# Railway-tietokannan resetointi ja snapshotin palautus

## Yleisohje: Jos Railwayn tuotantopalvelin ei löydä tietokantaa (SQLITE_CANTOPEN) tai haluat palauttaa snapshotin

1. **Varmista, että Railway-palvelin on käynnissä ja oikeassa osoitteessa**
   - Esim. https://vm2026-production.up.railway.app
   - Tarkista, että etusivu aukeaa selaimessa.

2. **Poista mahdollinen virheellinen tietokantatiedosto/kansio Railwayn Volumes-osiosta**
   - Mene Railwayn hallintaan → Volumes (tai Storage)
   - Jos /app/data/vm2026.db on kansio, poista se (tai koko /app/data -kansion sisältö)
   - Jos et voi poistaa UI:sta, käytä Railwayn Shelliä: `rm -rf /app/data/vm2026.db`
   - Käynnistä palvelu uudelleen (restart)

3. **Lataa uusi tietokanta snapshot paikalliselta koneelta**
   - Aja paikallisesti:
     ```
     VM2026_PROD_URL=https://vm2026-production.up.railway.app/api/admin/db-upload npm run deploy:snapshot
     ```
   - Varmista, että ADMIN_ACCESS_CODE on sama sekä paikallisesti että Railwayn ympäristömuuttujissa.
   - Jos saat "✅ Upload successful", tietokanta on nyt palvelimella.

4. **Käynnistä Railway-palvelu uudelleen**
   - Tämä varmistaa, että uusi tietokanta latautuu käyttöön.

5. **Testaa käyttöliittymä**
   - Kirjautuminen ja kaikki API-pyynnöt pitäisi toimia ilman 500-virheitä.

## Yleisimmät virheet ja ratkaisut
- **EISDIR: illegal operation on a directory**: /app/data/vm2026.db on kansio, poista se.
- **SQLITE_CANTOPEN**: Tietokantaa ei löydy, lataa snapshot yllä olevilla ohjeilla.
- **404 Application not found**: Tarkista, että käytät oikeaa osoitetta ja että admin-API on käytössä.
- **500 DB upload failed**: Varmista, että Railway-palvelin on käynnissä ja polku on oikein.

---

# Retro-muistiinpano: Railway DB resetointi ja snapshot workflow

- Railwayn persistent volume voi joskus jäädä väärään tilaan (esim. vm2026.db kansioksi).
- Jos näin käy, snapshotin upload epäonnistuu (EISDIR-virhe) ja palvelin ei löydä tietokantaa (SQLITE_CANTOPEN).
- Oikea workflow:
  1. Poista virheellinen tiedosto/kansio Volumesista (tai shellillä)
  2. Restart
  3. Lataa snapshot admin-API:lla
  4. Restart
- Tämän jälkeen palvelu toimii ja tietokanta on palautettu.
- Ohjeet tallennettu tiedostoon docs/railway-db-reset-ohjeet.md