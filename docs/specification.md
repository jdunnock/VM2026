# VM2026 - Specification

This document is the primary product and engineering specification for VM2026.

## 1. Goal

- Build a website for a friend group to submit and track FIFA World Cup 2026 predictions.
- Primary user group: private friend group participants and one or more admins.
- Phase 1 success criteria: all prediction targets and lock rules are clearly defined.

## 2. Scope

### In scope (current phase)
- Define all prediction targets for World Cup 2026.
- Define lock rules for each prediction target type.
- Define Swedish terminology for visible prediction categories.
- Define admin-managed question categories and required input fields.
- Define a Figma-ready layout package for 5+ pages.
- Deliver a static frontend prototype that visualizes the phase-1 page structure and key content blocks.
- Keep the static frontend prototype visually close to the wireframe-first Figma layout package instead of a looser concept interpretation.
- Reference prototype: https://tacky-hug-48269032.figma.site (published Figma site, all 5 pages).
- Implemented alignment: summary card captions, category chips with tip counts (104/12/31/1/1/5), short country codes in fixtures (USA-CAN style), H-B/Välj column headers in match table, count badges in Mina tips accordions, Gruppspel match table in Mina tips, Regler expanded with Viktigt om låsning block, 4 FAQs, and Turneringsinformation section.

### Out of scope (current phase)
- Real-time tournament tracking implementation.
- Automated score ingestion and points calculation engine.
- Leaderboard logic during tournament.
- Detailed final points table values (Poangsattning numbers will be finalized later).

## 3. Tournament Data Baseline

- Tournament: FIFA World Cup 2026.
- Teams: 48 total.
- Group stage: Groups A-L.
- Official data references:
	- Standings: https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/standings
	- Scores and fixtures: https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/scores-fixtures?country=FI&wtw-filter=ALL
- Placeholder teams are supported until qualifiers are finalized, for example:
	- `DEN/MKD/CZE/IRL`
	- `ITA/NIR/WAL/BIH`
	- `UKR/SWE/POL/ALB`
	- `NCL/JAM/COD`

## 4. Prediction Targets

### 4.1 Group stage match predictions
- For each group stage match, the user predicts:
	- Exact score (`exakt resultat`)
	- Match outcome (`1/X/2`)

### 4.2 Group ranking predictions
- For each group (A-L), the user predicts final ranking positions 1-4.
- Official result source for ranking resolution: FIFA standings.

### 4.3 Knockout predictions
- Knockout rounds included in prediction model:
	- `Sextondelsfinal` (Round of 32)
	- `Åttondelsfinal`
	- `Kvartsfinal`
	- `Semifinal`
	- `Final`

### 4.4 Admin-managed question categories
- `Gruppspelsfrågor`
- `Slutspelsfrågor`
- `Turneringsfrågor`
- `33-33-33 frågor`

Each admin-managed question must support:
- Question text
- Answer options
- Correct answer (optional until the real outcome is known; can be set later)
- Point value
- Category
- Status (draft or published)

## 5. Lock Rules

- Global deadline for all participant tips and questions in this phase:
	- `2026-06-09 22:00` (single common lock timestamp)

### 5.1 Group stage match lock
- Group stage match predictions lock at the global deadline (`2026-06-09 22:00`).

### 5.2 Group ranking lock
- Group ranking predictions lock at the global deadline (`2026-06-09 22:00`).

### 5.3 Knockout lock
- Knockout predictions lock at the global deadline (`2026-06-09 22:00`).

### 5.4 Admin question lock
- Published question answering locks at the same global deadline (`2026-06-09 22:00`).
- No match-specific or question-specific participant lock timestamps are used in this mode.

## 6. Language and Copy

- User-facing website copy language: Swedish.
- Consistency requirement: same term must be used across all pages and forms.
- Visible UI copy should use proper Swedish diacritics instead of ASCII fallbacks when shown to end users.
- Core term set for this phase:
	- Gruppspel
	- Sextondelsfinal (Round of 32)
	- Åttondelsfinal
	- Kvartsfinal
	- Semifinal
	- Final
	- Slutsegrare
	- Skytteligavinnare

## 7. Architecture and Data Flow (phase-level)

- Backend: Node.js (Express)
- Frontend: React + Vite
- Storage: SQLite (local MVP database)
- External integrations:
	- FIFA standings and fixtures as reference truth for tournament structure and result resolution

### 7.0 Frontend composition baseline (2026-03-26)

- Included in this step:
	- `src/App.tsx` is the application shell for shared state, data loading, and page routing.
	- Route-level page UIs are extracted to dedicated modules under `src/pages/` (`StartPage`, `ResultsPage`, `TipsPage`, `MyTipsPage`, `RulesPage`, `AdminPage`).
	- `AdminPage` tab surfaces are further split to dedicated admin subcomponents under `src/pages/admin/` for question management and result management presentation while keeping existing behavior intact.
	- Shared score detail UI (`ParticipantScorePanel`) is reused from `src/pages/ResultsPage.tsx` in both `Resultat & poäng` and `Mina tips` flows.
- Excluded from this step:
	- No scoring rule changes.
	- No API contract changes.

### 7.1 Backend MVP scope (2026-03-25)

- Included in this step:
	- `POST /api/auth/sign-in` endpoint for participant sign-in/create flow.
	- `participants` storage with fields: `id`, `name`, `access_code_hash`, `created_at`, `last_seen_at`.
	- Frontend Sign-in page integration against the backend endpoint.
- Excluded from this step:
	- Tips persistence CRUD.
	- Admin question persistence CRUD.
	- Advanced auth/session stack.

### 7.2 Persistence scope extension (2026-03-25)

- Included in this step:
	- Session persistence in frontend via localStorage for signed-in participant.
	- Participant-based tips persistence API (`participantId` keyed storage).
	- Persisted tips state now includes group placements, knockout predictions, and special predictions in addition to match tips.
	- Backend routes for tips read/write/delete operations.
- Excluded from this step:
	- Admin question persistence.
	- Full production auth/token/session implementation.

### 7.3 Tips input UX default model (2026-03-25)

- Included in this step:
	- Finalized single tips input model (no active A/B trial branches).
	- `Lämna tips` groups `Gruppspel` and `Grupplaceringar` into one combined group-based view on a single page.
	- Each group card (`Grupp A` ... `Grupp L`) contains both the group's match tips and the group's placement picks (1-4).
	- Group placement team options are derived from the same canonical group fixture teams used in the group match list, so match and placement data stay aligned.
	- Group-card layout target: desktop default 3 groups side-by-side, medium screens 2 columns, mobile 1 column.
	- Placement area inside each group card must be visually distinct (highlight color, framed container, and clear heading) so users immediately notice where to set `Grupplaceringar`.
	- Placement highlight color is strong warm yellow to draw immediate attention while scrolling through the group cards.
	- Placement heading inside each group card is sticky so the `Grupplaceringar` block remains discoverable during scroll.
	- Desktop: grouped quick-pick score buttons + manual `+More` fallback.
	- Mobile: spinner-only score entry for cleaner thumb interaction.
	- On mobile spinner score changes, `1/X/2` is always auto-derived immediately from the current score pair.
	- Auto-derived `1/X/2` from selected score with manual override still available.
	- Match-card completion feedback: a group-stage match card gets a pale green background only after a successful save (`Sparad:` state) and only when the currently shown score + `1/X/2` still matches the saved value.
	- Grupplaceringar uses guided group-specific team selectors instead of free text, so each position only offers teams from that group.
	- The same team can only be selected once inside a single group ranking.
	- Slutspel inputs use type-ahead suggestions: users can type first letters and pick only participating teams.
	- Slutspel suggestions are round-aware: first round uses participating teams, later rounds suggest picks from the previous round.
	- Slutspel input surface now covers all 5 rounds in UI with full slot counts: 32 (Sextondelsfinal), 16 (Åttondelsfinal), 8 (Kvartsfinal), 4 (Semifinal), 2 (Final).
	- Lämna tips section buttons now use a tabbed flow where one section is visible at a time (`Gruppspel`, `Slutspel`, `Special`, `Extrafrågor`); group placements are integrated inside the `Gruppspel` group cards.
	- `Special` and `Extrafrågor` are shown in separate section cards, aligned with their own tab buttons.
	- Start page uses one neutral overview panel instead of a second stacked green hero block, and redundant start-page CTA buttons/copy variants are removed.
	- Mobile header uses a compact layout: horizontally scrollable main navigation and condensed status cards to reduce wrapping and vertical crowding.
	- Mobile main navigation pills use tighter spacing and smaller padding so the tab row stays easier to scan without growing the header height.
- Excluded from this step:
	- Tips API/schema changes.
	- Admin UX changes.
	- Temporary local telemetry for A/B comparison.

### 7.4 Admin questions and Extrafragor MVP scope (2026-03-25)

- Included in this step:
	- Backend CRUD for admin-managed questions.
	- `admin_questions` persistence model with fields: `id`, `question_text`, `category`, `options_json`, `correct_answer`, `points`, `lock_time`, `status`, `created_at`, `updated_at`.
	- Public endpoint for published questions to support `Extrafrågor` rendering in participant UI.
	- Tips payload extension with `extraAnswers` map (`questionId` -> selected answer) stored together with participant tips.
	- Backward-compatible tips normalization so older payloads without `extraAnswers` remain valid.
	- Frontend `Extrafrågor` tab now loads published questions from API, supports option-based answer selection, and persists selected answers via `extraAnswers`.
	- `Mina tips` now shows saved answers for published `Extrafrågor`.
	- `Admin` page now uses live API-backed CRUD for question create/update/delete and publish state management.
	- Separate admin sign-in flow: `Admin` page first requires admin name + admin code before CRUD views are shown.
	- Admin credential verification endpoint: `POST /api/auth/admin-sign-in`.
	- Lightweight admin protection: all `/api/admin/*` endpoints require admin code via request header (`x-admin-code` or bearer token); Admin UI stores the active admin session and sends the code in its API calls.
	- `Rätt svar` is optional at question creation/update time and can be filled in later when the actual outcome is known.
- Excluded from this step:
	- Full role-based auth/session model for admin users.
	- Automatic points calculation and leaderboard updates.
	- Live external data sync for question lock scheduling.

### 7.5 Fixture source-of-truth prework for Phase 3 (2026-03-25)

- Included in this step:
	- Introduce one canonical fixture source module in frontend code.
	- Use FIFA 2026 official group composition from the scores/fixtures source as fixture team baseline.
	- Sync all 72 group-stage kickoff timestamps to FIFA 2026 official scores/fixtures schedule (`idSeason=285023` in FIFA API).
	- Display known country names in Swedish in group fixtures while leaving qualifier placeholder labels unchanged (for example `DEN/MKD/CZE/IRL`).
	- Keep exported fixture collections (`groupStageFixtures`, `allTournamentFixtures`, and derived templates) in chronological kickoff order.
	- Model all tournament fixtures match-by-match for Phase 3 preparation:
		- Group stage: 72 matches (12 groups x 6 matches).
		- Knockout stage: 62 matches (round of 32 through final).
		- Total modeled fixtures: 134.
	- Use placeholder teams/slots and planned kickoff timestamps where official final FIFA pairings/times are not yet fixed (currently knockout placeholders/times).
	- Keep current participant tips behavior aligned with existing prediction model while reusing the canonical fixture source for group-stage match tips.
	- Correct visible group-stage match count labels to 72.
- Excluded from this step:
	- Points calculation engine.
	- Leaderboard/ranking computation.
	- Official result ingestion and settlement logic.

### 7.6 Phase 3 backend result foundation (2026-03-25)

- Included in this step:
	- Add `match_results` persistence model keyed by `matchId` to store official/admin-entered match outcomes.
	- `match_results` model fields: `match_id`, `stage`, `round`, `group_code`, `home_team`, `away_team`, `kickoff_at`, `home_score`, `away_score`, `result_status`, `settled_at`, `created_at`, `updated_at`.
	- Public read endpoints for results data:
		- `GET /api/results`
		- `GET /api/results/:matchId`
	- Admin-protected upsert and read endpoints for results data:
		- `GET /api/admin/results`
		- `PUT /api/admin/results/:matchId`
	- Validation rules for foundational result data:
		- `stage` in `group|knockout`
		- `resultStatus` in `planned|live|completed`
		- Group matches require `groupCode` and no `round`
		- Knockout matches require `round` and no `groupCode`
		- `completed` requires both scores
		- `planned` requires no scores
- Excluded from this step:
	- Any points calculation.
	- Any leaderboard/ranking logic.
	- Automatic settlement/award side-effects.

### 7.7 Phase 3 scoring contract (Step 1 only, 2026-03-25 evening)

- Included in this step:
	- Define scoring input contract for backend implementation:
		- `participant_tips.fixtureTips` as participant prediction source.
		- `match_results` rows with `result_status = completed` and both scores as official result source.
	- Define per-match scoring rule (v1):
		- Exact score hit (`homeScore` and `awayScore` both match): 2 points.
		- Correct `1/X/2` outcome sign only (exact score miss): 1 point.
		- Otherwise: 0 points.
		- Missing tip for a match: 0 points.
	- Define settlement timing and behavior contract:
		- A match is settlement-eligible only when result status is `completed` and scores exist.
		- Settlement logic must be idempotent (safe to rerun without double-counting).
		- First implementation target is deterministic recompute from persisted tips + results.
- Excluded from this step:
	- No scoring engine code implementation yet.
	- No leaderboard aggregation/ranking implementation yet.
	- No UI changes for points/leaderboard yet.

- Continuation plan:
	- Tomorrow (2026-03-26) continue with Step 2 (backend scoring implementation).

### 7.8 MVP debug path cleanup (2026-03-26)

- Included in this step:
	- Removed local preview-only code paths from frontend pages that were intended for temporary MVP/demo use.
	- Removed participant-name-gated mock data toggles from `Resultat & poäng` and `Mina tips` (no more local mock switching in production flow).
	- Removed manual local lifecycle phase override (`auto/B/C`) from UI; lifecycle phase is now determined only by the configured global deadline.
	- Kept existing phase visibility behavior (`tips` hidden in phase C, `results` hidden in phase B), now driven only by real lock state.
- Excluded from this step:
	- No changes to scoring rules or scoring API contracts.
	- No changes to admin CRUD behavior.
	- Tomorrow (2026-03-26) continue with Step 3 (leaderboard endpoints and integration).

### 7.8 Phase 3 Step 2 implementation scope (2026-03-26)

- Included in this step:
	- Split Phase 3 Step 2 into two implementation layers inside the same feature set:
		- `Step 2A`: stable match identity foundation for persisted fixture tips.
		- `Step 2B`: backend scoring engine and score read API.
	- `Step 2A` identity scope:
		- Persist fixture tips with a backward-compatible `fixtureId` field.
		- Use `fixtureId` as the primary match identity for newly saved tips.
		- Keep backward compatibility for older saved tips that do not yet contain `fixtureId`.
		- Transitional fallback matching for older tips is allowed, but only as a compatibility bridge and not as the primary scoring strategy.
	- `Step 2B` scoring scope:
		- Implement deterministic recompute-on-read scoring from persisted tips plus completed match results.
		- Add read-only score endpoints:
			- `GET /api/scores`
			- `GET /api/scores/:participantId`
		- Use `match_results.match_id` matched against `fixtureId` as the primary scoring join key.
		- Return participant total score and per-match score breakdown for the participant-specific endpoint.
		- Keep score calculation side-effect free in this step; no score rows are persisted.
- Excluded from this step:
	- Leaderboard ranking or tie-break logic.
	- Frontend score UI.
	- Dedicated score persistence tables.
	- Automatic settlement jobs, cron tasks, or external sync side-effects.

### 7.9 Phase 3 scoring extension and test automation (2026-03-26)

- Included in this step:
	- Add automated API integration tests for scoring behavior using an isolated temporary database and spawned API process.
	- Test matrix coverage for fixture-tip scoring:
		- exact score => 2 points
		- correct sign only => 1 point
		- wrong result => 0 points
		- missing tip scores => 0 points
		- unsettled match (no completed result) => 0 points
	- Add automated regression coverage for legacy fixture-tip fallback when `fixtureId` is missing.
	- Extend score computation to include `Extrafrågor` answers:
		- match selected answer against published admin question `correct_answer`
		- award question `points` when correct
		- award 0 when wrong
		- treat questions without a resolved correct answer as unsettled (0 points)
	- Extend score API payload with extra-question scoring details:
		- summary fields: `fixturePoints`, `extraQuestionPoints`, `settledQuestions`
		- participant detail field: `extraBreakdown`
- Excluded from this step:
	- Leaderboard tie-break design and ranking policy.
	- Frontend leaderboard or participant score visualization.
	- Persisted score snapshots (still recompute-on-read).

### 7.10 Phase 3 Step 3 leaderboard endpoints and start-page integration (2026-03-26)

- Included in this step:
	- Extend `GET /api/scores` into a read-only leaderboard payload ordered by current score.
	- Leaderboard ordering policy for this step:
		- primary sort: `totalPoints` descending
		- ties keep the same shared `rank`
		- ties are rendered in stable name order (`name` case-insensitive ascending) without applying a dedicated tie-break rule
	- Extend leaderboard rows with:
		- `rank`
		- `positionLabel` (numeric rank as string; shared ranks repeat the same number without prefix)
	- Extend `GET /api/scores/:participantId` detail payload with the participant's current `rank` and `positionLabel` derived from the same read-only leaderboard calculation.
	- Integrate the leaderboard into the frontend Start page:
		- show a `Topplista` panel based on `GET /api/scores`
		- show the signed-in participant's current score/rank summary in the start-page status cards when available
	- Keep leaderboard computation recompute-on-read and side-effect free.
- Excluded from this step:
	- Dedicated tie-break rules beyond shared-rank handling.
	- Historical snapshots or persisted leaderboard tables.
	- Tournament-wide scoring for group rankings, knockout picks, or special predictions.

### 7.11 Phase 3 category scoring expansion and participant score breakdown (2026-03-26)

- Included in this step:
	- Expand score computation beyond match tips and extra questions to also include:
		- `Grupplaceringar`
		- `Slutspel`
		- `Special`
	- Finalized scoring values for current implementation:
		- Group-stage match tip:
			- exact score: 2 points
			- correct `1/X/2` only: 1 point
		- Group placements:
			- 1 point per team in the correct final position within its group
		- Knockout rounds:
			- `Sextondelsfinal`: 1 point per correctly predicted team in the round
			- `Åttondelsfinal`: 1 point per correctly predicted team in the round
			- `Kvartsfinal`: 2 points per correctly predicted team in the round
			- `Semifinal`: 2 points per correctly predicted team in the round
			- `Final`: 3 points per correctly predicted team in the round
		- Special predictions:
			- `Slutsegrare`: 4 points
			- `Skytteligavinnare`: 4 points
	- Interim group-ranking resolution model for backend scoring until an official standings ingest exists:
		- derive final group ranking from completed `match_results` rows in that group
		- sort by points, then goal difference, then goals scored, then team name as deterministic fallback
		- a group becomes settlement-eligible only when all 6 group matches are completed and 4 teams are present
	- Knockout round settlement model:
		- derive actual participants for each round from `match_results` rows with `stage = knockout`
		- a round becomes settlement-eligible when the expected number of unique teams for that round is present in stored fixtures/results
		- scoring is membership-based per unique team in the round, not slot/pairing exactness
	- Add special-outcome persistence for scoring `Special` predictions:
		- admin-managed results for `winner` and `topScorer`
	- Extend score payloads with category totals and breakdowns:
		- summary totals: `groupPlacementPoints`, `knockoutPoints`, `specialPoints`
		- participant detail: `groupPlacementBreakdown`, `knockoutBreakdown`, `specialBreakdown`
	- Integrate participant score breakdown into `Mina tips` using `GET /api/scores/:participantId`.
	- In participant-facing score breakdown accordions, show all settled rows in backend order, including zero-point misses; hide only unsettled rows that do not have final outcomes yet.
- Excluded from this step:
	- Official FIFA standings ingest.
	- Advanced knockout tie-break metadata beyond team participation.
	- Historical scoring snapshots.

### 7.12 Local-only score preview safety scope (2026-03-26)

- Included in this step:
	- Add a frontend-only mock score preview for the participant profile `Jarmo` in `Mina tips`.
	- Preview is local UI state only and must not write to backend APIs, database tables, local tips payloads, or leaderboard endpoints.
	- Preview may be toggled on/off in the UI and must leave real score data untouched.
- Excluded from this step:
	- Any backend mock data injection.
	- Any persistent feature flag or server-side preview mode.
	- Any modification to actual scoring, settlement, leaderboard ordering, or stored participant tips.

### 7.13 Admin results management UI (2026-03-26)

- Included in this step:
	- Extend the existing Admin frontend so one signed-in admin session can manage both question CRUD and scoring-driving outcomes.
	- Add an admin `Resultat och special` workspace to the frontend Admin page.
	- In the result workspace, allow admin to:
		- browse canonical fixtures from the shared frontend fixture source
		- filter fixtures by `Gruppspel`, `Slutspel`, or all matches
		- search fixtures by team name, group/round, or `matchId`
		- save official match outcomes through existing backend endpoint `PUT /api/admin/results/:matchId`
		- set `planned|live|completed` status, goals, and optional `settledAt`
	- Add frontend management for special scoring outcomes using existing backend endpoints:
		- `GET /api/admin/special-results`
		- `PUT /api/admin/special-results`
	- Keep canonical fixture metadata as the UI source of truth for match identity and scheduled kickoff while only admin-entered outcome fields are editable.
	- Show a saved-results overview table in Admin UI for quick re-entry to previously stored outcomes.
- Excluded from this step:
	- Any new backend scoring logic.
	- Automatic result ingestion from external feeds.
	- Bulk import/export tooling for results.
	- Changes to participant-facing score display behavior.

### 7.14 Participant-facing results and score view (2026-03-26)

- Included in this step:
	- Add a dedicated participant navigation target `Resultat & poäng` in the main frontend.
	- Load public tournament outcome data for participants from existing read endpoints:
		- `GET /api/results`
		- `GET /api/special-results`
	- In the new participant view, show:
		- current match result feed with status visibility for `planned|live|completed`
		- public special outcomes for `Slutsegrare` and `Skytteligavinnare`
		- the signed-in participant's current score summary and detailed settled breakdowns using existing `GET /api/scores/:participantId`
	- Reuse one shared frontend score-breakdown renderer so participant score details stay visually and structurally aligned across `Mina tips` and `Resultat & poäng`.
	- Keep the page read-only for participants; no result or score editing controls are introduced outside Admin.
	- Add a local-only mock preview toggle for participant profile `Jarmo` on `Resultat & poäng`, so in-progress tournament state can be previewed without backend writes.
	- In the same local preview mode, include mock participant score detail and rank summary to preview full `Resultat & poäng` page behavior during active tournament state.
- Excluded from this step:
	- Any new backend endpoints or scoring rules.
	- Auto-refresh, polling, websockets, or live push updates.
	- Historical result timelines or chart visualizations.
	- Public per-participant score comparison beyond the existing signed-in participant detail and already available leaderboard summary.

### 7.15 Lifecycle-based operating roadmap and separation model (2026-03-26)

- Goal:
	- Prevent feature creep and reduce cognitive load by separating product behavior into lifecycle phases that do not overlap in primary UX focus.

- Lifecycle phases (high-level roadmap):
	- Phase A: `Administrointi / alustus`
		- Primary focus: backoffice setup before participant entry.
		- Typical work: question authoring, answer options, lock configuration, result/special preconfiguration, sanity checks.
	- Phase B: `Osallistujien veikkausvaihe`
		- Primary focus: participant prediction input before deadline.
		- Typical work: sign-in, tips submission, edits before lock, own tips review.
	- Phase C: `Turnauksen aikainen seuranta`
		- Primary focus: result progress, score updates, leaderboard, lightweight news/updates.
		- Typical work: admin result entry, participant result/score follow-up, status communication.
	- Phase D: `Lopetus`
		- Primary focus: finalized results and winners communication.
		- Typical work: final leaderboard freeze, winners announcement, post-tournament summary.

- Separation rules (must follow in future changes):
	- Each implementation phase must declare exactly one lifecycle phase as primary context.
	- New UI work must avoid mixing unrelated primary actions from multiple lifecycle phases in the same main view.
	- Cross-phase visibility is allowed only as secondary read-only references (for example compact status card), not as equal-weight action blocks.
	- Before implementing any new behavior, specification must state:
		- target lifecycle phase
		- what is intentionally deferred to later phases
		- acceptance criteria for phase coherence

- Immediate planning policy from this point forward:
	- Prioritize structural clarity and phase coherence before adding new feature surface area.
	- Treat navigation/content restructuring and scope clean-up as first-class roadmap work.
	- Use small, phase-scoped increments and validate that each increment reduces (not increases) mixed-context UX.

- Out of scope for this planning step:
	- No immediate UI rewrite in this section.
	- No backend contract changes.
	- No release/deploy decision changes.

### 7.16 Current page-to-lifecycle phase mapping (2026-03-26)

Current application structure: 7 pages (`PageId` types in `src/App.tsx`) mapped to 4 lifecycle phases.

**Mapping Table**

| Page | Page ID | Primary Phase | Primary Purpose | Secondary Phase | Secondary Info |
| --- | --- | --- | --- | --- | --- |
| Sign-in | `login` | Both A & B | Entry gate (admin code for Phase A; participant code for Phase B) | — | Unified sign-in interface to route to Admin or Participant flows |
| Start | `start` | **C** (Tracking) | Tournament progress and leaderboard during Phase C | A & D | Static tournament info, playoff bracket placeholders |
| Lämna tips | `tips` | **B** (Predictions) | Participant enters/edits fixture, group, knockout, special, extra predictions before deadline | A | Hidden in Phase C; participants review submissions via `Mina tips` |
| Mina tips | `mine` | **B** (Predictions) primary; **C** (Tracking) secondary | Own prediction review before deadline; score breakdown visible after matches settle | C | Score breakdown by category (read-only) |
| Resultat & poäng | `results` | **C** (Tracking) | Public match results, special outcomes, leaderboard by phase | A & D | Tournament rules link (read-only) |
| Admin | `admin` | **A** (Admin/Setup) | Question authoring, management, result entry, before-and-during phases | C | Lightweight result stats (read-only) |
| Regler | `rules` | **Reference** (all phases) | Static tournament rules and scoring model | — | Used by participants in B and C; reference for admin in A |

**Lifecycle Phase Coherence Status**

- **Phase A (Admin/Setup)**: Primary pages = `admin`, `rules`. Secondary visibility = `results` (read-only stats), `start` (rules link). ✅ Mostly isolated.
- **Phase B (Predictions)**: Primary pages = `tips`, `mine`. Secondary visibility = `rules` (scoring context). ✅ Isolated.
- **Phase C (Tracking)**: Primary pages = `start`, `results`. Secondary visibility = `mine` (score breakdown), `admin` (result stats). `tips` is hidden. ⚠️ **MIXED** — Start page and Results page both primary; Start also references Phase A/D info.
- **Phase D (Closure)**: No dedicated page (Final results shown in end-screen variant of `start` or `results`). Secondary visibility = `rules` (results archive).
- **Sign-in (`login`)**: Dual entry point (admin code → Phase A, participant code → Phase B). ✅ Appropriate.

**Current Mixed-Context Issues**

1. **Start page confusion**: Shows Phase C leaderboard + Phase A tournament info + Phase D playoff logic in same view.
   - Problem: User context unclear — admin? tracking participant? viewing finals?
   - Coherence risk: **HIGH** if user navigates between Start and Admin during early Phase A.
   - Action: Defer detailed UX restructure; flag for Phase 3 start when live data validates layout.

2. **Mina tips mixing**: Primarily Phase B (edit predictions) but visible in Phase C with score breakdown.
	- Problem: During Phase B (before deadline), participant focuses on editing predictions; during Phase C, same page shifts to read-only + scoring context.
	- Coherence risk: **MEDIUM** — mixed page purpose across phases.
	- Current decision: Keep `Mina tips` visible in Phase C for participant transparency and quick access to submitted predictions with score details.

3. **Rules page as a catch-all**: Visible in all phases, linked from multiple pages.
   - Problem: Rules don't disambiguate by phase; scoring examples could reference Phase B or Phase C behavior.
   - Coherence risk: **LOW** if rules are consistent; **MEDIUM** if phase-specific clarifications overlap.
   - Action: Add phase-specific rule callouts (e.g., "After deadline:...", "During live play:...") when Phase B/C behaviors diverge.

**Next Steps**

1. Validate that Phase B (tips entry) and Phase C (results/tracking) pages do not display mixed actions in same view.
   - Acceptance: User can clearly identify whether they are *entering predictions* (B) or *viewing results* (C) on each page.
2. Document which components will require variant rendering based on current lifecycle phase (Phase A/B/C/D flag).
3. Plan first coherence cleanup when live tournament data available (post-Phase 3).

### 7.17 Redundant data flows and component variant requirements (2026-03-26)

**Identified redundancies in current specification**

1. **Mina tips (7.11) vs Resultat & poäng (7.14) — participant score display**
   - Issue: Both pages display *same participant-specific score breakdown* from `GET /api/scores/:participantId`.
   - Both pages use *same shared UI component* (`ParticipantScorePanel` in frontend).
   - Current scope boundary: intentional but not clearly marked.
   - Root cause: Specification does not clarify unique purpose of each page relative to tournament phase transition.
   - Resolution strategy: Add explicit Phase B vs Phase C scope clarification and mark components as "variant-aware".

2. **Start page (7.10) vs Resultat & poäng (7.14) — participant score/rank summary**
   - Issue: Both pages may display "my current score + rank" summary.
   - Start page focus (7.10): Leaderboard-centric view of tournament progress.
   - Resultat & poäng focus (7.14): Results-centric view with participant score drill-down.
   - Current scope boundary: intentional but not clearly marked.
   - Resolution strategy: Document as "intentional dual summary" for different UX contexts (tournament status vs my results).

3. **Regler (Rules) page — documentation gap**
   - Issue: Section 7.16 mapping shows Regler as "Reference (all phases)" but no specification section (7.x) exists.
   - Missing detail: Phase-specific rule callouts not yet authored.
   - Resolution strategy: Add new section 7.17.1 to define Regler scope by phase.

4. **Admin (7.13) result entry vs Resultat & poäng (7.14) result viewing — no admin variant**
   - Issue: Specification does not clarify whether Admin has a separate `Resultat & poäng`-like results overview page.
   - Current assumption: Admin places results in Admin workspace `Resultat och special`, sees results only in admin context.
   - Resolution strategy: Confirm whether Admin needs a "participant equivalent" results view or if admin-only workspace is sufficient.

**Components requiring phase-specific variants**

Frontend components that need conditional rendering or mode variants based on current lifecycle phase (`Phase A|B|C|D` flag):

| Component | Current Location | Phase B Variant | Phase C Variant | Notes |
| --- | --- | --- | --- | --- |
| **ParticipantScorePanel** | Mina tips (7.11) + Resultat & poäng (7.14) | Read-only accordion with zero-point misses hidden (predictions pending settlement) | Read-only accordion with all rows (predictions settled, showing scores) | Same UI, different data visibility. Recommendation: add `isSettled: boolean` prop to control display mode. |
| **ScoreSummaryCard** | Start page (7.10) + possibly Resultat & poäng (7.14) | Not shown (no rankings until Phase C) | Show participant rank + points (read-only) | Difference: timing of when card appears, not structure. |
| **LeaderboardPanel** | Start page (7.10) | Not shown (locked during signup; predictions still open) | Show Topplista filled with `GET /api/scores` data | Conditional rendering based on lock time. |
| **TipsInputPanel** | Lämna tips (7.3) | Edit mode enabled before deadline | Edit mode locked after deadline | Lock state controls input enablement. Likely already handled by backend API 409 response. |
| **MatchResultCard** | Resultat & poäng (7.14) | Not shown; page redirects or shows "not yet available" | Show all published results with `planned|live|completed` status badges | Conditional rendering of entire panel. |
| **SpecialResultsPanel** | Admin (7.13) edit mode vs Resultat & poäng (7.14) view mode | (Not applicable — Phase C+) | Admin: editable form; Participant: read-only display | Different components entirely; not a variant issue. |
| **RulesPage** | Regler (7.16 reference) | Show standard rules + Phase B deadline context | Show standard rules + Phase C settlement rules | Recommendation: Add phase-aware callouts to existing Regler page. |
| **AdminResultsWorkspace** | Admin (7.13) | (Not applicable — Phase A/C only) | Shown during Phase C for result entry; hidden during Phase A/B | Conditional main-panel visibility. |

**Component variant implementation strategy**

For each variant-aware component:
1. Accept a `lifecyclePhase: 'A' | 'B' | 'C' | 'D'` prop from parent page.
2. Source lifecycle phase from global state or route context (TBD in Phase 3).
3. Apply conditional rendering logic:
   - Hide unsupported UI blocks
   - Disable input fields
   - Show phase-specific explanatory text
4. No data API changes; all variants consume same backend payloads.
5. Validation: each variant tested manually in isolation before merged.

**Data redundancy acceptance**

Confirmed intentional data flows (not bugs):
- `ParticipantScorePanel` same data in two contexts: OK (different phase context, same component, reusable).
- `ScoreSummaryCard` same rank data in multiple contexts: OK (different UX purpose per page).
- `RulesPage` linkage across all pages: OK (reference material, no data duplication).

**Out of scope for this section**

- No component implementation changes.
- No API endpoint changes.
- No backend variant logic.

### 7.18 Start page phase-scoped rendering (2026-03-26)

- Included in this step:
	- Implement first coherence cleanup directly in frontend Start page by making rendering phase-aware via existing global lock state.
	- Add local-only Start page phase preview controls for participant profile `Jarmo` to force preview mode `Auto`, `Phase B`, or `Phase C` without changing system clock or backend state.
	- Define practical phase mapping for Start page behavior:
		- before global deadline (`Phase B` style): show prediction-prep content (`Kategorier`, `Framsteg`, and tips-oriented summary cards).
		- after global deadline (`Phase C` style): show tournament-tracking content (leaderboard and participant rank/points status) while hiding prediction-prep blocks.
	- Keep existing score and leaderboard data sources unchanged:
		- `GET /api/scores`
		- signed-in participant lookup from same leaderboard payload
	- Keep navigation unchanged; this step only narrows what Start page displays in each phase.
- Excluded from this step:
	- No new backend lifecycle flag.
	- No changes to `Resultat & poäng`, `Mina tips`, or `Regler` rendering.
	- No route-level redirects.

### 7.19 Mina tips phase-scoped score visibility (2026-03-26)

- Included in this step:
	- Implement second coherence cleanup in `Mina tips` so participant score breakdown is phase-scoped.
	- Define practical `Mina tips` behavior by existing global deadline state:
		- before global deadline (`Phase B` style): show saved tips in tabs, hide score breakdowns.
		- after global deadline (`Phase C` style): show saved tips in same tabs, with score breakdown accordion added inside each tab and compact score summary row above tabs.
	- Connect the existing Start-page local phase preview control (`Auto`/`Fas B`/`Fas C`) to shared app-level preview state so the same forced phase applies in both `Start` and `Mina tips` during validation.
	- Keep existing saved tips sections (`Gruppspel`, `Grupplaceringar`, `Slutspel`, `Special`, `Extrafrågor`) visible in both phases.
	- Reuse current `isGlobalLockActive` state as default lifecycle proxy, with local preview override only for `Jarmo`; no backend contract changes.
- Excluded from this step:
	- No scoring rule changes.
	- No API changes for `GET /api/scores/:participantId`.
	- No modifications to `Resultat & poäng` score visibility.

### 7.20 Regler phase-specific guidance (2026-03-26)

- Included in this step:
	- Implement phase-specific guidance block in `Regler` page for `Fas B` vs `Fas C` user context.
	- Use existing lifecycle proxy:
		- default from `isGlobalLockActive`
		- local preview override from shared `Jarmo` lifecycle preview state (`Auto`/`Fas B`/`Fas C`).
	- Show contextual rule emphasis:
		- `Fas B`: reminders for editable tips and deadline completion.
		- `Fas C`: reminders that tips are locked and focus has moved to results/score tracking.
	- Add visible preview status row in `Regler` when local preview is active, matching Start/Mina tips validation behavior.
- Excluded from this step:
	- No changes to lock timestamps.
	- No scoring rule or API changes.
	- No navigation structure changes.

### 7.21 Resultat & poäng context clarification (2026-03-26)

- Included in this step:
	- Add explicit participant-facing context note in `Resultat & poäng` explaining why the same personal score data can appear in both `Mina tips` and `Resultat & poäng`.
	- Clarify page intent separation in UI copy:
		- `Mina tips`: own submitted predictions and saved state.
		- `Resultat & poäng`: official match/special outcomes and how those outcomes affect the same personal score model.
	- Keep score source unchanged (`GET /api/scores/:participantId`) and keep shared score renderer unchanged.
- Excluded from this step:
	- No data model changes.
	- No scoring-rule changes.
	- No route or navigation changes.

### 7.22 Admin vs participant responsibility clarity (2026-03-26)

- Included in this step:
	- Add explicit role-clarity banner in Admin workspace tab `Resultat och special`.
	- Clarify operational split in UI copy:
		- Admin edits official results and special outcomes in Admin tab.
		- Participants see the same outcomes read-only in `Resultat & poäng`.
	- Hide visible Admin entry from participant utility UI to reduce confusion in normal participant flow.
	- Keep admin access available via hidden keyboard shortcut (`Alt+Shift+A`) that opens Admin page login view.
	- Keep current APIs and permissions unchanged.
- Excluded from this step:
	- No new access-control logic.
	- No route changes.
	- No data contract or scoring changes.

### 7.23 Participant score breakdown component and UI integration (2026-03-26)

- Included in this step:
	- Define and implement `ParticipantScorePanel` shared component for rendering participant score details with settled breakdown.
	- Component renders five accordion-based breakdown sections when `participantScoreDetail` is provided:
		1. **Avgjorda gruppspelsmatcher** (`breakdown` array): summary card per fixture showing match name, points, and formatted reason (e.g., "Exakt resultat", "Rätt 1/X/2", "Missad match", "Inget tips sparat").
		2. **Avgjorda gruppplaceringar** (`groupPlacementBreakdown` array): summary card per group showing group label, points, matched position count, and reason (e.g., "Rätt placeringar: 1, 2, 3, 4").
		3. **Avgjorda slutspel** (`knockoutBreakdown` array): summary card per knockout round showing round name, points, matched team count, points per team, and reason (e.g., "Rätt lag: Brasilien, Spanien").
		4. **Avgjorda extrafrågor** (combined `specialBreakdown` + `extraBreakdown` arrays): single accordion merging special predictions (winner/topScorer) and extra question answers, each showing points and formatted reason.
	- Each breakdown item displays:
		- Points badge with conditional color (green if > 0, red/muted if 0 or missing).
		- Reason badge with color-coded tone (success/exact/accent/danger/neutral) per `getReasonTone()` mapping.
		- Metadata line showing matched positions or matched teams when relevant.
	- Component also renders score summary grid above breakdowns showing:
		- Total points.
		- Settled match count per category (settledMatches, settledGroups, settledKnockoutRounds, settledSpecialPredictions, settledQuestions).
		- Participant ranking and position label if available.
	- Styling: reuse existing CSS classes (`.score-breakdown-list`, `.score-breakdown-item`, `.score-breakdown-main`, `.score-breakdown-badges`, `.points-badge`, `.reason-badge`, `.status-note`).
	- Integration:
		- `Mina tips` page: In Phase C, each tab (Gruppspel, Grupplaceringar, Slutspel, Extrafrågor) includes the corresponding score breakdown accordion below the saved tips. A compact score summary row (mini-cards with category points and total) is shown above the tabs. No standalone `ParticipantScorePanel` is used.
		- `Resultat & poäng` page: show `ParticipantScorePanel` at bottom after match results and special outcomes, always visible when participant score data available.
	- Local mock data:
		- Both pages support Jarmo-only local mock preview override.
		- Mock data includes full `ParticipantScoreDetail` objects with realistic breakdown arrays for all five categories.
	- Backend contract (unchanged):
		- Endpoint: `GET /api/scores/:participantId`
		- Expected return shape: `ParticipantScoreDetail` (already defined in types).
		- Note: Actual backend scoring implementation deferred; UI currently works with mock data for testing layout and UX.
- Excluded from this step:
	- No backend scoring implementation.
	- No new API endpoints or contracts.
	- No changes to existing result/special outcome data models.
	- No changes to tips save/load logic.

### 7.24 Hide leaderboard from Start page in Phase B (2026-03-27)

- Included in this step:
	- Remove the `Topplista / Aktuell ställning` panel from Start page Phase B layout.
	- Hide `Din placering` and `Dina poäng` stat cards in Phase B; only `Status` card remains.
	- Leaderboard and score stats remain visible only in Phase C, consistent with 7.18 phase mapping rule.
	- Progress section (`Framsteg`) changes from `panel-split` to `panel` since leaderboard column is removed.
- Excluded from this step:
	- No changes to Phase C leaderboard rendering.
	- No changes to participant stats cards (placement/points still shown).

### 7.25 Tips page UX: unsaved indicator, button labels, clear confirmation (2026-03-27)

- Included in this step:
	- Add `hasUnsavedChanges` boolean state to `useParticipantTips` hook. Set true on any change handler, cleared on save success, load, clear, and logout.
	- Show amber `Osparade ändringar` pill in both the tips page header bar and the bottom action bar when unsaved changes exist.
	- Rename bottom save button from `Skicka in tips` to `Spara` (consistent with top bar).
	- Add `window.confirm` dialog to `Rensa sparade` button to prevent accidental deletion.
- Excluded from this step:
	- No changes to save/load/clear logic itself.
	- No new API endpoints.

### 7.26 Merge Special and Extrafrågor tabs (2026-03-27)

- `tipsSectionTabs` reduced from `['Gruppspel', 'Slutspel', 'Special', 'Extrafrågor']` to `['Gruppspel', 'Slutspel', 'Extrafrågor']`.
- The former Special tab content (`SpecialPredictionsCard`: Slutsegrare, Skytteligavinnare) and former Extrafrågor content (`ExtraQuestionsCard`) now render together under the single Extrafrågor tab.
- No data model or API changes; only UI tab structure affected.
- Also applies to `Mina tips` page: `myTipsSections` merged Special (count 2) into Extrafrågor (count 7). The accordion card renders both special predictions and extra question answers together.

### 7.27 Navigation guard for unsaved tips (2026-03-27)

- When user is on the Tips page with unsaved changes and clicks a nav tab to leave, a `window.confirm` dialog asks: "Du har osparade ändringar. Vill du lämna sidan utan att spara?" Navigation is cancelled if the user declines.
- A `beforeunload` handler is active while unsaved changes exist on the Tips page, warning the user on browser close or refresh.
- No new state; reuses existing `hasUnsavedChanges` from `useParticipantTips`.

### 7.28 Mina tips page: tab navigation (2026-03-27)

- Replaced accordion layout on Mina tips page with tab-based navigation matching Lämna tips page.
- New `myTipsSectionTabs` const: `['Gruppspel', 'Grupplaceringar', 'Slutspel', 'Extrafrågor']`.
- Each tab shows its content section exclusively; `activeSection` state defaults to `'Gruppspel'`.
- `myTipsSections` constant in constants.ts is now unused (accordion removed).
- Poäng / Din poängöversikt section hidden entirely in Phase B; only shown in Phase C with the full score panel.

### 7.29 Extrafrågor tab: category-based sections (2026-03-27)

- Removed `SpecialPredictionsCard` and `ExtraQuestionsCard` component usage from TipsPage Extrafrågor tab.
- Replaced with four inline category sections: Gruppspelsfrågor, Slutspelsfrågor, Turneringsfrågor, 33-33-33 frågor.
- Slutsegrare and Skytteligavinnare rendered inside the Turneringsfrågor section.
- Admin questions grouped by their `category` field; empty categories hidden.
- No data model changes; same `specialPredictions` and `extraAnswers` payloads.

### 7.30 Bugfix: iOS Safari auto-capitalization causes wrong account login (2026-03-27)

- **Root cause**: iOS Safari auto-capitalizes the name input field. Typing "jarmo" becomes "Jarmo", which matches a different participant account (case-sensitive name lookup). The wrong account has no/incompatible saved tips, causing "saved tips don't show" and "card doesn't turn green" symptoms.
- **Fix**: Added `autoCapitalize="none"` to the name `<input>` in LoginPage to prevent iOS keyboard from auto-capitalizing.
- **Scope**: Frontend only (App.tsx LoginPage component). No server or data model changes.

### 7.31 UI consistency: Mina tips ↔ Lämna tips layout alignment (2026-03-27)

- Moved lead-text description inside the sticky header panel on Mina tips page so it does not push the tab row down.
- Wrapped Gruppspel tab content (data-table) in a `<section className="panel">` to match the framed card style used on Lämna tips page.
- Moved score panel (Phase C only) below the tab row so tabs appear at the same vertical position as on Lämna tips page.
- Result: switching between Mina tips and Lämna tips no longer feels visually jumpy — header, tabs, and framed content all align.

### 7.32 Unified page hero height across all pages (2026-03-27)

- All five navigable pages (Start, Lämna tips, Mina tips, Resultat, Regler) now use the same `panel-sticky-head page-hero` structure for their topmost section.
- `.page-hero` CSS class applies `min-height: 150px; align-content: center` so all hero panels render at the same height.
- StartPage and ResultsPage: stats (Din placering, Totalpoäng, etc.) moved from inside the hero panel into a separate `.start-stats-row` below, keeping the hero panel at uniform height.
- RulesPage: switched from plain `panel` to `panel-sticky-head page-hero` with a phase indicator pill on the right.
- Each hero panel follows the pattern: eyebrow + title + optional lead-text on the left, status pill or action buttons on the right.
- No data model or API changes.

### 7.33 Mobile sticky action-bar on Lämna tips page (2026-03-27)

- On mobile (max-width 720px and touch devices), the action-bar with Rensa sparade, save status pill, and Spara button is now `position: fixed` at the bottom of the viewport.
- iOS safe-area-inset handled via `env(safe-area-inset-bottom)`.
- Page content gets `padding-bottom: 80px` (via `:has(.action-bar)`) to prevent content from being hidden behind the fixed bar.
- Save message pill added to the action-bar so save feedback is visible without scrolling up.
- Desktop retains the existing `position: sticky; bottom: 18px` behavior.

### 7.34 Phase C QA simulation seed script (2026-03-27)

- Script: `server/seed-simulation.js` — deterministic simulation data generator for Phase C QA testing.
- npm shortcut: `npm run seed:sim -- <command>`
- CLI commands: `setup | C0 | C1 | C2 | C3 | C4 | C5 | C6 | C7 | reset`
- **setup**: Creates 15 simulated participants (Anders, Björn, Cecilia, David, Erik, Fanny, Gustav, Helena, Isak, Julia, Karl, Laura, Magnus, Nora, Oscar), all with access code `1234`. Creates 7 published admin questions (2 Gruppspelsfrågor, 2 Slutspelsfrågor, 2 Turneringsfrågor, 1 33-33-33). Generates complete predictions for each participant. Auto-backs up DB to `data/vm2026-pre-sim.db`.
- **C0**: No results (deadline passed, all scores = 0).
- **C1**: Chronological group matches up to June 20 (~36 matches across all 12 groups). Groups A–F have 4 matches each (rounds 1+2), groups G–L have 2 matches each (round 1). Partial fixture + group placement scoring.
- **C2**: All remaining group matches complete (72 total). Group placement scoring activates. 2 Gruppspelsfrågor settled.
- **C3**: Round of 32 complete (16 matches, 32 teams). Knockout R32 scoring.
- **C4**: Round of 16 complete (8 matches). Knockout R16 scoring.
- **C5**: Quarterfinals complete (4 matches). Knockout QF scoring (2 pts/team).
- **C6**: Semifinals complete (2 matches). Knockout SF scoring. 2 Slutspelsfrågor settled.
- **C7**: Final complete. Slutsegrare, Skytteligavinnare, and 33-33-33 fråga settled. Full scoring.
- **reset**: Deletes sim participants by name, clears match_results and sim admin_questions. Preserves non-sim users.
- Prediction quality tiers: 3 experts (~65% correct signs), 7 average (~45%), 5 casual (~30%).
- Phases are cumulative: run `setup` → `C0` → `C1` → … → `C7` in order.
- To revisit an earlier phase: `reset` → `setup` → desired `Cx`.
- Deterministic: same seed always produces identical predictions and scores.

### 7.35 Phase C leaderboard shows all participants (2026-03-27)

- Included in this step:
	- Phase C `Topplista / Aktuell ställning` panel on StartPage displays all participants in point order (previously limited to top 5).
- Excluded from this step:
	- No changes to Phase B (leaderboard remains hidden).
	- No changes to scoring logic or API.

### 7.37 Alla tips — All Participants' Predictions Side-by-Side (2026-03-28)

- New nav tab "Alla tips" visible only when logged in and in Phase C (after "Mina tips").
- New `GET /api/tips/all` endpoint returns all participants with their persisted tips, sorted alphabetically by name.
- New `AllTipsPage` with hero panel and section tabs (Gruppspel tab first; other tabs placeholder for later expansion).
- Gruppspel tab renders a horizontal scrollable table:
	- Rows: all 48 group-stage fixtures grouped by group code (A–L), each group preceded by a header row. Fixtures within each group sorted chronologically by kickoff date.
	- Columns: "Match", "Resultat", then one column per participant (alphabetical).
	- Cell content: predicted score (e.g. "1-0") or "—" if no tip.
	- Cell coloring: green (correct 1X2 sign) / red (wrong sign) based on match result; neutral if match not yet settled.
	- "Match" and "Resultat" columns sticky on left.
- Own column: subtle green highlight background; sticky on mobile so always visible.
- Logged-in participant identified from session; data fetched when navigating to the page.

### 7.36 Consolidate Resultat & poäng top stats with ParticipantScorePanel (2026-03-27)

- Removed three redundant stat sections from `Resultat & poäng` page:
	- `.start-stats-row` (Din placering, Totalpoäng, Avgjorda matcher)
	- `.summary-grid` (Slutförda matcher, Återstående matcher)
	- Bottom `ParticipantScorePanel` (separate section with "Poäng / Din poängöversikt")
- Replaced with a single consolidated `.stats-grid` rendered directly after the page hero, containing mini-cards:
	- Placering (with totalpoäng subtitle)
	- Gruppspelsmatcher (completed group-stage results / 72 total group matches, with återstående subtitle) — counts actual completed group-stage match results from the tournament; knockout matches excluded since they are not individually tippable
	- Gruppspel (points + settled count)
	- Grupplaceringar (points + settled count)
	- Slutspel (points + settled count)
	- Extrafrågor (points + settled count)
- `ParticipantScorePanel` component remains exported but is no longer used on the `Resultat & poäng` page (still available for other pages).
- No API or data model changes.

### 7.38 Merge Resultat & poäng into Mina tips (2026-03-28)

- Motivation: `Resultat & poäng` and `Mina tips` had identical 4-tab structure (Gruppspel, Grupplaceringar, Slutspel, Extrafrågor) with overlapping participant score data. Users had to switch between pages in Phase C to compare predictions with results.
- Decision: Remove `Resultat & poäng` as a separate page. Enrich `Mina tips` so it adapts by lifecycle phase:
	- **Phase B**: Shows submitted predictions only (no stats, no results).
	- **Phase C**: Shows predictions enriched with actual results and scoring inline per tab.
- Changes:
	- Removed `'results'` from `PageId` union type and nav items.
	- Removed `ResultsPage` component and its file (`src/pages/ResultsPage.tsx`).
	- Updated `Mina tips` page hero to adapt copy by phase (Phase C: "Dina tips och matchresultat").
	- Added 6 stats mini-cards in Phase C (Placering, Matcher, Gruppspel, Grupplaceringar, Slutspel, Extrafrågor) — adopted from former ResultsPage layout.
	- Gruppspel tab in Phase C: enriched fixture-breakdown layout with Match, Resultat, Tips, 1X2, Poäng columns and hit/miss indicators.
	- Grupplaceringar tab in Phase C: inline scoring with points and reason badges per group (no accordion).
	- Slutspel tab in Phase C: inline scoring with points and reason badges per round (no accordion).
	- Extrafrågor tab in Phase C: inline scoring with points and reason badges per item (no accordion).
	- Accordion pattern removed from Phase C display in favor of always-visible inline scoring.
	- App.tsx fetch logic updated: `mine` page in Phase C also loads results via `loadPublicResults()`.
	- Updated `normalizePageForPhase` to redirect `'results'` → `'mine'`.
- Supersedes: 7.14 (Participant-facing results and score view), partially supersedes 7.36 (stats consolidation).
- No API or backend changes.

### 7.39 Alla tips — Grupplaceringar tab (2026-03-28)

- Adds "Grupplaceringar" as second tab on the Alla tips page.
- Table structure mirrors the Gruppspel tab pattern: horizontal scrollable table with sticky left columns.
	- Rows: one per group (Grupp A through Grupp L, 12 rows).
	- Columns: "Grupp" (sticky), "Mitt tips" (sticky, logged-in participant's picks), then one column per other participant (alphabetical, scrollable).
	- Cell content: left-aligned numbered list of 4 predicted team placements (1–4) or "—" if no prediction.
- Group codes derived from `GROUP_TEAMS` in `fixtures.ts` (new export: `allGroupCodes`).
- No cell coloring in this version (actual group standings not yet available on frontend).
- No API or backend changes; data already present in `allTipsParticipants[].tips.groupPlacements`.

### 7.40 Alla tips — Slutspel tab (2026-03-28)

- Adds "Slutspel" as third tab on the Alla tips page.
- Table structure mirrors the Grupplaceringar tab pattern: horizontal scrollable table with sticky left columns.
	- Rows: one per knockout round (Sextondelsfinal, Åttondelsfinal, Kvartsfinal, Semifinal, Final — 5 rows).
	- Columns: "Omgång" (sticky), "Mitt tips" (sticky, logged-in participant's picks), then one column per other participant (alphabetical, scrollable).
	- Cell content: left-aligned list of predicted advancing team names or "—" if no prediction. Team count per round: 32, 16, 8, 4, 2.
- Knockout round definitions from `knockoutPredictionTemplates` in `constants.ts`.
- No cell coloring in this version (actual knockout results comparison not implemented).
- No API or backend changes; data already present in `allTipsParticipants[].tips.knockoutPredictions`.

### 7.41 Alla tips — Extrafrågor tab (2026-03-28)

- Adds "Extrafrågor" as fourth and final tab on the Alla tips page.
- Table structure mirrors the Grupplaceringar/Slutspel tab pattern: horizontal scrollable table with sticky left columns.
	- Rows: one per published extra question (dynamic, fetched from `publishedQuestions`).
	- Columns: "Fråga" (sticky), "Mitt tips" (sticky, logged-in participant's answer), then one column per other participant (alphabetical, scrollable).
	- Cell content: participant's selected answer text or "—" if unanswered.
- Questions sourced from `GET /api/questions/published` (same data already loaded in App.tsx).
- `publishedQuestions` prop added to AllTipsPage component.
- No cell coloring in this version.
- No API or backend changes; answers already present in `allTipsParticipants[].tips.extraAnswers`.

### 7.42 Extrafrågor — Searchable Combobox + Admin Player Picker (2026-03-28)

- **Problem:** When extra questions ask for player names, free-text entry leads to inconsistent spelling, making scoring difficult.
- **Solution:** Two-part approach:
	1. **Static squad data file** (`data/vm2026-squads.json`): JSON mapping country names to arrays of player names. Covers all 48 World Cup nations. Updated once when official squads are announced.
	2. **Admin player picker**: When editing a question, admin can click "Välj spelare" to open a modal that loads squad data. Admin searches/filters by country or name, selects relevant players, and appends them to the question's options list.
	3. **Searchable combobox for participants**: When a question has >10 options, the `<select>` dropdown is replaced with a searchable text input + dropdown (`SearchableCombobox` component). Typing filters options in real time. Selecting an option sets the canonical name.
- **Components:**
	- `src/components/SearchableCombobox.tsx`: Reusable combobox with text filtering, keyboard navigation (ArrowDown/Up/Enter/Escape), and click-to-select.
	- `src/pages/tips/ExtraQuestionsCard.tsx`: Uses `SearchableCombobox` when `options.length > 10`, otherwise regular `<select>`.
	- `src/pages/admin/AdminQuestionsTab.tsx`: Added "Välj spelare" button + inline player picker panel that loads `data/vm2026-squads.json`, grouped by country, with search filter.
- **Data flow:** Admin picks players → populates `options[]` → participant sees searchable combobox → selects canonical name → stored as `extraAnswers[questionId]`.
- **No API or backend changes.** Squad data served as static JSON file.

### 7.43 Remove hardcoded special predictions — use admin questions (2026-03-28)
- **Motivation**: all prediction questions should be fully configurable through admin UI (text, options, points, category, lock). Hardcoded Slutsegrare/Skytteligavinnare prevented this.
- Removed the `SpecialPredictions`, `SpecialResultsState`, `SpecialScoreBreakdown` types and all related code.
- Removed `specialPredictions` state from `useParticipantTips` hook; tips payload no longer includes `specialPredictions`.
- Removed `specialResults` state, `/api/special-results`, and `/api/admin/special-results` endpoints.
- Removed `scoreSpecialPrediction()` from scoring engine; `specialPoints`, `specialBreakdown`, `settledSpecialPredictions` removed from score response.
- Removed hardcoded Slutsegrare/Skytteligavinnare inputs from TipsPage Extrafrågor tab.
- Removed special breakdown display from MyTipsPage; only `extraBreakdown` is shown.
- Removed Special progress row from StartPage tips-progress panel.
- Removed special results section from AdminResultsTab (admin tab renamed to "Resultat").
- Admin creates these questions through the existing admin questions UI with appropriate options (from squads data) and category (Turneringsfrågor).
- Answers stored and scored via the existing `extraAnswers` / `scoreExtraAnswer()` system.
- TipsPage Extrafrågor tab uses `SearchableCombobox` when a question has >10 options.
- Deleted `db-special.js`, removed `special_results` and `participant_special_predictions` table schemas, removed dead validator functions (`isValidSpecialPredictions`, `normalizeSpecialResultsPayload`), cleaned test payloads.
- `seed-simulation.js` updated: removed `generateSpecialPredictions`, `upsertSpecialResults` import/usage; added Slutsegrare and Skytteligavinnare as admin questions in `ADMIN_QUESTIONS` (category: Turneringsfrågor); settling now uses `settleQuestion()` in phaseC7.

### 7.44 Alla tips — Correctness Highlighting for Grupplaceringar, Slutspel, Extrafrågor (2026-03-28)

- **Problem:** Gruppspel tab on AllTipsPage already shows green/red hit/miss coloring per participant. The remaining three tabs (Grupplaceringar, Slutspel, Extrafrågor) displayed predictions with no indication of correctness.
- **Solution:**
	- New read-only API endpoint `GET /api/results/correctness` returns answer-key data:
		- `groupStandings`: per group code — `{ settled: boolean, actualPicks: string[] | null }` derived from completed group matches using `deriveSettledGroupStanding()`.
		- `knockoutRounds`: per round title — `{ settled: boolean, actualTeams: string[] }` derived from completed knockout matches.
		- `extraAnswers`: per question id — `{ correctAnswer: string | null, settled: boolean }` from admin questions table.
	- Correctness data loaded in `App.tsx` when navigating to the Alla tips page.
	- **Grupplaceringar tab**: "Slutställning" column shows actual group standings when settled. Each team in a participant's prediction is highlighted per-position: green (`alltips-hit-exact`) if correct position, red (`alltips-miss`) if wrong.
	- **Slutspel tab**: "Kvalificerade lag" column shows actual teams per round when settled. Each team in a participant's prediction is highlighted: green if team participated in the round, red if not.
	- **Extrafrågor tab**: "Rätt svar" column shows correct answer when settled. Each participant's answer cell is highlighted: green if matches correct answer (case-insensitive), red if wrong.
	- All three tabs now show all participants in a unified column layout (consistent with Gruppspel tab), with the logged-in user's column highlighted via `alltips-own-col`.
	- Unsettled items show no highlighting (neutral display).
	- Reuses existing CSS classes (`alltips-hit-exact`, `alltips-miss`, `alltips-own-col`).
- **Backend changes:**
	- Exported `buildGroupStandingsLookups()`, `buildKnockoutRoundLookups()`, `buildPublishedQuestionLookups()` from `db-scoring.js`.
	- Added `GET /api/results/correctness` route in `public-routes.js`.
- **Frontend changes:**
	- New `CorrectnessData` type in `types.ts`.
	- `App.tsx`: new state `correctnessData`, fetched from `/api/results/correctness` when `activePage === 'alltips'`.
	- `AllTipsPage.tsx`: `correctnessData` prop added; highlighting logic in Grupplaceringar, Slutspel, and Extrafrågor tabs.
	- Removed Avgjorda accordion sections from ParticipantScorePanel (2026-03-28): removed the four accordion sections (Avgjorda gruppspelsmatcher, Avgjorda grupplaceringar, Avgjorda slutspel, Avgjorda extrafrågor) from the bottom of the Resultat & poäng page. The same information is accessible via the section tabs above.

### 7.45 Refactor: Centralized API layer + custom hooks extraction (2026-03-28)

- **Problem:** App.tsx had grown to ~600 lines with 9 independent state slices, 7 inline fetch functions, and 5 useEffect hooks. API calls were scattered across App.tsx, hooks, and page components with inconsistent error handling (some silently reset state, no standardized error pattern). The `useParticipantTips` hook accepted callback functions (`onLoadLeaderboard`, `onLoadScore`) creating tight coupling between hooks.
- **Solution:**
	- **New centralized API layer** (`src/api/`):
		- `client.ts`: typed fetch wrapper (`apiGet`, `apiPost`, `apiPut`, `apiDelete`) with `ApiError` class for standardized error handling. All API calls go through this single point.
		- `endpoints.ts`: typed endpoint functions (`fetchLeaderboard`, `fetchParticipantScore`, `fetchPublicResults`, `fetchCorrectnessData`, `fetchPublishedQuestions`, `fetchTips`, `saveTips`, `deleteTips`, `fetchAllTips`, `fetchConfig`, `signIn`). Each function handles response normalization (e.g., extracting arrays from wrapper objects).
		- `index.ts`: barrel export for clean imports.
	- **New custom hooks** extracted from App.tsx:
		- `useLeaderboard(participant)` — leaderboard state + auto-load on participant change.
		- `useParticipantScoreDetail(participant, activePage)` — score detail state + auto-load when on 'mine' page.
		- `usePublicData(activePage)` — match results + published questions, loaded on relevant page changes.
		- `useAllTipsData(activePage)` — all participants' tips + correctness data, loaded only on 'alltips' page.
	- **Updated existing hooks:**
		- `useParticipantTips`: replaced raw `fetch()` calls with `fetchTips`, `saveTips`, `deleteTips` from API layer. Simplified callback pattern from `(onLoadLeaderboard, onLoadScore)` to single `onAfterSave`/`onAfterClear` callback.
		- `usePhaseRouting`: replaced raw `fetch('/api/config')` with `fetchConfig()` from API layer.
	- **App.tsx reduced from ~600 to ~350 lines**: removed 9 useState declarations, 5 useEffect hooks, and 7 inline async functions. Replaced with 4 hook calls.
	- **LoginPage**: replaced raw `fetch('/api/auth/sign-in')` with `signIn()` from API layer, using `ApiError` for error messages.
- **Files changed:** `src/api/client.ts` (new), `src/api/endpoints.ts` (new), `src/api/index.ts` (new), `src/hooks/useLeaderboard.ts` (new), `src/hooks/useParticipantScoreDetail.ts` (new), `src/hooks/usePublicData.ts` (new), `src/hooks/useAllTipsData.ts` (new), `src/hooks/useParticipantTips.ts`, `src/hooks/usePhaseRouting.ts`, `src/hooks/index.ts`, `src/App.tsx`.
- **No behavioral changes**: API calls, timing, and error fallback behavior remain identical. This is a pure structural refactoring.

### 7.46 Refactor: db-scoring.js split into focused modules (2026-03-28)

- **Problem:** `server/db-scoring.js` had grown to 878 lines with 25 functions (5 exported, 20 private) mixing three distinct concerns: pure text normalization utilities, database lookup builders, and scoring calculation/ranking logic.
- **Solution:** Split into three focused modules behind the existing barrel re-export:
	- **`server/scoring-helpers.js`** — 8 pure functions with no DB dependencies: `normalizeText`, `normalizeComparableText`, `normalizeGroupCode`, `normalizeMatchLabel`, `extractGroupCode`, `uniqueNormalizedTexts`, `buildGroupMatchDateKey`, `buildGroupMatchKey`. All functions have JSDoc annotations.
	- **`server/db-scoring-lookups.js`** — 7 database lookup builders + 1 pure helper (`deriveSettledGroupStanding`): `buildScoringLookups`, `listParticipantsWithTips`, `getParticipantWithTipsById`, `buildCompletedResultLookups`, `buildPublishedQuestionLookups`, `buildGroupStandingsLookups`, `buildKnockoutRoundLookups`. All functions have JSDoc annotations.
	- **`server/db-scoring-calc.js`** — 9 scoring/ranking functions: `listParticipantScores`, `getParticipantScoreByParticipantId`, `calculateParticipantScore`, `rankParticipantScoreSummaries`, `scoreFixtureTip`, `scoreExtraAnswer`, `resolveResultForTip`, `derivePredictedSign`, `deriveOutcomeSign`. All functions have JSDoc annotations.
	- **`server/db-scoring.js`** — converted to barrel re-export of the 5 previously exported functions from the new modules. All downstream consumers (`db.js`, `public-routes.js`, `tips-routes.js`) remain unchanged.
- **Files changed:** `server/scoring-helpers.js` (new), `server/db-scoring-lookups.js` (new), `server/db-scoring-calc.js` (new), `server/db-scoring.js` (replaced with barrel re-export).
- **No behavioral changes**: all exports, function signatures, and computation logic remain identical. This is a pure structural refactoring with added JSDoc documentation.
### 7.47 App.tsx cleanup: renderPage prop grouping (2026-03-29)

- **Problem:** `renderPage` accepts a flat object with 30+ properties, making the call site in `App()` noisy and hard to scan.
- **Solution:** Group `renderPage` props into three semantic sub-objects: `tips` (tip data + mutations), `scores` (leaderboard, score detail, results, correctness), `ui` (session, phase, lock, touch, admin).
  - Define `RenderPageTipsProps`, `RenderPageScoresProps`, `RenderPageUIProps` interfaces.
  - `renderPage(activePage, { tips, scores, ui })` replaces the flat signature.
  - Inside `renderPage`, unpack groups to pass individual props to page components — **page component interfaces remain unchanged**.
  - Extract `LoginPage` to `src/pages/LoginPage.tsx`.
- **Files changed:** `src/App.tsx`, `src/pages/LoginPage.tsx` (new).
- **No behavioral changes**: all page rendering, prop passing, and user flows remain identical. This is a pure structural cleanup.

### 7.48 Mina tips UX redesign — card-based tabs with Phase C scoring (2026-03-29)

- **Problem:** Grupplaceringar, Slutspel, and Extrafrågor tabs on MyTipsPage used plain `<ul>` lists with no visual hierarchy. Phase C duplicated information (tips list + separate score-breakdown-list below). No per-position or per-team comparison. No delight.
- **Solution:** Redesign all four tabs into a cohesive, card-based experience optimized for Phase C (tournament viewing). Phase B stays minimalistic.
- **Grupplaceringar tab:**
  - Each group = one visual card in a responsive 2-column grid (1 column on mobile ≤720px).
  - Card header: group name + points badge.
  - 4 position rows showing: position number, predicted team, actual team (Phase C), per-position hit/miss indicator (green ✓ / red ✗). The reason-badge text (e.g., "Rätt placeringar: 1, 2, 3") is omitted because the per-row indicators already convey the same information.
  - Unsettled groups: picks only, no facit column.
  - Phase B: same card structure, positions + team names, no results column.
- **Slutspel tab:**
  - Each knockout round = one card, stacked vertically.
  - Card header: round name + points badge.
  - Predicted teams shown as chips: green if correct (hit), red if wrong (miss).
  - Below the picks, a "Rätt lag du saknade" section appears only when there are actual teams the user did not predict — shown as amber chips. If all actual teams were predicted, the section is hidden. This avoids duplicate display of teams.
  - Phase B: same card layout, teams as neutral chips.
- **Extrafrågor tab:**
  - Merged tips + score breakdown into one card per question (eliminates Phase C duplication).
  - Phase C: question title, "Ditt svar" shown as green (correct) or red (wrong). "Rätt svar" in amber shown only when the answer is wrong — hidden when correct to avoid redundancy. Points badge in card header.
  - Phase B: card per question, question text + selected answer.
- **Gruppspel tab:** Phase C fixtures grouped by group (Grupp A–L), each group as a card with header (group name + total points badge). Matches within each group sorted chronologically by kickoff date. Each match row shows a small date+time label above the match name. Groups with no settled matches are hidden.
- **Cross-cutting improvements:**
  - Tab switch animation: CSS `fadeIn` keyframe (opacity 0→1, 180ms ease-out) on `.tab-content` wrapper.
  - Consistent empty states: centered muted text pattern across all tabs.
  - All new card layouts responsive: verified at 720px, 600px, 560px breakpoints.
  - Color consistency: reuses existing `.tip-indicator.hit/.miss`, `.points-badge`, `.reason-badge` classes.
- **Files changed:** `src/pages/MyTipsPage.tsx`, `src/styles.css`.
- **No API or backend changes.** All data already available in `ParticipantScoreDetail` breakdown types (`groupPlacementBreakdown.actualPicks`, `knockoutBreakdown.matchedTeams`, `extraBreakdown.selectedAnswer/correctAnswer`).

### 7.49 Alla tips — Gruppspel grouped by group (2026-03-30)

- **Problem:** The Gruppspel tab on AllTipsPage listed all 48 group-stage fixtures in a single flat table, making it hard to locate matches for a specific group.
- **Solution:** Group fixtures by group code (A–L) within the same scrollable table. Each group is preceded by a full-width header row (`Grupp A`, `Grupp B`, …). Fixtures within each group are sorted chronologically by kickoff date.
- CSS class `alltips-group-header-row` styles the header row with subtle background, bold text, and sticky left position.
- The table structure (sticky Match/Resultat columns, participant columns, hit/miss coloring) is unchanged.
- **Files changed:** `src/pages/AllTipsPage.tsx`, `src/styles.css`, `docs/specification.md`.
- **No API or backend changes.**

### 7.50 Mina tips Gruppspel — show match datetime (2026-03-29)

- **Problem:** Phase C Gruppspel tab in MyTipsPage showed only match names without kickoff times, making it hard to orient in time.
- **Solution:** Display a small date+time label above the match name in each fixture row (e.g. "12 juni 18:00"). Uses `entry.date` (ISO datetime from breakdown), formatted with `sv-SE` locale (`day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'`).
- New CSS class `.fixture-date-label`: small muted text (`0.7rem`, `--ink-muted`), displayed as block above match name.
- **Files changed:** `src/pages/MyTipsPage.tsx`, `src/styles.css`, `docs/specification.md`.
- **No API or backend changes.**

### 7.51 Mina tips Gruppspel Phase B — group by group (2026-03-29)

- **Problem:** Phase B Gruppspel tab in MyTipsPage was a flat table listing all 48 fixtures, inconsistent with the Phase C card-based grouped layout.
- **Solution:** Replace flat table with the same card-based group layout (Grupp A–L). Each group card shows fixtures sorted chronologically with Match, Resultat, and 1X2 columns. Date+time label shown above each match name (reuses `.fixture-date-label`). Groups with no fixtures are hidden.
- Reuses `.placement-card`, `.fixture-breakdown-header/list/row` CSS from Phase C.
- **Files changed:** `src/pages/MyTipsPage.tsx`, `docs/specification.md`.
- **No API or backend changes.**

### 7.52 Mina tips Phase C — merge Grupplaceringar into Gruppspel (2026-03-29)

- **Problem:** In Phase C, Gruppspel and Grupplaceringar were separate tabs, but they naturally belong together per group — seeing fixtures and placements side by side gives better context.
- **Solution:** In Phase C, each Gruppspel group card now includes a "Grupplacering" section below the fixture list, showing the 4 position rows with hit/miss indicators (same layout as the old Grupplaceringar tab). The card's points badge shows combined points (fixture + placement). The "Grupplaceringar" tab is hidden from the tab row in Phase C.
- Phase B retains the Grupplaceringar tab unchanged (no scoring data in Phase B).
- New CSS: `.group-placement-section` (border-top separator), `.group-placement-section-label` (uppercase muted label with optional small points badge), `.points-badge.small`.
- **Files changed:** `src/pages/MyTipsPage.tsx`, `src/styles.css`, `docs/specification.md`.
- **No API or backend changes.**
- **Rollback:** `git revert` this commit to restore separate tabs. Rollback point: `b4813a4`.

### 7.53 Fix horizontal scroll on mobile pages (2026-03-29)

- **Problem:** On mobile, pages (particularly Mina tips) could scroll horizontally, causing distracting side-to-side movement.
- **Solution:** Add `overflow-x: hidden` to `.page-stack` to prevent any child content from causing horizontal page overflow.
- **Files changed:** `src/styles.css`, `docs/specification.md`.

### 7.54 Alla tips — sticky group headers on vertical scroll (2026-03-29)

- **Problem:** Group header rows (e.g., "Grupp A") in the AllTipsPage Gruppspel table only appeared when scrolling horizontally — they scrolled out of view when scrolling vertically through matches.
- **Solution:** Add `top: 29px; z-index: 2` to `.alltips-group-header-row td` so headers stick below the thead when scrolling vertically, keeping the current group always visible.
- **Files changed:** `src/styles.css`, `docs/specification.md`.

### 7.55 Phase C Start page — tournament dashboard redesign (2026-03-29)

- **Problem:** Phase C Start page showed only two simple stat cards (placement, points) and a plain bullet-list leaderboard — not visually engaging for a tournament landing page.
- **Solution:** Redesign Phase C Start page with three sections:
  1. **Personal highlight** (`lb-highlight`): 3-column card row showing placement (green), total points, and settled matches count.
  2. **Leader spotlight** (`lb-leader-spot`): gradient background card with 🥇 emoji, leader name, and points — adds visual hierarchy.
  3. **Full ranking table** (`lb-table`): columns #, Namn, Poäng. Top 3 get medal emojis (🥇🥈🥉). Current user's row highlighted green (`lb-row-me`) with "Du" pill badge.
- **Mobile (≤720px):** Highlight cards stack vertically (row layout within each card).
- Phase B Start page is unchanged.
- Uses existing `LeaderboardEntry` data — no new API calls.
- **Files changed:** `src/pages/StartPage.tsx`, `src/styles.css`, `docs/specification.md`.

## 8. Normalized Database Schema

### 8.1 Migration Strategy: JSON → Relational

Current state (MVP):
- Tips stored as single JSON `data` column in a monolithic `participant_tips` row.
- Data structure: `{ fixtureTips, groupPlacements, knockoutPredictions, specialPredictions, extraAnswers }`.
- Scaling concern: JSON normalization ensures easier querying, archival, audit, and scoring isolation.

Migration approach (this phase):
- Create new normalized tables in same SQLite database.
- Implement dual-write capability in backend: write to both JSON and normalized tables simultaneously.
- Implement read compatibility layer: read from normalized tables when available, fall back to JSON for backward compatibility.
- No frontend breaking changes; tips API contract remains unchanged.
- One-time backfill of historical tips from JSON to normalized tables (idempotent script, safe to rerun).

### 8.2 Normalized Tables Schema

#### `participant_fixture_tips` (one row per participant × fixture prediction)

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | |
| `participant_id` | INTEGER | FK → `participants.id`, NOT NULL | |
| `fixture_id` | TEXT | NOT NULL | Canonical fixture UUID from frontend fixture source |
| `match_key` | TEXT | | Legacy fallback key (group+match name) for backward compat |
| `home_score` | INTEGER | | Predicted home score (null if not set) |
| `away_score` | INTEGER | | Predicted away score (null if not set) |
| `sign` | TEXT | CHECK (`sign` IN ('1', 'X', '2', '')) | Predicted outcome sign (auto-derived from scores) |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | When prediction first saved |
| `updated_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | When prediction was last modified |
| `synced_from_json` | BOOLEAN | DEFAULT FALSE | Markers for backfill tracking |

**Indexes:**
- UNIQUE(`participant_id`, `fixture_id`)
- INDEX(`participant_id`, `updated_at`)

---

#### `participant_group_placements` (one row per participant × group ranking prediction)

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | |
| `participant_id` | INTEGER | FK → `participants.id`, NOT NULL | |
| `group_code` | TEXT | NOT NULL | Group identifier (A-L) |
| `position` | INTEGER | CHECK (`position` IN (1,2,3,4)), NOT NULL | Ranking position (1st, 2nd, 3rd, 4th) |
| `team_name` | TEXT | | Predicted team name for this position (null if not set) |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | |
| `updated_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | |
| `synced_from_json` | BOOLEAN | DEFAULT FALSE | |

**Indexes:**
- UNIQUE(`participant_id`, `group_code`, `position`)
- INDEX(`participant_id`, `group_code`)

**Invariants:**
- A team can appear at most once per group ranking (no duplicates).
- Null `team_name` represents "not yet picked" and is allowed for incomplete submissions.

---

#### `participant_knockout_predictions` (one row per participant × knockout round)

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | |
| `participant_id` | INTEGER | FK → `participants.id`, NOT NULL | |
| `round_title` | TEXT | NOT NULL | Round name (`Sextondelsfinal`, `Åttondelsfinal`, `Kvartsfinal`, `Semifinal`, `Final`) |
| `position` | INTEGER | NOT NULL | Slot index in the round (0-31 for round of 32, 0-15 for round of 16, etc.) |
| `team_name` | TEXT | | Predicted team name for this slot (null if not set) |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | |
| `updated_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | |
| `synced_from_json` | BOOLEAN | DEFAULT FALSE | |

**Indexes:**
- UNIQUE(`participant_id`, `round_title`, `position`)
- INDEX(`participant_id`, `round_title`)

**Invariants:**
- Null `team_name` is allowed (incomplete submission).
- No uniqueness constraint on team names within a round (teams may repeat if they're multiple iterations).

---

#### `participant_special_predictions` (one row per participant, combined special predictions)

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | |
| `participant_id` | INTEGER | FK → `participants.id`, NOT NULL, UNIQUE | One row per participant |
| `winner_team` | TEXT | | Predicted tournament winner team name (null if not set) |
| `top_scorer_name` | TEXT | | Predicted tournament top scorer name (null if not set) |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | |
| `updated_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | |
| `synced_from_json` | BOOLEAN | DEFAULT FALSE | |

---

#### `participant_extra_answers` (one row per participant × published question answer)

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | |
| `participant_id` | INTEGER | FK → `participants.id`, NOT NULL | |
| `question_id` | INTEGER | FK → `admin_questions.id`, NOT NULL | |
| `selected_answer` | TEXT | NOT NULL | The answer option participant selected |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | |
| `updated_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | |
| `synced_from_json` | BOOLEAN | DEFAULT FALSE | |

**Indexes:**
- UNIQUE(`participant_id`, `question_id`)
- INDEX(`participant_id`)
- INDEX(`question_id`)

---

### 8.3 API Contract (Unchanged)

Frontend continues to send and receive tips as a single JSON payload via existing endpoints:
- `PUT /api/tips/:participantId` — accepts single tips JSON object
- `GET /api/tips/:participantId` — returns single tips JSON object
- `DELETE /api/tips/:participantId` — clears all tips

Backend internally:
1. Writes normalized rows from incoming JSON.
2. Reads normalized rows and reconstructs JSON payload for API response.
3. Falls back to legacy JSON read if normalized tables are not available (for backward compat during transition).

No schema or response changes visible to frontend.

---

### 8.4 Scoring Implications

Scoring reads directly from normalized tables during backend scoring computation:
- `GET /api/scores/:participantId` queries normalized tables instead of JSON parsing.
- Scoring engine joins: `participant_fixture_tips` → `match_results`, `participant_group_placements` → settled group standings, etc.
- Idempotent computation: rescore can be run repeatedly from normalized data without double-counting.
- Audit trail: normalized tables preserve created/updated timestamps for forensic analysis.

---

### 8.5 Backfill and Transition Plan

1. **Create**: Deploy new normalized tables with `synced_from_json` flag.
2. **Dual-write**: New tips mutations write to both JSON and normalized tables; read `synced_from_json` to verify completeness.
3. **Backfill**: One-time script runs `UPDATE participant_fixture_tips SET synced_from_json = TRUE` where migration was successful; script is idempotent.
4. **Cutover**: Gradually increase read traffic from normalized tables; monitor for any mismatches vs. legacy JSON.
5. **Cleanup**: After N days of successful normalized-table reads, deprecate JSON column read path; JSON column remains in DB for archival only.

---

## 9. Test Automation Requirements

### 9.1 Test Coverage Philosophy

Goal: "Pomminvarma pistelaskenta" (bulletproof scoring) — ensure every path through the scoring pipeline is validated and cannot accidentally produce incorrect points.

Coverage principle:
- **Unit tests**: Scoring calculation logic per category (fixture, group, knockout, special, extra).
- **Integration tests**: End-to-end flow from tips save → match settlement → score recalculation.
- **Regression tests**: Edge cases that have caused bugs in the past (e.g., partial results, missing settlements).
- **Isolation tests**: Each test uses a dedicated temporary database and spawned API process to avoid test pollution.

### 9.2 Test Matrix: Fixture Tips (Group Stage Matches)

**Scoring Rule:**
- Exact score hit (home + away both match): 2 points.
- Correct `1/X/2` outcome only (scores miss but sign is right): 1 point.
- Wrong outcome or no tip: 0 points.
- Unsettled match (no completed result): 0 points (eligible for rescore when result arrives).

| Scenario | Tip Data | Match Result | Expected Points | Notes |
|----------|----------|--------------|-----------------|-------|
| Exact score | home=1, away=0, sign=1 | home=1, away=0, status=completed | 2 | Hit all three |
| Correct sign | home=1, away=0, sign=1 | home=1, away=1, status=completed | 1 | Sign correct, score wrong |
| Wrong sign | home=1, away=0, sign=1 | home=1, away=0 *reversed* → sign=2 | 0 | Sign wrong |
| No tip | null, null, '' | home=1, away=1, status=completed | 0 | Participant didn't enter |
| Unsettled | home=1, away=0, sign=1 | (no result row) | 0 | Match not yet played |
| Pending result | home=1, away=0, sign=1 | status=planned or live | 0 | Result not finalized |
| Admin override | home=1, away=0, sign=1 | admin-corrected to home=2, away=0 | Recalc on update | Corner case: admin corrects result after initial scoring → rescore must detect and repoint |

**Test implementation:**
- Use isolated API + temp DB per test scenario.
- Seed fixture, participant tips, and match result in sequence.
- Call `GET /api/scores/:participantId` and assert `fixturePoints` and expected `breakdown[0].points`.
- Verify `breakdown[0].reason` matches expected reason string (Swedish user-facing copy).

---

### 9.3 Test Matrix: Group Placements

**Scoring Rule:**
- 1 point per team in the correct final position within its group.
- Group settlement only when all 6 group matches are completed.
- Max: 4 points per group (all 4 teams correctly placed).

| Scenario | Prediction | Group Standing | Expected Points | Notes |
|----------|-----------|---|--|--|
| All correct | [MX, USA, CAN, MXPL] | [MX, USA, CAN, MXPL] computed from match results | 4 | Perfect group prediction |
| 2 correct | [MX, USA, CAN, MXPL] | [MX, MXPL, USA, CAN] | 2 | MX and USA correct; CAN and MXPL swapped |
| None correct | [MX, USA, CAN, MXPL] | [CAN, USA, MXPL, MX] | 0 | All wrong |
| Partial group | [MX, USA, CAN, MXPL] | Only 3 group matches played | 0 | Group not settled (unsettled) |
| Empty picks | ['', '', '', ''] | All positions settled | 0 | No prediction entered |

**Settlement logic:**
- Group is settlement-eligible when all 6 matches in that group have `result_status = completed` and both scores exist.
- Standings derived deterministically from completed results: sort by points (3 for win, 1 for draw), then goal diff, then goals for, then name.

**Test implementation:**
- Create 6 fixtures for a test group, all with completed results.
- Compute group standings from results.
- Seed participant group placement prediction.
- Call `GET /api/scores/:participantId` and assert `groupPlacementPoints` and `groupPlacementBreakdown[0]` contains matched position count and reason.

---

### 9.4 Test Matrix: Knockout Predictions

**Scoring Rule:**
- 1-3 points per correct team in the round (points vary by round; e.g., Semifinal = 2 pts/team, Final = 3 pts/team).
- Settlement when expected number of unique teams for that round are present in completed match results.
- Round is settlement-eligible only after the previous round has at least played.

| Scenario | Round | Prediction | Results | Expected Points | Notes |
|----------|-------|-----------|---------|---|---|
| All teams correct | Åttondelsfinal | Teams ABC…P (16) | All 16 teams advanced from fixtures | 16 × 1 = 16 | All teams in advance are predicted |
| Partial correct | Åttondelsfinal | Teams ABC…X (16) | Only 8 teams actually advanced | Points only for matched 8 | Unsettled teams don't score |
| Zero correct | Åttondelsfinal | Teams XXX…X (16) | None match advanced teams | 0 | All wrong predictions |
| Unsettled | Kvartsfinal | Prediction entered | Round-of-16 not yet played | 0 (eligible for rescore) | Settlement deferred until prior round complete |
| Semifinal | Semifinal | Predicted 4 teams | Only 2 teams available from QF | 2 × 2 = 4 | Points only for available teams in the round |

**Settlement logic:**
- Derive actual participants for a knockout round from `match_results` rows where `stage = knockout` and `round = <round_title>` and `result_status = completed`.
- Expected uniqueteams count per round: 32 (R32), 16 (R16), 8 (QF), 4 (SF), 2 (F).
- Scoring is membership-based: each team in the round that also appears in the participant's prediction gets the round's point value.

**Test implementation:**
- Create fixture chain: group matches → R32 matches with winners → R16 matches with winners.
- Seed knockout predictions for multiple rounds.
- Only mark some match results as completed.
- Call `GET /api/scores/:participantId` and verify:
  - Settled rounds show points; unsettled show 0.
  - `knockoutBreakdown[i]` shows matched team names and points-per-team.
  - Rerunning score computation (rescore) after more results complete updates points.

---

### 9.5 Test Matrix: Special Predictions (Slutsegrare, Skytteligavinnare)

**Scoring Rule:**
- 4 points if prediction correct.
- 0 points if prediction wrong.
- 0 points if special outcome not yet settled.

| Scenario | Prediction | Admin Outcome | Expected Points | Notes |
|---------|-----------|---|--|--|
| Correct winner | Argentina | Argentina | 4 | Hit |
| Wrong winner | Argentina | France | 0 | Miss |
| Correct topScorer | Kylian Mbappé | Kylian Mbappé | 4 | Hit |
| Wrong topScorer | Kylian Mbappé | Neymar | 0 | Miss |
| Unsettled | Argentina | (no special result row) | 0 | Corner case: tournament in progress, winner still uncertain |
| Empty prediction | '' | Argentina | 0 | Participant didn't enter |

**Settlement logic:**
- Admin enters special outcomes via `PUT /api/admin/special-results`.
- Special outcomes are standalone (not derived from match results).
- Scoring treats empty predictions (`''`) as 0 points, same as wrong predictions.

**Test implementation:**
- Seed special predictions (or empty).
- Seed special outcomes via admin API.
- Call `GET /api/scores/:participantId` and verify `specialPoints` and `specialBreakdown[0].points`.

---

### 9.6 Test Matrix: Extra Questions (Extrafrågor)

**Scoring Rule:**
- Award question's `points` value if selected answer matches `correct_answer`.
- 0 points if answers don't match.
- 0 points if question is unsettled (admin hasn't set `correct_answer` yet).

| Scenario | Question Points | Selected | Correct | Expected | Notes |
|----------|--------|----------|---------|---|---|
| Correct answer | 2 | "A" | "A" | 2 | Hit |
| Wrong answer | 2 | "A" | "B" | 0 | Miss |
| No answer saved | 2 | (null) | "A" | 0 | Participant skipped question |
| Unsettled question | 2 | "A" | (null) | 0 | Admin hasn't published answer yet |
| Published flag | 2 | "A" | "A" but status=draft | 0 | Corner: only published questions count |

**Settlement logic:**
- Only published questions (`status = published`) appear in `GET /api/questions/published` and are answerable by participants.
- Scoring only awards points when question is published AND `correct_answer` is not null.
- If admin later changes `correct_answer`, `GET /api/scores/:participantId` is recalculated.

**Test implementation:**
- Admin creates question with 2 options and score value.
- Admin publishes question.
- Participant saves answer.
- Admin sets `correct_answer`.
- Call `GET /api/scores/:participantId` and verify points awarded.
- Rescore after admin corrects answer to verify consistency.

---

### 9.7 Test Matrix: Edge Cases and Regressions

#### 9.7.1 Partial Match Results

**Scenario:**
- 72 group matches total; admin enters results for only 30 matches.
- Participant has predictions for all 72.

**Expected behavior:**
- Scoring computes points for 30 settled matches.
- 42 unsettled matches contribute 0 points and are marked in breakdown as unsettled (not 0-point misses).
- When admin settles more matches, `GET /api/scores/:participantId` recalculates and includes new points without double-counting.

**Test implementation:**
- Create all 72 fixtures.
- Seed participant fixture tips for all 72.
- Seed results for 30 matches (random selection).
- Verify `settledMatches = 30` and `fixturePoints` reflects 30 matches only.
- Add 15 more results and rescore; verify `settledMatches = 45` and points updated.

---

#### 9.7.2 Missing or Null Predictions

**Scenario:**
- Group A prediction has only 2 team picks out of 4 positions; participant left slots empty.
- Group A all matches are settled.

**Expected behavior:**
- Scoring counts only the 2 non-empty picks (not unknown).
- Unset positions don't cause errors or affect calculations of filled positions.
- Breakdown shows "2 av 4 rätt" structure and 2 points awarded.

**Test implementation:**
- Create group placement prediction with only non-null values.
- Verify scoring handles sparse arrays safely.

---

#### 9.7.3 Admin Result Correction (Rescore)

**Scenario:**
- Match initially scored: Argentina 1 - 0 Mexico; participant predicted 1-0 (2 points awarded).
- Admin corrects result to Argentina 2 - 0 Mexico; correction time recorded.

**Expected behavior:**
- Rescore from current state: participant's 1-0 prediction still matches first result, scores only 1 point (wrong score but right sign).
- Audit trail: `updated_at` on match result reflects correction time.
- No double-counting: historical score record is not updated; only forward rescore is valid.

**Test implementation:**
- Seed initial result.
- Score and verify points.
- Update result via admin API.
- Call `GET /api/scores/:participantId` and verify new points.
- Ensure old points are not re-added.

---

#### 9.7.4 Legacy Fixture Fallback Matching

**Scenario:**
- Old saved tips don't have `fixtureId` (only display text like "Argentina - France").
- New scoring engine has `match_results` with explicit `match_id` UUIDs.

**Expected behavior:**
- Fallback matching: if `fixtureId` is null, attempt to match by display text or (stage, group/round, kickoff time).
- If fallback matches a unique result row, score using that result.
- If fallback is ambiguous or fails, score 0 (safe default; no incorrect points awarded).

**Regression note:** This is a known fragility; normalized schema (section 8) is the long-term fix.

**Test implementation:**
- Create old-style tip row without `fixtureId`.
- Verify scoring falls back to text matching.
- Verify ambiguous fallbacks don't cause crashes (score defensively).

---

### 9.8 Test Automation Maintenance

#### 9.8.1 When to Add Tests

Add a new test scenario when:
1. A new scoring rule or category is implemented (before merging to main).
2. A bug is discovered in scoring (add test, fix bug, verify test passes).
3. A regression is suspected in an existing path (add test to cover, rerun test suite).
4. A new edge case is identified in code review or user feedback.

**Minimum coverage:** Each scenario in section 9.2–9.7 must have at least one automated test.

#### 9.8.2 Test Organization (Backend)

Location: `/server/scores.api.test.js` (existing file, extend with new tests).

Structure:
```javascript
describe('Scoring: Fixture Tips', () => {
  describe('exact score', () => { test(...) })
  describe('correct sign only', () => { test(...) })
  // ...per scenario in 9.2
})

describe('Scoring: Group Placements', () => {
  // ...per scenario in 9.3
})

describe('Scoring: Knockout Predictions', () => {
  // ...per scenario in 9.4
})

describe('Scoring: Special Predictions', () => {
  // ...per scenario in 9.5
})

describe('Scoring: Extra Questions', () => {
  // ...per scenario in 9.6
})

describe('Scoring: Edge Cases', () => {
  // ...per scenario in 9.7
})
```

**Test execution:**
- `npm run test:api` runs tests using an isolated temp database.
- Tests spawn a fresh API process per test suite to ensure no cross-test pollution.
- Tests clean up temporary database and API process after completion.

#### 9.8.3 Benchmark: Test Run Time

Target: Full test suite completes in < 30 seconds.
- Current baseline (Phase 2): ~1.1 seconds for 4 MVP smoke tests.
- Phase 3 target: ~10 additional scoring tests, estimated ~25 seconds total.
- Timeout: 60 seconds per test case (catch runaway processes).

#### 9.8.4 Continuous Integration Plan

When implemented (future phase):
- Run test suite on every push to main.
- Require tests to pass before merge.
- Archive test artifacts (stdout, temp DB snapshots) for debugging failures.
- Alert on test failures within 5 minutes of merge.

---

## 10. Maintenance and Evolution Guidelines

### 10.1 When Changing Scoring Rules

Before implementing:
1. **Update specification** section 7.11 (scoring values) or 9.x (test matrix).
2. **Add test case** in `/server/scores.api.test.js` for new rule.
3. **Verify test fails** (new rule not yet implemented).

While implementing:
1. **Implement scoring logic** in scoring engine.
2. **Update backend endpoints** if API contract changes.
3. **Update frontend** if UI surfaces new score detail (e.g., new breakdown category).

After implementing:
1. **Verify test passes**.
2. **Rescore all participants** if rule change is retroactive (edge case; typically new scores apply forward).
3. **Commit together**: code + tests + spec update in one atomic change.

**Example:** If knockout semifinal points change from 1 to 2 (covered in section 7.11), update spec before coding, add test for "semifinal 2 points per team", implement change, verify test passes, commit all together.

---

### 10.2 When Adding a New Prediction Category

Before implementing:
1. **Add to specification** section 4 (prediction targets) and section 7.x (new phase scope).
2. **Add schema** to section 8 (normalized tables) if persistence needed.
3. **Add test matrix** to section 9.x (full coverage).
4. **Get approval** from user (clarify phase, validate acceptance criteria).

While implementing:
1. **Create backend persistence** if needed (new API endpoint, new table).
2. **Create frontend UI** (input, edit, review).
3. **Add scoring rules** to 7.x and test matrix to 9.x.
4. **Implement tests** covering all scenarios in test matrix.

**Lock in order:** Complete tests before merging; spec updates happen in same change.

---

### 10.3 Known Fragilities and Planned Fixes

#### Fragility: Legacy Fixture Text Matching (Current MVP)

**Root cause:** Fixture tips saved without UUID `fixtureId` only have display text (team names + match date).  
**Impact:** Scoring falls back to fuzzy text matching, which is fragile (team name spelling variations, date timezone mismatches).  
**Planned fix:** Section 8.2 (normalized schema) includes `fixtureId` column; new tips always populate it; backfill existing tips with UUIDs.  
**Timeline:** Before production; low urgency if test suite covers fallback.

#### Fragility: Admin Special Outcomes Manual Entry (Current MVP)

**Root cause:** Admin must manually enter `Slutsegrare` and `Skytteligavinnare` via admin UI (no external data sync).  
**Impact:** Data-entry errors possible (typo in team name or player name = wrong scoring).  
**Planned fix:** Add data validation layer (`admin/special-results` endpoint validates team/player name against official source); UI auto-complete from official list.  
**Timeline:** Before Phase C start (live tournament); medium priority.

#### Fragility: Unsettled Result Ambiguity (Current MVP)

**Root cause:** If a match result is corrected multiple times, scoring must be deterministic (not path-dependent).  
**Impact:** Potential for double-counting or missed points if rescore logic is not careful.  
**Mitigation:** Scoring engine is read-only and recomputes from current state (no incremental updates); rescore is idempotent by design.  
**Validation:** Test 9.7.3 (admin result correction) covers this; runs before each merge.

---

### 10.4 Spec-to-Code Traceability

Maintain bidirectional links:

**From code to spec:**
- Header comments in scoring implementation `points/rules.js`: reference section 7.11 line numbers.
- Test file comments: reference test matrix sections 9.2–9.7.

**From spec to code:**
- Section 7.11 scoring values: link to implementation file and line number.
- Section 9 test matrix: link to test file location.

**Example:**
```javascript
// scores.js line 45:
// Fixture-tip scoring (MVP): see spec section 7.11 and test matrix 9.2
// Points: 2 (exact), 1 (sign only), 0 (wrong/unsettled)

const scoreFixtureTip = (tip, result) => {
  if (!result || result.status !== 'completed') return 0 // unsettled
  // ... exact/sign logic
}
```

---

### 10.5 Evolution Phase Roadmap

**Phase 3 (current):** Implement scoring engine, leaderboard, participant results pages.
- Adds sections 7.6–7.14 (result foundation, scoring contracts, leaderboard scope).
- Adds test matrix 9.2–9.7 (all core scoring scenarios).
- Normalization (section 8) begins; dual-write capability added.

**Phase 4 (future):** Production launch; CI/CD pipeline; live data sync.
- Complete section 8 (normalized tables; JSON fallback fully deprecated).
- Expand section 9 (CI/CD integration; automated regression suite run on every push).
- Resolve fragilities (section 10.3): external data validation, team name autocomplete.

**Phase 5 (future):** Post-tournament archive and lessons learned.
- Freeze scoring rules in spec; version historical seasons.
- Add audit/forensic section to spec (how to diagnose scoring disagreements).
- Update maintenance guidelines (section 10) based on issues encountered.

---

## 11. Workflow

- Default workflow mode for this project: Fast (as agreed).
- Spec-first rule: update this file before or together with behavior changes.
- Process hygiene rule: when backend/API code or API validation rules are changed, restart running API dev processes before smoke tests.
- Canonical workflow skill source: `.github/skills/`.

## 12. Open Questions

- Decide production hosting model for backend and database.

## 13. Phase 2 Done Checklist

Checklist run date: 2026-03-25

### 13.1 Automated checks

| Item | Verification method | Expected result | Status | Evidence |
| --- | --- | --- | --- | --- |
| API health | `GET /api/health` | `200` and `{ "status": "ok" }` | PASS | Terminal smoke command executed successfully against local API (`curl -sS -i http://localhost:4174/api/health`, exit code `0`). |
| Admin route protection | `GET /api/admin/questions` without admin code | `401` unauthorized | PASS | Existing smoke verification in this session validated admin auth guard behavior before/after admin credentials were provided. |
| Admin sign-in | `POST /api/auth/admin-sign-in` with valid name+code | `200` with admin identity payload | PASS | Existing smoke run validated separate admin sign-in flow used by Admin UI gating and backend guard. |
| Admin question CRUD | `POST/GET/PUT/DELETE /api/admin/questions` with admin code | Create/read/update/delete complete with expected codes (`201/200/200/204`) | PASS | Session smoke commands created, updated, listed, and deleted admin questions; delete endpoint revalidated with `204` and follow-up list command (exit code `0`). |
| Published questions feed | `GET /api/questions/published` | `200` with published question list | PASS | Session smoke flow used published question retrieval as source for `Extrafrågor` answer persistence checks. |
| Tips persistence with `extraAnswers` | `PUT/GET/DELETE /api/tips/:participantId` with `extraAnswers` map | Save/read/delete succeed and readback contains saved question answer | PASS | Session smoke commands verified save/readback (`READBACK_EXTRA=ok`) and cleanup delete (`DEL_TIPS=204`, exit code `0`). |
| Build | `npm run build` | Build finishes without errors | PASS | Fresh clean run completed successfully (`vite build`, exit code `0`, `✓ built in 345ms`). |

### 13.2 Manual checks

| Item | Verification method | Expected result | Status | Evidence |
| --- | --- | --- | --- | --- |
| Participant end-to-end Extrafrågor flow | Browser flow: sign-in -> answer `Extrafrågor` -> save -> open `Mina tips` -> reload | Saved extra answer remains visible in `Mina tips` after reload | PASS | User-confirmed manual review result: `Extrafrågor flow: ok`. |
| Admin UI gating and CRUD visibility | Browser flow: open Admin page signed out, then sign in as admin and verify CRUD UI | Admin login form shown when signed out; CRUD table/form shown when signed in | PASS | User-confirmed manual review result: `Admin gating + CRUD näkyvyys: ok`. |
| Mobile layout sanity | Browser responsive pass on tips/admin pages | No blocking overlaps in key interaction areas | PASS | User-confirmed manual review result: `Mobile layout sanity: ok`. |

### 13.3 Result summary

- Automated coverage: 7 PASS, 0 BLOCKED.
- Manual coverage: 3 PASS, 0 BLOCKED.
- Phase 2 backend/API MVP flow is validated.
- Remaining closure actions: none for Phase 2 checklist closure in this pass.

