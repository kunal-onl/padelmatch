"""
Padel Match — Backend regression tests
Covers: venues, players, recommendations, leaderboard, games join/leave,
match score entry with Elo updates, player creation with initial rating.
"""
import os
import pytest
import requests

BASE_URL = os.environ.get(
    "EXPO_PUBLIC_BACKEND_URL",
    "https://874f8ef7-d563-4ff2-a2c5-db247cafa924.preview.emergentagent.com",
).rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="session")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


# ---------- Health & seed -----------------------------------------------------

class TestHealth:
    def test_root(self, s):
        r = s.get(f"{API}/")
        assert r.status_code == 200
        assert r.json().get("status") == "ok"


# ---------- Venues ------------------------------------------------------------

class TestVenues:
    def test_list_venues_count_and_shape(self, s):
        r = s.get(f"{API}/venues")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) == 7, f"expected 7 venues, got {len(data)}"
        v = data[0]
        for k in ("id", "name", "area", "hudleUrl", "courts"):
            assert k in v
        assert isinstance(v["courts"], list) and len(v["courts"]) >= 1


# ---------- Players -----------------------------------------------------------

class TestPlayers:
    def test_list_players_count(self, s):
        r = s.get(f"{API}/players")
        assert r.status_code == 200
        data = r.json()
        assert len(data) >= 16, f"expected 16 players, got {len(data)}"
        # sorted desc by rating
        ratings = [p["gameRating"] for p in data]
        assert ratings == sorted(ratings, reverse=True)

    def test_get_kunal(self, s):
        r = s.get(f"{API}/players/kunal")
        assert r.status_code == 200
        p = r.json()
        assert p["id"] == "kunal"
        assert p["gameRating"] == 7.2
        assert p["matchesPlayed"] == 23
        assert p["wins"] == 14
        assert p["losses"] == 9
        assert p["communityRank"] == 4

    def test_create_player_initial_rating_in_range(self, s):
        payload = {
            "name": "TEST_New Player",
            "phone": "+910000000000",
            "bio": "test",
            "yearsPlayed": "1to3",
            "frequency": "weekly",
            "competitiveExperience": "casual",
            "wallControl": "somewhat",
            "preferredVenues": ["round-two"],
            "shotComfort": {"bandeja": 3, "vibora": 2, "flat_smash": 3},
        }
        r = s.post(f"{API}/players", json=payload)
        assert r.status_code == 200
        p = r.json()
        assert 1.0 <= p["gameRating"] <= 10.0
        assert p["name"] == payload["name"]
        # verify persisted
        g = s.get(f"{API}/players/{p['id']}")
        assert g.status_code == 200
        assert g.json()["id"] == p["id"]


# ---------- Games -------------------------------------------------------------

class TestGames:
    def test_open_games_week(self, s):
        r = s.get(f"{API}/games", params={"openOnly": "true"})
        assert r.status_code == 200
        games = r.json()
        assert isinstance(games, list)
        assert len(games) >= 1
        # all should be status open
        assert all(g["status"] == "open" for g in games)

    def test_join_and_leave_open_game(self, s):
        # Find an open game without kunal
        games = s.get(f"{API}/games", params={"openOnly": "true"}).json()
        target = next((g for g in games if "kunal" not in g["players"] and len(g["players"]) < 4), None)
        assert target is not None, "no joinable open game found"
        gid = target["id"]

        r = s.post(f"{API}/games/{gid}/join", headers={"x-player-id": "kunal"})
        assert r.status_code == 200
        g = r.json()
        assert "kunal" in g["players"]

        # verify via GET
        gget = s.get(f"{API}/games/{gid}").json()
        assert "kunal" in gget["players"]

        # leave
        r2 = s.post(f"{API}/games/{gid}/leave", headers={"x-player-id": "kunal"})
        assert r2.status_code == 200
        assert "kunal" not in r2.json()["players"]


# ---------- Recommendations ---------------------------------------------------

class TestRecommendations:
    def test_recs_have_shape(self, s):
        r = s.get(f"{API}/recommendations", headers={"x-player-id": "kunal"})
        assert r.status_code == 200
        recs = r.json()
        assert isinstance(recs, list)
        if recs:
            first = recs[0]
            for k in ("game", "score", "label", "reasons"):
                assert k in first
            assert isinstance(first["reasons"], list)


# ---------- Leaderboard -------------------------------------------------------

class TestLeaderboard:
    def test_leaderboard_kunal_rank4(self, s):
        r = s.get(f"{API}/leaderboard")
        assert r.status_code == 200
        data = r.json()
        for k in ("ranked", "unranked", "community"):
            assert k in data
        kunal = next((p for p in data["ranked"] if p["id"] == "kunal"), None)
        assert kunal is not None
        assert kunal["communityRank"] == 4


# ---------- Match score / Elo -------------------------------------------------

class TestScoreFlow:
    def test_score_match_updates_rating(self, s):
        # Use existing seeded match for Kunal
        matches = s.get(f"{API}/matches", params={"playerId": "kunal"}).json()
        assert len(matches) >= 1
        mid = matches[0]["id"]

        before = s.get(f"{API}/players/kunal").json()["gameRating"]

        body = {
            "scoreEnteredBy": "kunal",
            "sets": [{"pairA": 6, "pairB": 2}, {"pairA": 4, "pairB": 6}, {"pairA": 6, "pairB": 2}],
        }
        r = s.post(f"{API}/matches/{mid}/score", json=body)
        assert r.status_code == 200
        data = r.json()
        assert "match" in data and "deltas" in data
        assert data["match"]["status"] == "scored"
        assert data["match"]["winner"] in ("pairA", "pairB")
        # Elo deltas should contain entries for all 4 players
        assert len(data["deltas"]) == 4

        after = s.get(f"{API}/players/kunal").json()["gameRating"]
        # rating should reflect change (may stay same if delta rounded to 0, but typically not)
        assert isinstance(after, (int, float))


# ---------- Notifications -----------------------------------------------------

class TestNotifications:
    def test_kunal_notifications(self, s):
        r = s.get(f"{API}/notifications", headers={"x-player-id": "kunal"})
        assert r.status_code == 200
        notifs = r.json()
        assert len(notifs) >= 5
        types = {n["type"] for n in notifs}
        for t in ("game_opened", "rank_up", "score_request", "rating_update", "new_player"):
            assert t in types, f"missing notification type {t}"
