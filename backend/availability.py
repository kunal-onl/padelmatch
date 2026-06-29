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
import base64
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
# The court finder now reads Hudle's JSON API directly (no separate service, no
# browser). Provide the logged-in token via HUDLE_TOKEN (the raw JWT) or
# HUDLE_SESSION_B64 (base64 of the captured session JSON) or HUDLE_SESSION_FILE.
# Live mode turns on automatically when a token is present.
FINDER_BASE_URL = os.environ.get("FINDER_BASE_URL", "").strip()  # legacy; no longer used
CACHE_TTL_MINUTES = 8

HUDLE_API_BASE = "https://api.hudle.in/api/v1"
HUDLE_API_SECRET = os.environ.get("HUDLE_API_SECRET", "hudle-api1798@prod")
HUDLE_APP_ID = os.environ.get("HUDLE_APP_ID", "05010064645373612400053736720128024")
HUDLE_HTTP_TIMEOUT = float(os.environ.get("FINDER_HTTP_TIMEOUT", "25"))
_HUDLE_UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
             "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36")
# Goa/Hudle slot times are IST; compute "now" in IST so today's past-slot
# filtering is correct regardless of the server's timezone.
_IST = timezone(timedelta(hours=5, minutes=30))


def _hudle_session_present() -> bool:
    if os.environ.get("HUDLE_TOKEN", "").strip():
        return True
    if os.environ.get("HUDLE_SESSION_B64", "").strip():
        return True
    p = os.environ.get("HUDLE_SESSION_FILE", "").strip()
    if p and os.path.exists(p):
        return True
    # Default: a session file committed next to the backend.
    default = os.path.join(os.path.dirname(os.path.abspath(__file__)), "hudle_session.json")
    return os.path.exists(default)


FINDER_MODE = (
    os.environ.get("FINDER_MODE", "").strip().lower()
    or ("live" if _hudle_session_present() else "stub")
)

# venueId -> Hudle API ids (venue uuid + all Padel-Court facility uuids). Sunday
# Club has 3 courts; the rest 1. Re-harvest in the court-finder repo
# (harvest_ids.py) if Hudle ever changes them.
HUDLE_VENUES: Dict[str, Dict[str, Any]] = {
    "round-two": {"name": "Round Two", "area": "Vagator",
        "url": "https://hudle.in/venues/round-two-vagator/897288",
        "venue_uuid": "1dc8ed46-d38c-4bf5-bb39-d2aa40a79ebe",
        "facility_ids": ["a0bcaf91-119a-445d-a69d-a9c2080f1a4e"]},
    "sunday-club": {"name": "Sunday Club", "area": "Siolim",
        "url": "https://hudle.in/venues/sunday-racquet-and-social-club-siolim/515320",
        "venue_uuid": "122ef220-4950-4e2a-9bff-507199f9c0e4",
        "facility_ids": ["791a8a2d-e2a6-407e-9da9-a0a3836ffaed",
                          "b8edbe23-5d7f-4e60-ae05-eaa468b081f6",
                          "8cb40b2a-94bb-47f9-be18-0ff0bd3ca3f1"]},
    "coplay-panjim": {"name": "CoPlay Panjim", "area": "Panjim",
        "url": "https://hudle.in/venues/coplay-panjim-gymkhana/808217",
        "venue_uuid": "8d6b2f3d-c4c7-4a3a-8d4c-d0ffa5c97c4e",
        "facility_ids": ["354b02ba-6cb2-48d3-8d10-b45d9c967b5a"]},
    "coco-assagao": {"name": "Coco Assagao", "area": "Assagao",
        "url": "https://hudle.in/venues/coco-padel-assagao/585376",
        "venue_uuid": "91b4bb28-22b0-4a52-af4d-12ff2f8eb9f5",
        "facility_ids": ["1e6f4ef4-74cd-4bca-8e38-a71324bc0352"]},
    "coplay-assagao": {"name": "CoPlay Assagao", "area": "Assagao",
        "url": "https://hudle.in/venues/coplay-at-assagao-house/268830",
        "venue_uuid": "246c06aa-01a6-4aa2-b2c5-6c3c6e003747",
        "facility_ids": ["a5bd24fc-98a1-40b8-9ab3-3883951f9d3d"]},
    "jolt-method": {"name": "Jolt Method", "area": "Siolim",
        "url": "https://hudle.in/venues/jolt-method-siolim/788990",
        "venue_uuid": "e4196d17-4508-4b96-8f08-80e3261c4135",
        "facility_ids": ["8d409050-9ef6-42e1-afb5-16c51a774b20"]},
    "coco-anjuna": {"name": "Coco Anjuna", "area": "Anjuna",
        "url": "https://hudle.in/venues/coco-padel-circle-anjuna/615130",
        "venue_uuid": "d370acb6-5164-4627-88f3-23eaf57306c9",
        "facility_ids": ["182981f5-0cdf-411c-b9db-0bbbffd19de4"]},
    "clube-de-floresta": {"name": "Clube de Floresta", "area": "Assagao",
        "url": "https://hudle.in/venues/clube-de-floresta-forest-club/522426",
        "venue_uuid": "1b524373-0c24-45c1-9dee-8f8ac40cf653",
        "facility_ids": ["3db63d68-f3a8-43bf-bbde-95a5618c6117"]},
    "padelinho-anjuna": {"name": "Padelinho Anjuna", "area": "Anjuna",
        "url": "https://hudle.in/venues/padelinho-anjuna/348451",
        "venue_uuid": "5b140018-8d8a-4892-8fed-a09af81795f1",
        "facility_ids": ["d20d35c8-6801-49d6-92cc-57e6811c4976"]},
}

# Confirmed by Kunal (June 2026): venueName -> PadelMatch venueId. Kept for the
# stub finder + name-based mapping.
VENUE_NAME_TO_ID: Dict[str, str] = {v["name"]: vid for vid, v in HUDLE_VENUES.items()}


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


# ── Live finder: Hudle JSON API (no browser, no separate service) ─────
def _token_from_state(state: Dict[str, Any]) -> Optional[str]:
    for c in state.get("cookies", []):
        if c.get("name") == "access_token" and str(c.get("value", "")).startswith("eyJ"):
            return c["value"]
    for o in state.get("origins", []):
        for kv in o.get("localStorage", []):
            if kv.get("name") == "access_token" and str(kv.get("value", "")).startswith("eyJ"):
                return kv["value"]
    return None


def _hudle_token() -> Optional[str]:
    """The logged-in Hudle Bearer JWT. From HUDLE_TOKEN (raw JWT), or the
    access_token cookie inside HUDLE_SESSION_B64 / HUDLE_SESSION_FILE."""
    tok = os.environ.get("HUDLE_TOKEN", "").strip()
    if tok:
        return tok
    b64 = os.environ.get("HUDLE_SESSION_B64", "").strip()
    if b64:
        try:
            return _token_from_state(json.loads(base64.b64decode(b64)))
        except Exception as e:
            log.warning("availability: HUDLE_SESSION_B64 decode failed: %s", e)
    path = os.environ.get("HUDLE_SESSION_FILE", "").strip()
    if not path:
        # Default: a session file committed next to the backend.
        default = os.path.join(os.path.dirname(os.path.abspath(__file__)), "hudle_session.json")
        if os.path.exists(default):
            path = default
    if path and os.path.exists(path):
        try:
            with open(path, "r", encoding="utf-8") as fh:
                return _token_from_state(json.load(fh))
        except Exception as e:
            log.warning("availability: HUDLE_SESSION_FILE read failed: %s", e)
    return None


def _hudle_headers(token: str) -> Dict[str, str]:
    return {
        "Authorization": "Bearer " + token,
        "api-secret": HUDLE_API_SECRET,
        "x-app-id": HUDLE_APP_ID,
        "x-device-source": "3",
        "Accept": "application/json, text/plain, */*",
        "User-Agent": _HUDLE_UA,
        "Origin": "https://hudle.in",
        "Referer": "https://hudle.in/",
    }


def _dt_on(date: str, t24: str) -> datetime:
    return datetime.strptime(f"{date} {t24}", "%Y-%m-%d %H:%M")


def _bucket(t: datetime, pref_start: datetime, pref_end: datetime) -> str:
    if pref_start <= t <= pref_end:
        return "preferred"
    return "earlier" if t < pref_start else "later"


async def _fetch_one_venue(client, vid, vinfo, date, pref_start, pref_end,
                           search_start, search_end, now_ist, is_today,
                           token, fallback_window) -> Dict[str, Any]:
    """Query all of a venue's courts and union availability into one option."""
    avail: Dict[str, set] = {"preferred": set(), "earlier": set(), "later": set()}
    min_price: Optional[int] = None
    errors: List[str] = []
    for fid in vinfo["facility_ids"]:
        url = (f"{HUDLE_API_BASE}/venues/{vinfo['venue_uuid']}/facilities/{fid}/slots"
               f"?start_date={date}&end_date={date}&grid=1")
        try:
            r = await client.get(url, headers=_hudle_headers(token))
            if r.status_code != 200:
                errors.append(str(r.status_code))
                continue
            data = (r.json() or {}).get("data", {})
            for day in data.get("slot_data", []):
                if day.get("date") != date:
                    continue
                for s in day.get("slots", []):
                    if s.get("price"):
                        try:
                            p = int(float(s["price"]))
                            min_price = p if min_price is None else min(min_price, p)
                        except Exception:
                            pass
                    if not (s.get("is_available") and (s.get("available_count") or 0) > 0):
                        continue
                    try:
                        t = datetime.strptime(s["start_time"], "%Y-%m-%d %H:%M:%S")
                    except Exception:
                        continue
                    if is_today and t <= now_ist:
                        continue
                    if search_start <= t <= search_end:
                        avail[_bucket(t, pref_start, pref_end)].add(t)
        except Exception as e:
            errors.append(str(e)[:40])

    all_errored = bool(errors) and len(errors) == len(vinfo["facility_ids"])
    slots = sorted(avail["preferred"]) or sorted(avail["earlier"]) or sorted(avail["later"])
    has_any = bool(slots)
    return {
        "venueId": vid,
        "venueName": vinfo["name"],
        "location": vinfo["area"],
        "time": ", ".join(t.strftime("%I:%M %p") for t in slots) if slots else fallback_window,
        "price": min_price,
        "hudleUrl": vinfo["url"],
        "available": has_any,
        "error": (": ".join(errors[:2]) if all_errored else None),
    }


async def _live_options(date: str, start24: str, end24: str) -> List[Dict[str, Any]]:
    """Fetch every venue's availability directly from Hudle, in parallel."""
    token = _hudle_token()
    if not token:
        raise RuntimeError("Hudle token not configured (set HUDLE_TOKEN or HUDLE_SESSION_B64)")
    now_ist = datetime.now(_IST).replace(tzinfo=None)
    is_today = (date == now_ist.strftime("%Y-%m-%d"))
    pref_start, pref_end = _dt_on(date, start24), _dt_on(date, end24)
    search_start = pref_start - timedelta(hours=1)
    search_end = pref_end + timedelta(hours=1)
    fallback_window = f"{to_12h(start24)} - {to_12h(end24)}"
    async with httpx.AsyncClient(timeout=HUDLE_HTTP_TIMEOUT) as client:
        tasks = [
            _fetch_one_venue(client, vid, vinfo, date, pref_start, pref_end,
                             search_start, search_end, now_ist, is_today,
                             token, fallback_window)
            for vid, vinfo in HUDLE_VENUES.items()
        ]
        opts = list(await asyncio.gather(*tasks))
    for o in opts:
        o.pop("error", None)
    return opts


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
            options = await _live_options(date, start24, end24)
        else:
            options = _map_finder_response(_stub_finder(date, start24, end24))
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

    # ── Live: fan out the Hudle API per venue and emit each as it lands ──
    try:
        token = _hudle_token()
        if not token:
            raise RuntimeError("Hudle token not configured (set HUDLE_TOKEN or HUDLE_SESSION_B64)")
        now_ist = datetime.now(_IST).replace(tzinfo=None)
        is_today = (date == now_ist.strftime("%Y-%m-%d"))
        pref_start, pref_end = _dt_on(date, start24), _dt_on(date, end24)
        search_start = pref_start - timedelta(hours=1)
        search_end = pref_end + timedelta(hours=1)
        fallback_window = f"{to_12h(start24)} - {to_12h(end24)}"
        async with httpx.AsyncClient(timeout=HUDLE_HTTP_TIMEOUT) as client:
            tasks = [
                asyncio.ensure_future(
                    _fetch_one_venue(client, vid, vinfo, date, pref_start, pref_end,
                                     search_start, search_end, now_ist, is_today,
                                     token, fallback_window))
                for vid, vinfo in HUDLE_VENUES.items()
            ]
            for fut in asyncio.as_completed(tasks):
                opt = await fut
                opt.pop("error", None)   # don't leak per-venue error detail to the UI
                options_by_id[opt["venueId"]] = opt
                yield _sse("venue", opt)
        await _write_cache(db, date, start24, end24, list(options_by_id.values()))
        yield _sse("done", {"count": len(options_by_id), "source": "finder"})
    except Exception as e:
        log.exception("availability: live stream failed: %s", e)
        yield _sse("error", {"error": str(e)})
        yield _sse("done", {"count": len(options_by_id), "source": "error"})
