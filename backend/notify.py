"""
Padel Match — Notification helpers (Expo push + persistent inbox).

Every notification is *written to the inbox* (the `notifications` Mongo
collection); a subset is *also pushed* via Expo's push service.

Push uses the `exponent_server_sdk` library (Python wrapper around the
HTTP API — handles batching + delivery receipts).

Per the spec:
    invite_received      → push + inbox  (invitee)
    invite_accepted      → push + inbox  (host)
    game_booked          → push + inbox  (all players)
    game_cancelled       → push + inbox  (all players)
    score_prompt         → push + inbox  (all players)
    near_miss_received   → inbox only    (host — protect from decline noise)
"""
from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from motor.motor_asyncio import AsyncIOMotorDatabase

try:
    from exponent_server_sdk import (  # type: ignore
        DeviceNotRegisteredError,
        PushClient,
        PushMessage,
        PushServerError,
        PushTicketError,
    )
    _PUSH_AVAILABLE = True
except Exception:  # library not installed yet
    _PUSH_AVAILABLE = False

log = logging.getLogger("notify")

# Set of notification types that should also be pushed.
PUSH_TYPES = {
    "invite_received",
    "invite_accepted",
    "game_booked",
    "game_cancelled",
    "score_prompt",
}


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


async def write_inbox(
    db: AsyncIOMotorDatabase,
    *,
    recipient_id: str,
    n_type: str,
    game_id: Optional[str] = None,
    payload: Optional[Dict[str, Any]] = None,
    message: str = "",
) -> Dict[str, Any]:
    """Insert a notification row. Returns the inserted doc.

    Schema (new — replacing the older `playerId`/`read` shape):
        id, recipientId, type, gameId, message, payload, createdAt, readAt,
        deliveredPush
    """
    doc = {
        "id": str(uuid.uuid4()),
        "recipientId": recipient_id,
        # Backwards-compat: keep `playerId` populated until callers migrate.
        "playerId": recipient_id,
        "type": n_type,
        "gameId": game_id,
        # Human-readable sentence rendered verbatim by the inbox UI.
        "message": message,
        "payload": payload or {},
        "createdAt": _now_iso(),
        "readAt": None,
        "read": False,           # legacy field; kept until UI is rewritten
        "deliveredPush": False,
    }
    await db.notifications.insert_one(doc)
    doc.pop("_id", None)
    return doc


async def send_push(
    db: AsyncIOMotorDatabase,
    *,
    recipient_id: str,
    title: str,
    body: str,
    data: Optional[Dict[str, Any]] = None,
) -> bool:
    """Fan-out to all tokens registered for this player. Returns True if
    at least one message was sent without an immediate error.

    Tokens that come back as DeviceNotRegistered are pruned from the
    player document so we don't keep spamming dead installs.
    """
    if not _PUSH_AVAILABLE:
        log.info("push: SDK unavailable, skipping send (recipient=%s)", recipient_id)
        return False

    player = await db.players.find_one(
        {"id": recipient_id}, {"_id": 0, "expoPushTokens": 1}
    )
    tokens: List[str] = (player or {}).get("expoPushTokens") or []
    if not tokens:
        log.info("push: no tokens for recipient=%s", recipient_id)
        return False

    client = PushClient()
    messages = [
        PushMessage(
            to=t,
            title=title,
            body=body,
            data=data or {},
            sound="default",
            priority="high",
        )
        for t in tokens
    ]

    bad_tokens: List[str] = []
    sent_any = False
    try:
        # SDK handles its own batching (≤100 per request).
        tickets = client.publish_multiple(messages)
    except PushServerError as e:
        log.warning("push: server error for %s: %s", recipient_id, e)
        return False
    except Exception as e:
        log.warning("push: unexpected error for %s: %s", recipient_id, e)
        return False

    for token, ticket in zip(tokens, tickets):
        try:
            ticket.validate_response()
            sent_any = True
        except DeviceNotRegisteredError:
            bad_tokens.append(token)
        except PushTicketError as e:
            log.info("push: ticket error for %s/%s: %s", recipient_id, token[:12], e)
        except Exception as e:
            log.info("push: unknown ticket error for %s: %s", recipient_id, e)

    if bad_tokens:
        await db.players.update_one(
            {"id": recipient_id},
            {"$pull": {"expoPushTokens": {"$in": bad_tokens}}},
        )
        log.info("push: pruned %d dead tokens for %s", len(bad_tokens), recipient_id)

    return sent_any


def _friendly_when(date_str: str, start_str: str) -> str:
    """'2026-06-22' + '18:00' -> 'Mon 6pm'."""
    try:
        wd = datetime.fromisoformat(date_str).strftime("%a")
        h, m = (int(x) for x in start_str.split(":"))
        period = "am" if h < 12 else "pm"
        h12 = h % 12 or 12
        t = f"{h12}:{m:02d}{period}" if m else f"{h12}{period}"
        return f"{wd} {t}"
    except Exception:
        return f"{date_str} {start_str}".strip()


async def compose_message(
    db: AsyncIOMotorDatabase, n_type: str, game_id: Optional[str],
    payload: Optional[Dict[str, Any]] = None,
) -> str:
    """Build a human-readable inbox sentence from a notification's context.

    Used as the stored `message` for every inbox row (and to backfill old
    rows). Looks up the game's venue name, friendly time, and host name.
    """
    venue_name, when, host_name = "a venue", "", "Someone"
    if game_id:
        game = await db.games.find_one(
            {"id": game_id}, {"_id": 0, "venueId": 1, "date": 1, "startTime": 1, "hostId": 1})
        if game:
            v = await db.venues.find_one({"id": game.get("venueId")}, {"_id": 0, "name": 1})
            venue_name = (v or {}).get("name", "a venue")
            when = _friendly_when(game.get("date", ""), game.get("startTime", ""))
            h = await db.players.find_one({"id": game.get("hostId")}, {"_id": 0, "name": 1})
            host_name = (h or {}).get("name", "Someone")
    sfx = f", {when}" if when else ""
    templates = {
        "invite_received":   f"{host_name} invited you to {venue_name}{sfx}",
        "invite_accepted":   f"A player is in for {venue_name}{sfx}",
        "near_miss_received": f"A player would play {venue_name} if conditions change",
        "game_booked":       f"Your game at {venue_name} is booked{sfx}",
        "game_cancelled":    f"Game at {venue_name}{sfx} was cancelled",
        "score_prompt":      f"How did your game at {venue_name} go? Enter the score →",
        "game_opened":       f"A game at {venue_name} just opened{sfx}",
    }
    return templates.get(n_type, f"Update on your game at {venue_name}")


async def emit(
    db: AsyncIOMotorDatabase,
    *,
    recipient_id: str,
    n_type: str,
    game_id: Optional[str] = None,
    title: str = "",
    body: str = "",
    payload: Optional[Dict[str, Any]] = None,
    deep_link: Optional[str] = None,
) -> Dict[str, Any]:
    """Convenience: writes the inbox row AND optionally pushes.

    Push happens iff `n_type ∈ PUSH_TYPES` and the recipient has tokens.
    `deep_link` is embedded under `payload.deepLink` so the client-side
    notification handler can route to it.
    """
    full_payload = dict(payload or {})
    if deep_link:
        full_payload["deepLink"] = deep_link

    message = await compose_message(db, n_type, game_id, full_payload)

    notif = await write_inbox(
        db,
        recipient_id=recipient_id,
        n_type=n_type,
        game_id=game_id,
        payload=full_payload,
        message=message,
    )

    if n_type in PUSH_TYPES:
        delivered = await send_push(
            db,
            recipient_id=recipient_id,
            title=title or _default_title(n_type),
            body=body or "",
            data={"type": n_type, "gameId": game_id, "deepLink": deep_link,
                  "notificationId": notif["id"]},
        )
        if delivered:
            await db.notifications.update_one(
                {"id": notif["id"]}, {"$set": {"deliveredPush": True}}
            )
            notif["deliveredPush"] = True
    return notif


def _default_title(n_type: str) -> str:
    return {
        "invite_received":     "You're invited to a game",
        "invite_accepted":     "Invite accepted",
        "game_booked":         "Court booked — game on",
        "game_cancelled":      "Game cancelled",
        "score_prompt":        "How did the game go?",
        "near_miss_received":  "Decline with note",
    }.get(n_type, "Padel Match")
