"""
Padel Match — Backend
Single-file FastAPI + MongoDB service powering an Expo React Native client.
"""
from fastapi import FastAPI, APIRouter, HTTPException, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os, logging, uuid, math, random
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
    status: str = "open"  # open | full | played | cancelled
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
    {"id": "round-two", "name": "Round Two", "area": "Vagator",
     "hudleUrl": "https://hudle.in/venues/round-two-vagator",
     "courts": [{"id": "round-two-c1", "name": "Court 1"}]},
    {"id": "sunday-club", "name": "Sunday Club", "area": "Siolim",
     "hudleUrl": "https://hudle.in/venues/sunday-racquet-social-club",
     "courts": [{"id": "sunday-c1", "name": "Court 1"},
                {"id": "sunday-c2", "name": "Court 2"},
                {"id": "sunday-c3", "name": "Court 3"}]},
    {"id": "jolt-method", "name": "Jolt Method", "area": "Siolim",
     "hudleUrl": "https://hudle.in/venues/jolt-method-siolim",
     "courts": [{"id": "jolt-c1", "name": "Court 1"}]},
    {"id": "coplay", "name": "CoPlay", "area": "Assagao",
     "hudleUrl": "https://hudle.in/venues/coplay-assagao",
     "courts": [{"id": "coplay-c1", "name": "Court 1"}]},
    {"id": "coco-assagao", "name": "Coco Padel", "area": "Assagao",
     "hudleUrl": "https://hudle.in/venues/coco-padel-assagao",
     "courts": [{"id": "coco-assagao-c1", "name": "Court 1"}]},
    {"id": "coco-anjuna", "name": "Coco Padel", "area": "Anjuna",
     "hudleUrl": "https://hudle.in/venues/coco-padel-anjuna",
     "courts": [{"id": "coco-anjuna-c1", "name": "Court 1"}]},
    {"id": "padel-people", "name": "Padel People", "area": "Soccorro",
     "hudleUrl": "https://hudle.in/venues/padel-people-soccorro",
     "courts": [{"id": "padel-people-c1", "name": "Court 1"}]},
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
    kunal["preferredVenues"] = ["sunday-club", "round-two", "coplay", "padel-people"]
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
        ("p-anita", "coplay", "coplay-c1", 2, "07:00", "08:30", 5.5, 7.5, ["p-anita", "p-meera"]),
        ("p-sahil", "padel-people", "padel-people-c1", 2, "18:00", "19:30", 5.0, 6.5, ["p-sahil", "p-divya"]),
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
         "padel-people", "padel-people-c1"),
        (-18, ["p-rohan", "kunal"], ["p-sahil", "p-divya"], "pairA",
         [{"pairA": 6, "pairB": 2}, {"pairA": 6, "pairB": 3}],
         "coplay", "coplay-c1"),
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


@api.get("/players")
async def list_players():
    return [clean(p) async for p in db.players.find({}, {"_id": 0}).sort("gameRating", -1)]


@api.get("/players/{pid}")
async def get_player(pid: str):
    return await get_player_or_404(pid)


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
        q["status"] = "open"
    games = [clean(g) async for g in db.games.find(q, {"_id": 0}).sort("date", 1)]
    return games


@api.get("/games/{gid}")
async def get_game(gid: str):
    g = await db.games.find_one({"id": gid}, {"_id": 0})
    if not g:
        raise HTTPException(404, "Game not found")
    return g


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


@api.post("/games")
async def create_game(body: GameCreate):
    venue = await db.venues.find_one({"id": body.venueId}, {"_id": 0})
    if not venue:
        raise HTTPException(400, "Unknown venue")
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
        status="open",
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
    if x_player_id in g["players"]:
        return g
    if len(g["players"]) >= 4:
        raise HTTPException(400, "Game full")
    g["players"].append(x_player_id)
    if len(g["players"]) >= 4:
        g["status"] = "full"
    await db.games.update_one({"id": gid}, {"$set": {"players": g["players"], "status": g["status"]}})
    return g


@api.post("/games/{gid}/leave")
async def leave_game(gid: str, x_player_id: str = Header(default="kunal", alias="x-player-id")):
    g = await db.games.find_one({"id": gid}, {"_id": 0})
    if not g:
        raise HTTPException(404, "Game not found")
    if x_player_id not in g["players"]:
        return g
    g["players"].remove(x_player_id)
    g["status"] = "open"
    await db.games.update_one({"id": gid}, {"$set": {"players": g["players"], "status": g["status"]}})
    return g


@api.get("/recommendations")
async def recommendations(x_player_id: str = Header(default="kunal", alias="x-player-id"), limit: int = 5):
    me = await get_player_or_404(x_player_id)
    venues = {v["id"]: v async for v in db.venues.find({}, {"_id": 0})}
    players = {p["id"]: p async for p in db.players.find({}, {"_id": 0})}
    today = date.today().isoformat()
    week = (date.today() + timedelta(days=14)).isoformat()
    out = []
    async for g in db.games.find(
        {"status": "open", "date": {"$gte": today, "$lte": week}}, {"_id": 0}
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

    # Load players, update Elo, persist
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
    await db.matches.update_one({"id": mid}, {"$set": m})
    return {"match": m, "deltas": deltas}


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
        await seed_if_empty()
    except Exception as e:
        log.exception("seed failed: %s", e)


@app.on_event("shutdown")
async def on_shutdown():
    client.close()
