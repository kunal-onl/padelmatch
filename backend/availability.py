"""
Padel Match — Court availability wrapper.

Calls an external court-finder API. The finder is venue-level, ~40s per
scrape, with no cache. We wrap it with an 8-minute cache (TTL index on
`expiresAt`), expose a single async helper, and clearly partition fresh-
scrape vs cached-read paths.

ENV:
    FINDER_BASE_URL   Full base URL of the deployed finder. Empty → stub.
    FINDER_MODE       "stub" | "live". If unset/empty, derived from
                      FINDER_BASE_URL (empty=stub, else live).

The stub returns deterministic synthetic availability so we can build
the rest of the feature without the real finder. Same `(date, start, end)`
always returns the same answer.

Venue-name → PadelMatch venueId mapping is a single source of truth in
this module. **If the finder ever returns a venueName not in this map
we log + drop it** rather than guessing.
"""
from __future__ import annotations

import asyncio
import hashlib
import json
import logging
import os
import random
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

import httpx
from motor.motor_asyncio import AsyncIOMotorDatabase

log = logging.getLogger("availability")

# ── Configuration ─────────────────────────────────────────────────────
FINDER_BASE_URL = os.environ.get("FINDER_BASE_URL", "").strip()
FINDER_MODE = (
    os.environ.get("FINDER_MODE", "").strip().lower()
    or ("live" if FINDER_BASE_URL else "stub")
)
CACHE_TTL_MINUTES = 8

# Confirmed by Kunal (June 2026): the finder's `venueName` strings map
# 1:1 to PadelMatch venueIds as listed below. If the live finder returns
# a name not here, log a warning and drop the option.
VENUE_NAME_TO_ID: Dict[str, str] = {
    "Round Two":          "round-two",
    "Sunday Club":        "sunday-club",
    "CoPlay Panjim":      "coplay-panjim",
    "Coco Assagao":       "coco-assagao",
    "CoPlay Assagao":     "coplay-assagao",
    "Jolt Method":        "jolt-method",
    "Coco Anjuna":        "coco-anjuna",
    "Clube de Floresta":  "clube-de-floresta",
    "Padelinho Anjuna":   "padelinho-anjuna",
}


# ── Time format helpers ───────────────────────────────────────────────
def to_12h(t24: str) -> str:
    """'18:30' -> '06:30 PM'. Finder expects 12h."""
    h, m = (int(x) for x in t24.split(":"))
    period = "AM" if h < 12 else "PM"
    h12 = h % 12 or 12
    return f"{h12:02d}:{m:02d} {period}"


def to_24h(t12: str) -> str:
    """'06:30 PM' -> '18:30'. Best-effort reverse for stub bookkeeping."""
    try:
        parts = t12.strip().split()
        hm = parts[0]
        period = parts[1].upper() if len(parts) > 1 else "AM"
        h, m = (int(x) for x in hm.split(":"))
        if period == "PM" and h != 12:
            h += 12
        if period == "AM" and h == 12:
            h = 0
        return f"{h:02d}:{m:02d}"
    except Exception:
        return t12


# ── Stub finder ───────────────────────────────────────────────────────
def _stub_finder(date: str, start24: str, end24: str) -> Dict[str, Any]:
    """Deterministic synthetic availability for development.

    Returns ~3-5 of the 8 venues marked `available=true`, seeded by a
    hash of (date, start, end) so the same slot always returns the same
    result within a process lifetime. Includes a fake hudleUrl.
    """
    key = f"{date}|{start24}|{end24}"
    seed = int(hashlib.md5(key.encode()).hexdigest(), 16) % (2**32)
    rng = random.Random(seed)
    items: List[Dict[str, Any]] = []
    names = list(VENUE_NAME_TO_ID.keys())
    rng.shuffle(names)
    # 3-6 of the 8 are "available"
    n_available = rng.randint(3, 6)
    for i, name in enumerate(names):
        available = i < n_available
        price = rng.choice([900, 1000, 1100, 1200, 1400, 1500])
        items.append({
            "venueName": name,
            "venueId": VENUE_NAME_TO_ID[name],
            "location": _venue_area_hint(name),
            "time": f"{to_12h(start24)} - {to_12h(end24)}",
            "price": price if available else None,
            "hudleUrl": (
                f"https://hudle.in/venues/{VENUE_NAME_TO_ID[name]}/book?"
                f"date={date}&start={to_12h(start24).replace(' ', '+')}"
            ) if available else None,
            "available": available,
        })
    return {"ok": True, "courts": items, "elapsedSeconds": 1.5}


def _venue_area_hint(name: str) -> str:
    # Coarse area mapping for the stub's `location` string.
    return {
        "Round Two": "Vagator", "Sunday Club": "Siolim",
        "CoPlay Panjim": "Panjim", "Coco Assagao": "Assagao",
        "CoPlay Assagao": "Assagao", "Jolt Method": "Siolim",
        "Coco Anjuna": "Anjuna", "Clube de Floresta": "Assagao",
        "Padelinho Anjuna": "Anjuna",
    }.get(name, "Goa")


# ── Live finder client ────────────────────────────────────────────────
async def _call_live(date: str, start24: str, end24: str) -> Dict[str, Any]:
    url = f"{FINDER_BASE_URL.rstrip('/')}/api/courts/search"
    body = {
        "date": date,
        "startTime": to_12h(start24),
        "endTime": to_12h(end24),
    }
    async with httpx.AsyncClient(timeout=90.0) as c:
        r = await c.post(url, json=body)
        r.raise_for_status()
        return r.json()


def _map_finder_response(resp: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Turn raw finder response into venueId-mapped option list.

    Drops any unknown venueName with a warning; preserves order.
    """
    out: List[Dict[str, Any]] = []
    for c in resp.get("courts") or []:
        name = c.get("venueName")
        vid = VENUE_NAME_TO_ID.get(name)
        if not vid:
            log.warning("availability: unknown venueName from finder: %r", name)
            continue
        out.append({
            "venueId": vid,
            "venueName": name,
            "location": c.get("location"),
            "time": c.get("time"),
            "price": c.get("price"),
            "hudleUrl": c.get("hudleUrl"),
            "available": bool(c.get("available")),
        })
    return out


# ── Cache + public API ────────────────────────────────────────────────
async def ensure_cache_indexes(db: AsyncIOMotorDatabase) -> None:
    """Create the TTL index on the cache collection (idempotent)."""
    await db.availability_cache.create_index(
        "expiresAt", expireAfterSeconds=0
    )


async def get_or_fetch(
    db: AsyncIOMotorDatabase,
    date: str,
    start24: str,
    end24: str,
    *,
    force: bool = False,
) -> Dict[str, Any]:
    """Returns a snapshot dict (see module docstring)."""
    key = f"{date}|{start24}|{end24}"
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()

    if not force:
        cached = await db.availability_cache.find_one({"_id": key})
        if cached and cached.get("expiresAtIso") and cached["expiresAtIso"] > now_iso:
            return {
                "checkedAt": cached.get("fetchedAtIso") or now_iso,
                "expiresAt": cached["expiresAtIso"],
                "key": key,
                "options": cached.get("options", []),
                "source": "cache",
                "mode": FINDER_MODE,
            }

    # Cache miss or forced — hit the source.
    try:
        if FINDER_MODE == "live":
            raw = await _call_live(date, start24, end24)
        else:
            raw = _stub_finder(date, start24, end24)
        options = _map_finder_response(raw)
    except Exception as e:
        log.exception("availability: finder call failed (mode=%s): %s", FINDER_MODE, e)
        return {
            "checkedAt": now_iso,
            "expiresAt": now_iso,
            "key": key,
            "options": [],
            "source": "error",
            "mode": FINDER_MODE,
            "error": str(e),
        }

    expires_at = now + timedelta(minutes=CACHE_TTL_MINUTES)
    expires_at_iso = expires_at.isoformat()
    await db.availability_cache.update_one(
        {"_id": key},
        {"$set": {
            # Store ISO strings (avoids tz-aware vs tz-naive comparison
            # issues coming back through Motor). Also keep `expiresAt` as a
            # native datetime so the TTL index can sweep it.
            "fetchedAtIso": now_iso,
            "expiresAtIso": expires_at_iso,
            "expiresAt": expires_at,
            "options": options,
            "mode": FINDER_MODE,
        }},
        upsert=True,
    )
    return {
        "checkedAt": now_iso,
        "expiresAt": expires_at_iso,
        "key": key,
        "options": options,
        "source": "finder" if FINDER_MODE == "live" else "stub",
        "mode": FINDER_MODE,
    }


# ── Streaming (Server-Sent Events) ────────────────────────────────────
# Relays the finder's per-venue stream to the Courts tab so it fills in live.
# In stub mode it synthesizes the same event shape. Events:
#   meta  -> {venues:[{venueId,venueName,location}], total, mode, source}
#   venue -> one option {venueId,venueName,location,time,price,hudleUrl,available}
#   done  -> {count, source}
def _sse(event: str, data: Any) -> str:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


async def _write_cache(db, date: str, start24: str, end24: str,
                       options: List[Dict[str, Any]]) -> None:
    """Persist a streamed run into the same cache /availability/check reads, so a
    following check is instant and consistent."""
    key = f"{date}|{start24}|{end24}"
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(minutes=CACHE_TTL_MINUTES)
    try:
        await db.availability_cache.update_one(
            {"_id": key},
            {"$set": {
                "fetchedAtIso": now.isoformat(),
                "expiresAtIso": expires_at.isoformat(),
                "expiresAt": expires_at,
                "options": options,
                "mode": FINDER_MODE,
            }},
            upsert=True,
        )
    except Exception:
        log.exception("availability: stream cache write failed")


async def stream_availability(db, date: str, start24: str, end24: str):
    """Async generator of SSE frames for the Courts tab live view."""
    names = list(VENUE_NAME_TO_ID.keys())
    source = "finder" if FINDER_MODE == "live" else "stub"
    yield _sse("meta", {
        "venues": [{"venueId": VENUE_NAME_TO_ID[n], "venueName": n,
                    "location": _venue_area_hint(n)} for n in names],
        "total": len(names), "mode": FINDER_MODE, "source": source,
    })

    options_by_id: Dict[str, Dict[str, Any]] = {}

    # ── Stub: synthesize a gentle live stream ──
    if FINDER_MODE != "live":
        raw = _stub_finder(date, start24, end24)
        for c in raw.get("courts", []):
            opt = {k: c.get(k) for k in
                   ("venueId", "venueName", "location", "time", "price", "hudleUrl", "available")}
            options_by_id[opt["venueId"]] = opt
            yield _sse("venue", opt)
            await asyncio.sleep(0.25)
        await _write_cache(db, date, start24, end24, list(options_by_id.values()))
        yield _sse("done", {"count": len(options_by_id), "source": "stub"})
        return

    # ── Live: relay the finder's SSE, mapping venueName -> venueId ──
    url = f"{FINDER_BASE_URL.rstrip('/')}/api/courts/stream"
    params = {"date": date, "startTime": to_12h(start24), "endTime": to_12h(end24)}
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream("GET", url, params=params) as r:
                r.raise_for_status()
                event = None
                async for line in r.aiter_lines():
                    if line.startswith("event:"):
                        event = line[6:].strip()
                    elif line.startswith("data:"):
                        try:
                            data = json.loads(line[5:].strip())
                        except Exception:
                            continue
                        if event == "venue":
                            vid = VENUE_NAME_TO_ID.get(data.get("venueName"))
                            if not vid:
                                continue
                            opt = {
                                "venueId": vid,
                                "venueName": data.get("venueName"),
                                "location": data.get("location"),
                                "time": data.get("time"),
                                "price": data.get("price"),
                                "hudleUrl": data.get("hudleUrl"),
                                "available": bool(data.get("available")),
                            }
                            options_by_id[vid] = opt
                            yield _sse("venue", opt)
                        elif event == "done":
                            break
        await _write_cache(db, date, start24, end24, list(options_by_id.values()))
        yield _sse("done", {"count": len(options_by_id), "source": "finder"})
    except Exception as e:
        log.exception("availability: stream relay failed: %s", e)
        yield _sse("error", {"error": str(e)})
        yield _sse("done", {"count": len(options_by_id), "source": "error"})
