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
) -> Dict[str, Any]:
    """Insert a notification row. Returns the inserted doc.

    Schema (new — replacing the older `playerId`/`read` shape):
        id, recipientId, type, gameId, payload, createdAt, readAt,
        deliveredPush
    """
    doc = {
        "id": str(uuid.uuid4()),
        "recipientId": recipient_id,
        # Backwards-compat: keep `playerId` populated until callers migrate.
        "playerId": recipient_id,
        "type": n_type,
        "gameId": game_id,
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

    notif = await write_inbox(
        db,
        recipient_id=recipient_id,
        n_type=n_type,
        game_id=game_id,
        payload=full_payload,
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
