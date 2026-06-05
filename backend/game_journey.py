"""
Padel Match — Game Journey Reducer + Invite Cascade Engine.

The single source of truth for game-status transitions and for advancing
the invite cascade. Every endpoint that mutates a game routes through
`apply_transition`.

Design tenets (per the locked spec, Jun 2026):
  • One reducer enforces ALLOWED_GAME_STATUSES.
  • `status` is derived from two facts: `booked` (hudleBookingUrl set) and
    `playerCount`. The transition table makes that derivation explicit.
  • One pending invite at a time. Invites don't reserve slots.
  • On full: void all pending invites.
  • Booking can happen at ANY roster count → CONFIRMED.
  • Leaving a CONFIRMED (booked) game keeps it CONFIRMED.
  • Cancel cannot fire on PLAYED/SCORED. Hosts cannot leave their own game.
  • Public joins and the cascade coexist, first-come-first-served.

Concurrency safety (matters as soon as we run >1 backend instance OR
the sweeper double-ticks). Cascade advancement uses an atomic
`find_one_and_update` ticket so only one caller fires the next invite.
"""
from __future__ import annotations

import logging
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Awaitable, Callable, Dict, List, Optional, Tuple

from fastapi import HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ReturnDocument

import notify

log = logging.getLogger("game_journey")

# ── Status constants (single source of truth) ───────────────────────────
PLANNING    = "PLANNING"
NEEDS_COURT = "NEEDS_COURT"
CONFIRMED   = "CONFIRMED"
PLAYED      = "PLAYED"
SCORED      = "SCORED"
CANCELLED   = "CANCELLED"
ALLOWED_GAME_STATUSES = {PLANNING, NEEDS_COURT, CONFIRMED, PLAYED, SCORED, CANCELLED}

# Statuses past which no more mutation is allowed (cancel guard, etc.).
TERMINAL_FOR_CANCEL = {PLAYED, SCORED}

MAX_PLAYERS_DEFAULT = 4


# ── Helpers ─────────────────────────────────────────────────────────────
def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def derive_skill_label(lo: float, hi: float) -> str:
    """Server-side derivation. Bands are intentionally coarse for the
    home-screen card — they're a vibe, not a precise window.

       1.0–3.5  BEGINNER
       3.5–5.0  BEGINNER FRIENDLY
       4.0–6.0  INTERMEDIATE
       5.0–7.0  INT/ADV
       6.5–8.0  ADVANCED
       7.5–10   ELITE
       mixed (>=2.5 wide) → MIXED LEVELS
    """
    if hi - lo >= 2.5:
        return "MIXED LEVELS"
    avg = (lo + hi) / 2.0
    if avg < 3.5:  return "BEGINNER"
    if avg < 4.5:  return "BEGINNER FRIENDLY"
    if avg < 5.5:  return "INTERMEDIATE"
    if avg < 6.5:  return "INT/ADV"
    if avg < 7.5:  return "ADVANCED"
    return "ELITE"


def _player_count(g: dict) -> int:
    return len(g.get("players") or [])


def _is_booked(g: dict) -> bool:
    return bool(g.get("hudleBookingUrl"))


def _derive_status(g: dict, max_players: int = MAX_PLAYERS_DEFAULT) -> str:
    """Pure derivation from {booked, playerCount}. Used only when nothing
    has explicitly transitioned to PLAYED / SCORED / CANCELLED."""
    if _is_booked(g):
        return CONFIRMED
    if _player_count(g) >= max_players:
        return NEEDS_COURT
    return PLANNING


def _persist(g: dict, update: Dict[str, Any]) -> Dict[str, Any]:
    """Validates the new status before letting it touch the DB."""
    new_status = update.get("status")
    if new_status is not None and new_status not in ALLOWED_GAME_STATUSES:
        raise HTTPException(500, f"Illegal status transition: {new_status!r}")
    g.update(update)
    return update


# ── Event handlers ─────────────────────────────────────────────────────
# Each handler mutates `update` and returns the (recipients, notif specs)
# to dispatch *after* the DB write. This keeps DB writes atomic-ish and
# pushes the notification fan-out out-of-band of the request lifecycle.

NotifSpec = Tuple[str, str, str, Dict[str, Any], Optional[str]]
# (recipient_id, n_type, body, payload, deep_link)


def _spec_invite_received(invitee: str, g: dict) -> NotifSpec:
    title = "You're invited"
    body = (
        f"Game at {g.get('skillLabel') or 'TBD'} • "
        f"{g['date']} {g['startTime']}"
    )
    return (
        invitee, "invite_received", body,
        {"title": title, "gameId": g["id"]},
        f"/games/{g['id']}/respond",
    )


def _spec_invite_accepted(host: str, g: dict, who: str) -> NotifSpec:
    return (
        host, "invite_accepted", f"{who} is in",
        {"title": "Invite accepted", "gameId": g["id"]},
        f"/games/{g['id']}",
    )


def _spec_game_booked(pid: str, g: dict) -> NotifSpec:
    return (
        pid, "game_booked",
        f"Court booked: {g['date']} {g['startTime']}",
        {"title": "Court booked — game on", "gameId": g["id"],
         "hudleBookingUrl": g.get("hudleBookingUrl")},
        f"/games/{g['id']}",
    )


def _spec_game_cancelled(pid: str, g: dict) -> NotifSpec:
    return (
        pid, "game_cancelled",
        f"{g['date']} {g['startTime']} was cancelled",
        {"title": "Game cancelled", "gameId": g["id"]},
        f"/games/{g['id']}",
    )


def _spec_score_prompt(pid: str, g: dict) -> NotifSpec:
    return (
        pid, "score_prompt", "Tap to record the score",
        {"title": "How did it go?", "gameId": g["id"]},
        f"/games/{g['id']}",
    )


def _spec_near_miss(host: str, g: dict, decliner: str,
                    near_miss: Dict[str, Any]) -> NotifSpec:
    return (
        host, "near_miss_received",
        f"{decliner} would play if conditions change",
        {"title": "Decline with note", "gameId": g["id"],
         "decliner": decliner, "nearMiss": near_miss},
        f"/games/{g['id']}",
    )


# ── The reducer ─────────────────────────────────────────────────────────
async def apply_transition(
    db: AsyncIOMotorDatabase,
    g: dict,
    event: str,
    *,
    actor: Optional[str] = None,
    payload: Optional[Dict[str, Any]] = None,
) -> dict:
    """Returns the updated game dict. Persists. Dispatches notifications.

    Raises HTTPException for any invalid transition.

    `event` ∈ {
        "create", "accept", "decline", "public_join", "leave",
        "book", "host_cancel", "expire", "score_recorded",
        "post_public", "adjust_slot", "pre_confirm_add",
    }

    Cascade advancement is handled by the cascade module, which calls
    back into this reducer on accept/decline/timeout/leave events.
    """
    payload = payload or {}
    update: Dict[str, Any] = {}
    notif_specs: List[NotifSpec] = []
    cascade_action: Optional[str] = None   # "advance" | "void"

    # ── event: create ──────────────────────────────────────────────
    if event == "create":
        # Caller has fully constructed `g`. Reducer just validates
        # status derivation and emits no notifications.
        g["status"] = _derive_status(g)
        return g  # caller will insert_one

    # ── event: accept (invitee or pre-confirm) ────────────────────
    if event == "accept":
        if g.get("status") == CANCELLED:
            raise HTTPException(400, "Game cancelled")
        if actor in (g.get("players") or []):
            return g  # idempotent
        max_players = g.get("maxPlayers") or MAX_PLAYERS_DEFAULT
        if _player_count(g) >= max_players:
            raise HTTPException(400, "Game full")
        new_players = list(g.get("players") or []) + [actor]
        update["players"] = new_players
        # Status derivation: if already CONFIRMED (booked), stays CONFIRMED.
        if g.get("status") == CONFIRMED:
            pass  # status unchanged
        elif len(new_players) >= max_players and not _is_booked(g):
            update["status"] = NEEDS_COURT
            update["confirmedAt"] = _now_iso()  # legacy "fullAt"
        # Mark invite accepted if there's a matching pending one.
        invs = list(g.get("invites") or [])
        accepted_via_invite = False
        for inv in invs:
            if inv.get("playerId") == actor and inv.get("status") == "pending":
                inv["status"] = "accepted"
                inv["respondedAt"] = _now_iso()
                accepted_via_invite = True
                break
        if accepted_via_invite:
            update["invites"] = invs
            # Push host on accept.
            host = g.get("hostId")
            if host and host != actor:
                notif_specs.append(_spec_invite_accepted(host, {**g, **update}, actor))
        # On full: void any still-pending invites and stop cascading.
        if len(new_players) >= max_players:
            cascade_action = "void"
        else:
            cascade_action = "advance"

    # ── event: public_join (open feed) ─────────────────────────────
    elif event == "public_join":
        if g.get("status") == CANCELLED:
            raise HTTPException(400, "Game cancelled")
        if not g.get("postedToPublic"):
            raise HTTPException(400, "Game not posted to public feed")
        if actor in (g.get("players") or []):
            return g  # idempotent
        max_players = g.get("maxPlayers") or MAX_PLAYERS_DEFAULT
        if _player_count(g) >= max_players:
            raise HTTPException(400, "Game full")
        new_players = list(g.get("players") or []) + [actor]
        update["players"] = new_players
        if g.get("status") == CONFIRMED:
            pass
        elif len(new_players) >= max_players and not _is_booked(g):
            update["status"] = NEEDS_COURT
            update["confirmedAt"] = _now_iso()
        if len(new_players) >= max_players:
            cascade_action = "void"

    # ── event: pre_confirm_add (offline-arranged players at create) ─
    elif event == "pre_confirm_add":
        ids: List[str] = payload.get("playerIds") or []
        merged = list(g.get("players") or [])
        for pid in ids:
            if pid not in merged:
                merged.append(pid)
        update["players"] = merged
        max_players = g.get("maxPlayers") or MAX_PLAYERS_DEFAULT
        if g.get("status") == CONFIRMED:
            pass
        elif len(merged) >= max_players and not _is_booked(g):
            update["status"] = NEEDS_COURT
            update["confirmedAt"] = _now_iso()

    # ── event: decline ─────────────────────────────────────────────
    elif event == "decline":
        invs = list(g.get("invites") or [])
        matched = False
        near_miss = payload.get("nearMiss")
        for inv in invs:
            if inv.get("playerId") == actor and inv.get("status") == "pending":
                inv["status"] = "declined"
                inv["respondedAt"] = _now_iso()
                if near_miss:
                    inv["nearMiss"] = near_miss
                matched = True
                break
        if not matched:
            raise HTTPException(404, "No pending invite for this player")
        update["invites"] = invs
        # No host push on decline. Inbox-only near-miss if attached.
        if near_miss:
            host = g.get("hostId")
            if host:
                notif_specs.append(_spec_near_miss(host, g, actor, near_miss))
        cascade_action = "advance"

    # ── event: timeout (scheduler-driven) ──────────────────────────
    elif event == "timeout":
        invitee = payload.get("playerId")
        invs = list(g.get("invites") or [])
        matched = False
        for inv in invs:
            if inv.get("playerId") == invitee and inv.get("status") == "pending":
                inv["status"] = "expired"
                inv["respondedAt"] = _now_iso()
                matched = True
                break
        if not matched:
            # Already resolved by another instance — no-op.
            return g
        update["invites"] = invs
        cascade_action = "advance"

    # ── event: leave ───────────────────────────────────────────────
    elif event == "leave":
        if actor not in (g.get("players") or []):
            return g  # idempotent
        if g.get("hostId") == actor:
            raise HTTPException(400, "Host cannot leave their own game — cancel instead.")
        new_players = [p for p in (g.get("players") or []) if p != actor]
        update["players"] = new_players
        max_players = g.get("maxPlayers") or MAX_PLAYERS_DEFAULT
        # Booked games stay CONFIRMED on leave.
        if g.get("status") == NEEDS_COURT and len(new_players) < max_players:
            update["status"] = PLANNING
            update["confirmedAt"] = None
        cascade_action = "advance"   # may now have a slot to refill

    # ── event: book ────────────────────────────────────────────────
    elif event == "book":
        if g.get("hostId") != actor:
            raise HTTPException(403, "Only the host can book the court")
        if g.get("status") in TERMINAL_FOR_CANCEL or g.get("status") == CANCELLED:
            raise HTTPException(400, f"Cannot book from status {g.get('status')}")
        url = payload.get("hudleBookingUrl") or ""
        if not url:
            raise HTTPException(400, "hudleBookingUrl is required")
        now = _now_iso()
        update["hudleBookingUrl"] = url
        update["status"] = CONFIRMED
        update["bookedAt"] = now
        update["confirmedAt"] = now
        # Notify everyone in the roster.
        for pid in g.get("players") or []:
            notif_specs.append(_spec_game_booked(pid, {**g, **update}))

    # ── event: host_cancel ─────────────────────────────────────────
    elif event == "host_cancel":
        if g.get("hostId") != actor:
            raise HTTPException(403, "Only the host can cancel")
        if g.get("status") in TERMINAL_FOR_CANCEL:
            raise HTTPException(400, f"Cannot cancel a {g.get('status')} game")
        now = _now_iso()
        update["status"] = CANCELLED
        update["cancelledBy"] = actor
        update["cancelledAt"] = now
        # Notify all confirmed players.
        for pid in g.get("players") or []:
            notif_specs.append(_spec_game_cancelled(pid, g))
        cascade_action = "void"

    # ── event: expire (scheduler / lazy reads) ─────────────────────
    elif event == "expire":
        now = _now_iso()
        if g.get("status") == CONFIRMED:
            update["status"] = PLAYED
            update["playedAt"] = now
            update["completedAt"] = now
            # Spawn the Match (mirrors the old _auto_complete_if_past logic).
            match_id = g.get("matchId")
            if not match_id:
                players = list(g.get("players") or [])
                while len(players) < 4:
                    players.append("")
                match_id = str(uuid.uuid4())
                await db.matches.insert_one({
                    "id": match_id, "gameId": g["id"],
                    "venueId": g["venueId"], "courtId": g.get("courtId", ""),
                    "date": g["date"], "startTime": g["startTime"], "endTime": g["endTime"],
                    "pairA": players[:2], "pairB": players[2:4],
                    "sets": [], "winner": None, "status": "pending",
                    "gameType": g.get("gameType", "competitive"),
                    "createdAt": now,
                })
                update["matchId"] = match_id
            # Score prompt to all players.
            for pid in g.get("players") or []:
                if pid:
                    notif_specs.append(_spec_score_prompt(pid, g))
        elif g.get("status") in (PLANNING, NEEDS_COURT):
            update["status"] = CANCELLED
            update["cancelledAt"] = now
            update["cancelledBy"] = "system:expired"
            cascade_action = "void"
        else:
            return g  # nothing to do

    # ── event: score_recorded ─────────────────────────────────────
    elif event == "score_recorded":
        update["status"] = SCORED
        update["scoredAt"] = _now_iso()

    # ── event: post_public ─────────────────────────────────────────
    elif event == "post_public":
        if g.get("hostId") != actor:
            raise HTTPException(403, "Only the host can post to public")
        update["postedToPublic"] = True

    # ── event: adjust_slot (host moves game to a near-miss alt) ────
    elif event == "adjust_slot":
        if g.get("hostId") != actor:
            raise HTTPException(403, "Only the host can adjust the slot")
        for k in ("venueId", "courtId", "date", "startTime", "endTime",
                  "skillLevelMin", "skillLevelMax",
                  "availabilitySnapshot"):
            if k in payload:
                update[k] = payload[k]
        # Re-derive skillLabel if min/max changed.
        if "skillLevelMin" in payload or "skillLevelMax" in payload:
            update["skillLabel"] = derive_skill_label(
                update.get("skillLevelMin", g["skillLevelMin"]),
                update.get("skillLevelMax", g["skillLevelMax"]),
            )

    else:
        raise HTTPException(400, f"Unknown event: {event!r}")

    # ── Persist + dispatch ─────────────────────────────────────────
    if update:
        _persist(g, update)
        await db.games.update_one({"id": g["id"]}, {"$set": update})
        # Refetch a clean view (drops the legacy fields if any).
        refreshed = await db.games.find_one({"id": g["id"]}, {"_id": 0})
        if refreshed:
            g = refreshed

    # Dispatch notifications (after the DB write so they reflect truth).
    for spec in notif_specs:
        recipient, n_type, body, p, deep = spec
        try:
            await notify.emit(
                db,
                recipient_id=recipient,
                n_type=n_type,
                game_id=g["id"],
                title=p.get("title", ""),
                body=body,
                payload=p,
                deep_link=deep,
            )
        except Exception as e:
            log.exception("notify dispatch failed: %s", e)

    # Cascade hook — done last because it may fire more invites.
    if cascade_action == "void":
        await cascade_void_pending(db, g)
    elif cascade_action == "advance":
        await cascade_advance(db, g)

    return g


# ── Cascade engine ─────────────────────────────────────────────────────
async def cascade_void_pending(db: AsyncIOMotorDatabase, g: dict) -> None:
    """Mark every still-pending invite as voided. Idempotent."""
    invs = list(g.get("invites") or [])
    changed = False
    for inv in invs:
        if inv.get("status") == "pending":
            inv["status"] = "voided"
            inv["respondedAt"] = _now_iso()
            changed = True
    if changed:
        await db.games.update_one({"id": g["id"]}, {"$set": {"invites": invs}})


async def _claim_advance(db: AsyncIOMotorDatabase, g: dict) -> Optional[dict]:
    """Atomic claim: only one caller wins the right to fire the next
    invite for this game. Mongo `find_one_and_update` with a one-shot
    `cascadeAdvanceLock` ticket means two concurrent sweepers can't
    double-invite the next person.
    """
    ticket = uuid.uuid4().hex
    res = await db.games.find_one_and_update(
        {
            "id": g["id"],
            # Only claim if no other lock outstanding.
            "$or": [
                {"cascadeAdvanceLock": {"$exists": False}},
                {"cascadeAdvanceLock": None},
                # Stale locks > 60s are reclaimable.
                {"cascadeAdvanceLockAt": {"$lt": (datetime.now(timezone.utc)
                                                  - timedelta(seconds=60)).isoformat()}},
            ],
        },
        {"$set": {"cascadeAdvanceLock": ticket,
                  "cascadeAdvanceLockAt": _now_iso()}},
        return_document=ReturnDocument.AFTER,
    )
    if not res:
        return None
    res.pop("_id", None)
    return res


async def _release_advance(db: AsyncIOMotorDatabase, gid: str) -> None:
    await db.games.update_one(
        {"id": gid},
        {"$set": {"cascadeAdvanceLock": None, "cascadeAdvanceLockAt": None}},
    )


async def cascade_advance(db: AsyncIOMotorDatabase, g: dict) -> None:
    """Try to fire the next invite, if any.

    Atomic. If another caller has claimed this game, returns silently.

    Rules:
      • Don't advance if status ∈ {CANCELLED, PLAYED, SCORED}.
      • Don't advance if there's already a pending invite (one at a time).
      • Don't advance if the roster is full.
      • Iterate `inviteList` (the ordered queue) for the first id who
        is NOT already in `players` and NOT already in a non-pending
        invite for this game.
    """
    if g.get("status") in (CANCELLED, PLAYED, SCORED):
        return
    max_players = g.get("maxPlayers") or MAX_PLAYERS_DEFAULT
    if _player_count(g) >= max_players:
        return
    invs = list(g.get("invites") or [])
    if any(i.get("status") == "pending" for i in invs):
        return  # already one in flight
    queue = list(g.get("inviteList") or [])
    if not queue:
        return

    # Who's still eligible?
    already_invited = {i.get("playerId") for i in invs}
    players_set = set(g.get("players") or [])
    next_id: Optional[str] = None
    for pid in queue:
        if pid in players_set:
            continue
        if pid in already_invited:
            continue
        next_id = pid
        break
    if not next_id:
        return

    # Atomic claim.
    claimed = await _claim_advance(db, g)
    if not claimed:
        return
    try:
        # Re-check after claim — state may have changed.
        if claimed.get("status") in (CANCELLED, PLAYED, SCORED):
            return
        if any(i.get("status") == "pending" for i in (claimed.get("invites") or [])):
            return
        if len(claimed.get("players") or []) >= (claimed.get("maxPlayers") or MAX_PLAYERS_DEFAULT):
            return
        if next_id in (claimed.get("players") or []):
            return

        # Compose the new invite record.
        window_min = claimed.get("cascadeWindowMinutes") or 1
        now = datetime.now(timezone.utc)
        expires_at = (now + timedelta(minutes=window_min)).isoformat()
        new_invs = list(claimed.get("invites") or [])
        new_invs.append({
            "playerId": next_id,
            "position": len(new_invs),
            "status": "pending",
            "sentAt": now.isoformat(),
            "respondedAt": None,
            "expiresAt": expires_at,
            "nearMiss": None,
        })
        await db.games.update_one(
            {"id": claimed["id"]},
            {"$set": {"invites": new_invs}},
        )
        # Notify the invitee (push + inbox).
        await notify.emit(
            db,
            recipient_id=next_id,
            n_type="invite_received",
            game_id=claimed["id"],
            title="You're invited",
            body=f"Game {claimed['date']} {claimed['startTime']} — respond in {window_min} min",
            payload={"gameId": claimed["id"], "expiresAt": expires_at},
            deep_link=f"/games/{claimed['id']}/respond",
        )
    finally:
        await _release_advance(db, claimed["id"])


# ── Background sweeper ─────────────────────────────────────────────────
async def sweeper_tick(db: AsyncIOMotorDatabase) -> None:
    """One pass:
      1. Expire any past-endTime CONFIRMED → PLAYED, PLANNING/NEEDS_COURT → CANCELLED.
      2. Expire pending invites whose `expiresAt` has passed.
    """
    now_iso = _now_iso()

    # 1) End-time expiry — covers what _auto_complete_if_past used to do
    #    lazily on read, but now actively.
    today = datetime.now()
    async for g in db.games.find(
        {"status": {"$in": [PLANNING, NEEDS_COURT, CONFIRMED]}},
        {"_id": 0},
    ):
        try:
            end = datetime.fromisoformat(f"{g['date']}T{g['endTime']}:00")
        except Exception:
            continue
        if end <= today:
            try:
                await apply_transition(db, g, "expire")
            except Exception as e:
                log.exception("sweeper: expire failed for %s: %s", g.get("id"), e)

    # 2) Invite expiries
    async for g in db.games.find(
        {"invites": {"$elemMatch": {"status": "pending",
                                     "expiresAt": {"$lte": now_iso}}}},
        {"_id": 0},
    ):
        for inv in list(g.get("invites") or []):
            if inv.get("status") != "pending":
                continue
            if not inv.get("expiresAt") or inv["expiresAt"] > now_iso:
                continue
            try:
                await apply_transition(
                    db, g, "timeout",
                    payload={"playerId": inv["playerId"]},
                )
                # Re-fetch since apply_transition mutates DB.
                g = await db.games.find_one({"id": g["id"]}, {"_id": 0}) or g
            except Exception as e:
                log.exception("sweeper: timeout failed for %s/%s: %s",
                              g.get("id"), inv.get("playerId"), e)


# ── Public sweeper task ────────────────────────────────────────────────
async def run_sweeper_forever(db: AsyncIOMotorDatabase, interval: int = 20) -> None:
    """Long-running background task. Started from FastAPI startup hook.
    Each tick is bounded; errors don't kill the loop."""
    import asyncio
    while True:
        try:
            await sweeper_tick(db)
        except Exception as e:
            log.exception("sweeper crashed: %s", e)
        await asyncio.sleep(interval)
