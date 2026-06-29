# PadelMatch — working notes for Claude Code

## Repo layout
- `backend/` — FastAPI + MongoDB (Motor / Atlas). Entry point `server.py` (`app`).
  Court-finder logic is in `availability.py`: it reads **Hudle's JSON API directly**
  (no separate service, no browser, no proxy — Railway is retired).
- `frontend/` — Expo / React Native (web target), expo-router. Courts tab:
  `app/(tabs)/courts.tsx`.

## Workflow: heavy lifting here, polish in Emergent
Development happens in **Claude Code (local, cheap)**. **Emergent** is for final
visual QA and environment-specific troubleshooting **only** — its agent tokens are
expensive. The dividing line:

> **If a change can be verified without a human looking at pixels, do it AND verify
> it here before pushing.**

- **Do in Claude Code (local):** all backend code + logic, finder/data/API work,
  schema + seeds, frontend code edits + typecheck, and `git push`.
- **Do in Emergent (after pulling):** visual QA of the UI in the preview, env-var /
  config, final acceptance, and bugs that only appear in Emergent's runtime.
- **Avoid:** pushing unverified code. A break that only surfaces in Emergent costs
  expensive agent tokens to debug — verify locally first so Emergent just pulls.

## Run + verify locally
Backend (loads `backend/.env`, which holds the shared Atlas URI — i.e. the **same
DB Emergent uses**, so avoid destructive writes when testing):
```
cd backend && python -m uvicorn server:app --reload --port 8000
# then verify the change, e.g. the court finder:
curl -s -XPOST localhost:8000/api/availability/check -H 'content-type: application/json' \
  -d '{"date":"2026-06-30","startTime":"20:00","endTime":"21:00"}'
# expect "source":"finder" and most of the 9 venues "available":true
```
Frontend (logic/structure here; visuals in Emergent):
```
cd frontend && npx tsc --noEmit     # NB: errors in home/host/inbox are pre-existing, not blockers
npx expo lint
```

## Pre-push checklist (this is what saves Emergent tokens)
1. Backend changed → run it locally and `curl` the affected endpoint; confirm the JSON.
2. Frontend changed → `npx tsc --noEmit` clean for the files you touched.
3. Commit, then `git push origin main`.
4. In Emergent: **pull + visual check only** — no development there.

## Key facts / don'ts
- **Court finder** lives in `backend/availability.py` and calls `api.hudle.in` directly.
  Token is at `backend/hudle_session.json` (valid ~June 2027; refresh via the
  `padel-court-finder` repo's `capture_session.py`, run locally). Live mode auto-enables
  when a session is present. **Don't** re-add Railway, a browser/Playwright, or a proxy.
- **Design system "Sport Brutalism":** lime `#C9E52F` = primary/active; blue `#1A56FF` =
  rankings/headers; coral `#FF4136` = error/unavailable/loss ONLY. Fonts: Unbounded
  (display), DM Mono (technical), DM Sans (body). RADIUS = 0.
- **Don't** push `.env` with localhost values; **don't** collapse the four self-improvement
  domains (strokes/tactics/inner/outer) into one number; **don't** change the game-detail
  lifecycle stepper.
