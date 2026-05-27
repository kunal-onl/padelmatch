"""
Padel Match — Backend
Single-file FastAPI + MongoDB service powering an Expo React Native client.
"""
from fastapi import FastAPI, APIRouter, HTTPException, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os, logging, uuid, math, random, asyncio
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Literal
from datetime import datetime, date, timedelta, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

app = FastAPI(title="Padel Match API")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
log = logging.getLogger("padel")


# ----------------------------- MODELS -----------------------------

class Court(BaseModel):
    id: str
    name: str


class Venue(BaseModel):
    id: str
    name: str
    area: str
    hudleUrl: str
    courts: List[Court]


class AvailabilitySlot(BaseModel):
    dayOfWeek: str
    startTime: str
    endTime: str


class Connection(BaseModel):
    playerId: str
    relationship: str  # played_with | want_to_play | prefer_not
    reason: Optional[str] = None
    tags: List[str] = []  # multi-select: social, competitive (or sub-tags)
    addedAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class Player(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    phone: str = ""
    profilePhoto: Optional[str] = None
    bio: str = ""
    invitedBy: Optional[str] = None
    joinedAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    status: str = "active"
    gameRating: float = 5.0
    gameRatingPeak: float = 5.0
    gameRatingHistory: List[Dict[str, Any]] = []
    gameRatingStatus: str = "estimated"
    initialRatingEstimate: float = 5.0
    communityId: str = "north-goa-padel"
    communityRank: Optional[int] = None
    matchesPlayed: int = 0
    wins: int = 0
    losses: int = 0
    lastActiveAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    yearsPlayed: str = "1to3"
    frequency: str = "weekly"
    competitiveExperience: str = "none"
    wallControl: str = "somewhat"
    preferredVenues: List[str] = []
    availabilitySlots: List[AvailabilitySlot] = []
    gamesPerWeek: int = 2
    gameOrientation: str = "both"
    connections: List[Connection] = []
    shotComfort: Dict[str, int] = {}
    peerRatings: Dict[str, Dict[str, int]] = Field(
        default_factory=lambda: {
            "technique": {"sum": 0, "count": 0},
            "offensiveSkill": {"sum": 0, "count": 0},
            "defensiveSkill": {"sum": 0, "count": 0},
            "tacticalAbility": {"sum": 0, "count": 0},
            "endurance": {"sum": 0, "count": 0},
            "partnershipSkill": {"sum": 0, "count": 0},
            "sportsmanship": {"sum": 0, "count": 0},
        }
    )
    profileCompleteness: int = 0
    onboardingCompletedAt: Optional[str] = None
    # Onboarding V2 fields
    rankedDays: List[str] = []  # day-of-week strings in preference order
    preferredStartTime: Optional[str] = None  # e.g. "07:00"
    preferredEndTime: Optional[str] = None    # e.g. "21:00"
    rankedTimeBlocks: List[str] = []  # ordered list of day-of-week (or day×slot) labels
    gameTypes: List[str] = []  # ["competitive", "social"]
    whatsappVerified: bool = False
    whatsappVerifiedAt: Optional[str] = None


class SetScore(BaseModel):
    pairA: int
    pairB: int


class Match(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    date: str
    venueId: str
    courtId: str
    pairA: List[str]
    pairB: List[str]
    hostId: str
    scheduledStart: str
    scheduledEnd: str
    sets: List[SetScore] = []
    winner: Optional[str] = None  # pairA | pairB
    status: str = "upcoming"  # upcoming | played | scored | unscored
    scoreEnteredBy: Optional[str] = None
    scoreConfirmedBy: Optional[str] = None
    scoredAt: Optional[str] = None
    gameId: Optional[str] = None


class Game(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    hostId: str
    venueId: str
    courtId: str
    date: str
    startTime: str
    endTime: str
    skillLevelMin: float
    skillLevelMax: float
    skillLabel: str
    players: List[str]
    # 5-state machine (Feb 2026 spec):
    #   FORMING → CONFIRMED → BOOKED → COMPLETED → SCORED
    #                                            ↘ CANCELLED
    status: str = "FORMING"
    gameType: str = "competitive"  # competitive | social
    hudleBookingUrl: Optional[str] = None
    cancelledBy: Optional[str] = None
    cancelledAt: Optional[str] = None
    completedAt: Optional[str] = None
    bookedAt: Optional[str] = None
    confirmedAt: Optional[str] = None
    scoredAt: Optional[str] = None
    # Post-match state — track which players completed which prompts.
    scoresSubmittedBy: List[str] = []
    reflectionsBy: List[str] = []
    peerRatingsBy: List[str] = []
    promptDismissedBy: List[str] = []
    attendance: Dict[str, bool] = {}      # pid -> attended?
    shareLink: str = ""
    whatsappText: str = ""
    createdAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    matchId: Optional[str] = None


class Notification(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    playerId: str
    type: str  # game_opened | rank_up | score_request | rating_update | new_player
    message: str
    relatedId: Optional[str] = None
    read: bool = False
    createdAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


# ----------------------------- SEED DATA -----------------------------

VENUES_SEED = [
    {"id": "coco-anjuna", "name": "Coco Padel", "area": "Anjuna",
     "hudleUrl": "https://hudle.in/venues/coco-padel-circle-anjuna/615130",
     "courts": [{"id": "coco-anjuna-c1", "name": "Court 1"}]},
    {"id": "coco-assagao", "name": "Coco Padel", "area": "Assagao",
     "hudleUrl": "https://hudle.in/venues/coco-padel-assagao/585376",
     "courts": [{"id": "coco-assagao-c1", "name": "Court 1"}]},
    {"id": "coplay-assagao", "name": "CoPlay", "area": "Assagao",
     "hudleUrl": "https://hudle.in/venues/coplay-at-assagao-house/268830",
     "courts": [{"id": "coplay-assagao-c1", "name": "Court 1"}]},
    {"id": "coplay-panjim", "name": "CoPlay", "area": "Panjim",
     "hudleUrl": "https://hudle.in/venues/coplay-panjim-gymkhana/808217",
     "courts": [{"id": "coplay-panjim-c1", "name": "Court 1"}]},
    {"id": "clube-de-floresta", "name": "Clube de Floresta", "area": "Assagao",
     "hudleUrl": "https://hudle.in/venues/clube-de-floresta-forest-club/522426",
     "courts": [{"id": "floresta-c1", "name": "Court 1"}]},
    {"id": "jolt-method", "name": "Jolt Method", "area": "Siolim",
     "hudleUrl": "https://hudle.in/venues/jolt-method-siolim/788990",
     "courts": [{"id": "jolt-c1", "name": "Court 1"}]},
    {"id": "round-two", "name": "Round Two", "area": "Vagator",
     "hudleUrl": "https://hudle.in/venues/round-two-vagator/897288",
     "courts": [{"id": "round-two-c1", "name": "Court 1"}]},
    {"id": "sunday-club", "name": "Sunday R&SC", "area": "Siolim",
     "hudleUrl": "https://hudle.in/venues/sunday-racquet-and-social-club-siolim/515320",
     "courts": [{"id": "sunday-c1", "name": "Court 1"},
                {"id": "sunday-c2", "name": "Court 2"},
                {"id": "sunday-c3", "name": "Court 3"}]},
]

ALL_VENUE_IDS = [v["id"] for v in VENUES_SEED]

SHOT_SLUGS = [
    "flat_serve", "slice_serve", "topspin_serve", "short_serve", "deep_serve",
    "t_serve", "wide_serve", "drive_return", "lob_return",
    "forehand_volley", "backhand_volley", "chiquita", "drop_volley",
    "deep_volley", "block_volley", "blocking_drop_volley",
    "bandeja", "vibora", "kick_smash", "flat_smash", "rulo",
    "fake_smash", "backhand_overhead",
    "flat_forehand", "sliced_forehand", "topspin_forehand",
    "flat_backhand", "sliced_backhand", "topspin_backhand", "passing_shot",
    "lob", "bajada", "salida_de_pared", "contrapared",
    "lateral_wall_exit", "dormilona",
]

# Seed names: 15 mock players + Kunal B. (logged-in user with id 'kunal')
MOCK_PLAYERS = [
    {"id": "kunal", "name": "Kunal B.", "rating": 7.2, "bio": "Loves a tight third set."},
    {"id": "p-arjun", "name": "Arjun M.", "rating": 8.4, "bio": "Bandeja merchant."},
    {"id": "p-priya", "name": "Priya S.", "rating": 7.8, "bio": "Wall control specialist."},
    {"id": "p-rohan", "name": "Rohan K.", "rating": 7.5, "bio": "Aggressive net player."},
    {"id": "p-anita", "name": "Anita D.", "rating": 6.9, "bio": "Patient baseliner."},
    {"id": "p-vikram", "name": "Vikram J.", "rating": 6.7, "bio": "Lob and switch."},
    {"id": "p-meera", "name": "Meera R.", "rating": 6.3, "bio": "Backhand stays low."},
    {"id": "p-sahil", "name": "Sahil T.", "rating": 5.9, "bio": "Building consistency."},
    {"id": "p-divya", "name": "Divya N.", "rating": 5.6, "bio": "Loves doubles."},
    {"id": "p-tanvi", "name": "Tanvi P.", "rating": 5.2, "bio": "New to padel, fast learner."},
    {"id": "p-rahul", "name": "Rahul C.", "rating": 4.8, "bio": "Tennis convert."},
    {"id": "p-isha", "name": "Isha L.", "rating": 4.5, "bio": "Mornings in Siolim."},
    {"id": "p-aman", "name": "Aman G.", "rating": 4.1, "bio": "Weekend warrior."},
    {"id": "p-neha", "name": "Neha V.", "rating": 3.8, "bio": "Just here for fun."},
    {"id": "p-karan", "name": "Karan H.", "rating": 3.5, "bio": "Starting out."},
    {"id": "p-sneha", "name": "Sneha O.", "rating": 6.1, "bio": "Sharp at the net."},
]


def _exp_score(p: dict) -> float:
    s = 0
    s += {"under1": 0, "1to3": 10, "3to5": 20, "5plus": 30}.get(p.get("yearsPlayed", "1to3"), 0)
    s += {"rarely": 0, "monthly": 5, "weekly": 15, "multipleWeekly": 25}.get(p.get("frequency", "weekly"), 0)
    s += {"none": 0, "casual": 10, "regular": 20}.get(p.get("competitiveExperience", "none"), 0)
    s += {"no": 0, "somewhat": 10, "yes": 20}.get(p.get("wallControl", "somewhat"), 0)
    return s


SHOT_WEIGHTS = {
    # tier 3
    "vibora": 3, "bajada": 3, "contrapared": 3, "dormilona": 3, "kick_smash": 3,
    "flat_smash": 3, "rulo": 3, "fake_smash": 3, "backhand_overhead": 3,
    "chiquita": 3, "blocking_drop_volley": 3,
    # tier 2
    "bandeja": 2, "slice_serve": 2, "topspin_serve": 2, "t_serve": 2, "drive_return": 2,
    "drop_volley": 2, "sliced_forehand": 2, "topspin_forehand": 2, "topspin_backhand": 2,
    "passing_shot": 2, "lateral_wall_exit": 2, "lob_return": 2,
}


def compute_initial_rating(player: dict) -> float:
    exp = _exp_score(player)  # 0..95
    shots = player.get("shotComfort") or {}
    if not shots:
        return round(1 + (exp / 100) * 9, 1)
    wsum = 0.0
    wmax = 0.0
    for slug in SHOT_SLUGS:
        w = SHOT_WEIGHTS.get(slug, 1)
        val = int(shots.get(slug) or 1)
        wsum += val * w
        wmax += 5 * w
    shot_score = (wsum / wmax) * 100 if wmax > 0 else 50
    combined = exp * 0.4 + shot_score * 0.6
    rating = 1 + (combined / 100) * 9
    return round(max(1.0, min(10.0, rating)), 1)


def update_elo_for_match(match: dict, players_by_id: Dict[str, dict]) -> Dict[str, Dict[str, float]]:
    """Return mapping player_id -> {before, after, delta}. Mutates player rating fields."""
    out: Dict[str, Dict[str, float]] = {}
    pA1 = players_by_id[match["pairA"][0]]
    pA2 = players_by_id[match["pairA"][1]]
    pB1 = players_by_id[match["pairB"][0]]
    pB2 = players_by_id[match["pairB"][1]]
    rA = (pA1["gameRating"] + pA2["gameRating"]) / 2
    rB = (pB1["gameRating"] + pB2["gameRating"]) / 2
    Ea = 1 / (1 + math.pow(10, (rB - rA) / 4))
    Eb = 1 - Ea
    Sa = 1 if match["winner"] == "pairA" else 0
    Sb = 1 - Sa
    scale = 9 / 400
    for team_players, S, E in ((( pA1, pA2 ), Sa, Ea), (( pB1, pB2 ), Sb, Eb)):
        for p in team_players:
            K = 40 if p.get("matchesPlayed", 0) < 20 else 20
            delta = K * (S - E) * scale
            before = p["gameRating"]
            after = max(1.0, min(10.0, round((before + delta) * 10) / 10))
            p["gameRating"] = after
            p["gameRatingPeak"] = max(p.get("gameRatingPeak", before), after)
            p["matchesPlayed"] = p.get("matchesPlayed", 0) + 1
            won = (p in (pA1, pA2) and match["winner"] == "pairA") or (p in (pB1, pB2) and match["winner"] == "pairB")
            if won:
                p["wins"] = p.get("wins", 0) + 1
            else:
                p["losses"] = p.get("losses", 0) + 1
            mp = p.get("matchesPlayed", 0)
            p["gameRatingStatus"] = "settled" if mp >= 20 else ("provisional" if mp >= 5 else "estimated")
            history = p.get("gameRatingHistory") or []
            history.append({"date": match["date"], "rating": after, "matchId": match["id"]})
            p["gameRatingHistory"] = history[-50:]
            out[p["id"]] = {"before": before, "after": after, "delta": round(after - before, 2)}
    return out


def _slot(day: str, start: str, end: str) -> dict:
    return {"dayOfWeek": day, "startTime": start, "endTime": end}


async def seed_if_empty():
    if await db.venues.count_documents({}) == 0:
        await db.venues.insert_many([dict(v) for v in VENUES_SEED])
        log.info("Seeded %d venues", len(VENUES_SEED))
    else:
        # Idempotent migration to ensure existing DB has updated venue list.
        seed_ids = [v["id"] for v in VENUES_SEED]
        for v in VENUES_SEED:
            await db.venues.update_one({"id": v["id"]}, {"$set": v}, upsert=True)
        # Drop any venues that are no longer in the canonical list.
        await db.venues.delete_many({"id": {"$nin": seed_ids}})
        log.info("Synced %d venues", len(VENUES_SEED))

    # ── Migrate legacy game.status values to the new 5-state machine ──
    await db.games.update_many({"status": "open"},      {"$set": {"status": "FORMING"}})
    await db.games.update_many({"status": "full"},      {"$set": {"status": "CONFIRMED"}})
    await db.games.update_many({"status": "played"},    {"$set": {"status": "COMPLETED"}})
    await db.games.update_many({"status": "scored"},    {"$set": {"status": "SCORED"}})
    await db.games.update_many({"status": "cancelled"}, {"$set": {"status": "CANCELLED"}})

    if await db.players.count_documents({}) > 0:
        return

    random.seed(7)
    days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    docs = []
    for i, mp in enumerate(MOCK_PLAYERS):
        rating = mp["rating"]
        shots = {}
        for slug in SHOT_SLUGS:
            base = max(1, min(5, round(rating / 2 + random.uniform(-0.8, 0.8))))
            shots[slug] = base
        availability = []
        sample_days = random.sample(days, k=random.randint(2, 4))
        for d in sample_days:
            slot_choice = random.choice([("06:30", "08:30"), ("07:00", "09:00"),
                                         ("17:00", "19:00"), ("18:00", "20:00"),
                                         ("19:00", "21:00")])
            availability.append(_slot(d, slot_choice[0], slot_choice[1]))
        venues = random.sample(ALL_VENUE_IDS, k=random.randint(2, 4))
        # Kunal: fixed canonical stats from spec.
        if mp["id"] == "kunal":
            matches = 23
            wins = round(matches * 0.61)
            losses = matches - wins
        else:
            matches = random.randint(8, 35)
            wins = round(matches * (rating / 10))
            losses = matches - wins
        mp_full = {
            "yearsPlayed": "5plus" if rating > 7 else ("3to5" if rating > 5.5 else ("1to3" if rating > 4 else "under1")),
            "frequency": "multipleWeekly" if rating > 6.5 else ("weekly" if rating > 4 else "monthly"),
            "competitiveExperience": "regular" if rating > 7 else ("casual" if rating > 5 else "none"),
            "wallControl": "yes" if rating > 6.5 else ("somewhat" if rating > 4 else "no"),
            "shotComfort": shots,
        }
        history = []
        cur = rating
        for k in range(min(matches, 10)):
            cur = max(1.0, min(10.0, cur + random.uniform(-0.3, 0.3)))
            history.append({
                "date": (date.today() - timedelta(days=(10 - k) * 3)).isoformat(),
                "rating": round(cur, 1),
                "matchId": f"seed-h-{i}-{k}",
            })
        player = Player(
            id=mp["id"],
            name=mp["name"],
            phone=f"+91900000{1000 + i:04d}",
            bio=mp.get("bio", ""),
            gameRating=rating,
            gameRatingPeak=max(rating, round(rating + random.uniform(0, 0.5), 1)),
            gameRatingHistory=history,
            gameRatingStatus="settled" if matches >= 20 else "provisional",
            initialRatingEstimate=round(rating - random.uniform(-0.5, 0.5), 1),
            matchesPlayed=matches,
            wins=wins,
            losses=losses,
            yearsPlayed=mp_full["yearsPlayed"],
            frequency=mp_full["frequency"],
            competitiveExperience=mp_full["competitiveExperience"],
            wallControl=mp_full["wallControl"],
            preferredVenues=venues,
            availabilitySlots=[AvailabilitySlot(**s) for s in availability],
            gamesPerWeek=random.randint(1, 4),
            gameOrientation=random.choice(["competitive", "social", "both"]),
            shotComfort=shots,
            profileCompleteness=100,
            onboardingCompletedAt=datetime.now(timezone.utc).isoformat(),
        ).model_dump()
        docs.append(player)

    # Add connections for Kunal so recommendations have flavour.
    kunal = next(p for p in docs if p["id"] == "kunal")
    kunal["connections"] = [
        {"playerId": "p-arjun", "relationship": "played_with", "reason": "skill",
         "addedAt": datetime.now(timezone.utc).isoformat()},
        {"playerId": "p-priya", "relationship": "played_with", "reason": "both",
         "addedAt": datetime.now(timezone.utc).isoformat()},
        {"playerId": "p-rohan", "relationship": "want_to_play", "reason": None,
         "addedAt": datetime.now(timezone.utc).isoformat()},
        {"playerId": "p-anita", "relationship": "played_with", "reason": "social",
         "addedAt": datetime.now(timezone.utc).isoformat()},
        {"playerId": "p-meera", "relationship": "played_with", "reason": "skill",
         "addedAt": datetime.now(timezone.utc).isoformat()},
    ]
    kunal["preferredVenues"] = ["sunday-club", "round-two", "coplay-assagao", "clube-de-floresta"]
    kunal["availabilitySlots"] = [
        AvailabilitySlot(dayOfWeek="monday", startTime="18:00", endTime="20:00").model_dump(),
        AvailabilitySlot(dayOfWeek="wednesday", startTime="18:00", endTime="20:00").model_dump(),
        AvailabilitySlot(dayOfWeek="friday", startTime="19:00", endTime="21:00").model_dump(),
        AvailabilitySlot(dayOfWeek="saturday", startTime="07:00", endTime="09:00").model_dump(),
        AvailabilitySlot(dayOfWeek="sunday", startTime="07:00", endTime="09:00").model_dump(),
    ]

    await db.players.insert_many(docs)
    log.info("Seeded %d players", len(docs))

    # Seed games — a mix of open/full games over the next 7 days.
    today = date.today()
    games = []
    seed_games = [
        # (host, venue, court, day_offset, start, end, min, max, players)
        ("p-arjun", "sunday-club", "sunday-c1", 0, "18:00", "19:30", 7.0, 8.5, ["p-arjun", "p-priya"]),
        ("p-rohan", "round-two", "round-two-c1", 1, "19:00", "20:30", 6.5, 8.0, ["p-rohan", "p-anita", "kunal"]),
        ("p-anita", "coplay-assagao", "coplay-assagao-c1", 2, "07:00", "08:30", 5.5, 7.5, ["p-anita", "p-meera"]),
        ("p-sahil", "clube-de-floresta", "floresta-c1", 2, "18:00", "19:30", 5.0, 6.5, ["p-sahil", "p-divya"]),
        ("p-vikram", "sunday-club", "sunday-c2", 3, "19:00", "20:30", 6.0, 7.5, ["p-vikram", "p-sneha", "p-rohan"]),
        ("p-tanvi", "coco-anjuna", "coco-anjuna-c1", 4, "17:00", "18:30", 4.5, 6.0, ["p-tanvi", "p-rahul"]),
        ("p-priya", "jolt-method", "jolt-c1", 5, "07:00", "08:30", 7.0, 8.5, ["p-priya", "p-arjun", "p-rohan"]),
        ("p-meera", "coco-assagao", "coco-assagao-c1", 6, "18:00", "19:30", 5.5, 7.0, ["p-meera", "p-anita"]),
        ("p-divya", "sunday-club", "sunday-c3", 0, "07:00", "08:30", 4.5, 6.0, ["p-divya", "p-isha"]),
        ("p-rohan", "round-two", "round-two-c1", 4, "19:00", "20:30", 6.5, 8.0, ["p-rohan", "p-arjun", "p-priya", "kunal"]),
    ]
    for host, venue, court, off, st, en, mn, mx, ps in seed_games:
        label = "Beginner" if mx < 5 else ("Intermediate" if mx < 7.5 else "Advanced")
        gid = str(uuid.uuid4())
        status = "full" if len(ps) >= 4 else "open"
        wa = (
            f"\U0001F3BE Game at {next(v['name'] for v in VENUES_SEED if v['id']==venue)}, "
            f"{next(v['area'] for v in VENUES_SEED if v['id']==venue)}\n"
            f"{(today+timedelta(days=off)).strftime('%a %d %b')} \u00B7 {st}\u2013{en}\n"
            f"Level: {label} ({mn}\u2013{mx})\n{4-len(ps)} spots open\n\nJoin: padelmatch.in/g/{gid[:6]}"
        )
        games.append(Game(
            id=gid, hostId=host, venueId=venue, courtId=court,
            date=(today + timedelta(days=off)).isoformat(),
            startTime=st, endTime=en, skillLevelMin=mn, skillLevelMax=mx,
            skillLabel=label, players=ps, status=status,
            shareLink=f"padelmatch.in/g/{gid[:6]}",
            whatsappText=wa,
        ).model_dump())
    await db.games.insert_many(games)
    log.info("Seeded %d games", len(games))

    # Seed some played matches (history) for Kunal
    played_seed = [
        # (date_offset, pairA, pairB, winner, sets, venue, court)
        (-3, ["kunal", "p-priya"], ["p-arjun", "p-rohan"], "pairA",
         [{"pairA": 6, "pairB": 4}, {"pairA": 4, "pairB": 6}, {"pairA": 6, "pairB": 2}],
         "sunday-club", "sunday-c1"),
        (-7, ["kunal", "p-anita"], ["p-meera", "p-vikram"], "pairB",
         [{"pairA": 3, "pairB": 6}, {"pairA": 6, "pairB": 4}, {"pairA": 4, "pairB": 6}],
         "round-two", "round-two-c1"),
        (-12, ["kunal", "p-arjun"], ["p-priya", "p-rohan"], "pairA",
         [{"pairA": 7, "pairB": 5}, {"pairA": 6, "pairB": 4}],
         "clube-de-floresta", "floresta-c1"),
        (-18, ["p-rohan", "kunal"], ["p-sahil", "p-divya"], "pairA",
         [{"pairA": 6, "pairB": 2}, {"pairA": 6, "pairB": 3}],
         "coplay-assagao", "coplay-assagao-c1"),
    ]
    matches = []
    for off, pa, pb, winner, sets, venue, court in played_seed:
        m = Match(
            id=str(uuid.uuid4()),
            date=(today + timedelta(days=off)).isoformat(),
            venueId=venue, courtId=court,
            pairA=pa, pairB=pb, hostId=pa[0],
            scheduledStart="18:00", scheduledEnd="19:30",
            sets=[SetScore(**s) for s in sets],
            winner=winner, status="scored",
            scoreEnteredBy=pa[0],
            scoredAt=(datetime.now(timezone.utc) - timedelta(days=abs(off))).isoformat(),
        ).model_dump()
        matches.append(m)
    await db.matches.insert_many(matches)
    log.info("Seeded %d matches", len(matches))

    # Notifications for Kunal
    notifs = [
        Notification(playerId="kunal", type="game_opened",
                     message="A game at Sunday Club just opened — Arjun M. is in it",
                     relatedId=games[0]["id"]).model_dump(),
        Notification(playerId="kunal", type="rank_up",
                     message="You've moved up to #4 in North Goa Padel").model_dump(),
        Notification(playerId="kunal", type="score_request",
                     message="How did your game at Sunday Club go? Enter the score \u2192",
                     relatedId=matches[0]["id"]).model_dump(),
        Notification(playerId="kunal", type="rating_update",
                     message="Your rating updated to 7.2 after yesterday's match").model_dump(),
        Notification(playerId="kunal", type="new_player",
                     message="Karan H. joined North Goa Padel").model_dump(),
    ]
    await db.notifications.insert_many(notifs)


# --------------------------- HELPERS ---------------------------

def clean(d: dict) -> dict:
    if d and "_id" in d:
        d.pop("_id", None)
    return d


async def _attach_rank(p: dict) -> dict:
    """Compute communityRank on the fly so home/profile display correctly."""
    if p.get("matchesPlayed", 0) >= 5:
        higher = await db.players.count_documents({
            "matchesPlayed": {"$gte": 5},
            "gameRating": {"$gt": p["gameRating"]},
        })
        p["communityRank"] = higher + 1
    else:
        p["communityRank"] = None
    return p


async def get_player_or_404(pid: str) -> dict:
    p = await db.players.find_one({"id": pid}, {"_id": 0})
    if not p:
        raise HTTPException(404, "Player not found")
    return await _attach_rank(p)


def parse_time(t: str) -> int:
    h, m = t.split(":")
    return int(h) * 60 + int(m)


def day_of_week(date_str: str) -> str:
    d = datetime.fromisoformat(date_str).date() if "T" not in date_str else datetime.fromisoformat(date_str).date()
    return ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"][d.weekday()]


def fuzzy_avail(slots: list, game: dict, flex_min: int = 60) -> str:
    if not slots:
        return "none"
    g_day = day_of_week(game["date"])
    g_start = parse_time(game["startTime"])
    for s in slots:
        if s["dayOfWeek"] != g_day:
            continue
        diff = abs(g_start - parse_time(s["startTime"]))
        if diff == 0:
            return "exact"
        if diff <= flex_min:
            return "close"
    return "none"


def compute_recommendation(game: dict, player: dict, venues_by_id: dict, players_by_id: dict) -> dict:
    score = 0
    reasons = []
    venue_name = venues_by_id.get(game["venueId"], {}).get("name", "")
    pref = player.get("preferredVenues") or []
    if pref and game["venueId"] == (pref[0] if pref else None):
        score += 30
        reasons.append(f"{venue_name} is your #1 venue")
    elif game["venueId"] in pref[:3]:
        score += 20
        reasons.append(f"{venue_name} is one of your preferred venues")
    elif game["venueId"] in pref:
        score += 10

    fa = fuzzy_avail(player.get("availabilitySlots") or [], game, 60)
    if fa == "exact":
        score += 30
        reasons.append("Matches your availability exactly")
    elif fa == "close":
        score += 20
        reasons.append("Close to your usual time")

    preferred_in_game = []
    for c in player.get("connections") or []:
        if c["relationship"] != "prefer_not" and c["playerId"] in game["players"]:
            nm = players_by_id.get(c["playerId"], {}).get("name")
            if nm:
                preferred_in_game.append(nm)
    if len(preferred_in_game) >= 2:
        score += 30
        reasons.append(f"{preferred_in_game[0]} & {preferred_in_game[1]} are in this game")
    elif len(preferred_in_game) == 1:
        score += 15
        reasons.append(f"{preferred_in_game[0]} is in this game")

    r = player.get("gameRating", 5.0)
    if game["skillLevelMin"] <= r <= game["skillLevelMax"]:
        score += 10

    label = "STRONG MATCH" if score >= 70 else ("GOOD MATCH" if score >= 40 else None)
    return {"score": score, "label": label, "reasons": reasons}


# --------------------------- ROUTES ---------------------------

@api.get("/")
async def root():
    return {"service": "padel-match", "status": "ok"}


@api.get("/venues")
async def list_venues():
    return [clean(v) async for v in db.venues.find({}, {"_id": 0})]


def _strip_private_tags(player: dict, viewer_id: Optional[str]) -> dict:
    """Rule 3b — connection tags/reason are PRIVATE to the author.

    If the viewer is not the player whose `connections` list this is,
    drop the `tags` and `reason` fields from every connection before
    returning the doc.
    """
    if not isinstance(player, dict):
        return player
    if viewer_id and player.get("id") == viewer_id:
        return player
    conns = player.get("connections") or []
    if not conns:
        return player
    scrubbed = []
    for c in conns:
        if not isinstance(c, dict):
            scrubbed.append(c); continue
        cc = {k: v for k, v in c.items() if k not in ("tags", "reason")}
        scrubbed.append(cc)
    player = dict(player)
    player["connections"] = scrubbed
    return player


@api.get("/players")
async def list_players(x_player_id: str = Header(default="kunal", alias="x-player-id")):
    return [
        _strip_private_tags(clean(p), x_player_id)
        async for p in db.players.find({}, {"_id": 0}).sort("gameRating", -1)
    ]


@api.get("/players/{pid}")
async def get_player(pid: str, x_player_id: str = Header(default="kunal", alias="x-player-id")):
    p = await get_player_or_404(pid)
    return _strip_private_tags(p, x_player_id)


class PlayerCreate(BaseModel):
    name: str
    phone: str = ""
    bio: str = ""
    profilePhoto: Optional[str] = None
    yearsPlayed: str = "1to3"
    frequency: str = "weekly"
    competitiveExperience: str = "none"
    wallControl: str = "somewhat"
    preferredVenues: List[str] = []
    availabilitySlots: List[AvailabilitySlot] = []
    gamesPerWeek: int = 2
    gameOrientation: str = "both"
    connections: List[Connection] = []
    shotComfort: Dict[str, int] = {}
    # Onboarding V2 fields
    rankedDays: List[str] = []
    preferredStartTime: Optional[str] = None
    preferredEndTime: Optional[str] = None
    rankedTimeBlocks: List[str] = []
    gameTypes: List[str] = []
    whatsappVerified: bool = False


@api.post("/players")
async def create_player(body: PlayerCreate):
    payload = body.model_dump()
    rating = compute_initial_rating(payload)
    p = Player(
        **payload,
        gameRating=rating,
        gameRatingPeak=rating,
        initialRatingEstimate=rating,
        gameRatingStatus="estimated",
        profileCompleteness=100,
        onboardingCompletedAt=datetime.now(timezone.utc).isoformat(),
    ).model_dump()
    await db.players.insert_one(p)
    p.pop("_id", None)
    return p


class PlayerPatch(BaseModel):
    name: Optional[str] = None
    bio: Optional[str] = None
    profilePhoto: Optional[str] = None
    preferredVenues: Optional[List[str]] = None
    availabilitySlots: Optional[List[AvailabilitySlot]] = None
    gamesPerWeek: Optional[int] = None
    gameOrientation: Optional[str] = None
    shotComfort: Optional[Dict[str, int]] = None
    connections: Optional[List[Connection]] = None


@api.patch("/players/{pid}")
async def patch_player(pid: str, body: PlayerPatch):
    update = {k: v for k, v in body.model_dump(exclude_unset=True).items() if v is not None}
    if not update:
        return await get_player_or_404(pid)
    await db.players.update_one({"id": pid}, {"$set": update})
    return await get_player_or_404(pid)


@api.get("/games")
async def list_games(
    when: Optional[str] = None,
    venueId: Optional[str] = None,
    skillMin: Optional[float] = None,
    skillMax: Optional[float] = None,
    openOnly: Optional[bool] = None,
):
    q: Dict[str, Any] = {}
    today = date.today()
    if when == "today":
        q["date"] = today.isoformat()
    elif when == "week":
        q["date"] = {"$gte": today.isoformat(), "$lte": (today + timedelta(days=7)).isoformat()}
    if venueId:
        q["venueId"] = venueId
    if skillMin is not None:
        q["skillLevelMax"] = {"$gte": skillMin}
    if skillMax is not None:
        q.setdefault("skillLevelMin", {})
        q["skillLevelMin"]["$lte"] = skillMax
    if openOnly:
        # "Open" in the new state machine = still accepting players.
        q["status"] = {"$in": ["FORMING"]}
    games = []
    async for g in db.games.find(q, {"_id": 0}).sort("date", 1):
        g = await _auto_complete_if_past(g)
        games.append(clean(g))
    return games


@api.get("/games/pending-completion")
async def games_pending_completion(
    x_player_id: str = Header(default="kunal", alias="x-player-id"),
):
    """Games the caller participated in that have ended but still have
    outstanding post-match prompts.

    Catches two cases:
      1) BOOKED games whose endTime has passed — auto-transition to
         COMPLETED (also creates a Match for score entry).
      2) Already-COMPLETED / SCORED games where this player still hasn't
         finished all three post-match prompts (scores, reflection,
         peer ratings) and hasn't dismissed the card.
    """
    out: List[dict] = []
    q = {"$or": [
        {"status": "BOOKED"},
        {"status": {"$in": ["COMPLETED", "SCORED"]}, "players": x_player_id},
    ]}
    async for g in db.games.find(q, {"_id": 0}):
        if g.get("status") == "BOOKED":
            g = await _auto_complete_if_past(g)
        if g.get("status") not in ("COMPLETED", "SCORED"):
            continue
        if x_player_id not in g.get("players", []):
            continue
        if x_player_id in (g.get("promptDismissedBy") or []):
            continue
        scored     = x_player_id in (g.get("scoresSubmittedBy") or [])
        reflected  = x_player_id in (g.get("reflectionsBy") or [])
        rated      = x_player_id in (g.get("peerRatingsBy") or [])
        if scored and reflected and rated:
            continue
        out.append(clean(g))
    # Most recently completed first.
    out.sort(key=lambda g: g.get("completedAt") or "", reverse=True)
    return out


@api.get("/games/{gid}")
async def get_game(gid: str):
    g = await db.games.find_one({"id": gid}, {"_id": 0})
    if not g:
        raise HTTPException(404, "Game not found")
    g = await _auto_complete_if_past(g)
    return clean(g)


class GameCreate(BaseModel):
    hostId: str
    venueId: str
    courtId: str
    date: str
    startTime: str
    endTime: str
    skillLevelMin: float
    skillLevelMax: float
    skillLabel: str
    gameType: str = "competitive"  # competitive | social


# ── Game state helpers ──────────────────────────────────────────────────
ALLOWED_GAME_STATUSES = {"FORMING", "CONFIRMED", "BOOKED", "COMPLETED", "SCORED", "CANCELLED"}

def _game_end_dt(g: dict) -> Optional[datetime]:
    try:
        return datetime.fromisoformat(f"{g['date']}T{g['endTime']}:00")
    except Exception:
        return None

async def _auto_complete_if_past(g: dict) -> dict:
    """If a BOOKED game's endTime is in the past, transition to COMPLETED.

    Also lazily create a Match record (with players split 2/2) so the
    post-match score screen has a row to write into. The pair assignment
    can be edited later via the score screen.
    """
    if g.get("status") != "BOOKED":
        return g
    end = _game_end_dt(g)
    if end is None or end > datetime.now():
        return g
    now = datetime.now(timezone.utc).isoformat()
    update: Dict[str, Any] = {"status": "COMPLETED", "completedAt": now}
    # Ensure a match exists for score entry.
    match_id = g.get("matchId")
    if not match_id:
        players = list(g.get("players") or [])
        # Pad to 4 with empty strings if under-attended.
        while len(players) < 4:
            players.append("")
        match_id = str(uuid.uuid4())
        match_doc = {
            "id": match_id,
            "gameId": g["id"],
            "venueId": g["venueId"],
            "courtId": g["courtId"],
            "date": g["date"],
            "startTime": g["startTime"],
            "endTime": g["endTime"],
            "pairA": players[:2],
            "pairB": players[2:4],
            "sets": [],
            "winner": None,
            "status": "pending",
            "gameType": g.get("gameType", "competitive"),
            "createdAt": now,
        }
        await db.matches.insert_one(match_doc)
        update["matchId"] = match_id
    await db.games.update_one({"id": g["id"]}, {"$set": update})
    g.update(update)
    return g


@api.post("/games")
async def create_game(body: GameCreate):
    venue = await db.venues.find_one({"id": body.venueId}, {"_id": 0})
    if not venue:
        raise HTTPException(400, "Unknown venue")
    if body.gameType not in ("competitive", "social"):
        raise HTTPException(400, "gameType must be competitive or social")
    gid = str(uuid.uuid4())
    d = datetime.fromisoformat(body.date).date()
    wa = (
        f"\U0001F3BE Game at {venue['name']}, {venue['area']}\n"
        f"{d.strftime('%a %d %b')} \u00B7 {body.startTime}\u2013{body.endTime}\n"
        f"Level: {body.skillLabel} ({body.skillLevelMin}\u2013{body.skillLevelMax})\n"
        f"3 spots open\n\nJoin: padelmatch.in/g/{gid[:6]}"
    )
    g = Game(
        id=gid,
        hostId=body.hostId,
        venueId=body.venueId,
        courtId=body.courtId,
        date=body.date,
        startTime=body.startTime,
        endTime=body.endTime,
        skillLevelMin=body.skillLevelMin,
        skillLevelMax=body.skillLevelMax,
        skillLabel=body.skillLabel,
        players=[body.hostId],
        status="FORMING",
        gameType=body.gameType,
        shareLink=f"padelmatch.in/g/{gid[:6]}",
        whatsappText=wa,
    ).model_dump()
    await db.games.insert_one(g)
    g.pop("_id", None)
    return g


@api.post("/games/{gid}/join")
async def join_game(gid: str, x_player_id: str = Header(default="kunal", alias="x-player-id")):
    g = await db.games.find_one({"id": gid}, {"_id": 0})
    if not g:
        raise HTTPException(404, "Game not found")
    if g.get("status") == "CANCELLED":
        raise HTTPException(400, "Game cancelled")
    if x_player_id in g["players"]:
        return g
    if len(g["players"]) >= 4:
        raise HTTPException(400, "Game full")
    g["players"].append(x_player_id)
    # FORMING → CONFIRMED on 4th join.
    if len(g["players"]) >= 4 and g.get("status") == "FORMING":
        g["status"] = "CONFIRMED"
        g["confirmedAt"] = datetime.now(timezone.utc).isoformat()
    await db.games.update_one(
        {"id": gid},
        {"$set": {"players": g["players"], "status": g["status"],
                  "confirmedAt": g.get("confirmedAt")}},
    )
    return g


@api.post("/games/{gid}/leave")
async def leave_game(gid: str, x_player_id: str = Header(default="kunal", alias="x-player-id")):
    g = await db.games.find_one({"id": gid}, {"_id": 0})
    if not g:
        raise HTTPException(404, "Game not found")
    if x_player_id not in g["players"]:
        return g
    g["players"].remove(x_player_id)
    # Drop back to FORMING if we dip below 4 players AND haven't been booked.
    if g.get("status") in ("CONFIRMED",) and len(g["players"]) < 4:
        g["status"] = "FORMING"
        g["confirmedAt"] = None
    await db.games.update_one({"id": gid}, {"$set": {
        "players": g["players"], "status": g["status"], "confirmedAt": g.get("confirmedAt"),
    }})
    return g


class BookBody(BaseModel):
    hudleBookingUrl: str


@api.patch("/games/{gid}/book")
async def book_game(gid: str, body: BookBody,
                    x_player_id: str = Header(default="kunal", alias="x-player-id")):
    g = await db.games.find_one({"id": gid}, {"_id": 0})
    if not g:
        raise HTTPException(404, "Game not found")
    if g.get("hostId") != x_player_id:
        raise HTTPException(403, "Only the host can book the court")
    if g.get("status") not in ("CONFIRMED", "FORMING"):
        raise HTTPException(400, f"Cannot book from status {g.get('status')}")
    now = datetime.now(timezone.utc).isoformat()
    upd = {"status": "BOOKED", "hudleBookingUrl": body.hudleBookingUrl, "bookedAt": now}
    await db.games.update_one({"id": gid}, {"$set": upd})
    g.update(upd)
    return g


@api.post("/games/{gid}/cancel")
async def cancel_game(gid: str,
                      x_player_id: str = Header(default="kunal", alias="x-player-id")):
    g = await db.games.find_one({"id": gid}, {"_id": 0})
    if not g:
        raise HTTPException(404, "Game not found")
    if g.get("hostId") != x_player_id:
        raise HTTPException(403, "Only the host can cancel")
    now = datetime.now(timezone.utc).isoformat()
    upd = {"status": "CANCELLED", "cancelledBy": x_player_id, "cancelledAt": now}
    await db.games.update_one({"id": gid}, {"$set": upd})
    g.update(upd)
    return g


class DismissBody(BaseModel):
    dismiss: bool = True


@api.post("/games/{gid}/dismiss-prompt")
async def dismiss_prompt(gid: str, body: DismissBody,
                         x_player_id: str = Header(default="kunal", alias="x-player-id")):
    """Player chose 'remind me later' — hide the post-match prompt for them
    until the next app launch (frontend handles re-surfacing)."""
    if body.dismiss:
        await db.games.update_one({"id": gid}, {"$addToSet": {"promptDismissedBy": x_player_id}})
    else:
        await db.games.update_one({"id": gid}, {"$pull": {"promptDismissedBy": x_player_id}})
    return {"ok": True}


class ReflectionBody(BaseModel):
    text: str = ""
    focusAreas: List[str] = []


@api.post("/games/{gid}/reflect")
async def submit_reflection(gid: str, body: ReflectionBody,
                            x_player_id: str = Header(default="kunal", alias="x-player-id")):
    g = await db.games.find_one({"id": gid}, {"_id": 0})
    if not g:
        raise HTTPException(404, "Game not found")
    if x_player_id not in g.get("players", []):
        raise HTTPException(403, "Not a participant of this game")
    entry = {
        "gameId": gid,
        "playerId": x_player_id,
        "text": body.text[:280],
        "focusAreas": body.focusAreas,
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }
    await db.reflections.insert_one(entry)
    await db.games.update_one({"id": gid}, {"$addToSet": {"reflectionsBy": x_player_id}})
    entry.pop("_id", None)
    return entry


class PeerRatingsBody(BaseModel):
    # ratings: { otherPlayerId: { technique, attack, defence, tactics, partnership } }
    ratings: Dict[str, Dict[str, int]]


# Categories tracked in Player.peerRatings (sum + count averages).
PEER_RATING_KEYS = ("technique", "offensiveSkill", "defensiveSkill",
                    "tacticalAbility", "partnershipSkill")
# Frontend uses friendlier names — map them onto the canonical keys.
PEER_RATING_ALIASES = {
    "technique": "technique",
    "attack": "offensiveSkill",
    "defence": "defensiveSkill",
    "defense": "defensiveSkill",
    "tactics": "tacticalAbility",
    "partnership": "partnershipSkill",
}


@api.post("/games/{gid}/peer-ratings")
async def submit_peer_ratings(gid: str, body: PeerRatingsBody,
                              x_player_id: str = Header(default="kunal", alias="x-player-id")):
    g = await db.games.find_one({"id": gid}, {"_id": 0})
    if not g:
        raise HTTPException(404, "Game not found")
    if x_player_id not in g.get("players", []):
        raise HTTPException(403, "Not a participant of this game")
    # Update each rated player's peerRatings sum+count.
    for other_pid, scores in body.ratings.items():
        if other_pid == x_player_id or other_pid not in g.get("players", []):
            continue
        inc: Dict[str, int] = {}
        for k, v in (scores or {}).items():
            canon = PEER_RATING_ALIASES.get(k)
            if not canon:
                continue
            try:
                iv = max(1, min(5, int(v)))
            except Exception:
                continue
            inc[f"peerRatings.{canon}.sum"] = inc.get(f"peerRatings.{canon}.sum", 0) + iv
            inc[f"peerRatings.{canon}.count"] = inc.get(f"peerRatings.{canon}.count", 0) + 1
        if inc:
            await db.players.update_one({"id": other_pid}, {"$inc": inc})
    await db.games.update_one({"id": gid}, {"$addToSet": {"peerRatingsBy": x_player_id}})
    return {"ok": True}


class AttendanceBody(BaseModel):
    attendance: Dict[str, bool]


@api.post("/games/{gid}/attendance")
async def submit_attendance(gid: str, body: AttendanceBody,
                            x_player_id: str = Header(default="kunal", alias="x-player-id")):
    g = await db.games.find_one({"id": gid}, {"_id": 0})
    if not g:
        raise HTTPException(404, "Game not found")
    if x_player_id not in g.get("players", []):
        raise HTTPException(403, "Not a participant of this game")
    await db.games.update_one({"id": gid}, {"$set": {"attendance": body.attendance}})
    return {"ok": True}


@api.get("/recommendations")
async def recommendations(x_player_id: str = Header(default="kunal", alias="x-player-id"), limit: int = 5):
    me = await get_player_or_404(x_player_id)
    venues = {v["id"]: v async for v in db.venues.find({}, {"_id": 0})}
    players = {p["id"]: p async for p in db.players.find({}, {"_id": 0})}
    today = date.today().isoformat()
    week = (date.today() + timedelta(days=14)).isoformat()
    out = []
    async for g in db.games.find(
        {"status": "FORMING", "date": {"$gte": today, "$lte": week}}, {"_id": 0}
    ).sort("date", 1):
        if x_player_id in g["players"]:
            continue
        if len(g["players"]) >= 4:
            continue
        rec = compute_recommendation(g, me, venues, players)
        out.append({"game": g, **rec})
    out.sort(key=lambda r: r["score"], reverse=True)
    return out[:limit]


@api.get("/leaderboard")
async def leaderboard():
    players = [clean(p) async for p in db.players.find({}, {"_id": 0}).sort("gameRating", -1)]
    ranked = [p for p in players if p.get("matchesPlayed", 0) >= 5]
    unranked = [p for p in players if p.get("matchesPlayed", 0) < 5]
    for i, p in enumerate(ranked):
        p["communityRank"] = i + 1
    return {"ranked": ranked, "unranked": unranked, "community": "North Goa Padel"}


@api.get("/matches")
async def list_matches(playerId: Optional[str] = None, limit: int = 20):
    q: Dict[str, Any] = {}
    if playerId:
        q["$or"] = [{"pairA": playerId}, {"pairB": playerId}]
    cur = db.matches.find(q, {"_id": 0}).sort("date", -1).limit(limit)
    return [clean(m) async for m in cur]


@api.get("/matches/{mid}")
async def get_match(mid: str):
    m = await db.matches.find_one({"id": mid}, {"_id": 0})
    if not m:
        raise HTTPException(404, "Match not found")
    return m


class ScoreEntry(BaseModel):
    sets: List[SetScore]
    scoreEnteredBy: str
    gameType: Optional[str] = None  # override game-level flag (competitive | social)


@api.post("/matches/{mid}/score")
async def enter_score(mid: str, body: ScoreEntry):
    m = await db.matches.find_one({"id": mid}, {"_id": 0})
    if not m:
        raise HTTPException(404, "Match not found")
    sets_a = sum(1 for s in body.sets if s.pairA > s.pairB)
    sets_b = len(body.sets) - sets_a
    winner = "pairA" if sets_a > sets_b else "pairB"
    m["sets"] = [s.model_dump() for s in body.sets]
    m["winner"] = winner
    m["status"] = "scored"
    m["scoreEnteredBy"] = body.scoreEnteredBy
    m["scoredAt"] = datetime.now(timezone.utc).isoformat()

    # Determine if this is a competitive game (ELO mutates) or social
    # (record-only, no ELO mutation).
    game_type = body.gameType
    linked_game = None
    if m.get("gameId"):
        linked_game = await db.games.find_one({"id": m["gameId"]}, {"_id": 0})
        if linked_game and not game_type:
            game_type = linked_game.get("gameType", "competitive")
    if game_type not in ("competitive", "social"):
        game_type = "competitive"
    m["gameType"] = game_type

    deltas: Dict[str, Dict[str, float]] = {}
    if game_type == "competitive":
        # Load players, update Elo, persist.
        ids = m["pairA"] + m["pairB"]
        players = {}
        async for p in db.players.find({"id": {"$in": ids}}, {"_id": 0}):
            players[p["id"]] = p
        deltas = update_elo_for_match(m, players)
        for pid, p in players.items():
            await db.players.update_one({"id": pid}, {"$set": {
                "gameRating": p["gameRating"],
                "gameRatingPeak": p["gameRatingPeak"],
                "gameRatingHistory": p["gameRatingHistory"],
                "gameRatingStatus": p["gameRatingStatus"],
                "matchesPlayed": p["matchesPlayed"],
                "wins": p["wins"],
                "losses": p["losses"],
            }})
    else:
        # Social: bump matchesPlayed + wins/losses tally only.
        ids = m["pairA"] + m["pairB"]
        async for p in db.players.find({"id": {"$in": ids}}, {"_id": 0}):
            won = (m["winner"] == "pairA" and p["id"] in m["pairA"]) or \
                  (m["winner"] == "pairB" and p["id"] in m["pairB"])
            inc = {"matchesPlayed": 1, "wins": 1 if won else 0, "losses": 0 if won else 1}
            await db.players.update_one({"id": p["id"]}, {"$inc": inc})

    await db.matches.update_one({"id": mid}, {"$set": m})

    # Bump the linked Game to SCORED.
    if linked_game and m.get("scoreEnteredBy"):
        await db.games.update_one({"id": linked_game["id"]}, {
            "$set": {"status": "SCORED", "scoredAt": m["scoredAt"], "gameType": game_type},
            "$addToSet": {"scoresSubmittedBy": body.scoreEnteredBy},
        })
    return {"match": m, "deltas": deltas, "gameType": game_type}


@api.get("/notifications")
async def notifications(x_player_id: str = Header(default="kunal", alias="x-player-id")):
    cur = db.notifications.find({"playerId": x_player_id}, {"_id": 0}).sort("createdAt", -1)
    return [clean(n) async for n in cur]


@api.post("/notifications/{nid}/read")
async def mark_read(nid: str):
    await db.notifications.update_one({"id": nid}, {"$set": {"read": True}})
    return {"ok": True}


@api.post("/dev/reseed")
async def reseed():
    """Wipe and reseed - useful during development."""
    await db.players.delete_many({})
    await db.games.delete_many({})
    await db.matches.delete_many({})
    await db.notifications.delete_many({})
    await db.venues.delete_many({})
    await seed_if_empty()
    return {"ok": True}


# --------------------------- COMMUNITY SEED (real players) ---------------------------
# Real North-Goa Padel community roster — upserted by id on startup and via
# POST /api/dev/seed-community. Profile/preferences fields are always synced
# (these are the source of truth). Stat fields (gameRating, matchesPlayed,
# wins, losses, gameRatingHistory, …) are only set on FIRST insert via
# $setOnInsert so any computed match values are preserved across reseeds.

COMMUNITY_SEED = [
    # ── ACTIVE ────────────────────────────────────────────────
    {"id": "kunal", "name": "Kunal Bambawale", "phone": "+919834751704",
     "status": "active", "invitedBy": None, "communityId": "north-goa-padel",
     "preferredVenues": ["round-two", "sunday-club", "jolt-method"],
     "rankedDays": ["monday", "wednesday", "friday", "saturday", "sunday"],
     "preferredStartTime": "19:00", "preferredEndTime": "20:30",
     "connections": []},

    # ── INVITED — preferences documented ─────────────────────
    {"id": "abhilaash-s", "name": "Abhilaash Sahu", "phone": "+917042780534",
     "status": "invited", "invitedBy": "kunal", "communityId": "north-goa-padel",
     "preferredVenues": ["round-two", "sunday-club", "coco-anjuna"],
     "rankedDays": ["monday", "wednesday", "thursday", "friday"],
     "preferredStartTime": "18:00", "preferredEndTime": "19:30",
     "connections": [
        {"playerId": "aakash-m", "relationship": "played_with", "tags": ["social"]},
        {"playerId": "abraham-ja", "relationship": "played_with", "tags": ["social"]},
        {"playerId": "varun-n", "relationship": "played_with", "tags": ["social"]},
        {"playerId": "adhi-b", "relationship": "played_with", "tags": ["social"]},
        {"playerId": "sagar-m", "relationship": "played_with", "tags": ["social"]},
        {"playerId": "amar-s", "relationship": "played_with", "tags": ["social"]},
        {"playerId": "kunal", "relationship": "played_with", "tags": ["social"]},
     ]},
    {"id": "abhizer-r", "name": "Abhizer Rajkotwala", "phone": "+917303197397",
     "status": "invited", "invitedBy": "kunal", "communityId": "north-goa-padel",
     "preferredVenues": ["sunday-club", "round-two"],
     "rankedDays": ["tuesday", "thursday", "saturday"],
     "preferredStartTime": "17:00", "preferredEndTime": "20:00",
     "connections": []},
    {"id": "abraham-ja", "name": "Abraham J.A.", "phone": "+919740194001",
     "status": "invited", "invitedBy": "kunal", "communityId": "north-goa-padel",
     "preferredVenues": ["sunday-club", "clube-de-floresta"],
     "rankedDays": ["wednesday", "friday", "saturday"],
     "preferredStartTime": "09:00", "preferredEndTime": "22:00",
     "connections": [
        {"playerId": "aakash-m", "relationship": "played_with", "tags": ["social"]},
        {"playerId": "teyjas-c", "relationship": "played_with", "tags": ["social"]},
        {"playerId": "prayaag", "relationship": "played_with", "tags": ["social"]},
        {"playerId": "ryan", "relationship": "played_with", "tags": ["social"]},
        {"playerId": "vibhav", "relationship": "played_with", "tags": ["social"]},
        {"playerId": "bharat", "relationship": "played_with", "tags": ["social"]},
     ]},
    {"id": "adhi-b", "name": "Adhi Bhattacharya", "phone": "+918971908034",
     "status": "invited", "invitedBy": "kunal", "communityId": "north-goa-padel",
     "preferredVenues": [],
     "rankedDays": ["tuesday", "wednesday", "thursday", "saturday"],
     "preferredStartTime": "08:00", "preferredEndTime": "21:00",
     "connections": []},
    {"id": "amar-s", "name": "Amar Sarvaria", "phone": "+919910869827",
     "status": "invited", "invitedBy": "kunal", "communityId": "north-goa-padel",
     "preferredVenues": ["round-two", "coco-assagao", "clube-de-floresta"],
     "rankedDays": ["friday", "saturday", "sunday"],
     "preferredStartTime": "17:30", "preferredEndTime": "20:00",
     "connections": [
        {"playerId": "abhilaash-s", "relationship": "played_with", "tags": ["social"]},
        {"playerId": "aakash-m", "relationship": "played_with", "tags": ["social"]},
        {"playerId": "alexander-m", "relationship": "played_with", "tags": ["social", "competitive"]},
     ]},
    {"id": "aman-m", "name": "Aman Mamgain", "phone": "+918010599485",
     "status": "invited", "invitedBy": "kunal", "communityId": "north-goa-padel",
     "preferredVenues": ["sunday-club", "jolt-method", "round-two"],
     "rankedDays": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
     "preferredStartTime": "18:00", "preferredEndTime": "21:00",
     "connections": []},
    {"id": "ashwin-s", "name": "Ashwin Saksena", "phone": "+919820069169",
     "status": "invited", "invitedBy": "kunal", "communityId": "north-goa-padel",
     "preferredVenues": ["sunday-club", "coco-assagao", "round-two"],
     "rankedDays": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
     "preferredStartTime": "07:00", "preferredEndTime": "10:00",
     "connections": []},
    {"id": "dinika-t", "name": "Dinika Thomas", "phone": "+919742804532",
     "status": "invited", "invitedBy": "kunal", "communityId": "north-goa-padel",
     "preferredVenues": ["sunday-club", "coco-anjuna", "coco-assagao"],
     "rankedDays": ["monday", "tuesday", "thursday"],
     "preferredStartTime": "08:00", "preferredEndTime": "21:00",
     "connections": [
        {"playerId": "adhi-b", "relationship": "played_with", "tags": ["social"]},
        {"playerId": "teyjas-c", "relationship": "played_with", "tags": ["social"]},
        {"playerId": "aakash-m", "relationship": "played_with", "tags": ["social"]},
        {"playerId": "abraham-ja", "relationship": "played_with", "tags": ["social"]},
        {"playerId": "marina-b", "relationship": "played_with", "tags": ["social"]},
        {"playerId": "aneesha-l", "relationship": "played_with", "tags": ["social"]},
        {"playerId": "polina-s", "relationship": "played_with", "tags": ["social"]},
        {"playerId": "rhea-m", "relationship": "played_with", "tags": ["social"]},
     ]},
    {"id": "gaurav-c", "name": "Gaurav Chander", "phone": "+917506941144",
     "status": "invited", "invitedBy": "kunal", "communityId": "north-goa-padel",
     "preferredVenues": ["sunday-club", "coplay-panjim", "jolt-method"],
     "rankedDays": ["monday", "tuesday", "wednesday", "thursday", "friday"],
     "preferredStartTime": "09:00", "preferredEndTime": "19:00",
     "connections": []},
    {"id": "girish-v", "name": "Girish Venkatraman", "phone": "+918087603676",
     "status": "invited", "invitedBy": "kunal", "communityId": "north-goa-padel",
     "preferredVenues": ["sunday-club", "jolt-method"],
     "rankedDays": ["monday", "tuesday", "wednesday", "thursday", "friday"],
     "preferredStartTime": "18:00", "preferredEndTime": "21:00",
     "connections": [
        {"playerId": "rishi-s", "relationship": "played_with", "tags": ["social"]},
        {"playerId": "abhishek-b", "relationship": "played_with", "tags": ["social"]},
        {"playerId": "adhi-b", "relationship": "played_with", "tags": ["social"]},
        {"playerId": "harsh", "relationship": "played_with", "tags": ["social"]},
        {"playerId": "laveen", "relationship": "played_with", "tags": ["social"]},
        {"playerId": "bharat", "relationship": "played_with", "tags": ["social"]},
     ]},
    {"id": "ishaan-a", "name": "Ishaan Ahluwalia", "phone": "+919867384576",
     "status": "invited", "invitedBy": "kunal", "communityId": "north-goa-padel",
     "preferredVenues": ["coplay-assagao", "sunday-club", "coco-anjuna"],
     "rankedDays": ["monday", "wednesday", "friday"],
     "preferredStartTime": "18:30", "preferredEndTime": "20:00",
     "connections": [
        {"playerId": "teyjas-c", "relationship": "played_with", "tags": ["social", "competitive"]},
        {"playerId": "kusai", "relationship": "played_with", "tags": ["social", "competitive"]},
        {"playerId": "karan-meh", "relationship": "played_with", "tags": ["social", "competitive"]},
        {"playerId": "vishnu-m", "relationship": "played_with", "tags": ["social"]},
        {"playerId": "moustapha", "relationship": "played_with", "tags": ["social"]},
     ]},
    {"id": "marlon-r", "name": "Marlon Rodrigues", "phone": "+919822758927",
     "status": "invited", "invitedBy": "kunal", "communityId": "north-goa-padel",
     "preferredVenues": ["round-two", "coco-assagao", "sunday-club"],
     "rankedDays": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
     "preferredStartTime": "07:00", "preferredEndTime": "22:00",
     "connections": []},
    {"id": "belal-m", "name": "Mohammad Belal", "phone": "+918789170194",
     "status": "invited", "invitedBy": "kunal", "communityId": "north-goa-padel",
     "preferredVenues": ["round-two", "sunday-club"],
     "rankedDays": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
     "preferredStartTime": "17:00", "preferredEndTime": "20:00",
     "connections": [
        {"playerId": "aakash-m", "relationship": "played_with", "tags": ["social", "competitive"]},
        {"playerId": "abraham-ja", "relationship": "played_with", "tags": ["social"]},
        {"playerId": "mikhail-m", "relationship": "played_with", "tags": ["competitive"]},
     ]},
    {"id": "mukund-m", "name": "Mukund Muthanna", "phone": "+917204035030",
     "status": "invited", "invitedBy": "kunal", "communityId": "north-goa-padel",
     "preferredVenues": [],
     "rankedDays": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
     "preferredStartTime": "18:00", "preferredEndTime": "22:00",
     "connections": []},
    {"id": "prashasti-p", "name": "Prashasti Pandey", "phone": "+919967312974",
     "status": "invited", "invitedBy": "kunal", "communityId": "north-goa-padel",
     "preferredVenues": [],
     "rankedDays": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
     "preferredStartTime": "07:00", "preferredEndTime": "21:00",
     "connections": [
        {"playerId": "mihika-c", "relationship": "played_with", "tags": ["social"]},
        {"playerId": "polina-s", "relationship": "played_with", "tags": ["social"]},
        {"playerId": "sonam", "relationship": "played_with", "tags": ["social"]},
        {"playerId": "tamanna", "relationship": "played_with", "tags": ["social"]},
     ]},
    {"id": "ragini-m", "name": "Ragini Menon", "phone": "+919591693024",
     "status": "invited", "invitedBy": "kunal", "communityId": "north-goa-padel",
     "preferredVenues": ["round-two"],
     "rankedDays": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
     "preferredStartTime": "07:00", "preferredEndTime": "21:00",
     "connections": []},
    {"id": "sagar-m", "name": "Sagar Malik", "phone": "+919810807858",
     "status": "invited", "invitedBy": "kunal", "communityId": "north-goa-padel",
     "preferredVenues": ["round-two", "clube-de-floresta"],
     "rankedDays": ["wednesday", "thursday", "friday"],
     "preferredStartTime": "15:00", "preferredEndTime": "19:00",
     "connections": [
        {"playerId": "alexander-m", "relationship": "played_with", "tags": ["competitive"]},
     ]},
    {"id": "sagarika-b", "name": "Sagarika Bhandari", "phone": "+918279986583",
     "status": "invited", "invitedBy": "kunal", "communityId": "north-goa-padel",
     "preferredVenues": ["round-two"],
     "rankedDays": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
     "preferredStartTime": "07:00", "preferredEndTime": "21:00",
     "connections": [
        {"playerId": "mihika-c", "relationship": "played_with", "tags": ["social"]},
        {"playerId": "abhilaash-s", "relationship": "played_with", "tags": ["social"]},
        {"playerId": "arjun", "relationship": "played_with", "tags": ["social"]},
     ]},
    {"id": "shashank-s", "name": "Shashank Shekhar", "phone": "+918861062663",
     "status": "invited", "invitedBy": "kunal", "communityId": "north-goa-padel",
     "preferredVenues": [],
     "rankedDays": ["monday", "wednesday", "friday", "sunday"],
     "preferredStartTime": "07:30", "preferredEndTime": "21:00",
     "connections": [
        {"playerId": "amar-s", "relationship": "played_with", "tags": ["social"]},
        {"playerId": "aakash-m", "relationship": "played_with", "tags": ["social"]},
        {"playerId": "belal-m", "relationship": "played_with", "tags": ["social"]},
        {"playerId": "abraham-ja", "relationship": "played_with", "tags": ["social"]},
        {"playerId": "teyjas-c", "relationship": "played_with", "tags": ["social"]},
        {"playerId": "deepinder-s", "relationship": "played_with", "tags": ["social"]},
        {"playerId": "karan-meh", "relationship": "played_with", "tags": ["social"]},
        {"playerId": "moustapha", "relationship": "played_with", "tags": ["social"]},
     ]},
    {"id": "teyjas-c", "name": "Teyjas Chaudhry", "phone": "+919354207113",
     "status": "invited", "invitedBy": "kunal", "communityId": "north-goa-padel",
     "preferredVenues": ["sunday-club", "coco-assagao", "jolt-method", "clube-de-floresta"],
     "rankedDays": ["tuesday", "thursday", "friday"],
     "preferredStartTime": "17:00", "preferredEndTime": "20:00",
     "connections": []},
    {"id": "tushar-c", "name": "Tushar Chhabra", "phone": "+917030203408",
     "status": "invited", "invitedBy": "kunal", "communityId": "north-goa-padel",
     "preferredVenues": ["sunday-club", "coco-anjuna", "coco-assagao"],
     "rankedDays": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
     "preferredStartTime": "17:00", "preferredEndTime": "21:00",
     "connections": [
        {"playerId": "aman-m", "relationship": "played_with", "tags": ["social"]},
        {"playerId": "garv-v", "relationship": "played_with", "tags": ["social"]},
        {"playerId": "arpit-s", "relationship": "played_with", "tags": ["social"]},
     ]},
    {"id": "varun-n", "name": "Varun Narayanan", "phone": "+919945132553",
     "status": "invited", "invitedBy": "kunal", "communityId": "north-goa-padel",
     "preferredVenues": ["round-two", "coco-assagao", "clube-de-floresta"],
     "rankedDays": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
     "preferredStartTime": "18:00", "preferredEndTime": "22:00",
     "connections": []},

    # ── INVITED — no preferences yet ─────────────────────────
    {"id": "aakash-m", "name": "Aakash Moitra", "phone": "+919599206792",
     "status": "invited", "invitedBy": "kunal", "communityId": "north-goa-padel",
     "preferredVenues": [], "rankedDays": [], "connections": []},
    {"id": "abhishek-b", "name": "Abhishek Bardia", "phone": None,
     "status": "invited", "invitedBy": "kunal", "communityId": "north-goa-padel",
     "preferredVenues": [], "rankedDays": [], "connections": []},
    {"id": "harry-s", "name": "Harry Singh", "phone": "+919820715063",
     "status": "invited", "invitedBy": "kunal", "communityId": "north-goa-padel",
     "preferredVenues": [], "rankedDays": [], "connections": []},
    {"id": "mihika-c", "name": "Mihika Chanchani", "phone": "+919902474654",
     "status": "invited", "invitedBy": "kunal", "communityId": "north-goa-padel",
     "preferredVenues": [], "rankedDays": [], "connections": []},
    {"id": "rishi-s", "name": "Rishi Solanki", "phone": "+919833077209",
     "status": "invited", "invitedBy": "kunal", "communityId": "north-goa-padel",
     "preferredVenues": [], "rankedDays": [], "connections": []},
    {"id": "nishant-w", "name": "Nishant Walambe", "phone": None,
     "status": "invited", "invitedBy": "kunal", "communityId": "north-goa-padel",
     "preferredVenues": [], "rankedDays": [], "connections": []},

    # ── GHOST PROFILES ───────────────────────────────────────
    {"id": "alexander-m", "name": "Alexander McPherson", "phone": "+919172095371",
     "status": "ghost", "invitedBy": "amar-s", "communityId": "north-goa-padel",
     "preferredVenues": [], "rankedDays": [], "connections": []},
    {"id": "anand-c", "name": "Anand Chandani", "phone": None,
     "status": "ghost", "invitedBy": "abhilaash-s", "communityId": "north-goa-padel",
     "preferredVenues": [], "rankedDays": [], "connections": []},
    {"id": "arjun", "name": "Arjun", "phone": None,
     "status": "ghost", "invitedBy": "sagarika-b", "communityId": "north-goa-padel",
     "preferredVenues": [], "rankedDays": [], "connections": []},
    {"id": "arpit-s", "name": "Arpit Shah", "phone": None,
     "status": "ghost", "invitedBy": "tushar-c", "communityId": "north-goa-padel",
     "preferredVenues": [], "rankedDays": [], "connections": []},
    {"id": "bharat", "name": "Bharat", "phone": None,
     "status": "ghost", "invitedBy": "girish-v", "communityId": "north-goa-padel",
     "preferredVenues": [], "rankedDays": [], "connections": []},
    {"id": "deepinder-s", "name": "Deepinder Singh", "phone": None,
     "status": "ghost", "invitedBy": "shashank-s", "communityId": "north-goa-padel",
     "preferredVenues": [], "rankedDays": [], "connections": []},
    {"id": "garv-v", "name": "Garv Vohra", "phone": None,
     "status": "ghost", "invitedBy": "tushar-c", "communityId": "north-goa-padel",
     "preferredVenues": [], "rankedDays": [], "connections": []},
    {"id": "harsh", "name": "Harsh", "phone": None,
     "status": "ghost", "invitedBy": "girish-v", "communityId": "north-goa-padel",
     "preferredVenues": [], "rankedDays": [], "connections": []},
    {"id": "jashan-a", "name": "Jashan Arora", "phone": None,
     "status": "ghost", "invitedBy": "kunal", "communityId": "north-goa-padel",
     "preferredVenues": [], "rankedDays": [], "connections": []},
    {"id": "karan-meh", "name": "Karan Mehrota", "phone": None,
     "status": "ghost", "invitedBy": "ishaan-a", "communityId": "north-goa-padel",
     "preferredVenues": [], "rankedDays": [], "connections": []},
    {"id": "kusai", "name": "Kusai", "phone": None,
     "status": "ghost", "invitedBy": "ishaan-a", "communityId": "north-goa-padel",
     "preferredVenues": [], "rankedDays": [], "connections": []},
    {"id": "laveen", "name": "Laveen", "phone": None,
     "status": "ghost", "invitedBy": "girish-v", "communityId": "north-goa-padel",
     "preferredVenues": [], "rankedDays": [], "connections": []},
    {"id": "lokesh-c", "name": "Lokesh Chhabra", "phone": None,
     "status": "ghost", "invitedBy": "kunal", "communityId": "north-goa-padel",
     "preferredVenues": [], "rankedDays": [], "connections": []},
    {"id": "mikhail-m", "name": "Mikhail Mehra", "phone": None,
     "status": "ghost", "invitedBy": "belal-m", "communityId": "north-goa-padel",
     "preferredVenues": [], "rankedDays": [], "connections": []},
    {"id": "moustapha", "name": "Moustapha", "phone": None,
     "status": "ghost", "invitedBy": "shashank-s", "communityId": "north-goa-padel",
     "preferredVenues": [], "rankedDays": [], "connections": []},
    {"id": "marina-b", "name": "Marina Barskaya", "phone": None,
     "status": "ghost", "invitedBy": "dinika-t", "communityId": "north-goa-padel",
     "preferredVenues": [], "rankedDays": [], "connections": []},
    {"id": "aneesha-l", "name": "Aneesha Labroo", "phone": None,
     "status": "ghost", "invitedBy": "dinika-t", "communityId": "north-goa-padel",
     "preferredVenues": [], "rankedDays": [], "connections": []},
    {"id": "polina-s", "name": "Polina Shabalina", "phone": None,
     "status": "ghost", "invitedBy": "dinika-t", "communityId": "north-goa-padel",
     "preferredVenues": [], "rankedDays": [], "connections": []},
    {"id": "prayaag", "name": "Prayaag", "phone": None,
     "status": "ghost", "invitedBy": "abraham-ja", "communityId": "north-goa-padel",
     "preferredVenues": [], "rankedDays": [], "connections": []},
    {"id": "rajat", "name": "Rajat", "phone": None,
     "status": "ghost", "invitedBy": "adhi-b", "communityId": "north-goa-padel",
     "preferredVenues": [], "rankedDays": [], "connections": []},
    {"id": "rhea-m", "name": "Rhea Mathew", "phone": None,
     "status": "ghost", "invitedBy": "dinika-t", "communityId": "north-goa-padel",
     "preferredVenues": [], "rankedDays": [], "connections": []},
    {"id": "ryan", "name": "Ryan", "phone": None,
     "status": "ghost", "invitedBy": "abraham-ja", "communityId": "north-goa-padel",
     "preferredVenues": [], "rankedDays": [], "connections": []},
    {"id": "sonam", "name": "Sonam", "phone": None,
     "status": "ghost", "invitedBy": "prashasti-p", "communityId": "north-goa-padel",
     "preferredVenues": [], "rankedDays": [], "connections": []},
    {"id": "tamanna", "name": "Tamanna", "phone": None,
     "status": "ghost", "invitedBy": "prashasti-p", "communityId": "north-goa-padel",
     "preferredVenues": [], "rankedDays": [], "connections": []},
    {"id": "vibhav", "name": "Vibhav", "phone": None,
     "status": "ghost", "invitedBy": "abraham-ja", "communityId": "north-goa-padel",
     "preferredVenues": [], "rankedDays": [], "connections": []},
    {"id": "vishnu-m", "name": "Vishnu Malani", "phone": None,
     "status": "ghost", "invitedBy": "ishaan-a", "communityId": "north-goa-padel",
     "preferredVenues": [], "rankedDays": [], "connections": []},
]


async def seed_community() -> int:
    """Upsert every COMMUNITY_SEED entry by id.

    Fields in the seed dict are always synced via $set (these are
    canonical profile/preference data). Player default fields like
    gameRating, matchesPlayed, wins, losses, gameRatingHistory, joinedAt,
    lastActiveAt are only written on first insert via $setOnInsert so any
    computed values from matches are preserved.
    """
    count = 0
    for seed in COMMUNITY_SEED:
        defaults = Player(id=seed["id"], name=seed["name"]).model_dump()
        # Strip the keys we always $set so they don't end up in $setOnInsert.
        for k in list(seed.keys()):
            defaults.pop(k, None)
        await db.players.update_one(
            {"id": seed["id"]},
            {"$set": dict(seed), "$setOnInsert": defaults},
            upsert=True,
        )
        count += 1
    log.info("Seeded community: upserted %d players", count)
    return count


@api.post("/dev/seed-community")
async def dev_seed_community():
    """Idempotent upsert of the real community roster. Safe to call repeatedly."""
    n = await seed_community()
    return {"ok": True, "seeded": n}


@api.post("/dev/scrub")
async def dev_scrub():
    """Wipe ALL test / mock / previous data and leave only the real roster.

    Keeps:
      • venues (the 8 canonical Hudle venues)
      • players whose id appears in COMMUNITY_SEED
    Deletes:
      • any player not in the community roster (legacy mock players,
        signed-up test accounts, etc.)
      • all games, matches and notifications (these were all seed/test
        fixtures with mock data)
    Resets stats on the kept community players back to Player defaults so
    the leaderboard reflects an empty match history, then re-syncs the
    canonical community profile data.
    """
    keep_ids = [s["id"] for s in COMMUNITY_SEED]

    player_del = await db.players.delete_many({"id": {"$nin": keep_ids}})
    games_del = await db.games.delete_many({})
    matches_del = await db.matches.delete_many({})
    notifs_del = await db.notifications.delete_many({})

    # Reset rating / record fields on the kept community players.
    defaults = Player(id="__defaults__", name="__").model_dump()
    reset_fields = {
        "gameRating": defaults["gameRating"],
        "gameRatingPeak": defaults["gameRatingPeak"],
        "gameRatingHistory": [],
        "gameRatingStatus": defaults["gameRatingStatus"],
        "initialRatingEstimate": defaults["initialRatingEstimate"],
        "matchesPlayed": 0,
        "wins": 0,
        "losses": 0,
        "communityRank": None,
        "peerRatings": defaults["peerRatings"],
        "shotComfort": {},
    }
    await db.players.update_many(
        {"id": {"$in": keep_ids}},
        {"$set": reset_fields},
    )

    # Re-sync canonical community profile data on top of the reset.
    n = await seed_community()

    return {
        "ok": True,
        "deleted": {
            "players": player_del.deleted_count,
            "games": games_del.deleted_count,
            "matches": matches_del.deleted_count,
            "notifications": notifs_del.deleted_count,
        },
        "remaining_community": n,
    }


# --------------------------- OTP (PLACEHOLDER) ---------------------------
# Mock WhatsApp OTP. Accepts any 6-digit code OR the universal demo code
# 123456. MSG91 integration will plug in here later. The endpoint
# intentionally returns the OTP for development so frontend can echo it.

class OtpSend(BaseModel):
    phone: str

class OtpVerify(BaseModel):
    phone: str
    code: str


@api.post("/auth/otp/send")
async def otp_send(body: OtpSend):
    """Mock OTP send. Returns the code for dev only."""
    log.info("Mock OTP requested for phone %s", body.phone)
    return {"ok": True, "phone": body.phone, "devCode": "123456",
            "note": "Mock provider. Replace with MSG91 when ready."}


@api.post("/auth/otp/verify")
async def otp_verify(body: OtpVerify):
    code = (body.code or "").strip()
    if len(code) != 6 or not code.isdigit():
        raise HTTPException(400, "Invalid code format")
    # Accept any 6-digit code in mock mode.
    return {"ok": True, "verified": True, "phone": body.phone,
            "verifiedAt": datetime.now(timezone.utc).isoformat()}


# --------------------------- BRAND ASSETS ---------------------------
# Serves the canonical asset files shipped in
# /app/backend/static/brand/ (padelmatch-*.svg, *.png, tokens.css,
# tokens.json). DO NOT render brand marks on the server — only serve
# the official files provided by the brand kit zip.

from fastapi.staticfiles import StaticFiles  # noqa: E402
from fastapi.responses import FileResponse   # noqa: E402

_BRAND_DIR = ROOT_DIR / "static" / "brand"


def _brand_url(filename: str) -> str:
    return f"/api/brand/files/{filename}"


# A friendly index of the canonical assets.
_BRAND_INDEX = {
    "marks": {
        "cream":   "padelmatch-mark-cream.svg",
        "ink":     "padelmatch-mark-ink.svg",
        "white":   "padelmatch-mark-white.svg",
    },
    "letter_variants": {
        "P_cream": "padelmatch-P-cream.svg",
        "P_ink":   "padelmatch-P-ink.svg",
        "M_cream": "padelmatch-M-cream.svg",
        "M_ink":   "padelmatch-M-ink.svg",
    },
    "animated": {
        "pulse_cream": "padelmatch-pulse-cream.svg",
        "pulse_ink":   "padelmatch-pulse-ink.svg",
    },
    "app_icons": {
        "cream": "padelmatch-appicon-cream.svg",
        "ink":   "padelmatch-appicon-ink.svg",
        "lime":  "padelmatch-appicon-lime.svg",
    },
    "avatars": {
        "cream": "padelmatch-avatar-cream (1).svg",
        "ink":   "padelmatch-avatar-ink-512.png",
    },
    "favicons": {
        "16": "padelmatch-favicon-16.png",
        "32": "padelmatch-favicon-32.png",
        "48": "padelmatch-favicon-48.png",
        "svg": "padelmatch-favicon-48.svg",
        "apple_touch_180": "padelmatch-appletouch-180.png",
    },
    "og_images": {
        "cream_1200x630": "padelmatch-og-cream-1200x630 (1).png",
        "ink_1200x630":   "padelmatch-og-ink-1200x630.png",
    },
    "tokens": {
        "css":  "padelmatch-tokens.css",
        "json": "padelmatch-tokens.json",
    },
}


@api.get("/brand")
async def brand_index():
    """Inventory of the canonical brand assets (real files, not generated)."""
    def expand(d):
        if isinstance(d, dict):
            return {k: expand(v) for k, v in d.items()}
        return {"filename": d, "url": _brand_url(d)}
    return {
        "assets": expand(_BRAND_INDEX),
        "all_files_index": _brand_url(""),
        "notes": [
            "All assets are the canonical files shipped in the official PadelMatch brand kit zip.",
            "Serve via /api/brand/files/<filename> — no server-side rendering.",
            "Tokens: see /api/brand/files/padelmatch-tokens.json for the source-of-truth palette.",
        ],
    }


@api.get("/brand/raw-tokens")
async def brand_raw_tokens():
    """Convenience: returns the parsed tokens.json."""
    path = _BRAND_DIR / "padelmatch-tokens.json"
    return FileResponse(path, media_type="application/json")


# Mount the static directory under /api/brand/files/<filename>.
# This serves SVGs, PNGs, CSS, and JSON straight from disk.
app.mount(
    "/api/brand/files",
    StaticFiles(directory=str(_BRAND_DIR), html=False),
    name="brand-files",
)


# --------------------------- APP ---------------------------

app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup():
    try:
        await asyncio.gather(seed_if_empty(), seed_community())
    except Exception as e:
        log.exception("seed failed: %s", e)


@app.on_event("shutdown")
async def on_shutdown():
    client.close()
