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

### 4.4 Special predictions
- `Slutsegrare`
- `Skytteligavinnare`

### 4.5 Admin-managed question categories
- `Gruppspelsfrågor`
- `Slutspelsfrågor`
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

### 5.4 Special prediction lock
- `Slutsegrare` and `Skytteligavinnare` lock at the global deadline (`2026-06-09 22:00`).

### 5.5 Admin question lock
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
	- Placement area inside each group card must be visually distinct (highlight color, framed container, and clear heading) so users immediately notice where to set `Gruppplaceringar`.
	- Placement highlight color is strong warm yellow to draw immediate attention while scrolling through the group cards.
	- Placement heading inside each group card is sticky so the `Gruppplaceringar` block remains discoverable during scroll.
	- Desktop: grouped quick-pick score buttons + manual `+More` fallback.
	- Mobile: spinner-only score entry for cleaner thumb interaction.
	- On mobile spinner score changes, `1/X/2` is always auto-derived immediately from the current score pair.
	- Auto-derived `1/X/2` from selected score with manual override still available.
	- Gruppplaceringar uses guided group-specific team selectors instead of free text, so each position only offers teams from that group.
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
		- `positionLabel` (`Delad X` for shared ranks, otherwise numeric rank as string)
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
		- `Gruppplaceringar`
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
| Lämna tips | `tips` | **B** (Predictions) | Participant enters/edits fixture, group, knockout, special, extra predictions before deadline | A | Scoring rules reference (read-only) |
| Mina tips | `mine` | **B** (Predictions) only | Own prediction review and saved answers before deadline | — | Hidden in Phase C; score breakdown moved to Resultat & poäng |
| Resultat & poäng | `results` | **C** (Tracking) | Public match results, special outcomes, leaderboard by phase | A & D | Tournament rules link (read-only) |
| Admin | `admin` | **A** (Admin/Setup) | Question authoring, management, result entry, before-and-during phases | C | Lightweight result stats (read-only) |
| Regler | `rules` | **Reference** (all phases) | Static tournament rules and scoring model | — | Used by participants in B and C; reference for admin in A |

**Lifecycle Phase Coherence Status**

- **Phase A (Admin/Setup)**: Primary pages = `admin`, `rules`. Secondary visibility = `results` (read-only stats), `start` (rules link). ✅ Mostly isolated.
- **Phase B (Predictions)**: Primary pages = `tips`, `mine`. Secondary visibility = `rules` (scoring context). ✅ Isolated.
- **Phase C (Tracking)**: Primary pages = `start`, `results`. Secondary visibility = `admin` (result stats). ⚠️ **MIXED** — Start page and Results page both primary; Start also references Phase A/D info.
- **Phase D (Closure)**: No dedicated page (Final results shown in end-screen variant of `start` or `results`). Secondary visibility = `rules` (results archive).
- **Sign-in (`login`)**: Dual entry point (admin code → Phase A, participant code → Phase B). ✅ Appropriate.

**Current Mixed-Context Issues**

1. **Start page confusion**: Shows Phase C leaderboard + Phase A tournament info + Phase D playoff logic in same view.
   - Problem: User context unclear — admin? tracking participant? viewing finals?
   - Coherence risk: **HIGH** if user navigates between Start and Admin during early Phase A.
   - Action: Defer detailed UX restructure; flag for Phase 3 start when live data validates layout.

2. **Mina tips separation**: Now Phase B only (hidden in Phase C).
   - Solution: Remove "Mina tips" page from navigation when Phase C (isGlobalLockActive) is active. Redirect users from "Mina tips" to "Resultat & poäng" if phase change occurs during active session.
   - Score breakdown: Displayed only in "Resultat & poäng" (Phase C).
   - Coherence improvement: **RESOLVED** — clear phase separation between prediction entry (B, Mina tips) and result tracking (C, Resultat & poäng).

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
		- before global deadline (`Phase B` style): hide `ParticipantScorePanel` and show explanatory read-only note that scoring appears after tournament tracking starts.
		- after global deadline (`Phase C` style): show `ParticipantScorePanel` with existing score API data and local mock controls.
	- Connect the existing Start-page local phase preview control (`Auto`/`Fas B`/`Fas C`) to shared app-level preview state so the same forced phase applies in both `Start` and `Mina tips` during validation.
	- Keep existing saved tips sections (`Gruppspel`, `Gruppplaceringar`, `Slutspel`, `Special`, `Extrafrågor`) visible in both phases.
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
		4. **Avgjorda special** (`specialBreakdown` array): summary card per special (winner/topScorer) showing label, points, max points, and reason (e.g., "Korrekt specialtips").
		5. **Avgjorda extrafrågor** (`extraBreakdown` array): summary card per settled question showing question text, points, answer strings (predicted vs actual), and reason (e.g., "Rätt svar", "Fel svar").
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
		- `Mina tips` page: show `ParticipantScorePanel` in Phase C (after global deadline) with mock preview toggle for Jarmo; hide in Phase B with explanatory note.
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

## 8. Workflow

- Default workflow mode for this project: Fast (as agreed).
- Spec-first rule: update this file before or together with behavior changes.
- Process hygiene rule: when backend/API code or API validation rules are changed, restart running API dev processes before smoke tests.
- Canonical workflow skill source: `.github/skills/`.

## 9. Open Questions

- Decide production hosting model for backend and database.

## 10. Phase 2 Done Checklist

Checklist run date: 2026-03-25

### 10.1 Automated checks

| Item | Verification method | Expected result | Status | Evidence |
| --- | --- | --- | --- | --- |
| API health | `GET /api/health` | `200` and `{ "status": "ok" }` | PASS | Terminal smoke command executed successfully against local API (`curl -sS -i http://localhost:4174/api/health`, exit code `0`). |
| Admin route protection | `GET /api/admin/questions` without admin code | `401` unauthorized | PASS | Existing smoke verification in this session validated admin auth guard behavior before/after admin credentials were provided. |
| Admin sign-in | `POST /api/auth/admin-sign-in` with valid name+code | `200` with admin identity payload | PASS | Existing smoke run validated separate admin sign-in flow used by Admin UI gating and backend guard. |
| Admin question CRUD | `POST/GET/PUT/DELETE /api/admin/questions` with admin code | Create/read/update/delete complete with expected codes (`201/200/200/204`) | PASS | Session smoke commands created, updated, listed, and deleted admin questions; delete endpoint revalidated with `204` and follow-up list command (exit code `0`). |
| Published questions feed | `GET /api/questions/published` | `200` with published question list | PASS | Session smoke flow used published question retrieval as source for `Extrafrågor` answer persistence checks. |
| Tips persistence with `extraAnswers` | `PUT/GET/DELETE /api/tips/:participantId` with `extraAnswers` map | Save/read/delete succeed and readback contains saved question answer | PASS | Session smoke commands verified save/readback (`READBACK_EXTRA=ok`) and cleanup delete (`DEL_TIPS=204`, exit code `0`). |
| Build | `npm run build` | Build finishes without errors | PASS | Fresh clean run completed successfully (`vite build`, exit code `0`, `✓ built in 345ms`). |

### 10.2 Manual checks

| Item | Verification method | Expected result | Status | Evidence |
| --- | --- | --- | --- | --- |
| Participant end-to-end Extrafrågor flow | Browser flow: sign-in -> answer `Extrafrågor` -> save -> open `Mina tips` -> reload | Saved extra answer remains visible in `Mina tips` after reload | PASS | User-confirmed manual review result: `Extrafrågor flow: ok`. |
| Admin UI gating and CRUD visibility | Browser flow: open Admin page signed out, then sign in as admin and verify CRUD UI | Admin login form shown when signed out; CRUD table/form shown when signed in | PASS | User-confirmed manual review result: `Admin gating + CRUD näkyvyys: ok`. |
| Mobile layout sanity | Browser responsive pass on tips/admin pages | No blocking overlaps in key interaction areas | PASS | User-confirmed manual review result: `Mobile layout sanity: ok`. |

### 10.3 Result summary

- Automated coverage: 7 PASS, 0 BLOCKED.
- Manual coverage: 3 PASS, 0 BLOCKED.
- Phase 2 backend/API MVP flow is validated.
- Remaining closure actions: none for Phase 2 checklist closure in this pass.

## 11. Changelog

- 2026-03-24
	- Added phase-1 content definition for prediction targets and lock rules.
	- Added tournament data baseline with FIFA reference sources.
	- Added admin-managed question model and Swedish terminology baseline.
	- Added static frontend prototype scope for the phase-1 information architecture.
	- Normalized visible Swedish terminology to `Sextondelsfinal`, `Åttondelsfinal`, and question labels with diacritics.
	- Clarified that the prototype should stay visually close to the Figma layout pack structure.
	- Updated selected navigation/section button background to gray in the static prototype.
	- Updated hero section CTA buttons to gray tones for consistent button styling.
	- Added mobile readiness pass: all major data tables now transform into stacked card layouts on small screens, and tips actions keep sticky bottom accessibility for phone testing.
- 2026-03-25
	- Aligned `Gruppplaceringar` options with canonical group fixture teams by deriving placement candidates from the same grouped fixture source used by the match cards.
	- Trialed stronger `Placeringar` emphasis: upgraded to a more assertive warm yellow palette and sticky section header inside each group card for better scroll discoverability.
	- Changed `Placeringar` emphasis color to warm yellow and strengthened section framing so group placements are clearly visible in each group card.
	- Fixed mobile score spinner behavior so selecting score values always auto-updates `1/X/2` immediately from the active score pair.
	- Strengthened group-card `Placeringar` visibility in `Lämna tips` with explicit visual emphasis (highlighted framed block + clearer heading) to prevent it from being overlooked during scrolling.
	- Reworked `Lämna tips` group-stage UX to a single group-based page section: each group card now includes both match tips and group placements, with responsive 3/2/1 column layout.
	- Unified lock policy for participant tips: one common deadline (`2026-06-09 22:00`) for all categories and published extra questions; removed participant-facing per-match and per-question lock behavior.
	- Synced all group-stage kickoff timestamps (72 matches) in the canonical fixture module to FIFA official 2026 schedule and switched visible group-stage country names to Swedish where explicit country names are known (placeholder slash labels remain unchanged).
	- Sorted exported fixture collections chronologically by kickoff time so match lists render in time order.
	- Corrected group-stage fixture team composition to match FIFA 2026 official group teams in the canonical fixture source.
	- Clarified fixture baseline behavior: official FIFA group composition is used, while kickoff timestamps remain planned placeholders where final production timing sync is not yet implemented (currently knockout stage).
	- Added Phase 3 Step 1 scoring contract to specification (inputs, per-match scoring rule, settlement timing), with explicit plan to continue Steps 2 and 3 on 2026-03-26.
	- Added Phase 3 backend result foundation: `match_results` table and result API endpoints (`/api/results`, `/api/admin/results`) keyed by `matchId`, without scoring or leaderboard side-effects.
	- Added fixture source-of-truth prework scope for Phase 3 start: 134 total modeled fixtures (72 group + 62 knockout) with placeholder pairings/times where needed.
	- Corrected group-stage match count target to 72 and documented canonical fixture-module strategy.
	- Updated Phase 2 checklist manual validation statuses to PASS based on user-confirmed browser review (`Extrafrågor`, admin gating/CRUD visibility, mobile layout sanity).
	- Added `Phase 2 Done Checklist` section with explicit PASS/BLOCKED status and evidence links to this session's smoke validation.
	- Added workflow rule: restart active API dev process after backend/API changes before running smoke tests.
	- Added Phase 2 MVP backend scope for admin question CRUD and `Extrafrågor` tips payload extension.
	- Implemented Phase 2 MVP frontend wiring: dynamic `Extrafrågor` in Lämna tips + Mina tips, and API-backed Admin question CRUD UI.
	- Added lightweight admin endpoint protection (`x-admin-code` / bearer token) and Admin UI support for sending admin code on CRUD calls.
	- Added separate admin sign-in (name + code) before Admin CRUD UI is visible.
	- Updated admin question behavior: `Rätt svar` is no longer mandatory before the real answer is known.
	- Added Sign-in / access code page: users enter Namn and Åtkomstkod before accessing main tips interface. Error messaging for incorrect codes included.
	- Chosen backend stack for MVP: Node.js (Express) + SQLite.
	- Added backend MVP scope for participant persistence and `POST /api/auth/sign-in` sign-in/create flow.
	- Added session persistence for signed-in participant via localStorage.
	- Added participantId-based tips CRUD backend scope and frontend integration for loading/saving tips.
	- Added tips input UX trial scope with Variant A/B model for desktop+mobile comparison.
	- Refined tips Variant B UX: grouped quick-pick score buttons into 6 home-win + 6 draw/away options with manual fallback, and added mobile spinner controls for tap-first score adjustment.
	- Refined mobile Variant B score input to wheel-style vertical number spinners (scroll up/down) for faster thumb interaction.
	- Simplified mobile Variant B further: removed score quick-picks on mobile so score entry is spinner-only for cleaner thumb flow.
	- Updated tips behavior on both desktop and mobile: 1/X/2 is now auto-derived from selected score (for example 1-2 => 2), while manual override remains possible.
	- Locked the tips input UX model as default and removed temporary A/B trial instrumentation.
	- Extended tips persistence end-to-end to include Gruppplaceringar and Special predictions, and updated Mina tips to show these from saved data.
	- Replaced Gruppplaceringar free-text entry with group-specific team selectors that work better on mobile and prevent duplicate country picks inside the same group.
	- Fixed Gruppplaceringar selector behavior so teams can be cleared and swapped between positions without breaking the one-team-per-group rule.
	- Extended tips persistence to include Slutspel predictions and updated both Lämna tips and Mina tips to edit/show saved knockout picks.
	- Added Slutspel type-ahead suggestions with round-aware team filtering so users can type to narrow choices instead of scrolling long lists.
	- Fixed mobile overlap issue where the floating action bar could cover active tips input fields. Initial fix used max-width: 720px breakpoint; extended to also apply @media (hover: none) and (pointer: coarse) to cover landscape iPhones and tablets whose CSS viewport width exceeds 720px.
	- Fixed touch-device Slutspel input overlap where native datalist suggestion popups could cover the next text field; desktop keeps datalist type-ahead and touch devices now show inline suggestion chips directly under the active field.
	- Expanded Gruppplaceringar source-of-truth data from sample Groups A-C to full Groups A-L (48 team slots) with placeholder entries where qualifiers are still pending.
	- Expanded Slutspel prediction templates to all five rounds with full participant slot counts (32/16/8/4/2) for each knockout round.
	- Fixed desktop Slutspel layout so knockout round cards no longer stretch to the height of the largest card in the same grid row.
	- Updated tips page section flow so all Slutspel rounds (including Semifinal and Final) stay in the same knockout panel, while `Special och dynamiska frågor` is rendered in a separate panel below.
	- Updated Lämna tips UX to tab-driven section cards so only the selected section is shown at a time, and split `Special` + `Extrafrågor` into separate panels matching their buttons.
	- Updated Lämna tips tab copy for `Grupplaceringar` and added clearer heading-to-content spacing in compact section panels.
	- Simplified start page UI: removed the separate green hero block, reduced repeated `VM2026 Tipset` branding on page-level headings, and removed redundant start-page CTA buttons.
	- Simplified mobile topbar layout with horizontally scrollable navigation and compact utility cards so the header uses less vertical space on small screens.
	- Tightened mobile main navigation pill spacing and padding so the horizontally scrollable tab row reads lighter on small screens.
- 2026-03-26
	- Updated phase navigation coherence: `Resultat & poäng` is hidden from participant main navigation during Phase B (before global deadline) and shown in Phase C tracking mode.
	- Added participant logout control in topbar utility panel (`Logga ut`) to explicitly end participant session from the main app UI; logout clears local participant and admin session state and returns to sign-in.
	- Fixed participant login-to-empty-screen regression: moved the `Mina tips` Phase C redirect `useEffect` to run before conditional login return so React hook order stays stable between signed-out and signed-in renders.
	- Added lifecycle-based roadmap and strict phase-separation model (`Administrointi/alustus` -> `Osallistujien veikkausvaihe` -> `Turnauksen aikainen seuranta` -> `Lopetus`) to reduce mixed-context UX and prevent feature creep.
	- Implemented first phase-coherence UI cleanup on Start page: prediction-prep blocks are now shown before deadline, while post-deadline Start switches to tournament-tracking-only leaderboard and rank context.
	- Added Start page local-only phase preview controls for `Jarmo` (`Auto`, `Phase B`, `Phase C`) so phase-dependent UI can be validated without real-time deadline transitions.
	- Fixed Start page phase preview control usability by replacing button toggle with explicit phase selector (`Auto`/`Fas B`/`Fas C`) and visible active-phase indicator.
	- Implemented `Mina tips` phase-scoped score visibility: before deadline the score panel is hidden with explanatory copy, after deadline the existing participant score breakdown is shown.
	- Connected Start phase preview selector to `Mina tips` so forced `Fas B`/`Fas C` mode now affects both pages during local validation.
	- Added visible lifecycle preview badge row in `Mina tips` so active phase and preview source (`Auto` or forced mode) can be validated without returning to Start page.
	- Added `Regler` phase-specific guidance callouts for `Fas B` and `Fas C`, tied to the same shared local lifecycle preview mode used by Start and Mina tips.
	- Added `Resultat & poäng` context clarification copy to explain intentional shared score source with `Mina tips` while preserving different page purpose.
	- Added explicit Admin role-clarity banner in `Resultat och special` tab: Admin edits outcomes there, participants view same outcomes read-only in `Resultat & poäng`.
	- Removed visible Admin login entry from participant topbar utilities and kept admin entry via hidden shortcut (`Alt+Shift+A`) to reduce participant confusion.
	- Fixed hidden admin shortcut detection to work across keyboard layouts by matching physical key code (`KeyA`) in addition to character key.
	- Created current-state page-to-lifecycle mapping (section 7.16) showing all 7 pages across 4 phases with identified mixed-context issues (Start page, Mina tips, Rules page) and coherence action priorities.
	- Expanded local-only `Resultat & poäng` mock preview (Jarmo profile) to include participant score detail/rank summary in addition to in-progress match and special result states, without affecting backend data.
	- Added participant-facing `Resultat & poäng` scope: public match/special outcomes plus signed-in participant score breakdowns using existing score/result APIs.
	- Extended the Admin frontend with a dedicated `Resultat och special` workspace for maintaining official match outcomes and special scoring results via the already existing admin APIs.
	- Updated `Mina tips` score breakdown accordions to keep backend order for all settled rows and show misses (`0 p`) alongside hits instead of hiding them.
	- Added a safe local-only mock score preview mode for participant profile `Jarmo` in `Mina tips`, explicitly isolated from backend score logic and persistence.
	- Refined `Mina tips` score breakdown UI into compact card rows with dedicated points badges and color-coded reason badges for faster scanning.
	- Updated `Mina tips` score breakdown copy so score reasons are shown as user-friendly Swedish labels instead of backend reason codes.
	- Completed `Mina tips` participant score integration by wiring `GET /api/scores/:participantId` into the page and showing category totals plus score-contributing breakdown sections.
	- Started Phase 3 Step 2 implementation scope by splitting it into `Step 2A` (stable fixture identity) and `Step 2B` (backend scoring engine plus score read API).
	- Added backward-compatible `fixtureId` support to persisted fixture tips so newly saved tips can be joined to `match_results.match_id` without relying primarily on display-text matching.
	- Added Phase 3 Step 3 leaderboard scope: read-only ranking via `GET /api/scores`, shared ranks for equal `totalPoints`, and Start-page leaderboard integration without introducing a tie-break policy.
	- Finalized and implemented the current scoring model across all prediction categories: group placements, knockout rounds, special predictions, and participant-facing score breakdowns in `Mina tips`.
	- Added interim deterministic group-standings resolution from completed group match results until official standings ingest exists.
	- Added admin-managed special outcomes persistence for `Slutsegrare` and `Skytteligavinnare` scoring.
	- Documented redundant data flows and identified component variant requirements (section 7.17): `ParticipantScorePanel`, `ScoreSummaryCard`, `LeaderboardPanel`, `TipsInputPanel`, `MatchResultCard`, `RulesPage`, and `AdminResultsWorkspace` all need phase-aware conditional rendering. No implementation changes; documentation-only planning for Phase 3 coherence cleanup.
	- Defined recompute-on-read score API scope for this phase: `GET /api/scores` and `GET /api/scores/:participantId`, without leaderboard ranking or score persistence.
	- Added automated scoring API integration tests (`node --test`) with isolated API process and temporary DB to verify exact/sign/wrong/missing/unsettled scoring paths plus legacy fallback matching.
	- Extended recompute-on-read scoring to include published `Extrafrågor` answers and exposed additional score fields: `fixturePoints`, `extraQuestionPoints`, `settledQuestions`, and participant `extraBreakdown`.