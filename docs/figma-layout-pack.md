# VM2026 - Figma Layout Pack (Phase 1)

Purpose: This document defines a Figma-ready layout package for the VM2026 prediction site.

Scope for this pack:
- 5+ page flow
- Wireframe-level structure
- Component list
- Ready-to-use Swedish copy
- Focus on prediction submission content (not live tracking logic)

Visual direction:
- Sports-oriented, clear, and bold
- Strong accent colors
- Data tables and readable forms are primary

## 1. Design Tokens (starting point)

Color suggestions:
- Primary: `#0B3D2E` (deep green)
- Accent: `#F4C542` (gold)
- Surface: `#F7F9FB` (light gray)
- Text primary: `#111827`
- Text secondary: `#4B5563`
- Danger/lock warning: `#B91C1C`

Typography suggestions:
- Heading: `Barlow Condensed` (sports headline feel)
- Body/UI: `Source Sans 3`

Spacing system:
- 4, 8, 12, 16, 24, 32, 48

Grid:
- Desktop: 12 columns, 1200 px content width
- Tablet: 8 columns
- Mobile: 4 columns

## 2. Information Architecture (5+ pages)

Pages:
1. Start (overview)
2. Lämna tips (prediction form)
3. Mina tips (submitted picks)
4. Regler och låsning (rules and lock timings)
5. Adminfrågor (admin concept page)
6. Sign-in / access code (optional but recommended)

Global navigation labels (Swedish):
- Start
- Lämna tips
- Mina tips
- Regler
- Admin

Global utility:
- Tournament countdown
- Last saved timestamp
- User status badge

## 3. Page Specs

## 3.1 Start

Goal:
- Give quick overview of what can be predicted and current completion status.

Wireframe blocks (top to bottom):
1. Hero block
- Title: `VM2026 Tipset`
- Subtitle: `Lägg dina tips för VM 2026 och följ turneringen hela vägen till finalen.`
- CTA primary: `Lämna tips`
- CTA secondary: `Se regler`

2. Tournament summary cards
- `48 lag`
- `Grupp A-L`
- `Sextondelsfinal till final`

3. Prediction categories overview
- Gruppspelsmatcher
- Grupplaceringar
- Slutspel
- Slutsegrare
- Skytteligavinnare
- Extrafrågor

4. Personal progress module
- `Du har fyllt i: 0%`
- Segment progress bars by category

5. Recent updates strip
- Placeholder area for admin messages/news

Copy snippets:
- `Allt måste vara inlämnat innan respektive låsningstid.`
- `Tips som är låsta kan inte ändras.`

## 3.2 Lämna tips

Goal:
- Main data-entry page for all prediction targets.

Wireframe blocks:
1. Sticky page header
- Title: `Lämna dina tips`
- Save status: `Sparad för 2 minuter sedan`
- Button: `Spara`

2. Tabs/sections
- `Gruppspel`
- `Grupplaceringar`
- `Slutspel`
- `Special`
- `Extrafrågor`

3. Gruppspel section (table)
Columns:
- Match
- Datum/tid
- Resultat (home-away)
- 1/X/2
- Låsstatus

Row state examples:
- Open: `Öppet`
- Locked: `Last`

4. Grupplaceringar section
- One card per group (A-L)
- Drag-and-drop or 1-4 dropdown ranking
- Header example: `Grupp A - slutlig ordning`

5. Slutspel section
- Bracket-like structured list by round
- Round headings:
  - `Sextondelsfinal`
  - `Åttondelsfinal`
  - `Kvartsfinal`
  - `Semifinal`
  - `Final`

6. Special section
- Field: `Slutsegrare`
- Field: `Skytteligavinnare`

7. Extrafrågor section
- Dynamic question cards
- Option list/radio buttons
- Lock time per question shown

Primary actions:
- `Spara utkast`
- `Skicka in tips`

Confirmation modal copy:
- Title: `Bekräfta inlämning`
- Body: `Kontrollera dina val. Låsta tips kan inte ändras efter låsningstid.`
- Buttons: `Avbryt`, `Bekräfta`

## 3.3 Mina tips

Goal:
- Show submitted picks and lock status in read-only view.

Wireframe blocks:
1. Header summary
- `Dina inskickade tips`
- `Senast uppdaterad: 2026-06-10 18:45`

2. Category accordions
- Gruppspel
- Grupplaceringar
- Slutspel
- Special
- Extrafrågor

3. Lock badges
- `Last`
- `Ändringsbar`

4. Diff/changes area (optional)
- `Senaste ändringar innan låsning`

Copy snippets:
- `Här ser du exakt vad du har skickat in.`
- `Tips med status Låst kan inte redigeras.`

## 3.4 Regler och låsning

Goal:
- Explain what is predicted and exactly when each category locks.

Wireframe blocks:
1. Rules overview
- Short intro text

2. Lock rules table
Columns:
- Kategori
- Vad du tippar
- När det låser

Rows:
- Gruppspelsmatcher | Exakt resultat + 1/X/2 | Vid matchstart
- Grupplaceringar | Slutlig ordning 1-4 i Grupp A-L | Före turneringens första match
- Slutspel | Matchval per slutspelsrunda | Före första matchen i respektive runda
- Slutsegrare | Vinnande lag | Före turneringsstart
- Skytteligavinnare | Spelare med flest mål | Före turneringsstart
- Extrafrågor | Frågespecifik svarstyp | Enligt admin-satt låstid

3. FAQ block
- `Vad händer om ett lag ännu inte är fastställt?`
- `Kan jag ändra tips efter att jag skickat in?`

FAQ answer baseline:
- `FIFA har nu fastställt samtliga 48 VM-lag, så gruppspelet visas utan kval-platshållare.`

## 3.5 Adminfrågor (concept)

Goal:
- Define what admin needs to configure dynamic question sets.

Wireframe blocks:
1. Question list table
Columns:
- Fråga
- Kategori
- Poäng
- Låstid
- Status

2. Create/edit form
Fields:
- `Frågetext`
- `Kategori` (Gruppspelsfrågor, Slutspelsfrågor, 33-33-33 frågor)
- `Svarsalternativ` (multiple)
- `Rätt svar`
- `Poäng`
- `Låstid`
- `Status` (Utkast/Publicerad)

3. Admin actions
- `Spara utkast`
- `Publicera`
- `Avpublicera`

## 3.6 Sign-in / access code (optional)

Goal:
- Keep usage restricted to friend group.

Wireframe blocks:
1. Access form
- `Namn`
- `Åtkomstkod`
- Button: `Gå vidare`

2. Error message
- `Fel kod. Försök igen.`

## 4. Shared Components

Core components to design in Figma:
- Top navigation bar
- Tournament summary card
- Category status card
- Section tab bar
- Match prediction table row
- Group ranking card
- Bracket round block
- Question card
- Lock status badge
- Save/submit button group
- Confirmation modal
- Toast notifications

Status badges:
- `Öppet`
- `Låst`
- `Utkast`
- `Publicerad`

## 5. Responsive Behavior

Desktop:
- Full table and multi-column card layouts.

Tablet:
- Condense tables, preserve all columns with horizontal scroll where needed.

Mobile:
- Convert wide tables into stacked cards.
- Keep save button sticky at bottom.

## 6. Figma Handoff Checklist

Before sending to design refinement:
1. Create one Figma page per wireframe page above.
2. Add component variants for lock states.
3. Add text styles for heading/body/caption.
4. Add color styles for primary/accent/warning states.
5. Keep all labels in Swedish.
6. Treat group-stage teams as finalised; do not show multi-team qualifier placeholders.

## 7. Notes

- This layout pack intentionally excludes final points values.
- This layout pack intentionally excludes live-tracking visuals for now.
- Next phase will add tournament-time tracking and scoring behavior.
