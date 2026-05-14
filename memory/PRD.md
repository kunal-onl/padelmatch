# Padel Match — Product Requirements Document

## Overview
Padel Match is an invite-only community platform for padel players in North Goa, India (~100–200 members).
It replaces fragmented WhatsApp coordination with a preference-aware, structured game discovery layer.
Court bookings link out to Hudle.

- **Platform:** Expo React Native (mobile-first, web preview supported)
- **Backend:** FastAPI + MongoDB
- **Domain:** padelmatch.in
- **Auth:** Local profile only in MVP (Emergent Google Auth deferred per user choice)

## Design system — Sport Brutalism
- 0px border radius everywhere
- 2px solid ink (#111118) borders on all cards/buttons/nav
- Palette: cream / ink / lime / coral / blue / win / loss
- Typography: Unbounded (900/700/400) + DM Mono + DM Sans (Google Fonts via expo-font)
- The rating number is the single most dominant visual element on every screen it appears on

## Implemented screens
1. Onboarding (5 steps + rating reveal)
   - Identity, Experience, Preferences, Connections, Shot Comfort, Rating Reveal
   - "Use demo profile" shortcut to seeded Kunal B.
2. Home / Dashboard — stat strip, Find a Game CTA, strong matches, available players, recent results
3. Games Feed — Today/Week/All filter, Available/All tabs
4. Game Detail — venue header, 2×2 player grid, Join/Leave, Hudle deep-link
5. Create Game — 3-step flow (Where / When / Preview & Share with WhatsApp text)
6. Leaderboard — Top-3 podium, ranked list (Kunal highlighted), unranked section
7. Own Profile — Blue hero, 88px rating number, sparkline (recharts via react-native-svg), radar chart, stats, match history
8. Other Player Profile — relationship banner, sticky Invite CTA
9. Score Entry — two side-by-side team panels with editable set scores
10. Notifications — typed list with icon colour coding

## Rating & matchmaking logic
- `compute_initial_rating(player)` — experience score + weighted shot comfort → 1.0–10.0
- `update_elo_for_match(match, players)` — Elo with K=40 (<20 matches) / K=20, scaled to 9-pt range
- `compute_recommendation(game, me, …)` — venue/availability/preferred-players/skill scoring → STRONG / GOOD MATCH labels

## Key backend endpoints (all under `/api`)
- Players: GET/POST/PATCH `/players`, `/players/{id}` (rank attached dynamically)
- Venues: GET `/venues`
- Games: GET `/games?when=&venueId=&skillMin=&skillMax=&openOnly=`, GET/POST `/games`, POST `/games/{id}/join|leave`
- Recommendations: GET `/recommendations` (uses `x-player-id` header)
- Leaderboard: GET `/leaderboard`
- Matches: GET `/matches`, GET `/matches/{id}`, POST `/matches/{id}/score` (updates Elo)
- Notifications: GET `/notifications`, POST `/notifications/{id}/read`
- Dev: POST `/dev/reseed`

## Seed data
Auto-seeded on first startup, idempotent:
- 7 venues (with Hudle deep links)
- 16 players incl. canonical Kunal B. (rating 7.2, 23 matches, 14W/9L)
- 10 open/mixed games over the next 7 days
- 4 played matches for Kunal

## Smart business enhancement
- **Match Reason banner** on Game Detail — when a recommendation scores ≥40, the game page surfaces a lime banner explaining *why* it's a strong match (venue preference, friend playing, time window). This nudges joins and improves the discovery flywheel that makes the community sticky.
