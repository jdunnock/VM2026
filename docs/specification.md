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
- Correct answer
- Point value
- Category
- Status (draft or published)

## 5. Lock Rules

### 5.1 Group stage match lock
- Each match prediction locks at kickoff time for that match.

### 5.2 Group ranking lock
- All group ranking predictions lock before the first match of the entire tournament.

### 5.3 Knockout lock
- Predictions for each knockout round lock before the first match of that round.

### 5.4 Special prediction lock
- Initial default (can be revised later):
	- `Slutsegrare` locks before tournament kickoff.
	- `Skytteligavinnare` locks before tournament kickoff.

### 5.5 Admin question lock
- Default policy for now:
	- Each published question has an explicit lock timestamp set by admin.

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

- Backend: TBD (Node.js or Python)
- Frontend: TBD
- Storage: TBD
- External integrations:
	- FIFA standings and fixtures as reference truth for tournament structure and result resolution

## 8. Workflow

- Default workflow mode for this project: Fast (as agreed).
- Spec-first rule: update this file before or together with behavior changes.
- Canonical workflow skill source: `.github/skills/`.

## 9. Open Questions

- Final Poangsattning values per prediction category.
- Decide final tech stack (Node.js vs Python) before backend scaffolding.

## 10. Changelog

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