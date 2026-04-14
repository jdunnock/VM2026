// scripts/clear-all-participants.js
// Poistaa kaikki käyttäjät ja heidän tietonsa tietokannasta (myös manuaaliset)

import { openDatabaseConnection } from '../server/db-core.js';
import { run } from '../server/db-core.js';
import { closeDatabase } from '../server/db-schema.js';

async function clearAllParticipants() {
  await openDatabaseConnection();

  // Poista kaikki osallistujien tiedot
  await run('DELETE FROM participant_fixture_tips');
  await run('DELETE FROM participant_group_placements');
  await run('DELETE FROM participant_knockout_predictions');
  await run('DELETE FROM participant_extra_answers');
  await run('DELETE FROM participant_special_predictions').catch(() => {});
  await run('DELETE FROM participants');

  console.log('Kaikki osallistujat ja heidän tietonsa poistettu.');

  await closeDatabase();
}

clearAllParticipants().catch((err) => {
  console.error('Virhe osallistujien poistossa:', err);
  process.exit(1);
});
