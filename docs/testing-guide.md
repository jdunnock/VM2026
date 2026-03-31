# Testaus — Lifecycle-snapshottien käyttöohje

## Yleiskatsaus

`server/seed-simulation.js` sisältää 8 snapshot-komentoa (`S-B1` → `S-C6`), jotka rakentavat turnauksen tilan vaihe vaiheelta. Jokaisessa vaiheessa voit tarkistaa sivuston käyttöliittymän ja pistetilanteen selaimessa.

## Edellytykset

- Dev-serveri käynnissä: `npm run dev -- --host 0.0.0.0 --port 4173`
- Backend käynnissä: `node server/index.js` (tai VS Code task "Run VM2026 dev server")

## Snapshot-komennot

Ajettava järjestyksessä — jokainen vaihe rakentuu edellisen päälle.

```
node server/seed-simulation.js S-B1     # Tyhjä tila (reset)
node server/seed-simulation.js S-B2     # 15 osallistujaa + vinkit + 7 kysymystä
node server/seed-simulation.js S-C1     # 4 ensimmäistä ottelua ratkaistuna
node server/seed-simulation.js S-C2     # +28 ottelua (yhteensä 32)
node server/seed-simulation.js S-C3     # Kaikki 72 lohko-ottelua + Sextondelsfinal-joukkueet
node server/seed-simulation.js S-C4     # R32 + R16 + kvartaalit pelattu
node server/seed-simulation.js S-C5     # Semifinaali pelattu
node server/seed-simulation.js S-C6     # Finaali pelattu (turnaus valmis)
```

## Tyypillinen testaussessio

### 1. Aloita puhtaalta pöydältä

```bash
node server/seed-simulation.js S-B1
```

Avaa selain → Admin-sivu näyttää tyhjältä. Ei osallistujia, ei tuloksia.

### 2. Lisää osallistujat ja ennusteet

```bash
node server/seed-simulation.js S-B2
```

Tämä luo:
- 15 osallistujaa (salasana: `1234`) kolmella tasoluokalla:
  - **Expert** (Anders, Björn, Cecilia) — ~65 % oikeita merkkejä
  - **Average** (David–Julia) — ~45 %
  - **Casual** (Karl–Oscar) — ~30 %
- Jokainen osallistuja saa otteluennusteet, lohkosijoitukset, pudotuspelivalinnat
- 7 Extrafrågor-kysymystä (2 asetettua, 5 avoimena)

Tarkista selaimessa:
- Kirjaudu sisään nimellä "Anders", koodi `1234`
- **Mina tips** -sivu näyttää ennusteet
- Admin-sivu näyttää 15 osallistujaa

### 3. Vaihda Phase C:hen

Klikkaa Admin-sivulla **B → C** toggle-nappia. Matchdag- ja Slutspel-taulukot tulevat näkyviin.

### 4. Ratkaise otteluja vaihe kerrallaan

```bash
node server/seed-simulation.js S-C1
```

**Mitä tarkistaa selaimessa:**
- Resultat & poäng -sivu näyttää tuloslistasijoitukset
- Vain ottelupistelaskenta (exact 2p, sign 1p)
- Ei vielä lohko- tai pudotuspelipistelaskentaa

```bash
node server/seed-simulation.js S-C2
```

**Mitä tarkistaa:**
- Lisää otteluja näkyy ratkaistuna
- Expert-tason osallistujat johtavat
- Matchdag-taulukko Admin-sivulla näyttää tuoreimmat tulokset

### 5. Lohkovaihe valmis + ensimmäinen pudotuspeli

```bash
node server/seed-simulation.js S-C3
```

**Mitä tarkistaa:**
- 72 ottelua ratkaistuna
- Lohkosijoituspisteet näkyvät (groupPlacementPoints > 0)
- Slutspel-taulukossa 32 joukkuetta Sextondelsfinalissa
- 1 pudotuspelikierros näkyy pisteissä

### 6. Pudotuspelit etenevät

```bash
node server/seed-simulation.js S-C4   # R32, R16, kvartaalit
node server/seed-simulation.js S-C5   # Semifinaali
node server/seed-simulation.js S-C6   # Finaali
```

**Mitä tarkistaa jokaisessa:**
- Pudotuspelipisteet kasvavat (knockoutPoints)
- Tuloslistassa oikea järjestys — saman pistemäärän = sama sijoitus
- Final-vaiheen jälkeen yhteensä 103 ottelua, 5 pudotuspelikierrosta

### 7. Tarkista lopulliset sijoitukset

S-C6:n jälkeen odotettu pistejakauma:

| Sija | Nimi | Taso | Pisteet (noin) |
|------|------|------|----------------|
| 1 | Anders | Expert | ~157 |
| 2 | Cecilia | Expert | ~150 |
| 3 | Björn | Expert | ~141 |
| 4 | Fanny | Average | ~112 |
| 5 | Julia | Average | ~103 |
| … | … | … | … |
| 15 | Magnus | Casual | ~65 |

Expert-taso dominoi, casual jää viimeiseksi.

### 8. Palauta alkutilaan

```bash
node server/seed-simulation.js reset
```

Poistaa kaikki simulaatio-osallistujat, tulokset ja knockout-etenemät.

## Automatisoidut testit

Snapshot-pistelogiikkaa testataan myös automaattisesti:

```bash
npm run test:lifecycle    # 5 lifecycle-testiä (S-C1 → S-C6)
npm run test:api          # 8 API-pistelaskutestiä
```

Lifecycle-testit ajavat snapshot-komennot väliaikaista tietokantaa vasten ja tarkistavat pistelogiikan invarianssit (oikeaoppisuus, tier-erottelu, kokonaissummat).

## Huomautuksia

- Snapshot-komennot **eivät** vaihda Phase B/C -tilaa — tee se manuaalisesti Admin-sivulta
- Komennot on ajettava **järjestyksessä** (S-B1 → S-B2 → S-C1 → … → S-C6)
- Osallistujien salasana on aina `1234`
- Vanhat legacy-komennot (`setup`, `C0`–`C7`) toimivat edelleen mutta snapshot-komennot ovat suositeltavia QA-testaukseen
