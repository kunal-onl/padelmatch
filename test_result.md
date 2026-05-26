#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: |
  Padel Match — Onboarding V2 overhaul. Per /app/feedback/V1-review.md and
  user's clarifying answers (message #278), rebuild the onboarding into a
  9-step flow: Identity → Experience → Venues → Days → Timings → Time-
  Ranking → Game Type → Connections → WhatsApp OTP → Reveal. Use padel
  racket "hole" dots as the progress indicator. Color-code venues by
  village. Add Coplay Panjim. Rename Sunday Club → Sunday R&SC. Move
  Rate-Your-Shots out of onboarding to Profile. OTP is a placeholder
  (MSG91 to be integrated later). Save draft after each step.

backend:
  - task: "Venues update — alphabetical seed, color codes, Sunday R&SC rename, add Coplay Panjim, fix Socorro typo"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "VENUES_SEED rewritten: alphabetical by venue name. Renamed Sunday Club → Sunday R&SC. Added new venue 'coplay-panjim'. Fixed Soccorro → Socorro on Padel People. Added idempotent migration in seed_if_empty() that does upsert on every venue id — so existing Atlas DBs pick up the changes without losing players/games/matches. Verified via startup log 'Synced 8 venues'."
  - task: "Player V2 fields (rankedDays, preferredStartTime, preferredEndTime, rankedTimeBlocks, gameTypes, whatsappVerified) on Player + PlayerCreate"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "Extended Player model and PlayerCreate to accept new V2 fields. Connection model also gained a tags: List[str] field for multi-select social/competitive context. Reveal screen submits all V2 fields; legacy availabilitySlots is derived from rankedDays × preferred window."
  - task: "WhatsApp OTP placeholder endpoints"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "Added POST /api/auth/otp/send (returns devCode=123456) and POST /api/auth/otp/verify (accepts any 6-digit code in mock mode). MOCKED — MSG91 to be wired later. Verified via end-to-end test: send → verify → player create."

frontend:
  - task: "Onboarding V2 — Step 1 Identity (no photo, racket-hole dots, AsyncStorage draft)"
    implemented: true
    working: true
    file: "/app/frontend/app/onboarding/identity.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "Photo upload widget removed. Progress indicator replaced with 9 small circular 'racket hole' dots — active step is lime-filled, completed are ink, future are hollow outlined. Name/phone persisted via loadDraft/saveDraft (AsyncStorage key pm.onboarding.draft.v2)."
  - task: "Onboarding V2 — Step 2 Experience (neutral inactive pills, accent-color per question)"
    implemented: true
    working: true
    file: "/app/frontend/app/onboarding/experience.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "Pill ui.tsx extended with neutralInactive prop (white bg, ink border) and activeColor prop. Each question's pills highlight in that question's accent (lime/purple/blue) on selection — fixes the 'green overload'. Verified via screenshot: distinct lime/purple/blue/lime accents on selected pills."
  - task: "Onboarding V2 — Step 3 Venues (own screen, village color coding, alphabetical, Sunday R&SC, Coplay Panjim)"
    implemented: true
    working: true
    file: "/app/frontend/app/onboarding/venues.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "New screen. VILLAGE_COLOR map: Anjuna=lime, Assagao=blue, Panjim=blue, Siolim=purple, Socorro=cream, Vagator=lime. Venues sorted alphabetically by name. Tap-to-rank with numeric badge on selected venues. Verified via screenshot — all 8 venues present including Sunday R&SC and Coplay Panjim."
  - task: "Onboarding V2 — Step 4 Days (rank up to 7, copy 'When would you prefer to play?', auto-derive sessions per week)"
    implemented: true
    working: true
    file: "/app/frontend/app/onboarding/days.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "Tap days to add to ranked list with badge showing rank. 'SESSIONS PER WEEK — UP TO N' updates live based on count. Verified via screenshot."
  - task: "Onboarding V2 — Step 5 Timings (own screen, half-hour 12h dropdowns, AM/PM toggle)"
    implemented: true
    working: true
    file: "/app/frontend/app/onboarding/timings.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "Hour 1-12 list, minute :00/:30, AM/PM toggle for both Preferred Start and End. End-after-start validation. Summary band shows 12h formatted window."
  - task: "Onboarding V2 — Step 6 Time Ranking (drag-and-drop ideal slot list)"
    implemented: true
    working: true
    file: "/app/frontend/app/onboarding/time-ranking.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "react-native-draggable-flatlist@4.0.3 added. List built from rankedDays × preferred window. Each row shows rank pill, day name, window, and a long-press drag handle. Empty-state shown when no days selected upstream."
  - task: "Onboarding V2 — Step 7 Game Type (multi-select Competitive + Social, removed Both, clearer icons)"
    implemented: true
    working: true
    file: "/app/frontend/app/onboarding/game-type.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "Card layout, trophy + people icons, blue + purple accents. Checkmark badge on active cards. Multi-select."
  - task: "Onboarding V2 — Step 8 Connections (played_with only, multi-tag social/competitive context, clearer icons)"
    implemented: true
    working: true
    file: "/app/frontend/app/onboarding/connections.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "Removed want_to_play and prefer_not. Tennis-ball add button toggles played_with. Once added, two multi-select tag chips appear (SOCIAL purple / COMPETITIVE blue). Lime left bar marks added rows."
  - task: "Onboarding V2 — Step 9 WhatsApp OTP (placeholder, MSG91 later)"
    implemented: true
    working: true
    file: "/app/frontend/app/onboarding/otp.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "MOCKED. Dark hero matching identity step. Phone prefilled from draft. SEND CODE → input 6 digits → VERIFY & FINISH. Dev code hint visible (any 6 digits accepted). Resend cooldown 30s. End-to-end verified: send → verify 123456 → reveal renders rating 5.0."
  - task: "Onboarding V2 — Reveal screen submits V2 draft, blocks if not WhatsApp verified"
    implemented: true
    working: true
    file: "/app/frontend/app/onboarding/reveal.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "Builds PlayerCreate from V2 draft (derives legacy availabilitySlots from rankedDays × window; gameOrientation from gameTypes). Redirects back to OTP if whatsappVerified=false. Shows hint to rate shots later in profile."
  - task: "Onboarding draft store with AsyncStorage persistence"
    implemented: true
    working: true
    file: "/app/frontend/lib/onboarding-draft.ts"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "loadDraft/saveDraft/resetDraft API. Persists under pm.onboarding.draft.v2. Saves after every step CTA. Includes helpers fmtTime, fullDayLabel, deriveAvailabilitySlots, deriveGameOrientation."
  - task: "Progress dots — padel racket holes (9 step circular indicator)"
    implemented: true
    working: true
    file: "/app/frontend/lib/onboarding-header.tsx"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "Replaced square dots with circular borderRadius:999 dots. Active step is lime-filled and slightly larger. Completed steps fill ink. Future steps are hollow."
  - task: "Profile → Rate Your Shots entry point + standalone editor"
    implemented: true
    working: true
    file: "/app/frontend/app/(tabs)/profile.tsx, /app/frontend/app/profile/shots.tsx"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "Added 'RATE YOUR SHOTS →' link on the SHOT COMFORT row of the own-profile screen. Tapping routes to new /profile/shots screen which reuses CATEGORIES + SHOTS and saves via PATCH /players/:id. Fixed pre-existing React Hooks ordering bug on profile.tsx (early-return moved after useMemo hooks)."
  - task: "Pill component — neutralInactive + activeColor"
    implemented: true
    working: true
    file: "/app/frontend/lib/ui.tsx"
    stuck_count: 0
    priority: "low"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "Added optional props so Experience step 2 stops looking 'all green' on inactive pills."

metadata:
  created_by: "main_agent"
  version: "2.0"
  test_sequence: 2
  run_ui: true

test_plan:
  current_focus:
    - "Onboarding V2 — end-to-end 9-step flow (identity → experience → venues → days → timings → time-ranking → game-type → connections → otp → reveal)"
    - "Backend V2 fields persistence (POST /api/players with rankedDays/preferredStartTime/preferredEndTime/rankedTimeBlocks/gameTypes/whatsappVerified)"
    - "WhatsApp OTP placeholder (POST /api/auth/otp/send, /api/auth/otp/verify) — verify dev code 123456 and any 6-digit input is accepted"
    - "Venue migration — confirm /api/venues returns Sunday R&SC, Coplay Panjim, alphabetical order, Socorro spelling fix"
    - "Profile → Rate Your Shots flow (entry point appears, /profile/shots screen loads, save via PATCH succeeds)"
    - "Draft resumption — close + reopen identity step preserves typed name/phone via AsyncStorage"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
  - agent: "main"
    message: |
      Onboarding V2 overhaul complete. All 9 screens implemented and verified
      end-to-end via Playwright screenshot. Notable items for the testing
      agent to verify:
        • WhatsApp OTP is MOCKED — backend accepts any 6-digit code. MSG91
          integration is deferred per user request.
        • Draft persistence uses AsyncStorage key pm.onboarding.draft.v2.
        • Venue migration runs idempotently on every startup — existing
          Atlas DB is upserted, not wiped.
        • Use demo login (kunal) for tab/screen checks; otherwise drive
          the full onboarding flow via the testIDs declared in each step.
