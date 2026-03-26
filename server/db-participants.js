import { run, get } from './db-core.js'

export async function findParticipantByName(name) {
  return get('SELECT id, name, access_code_hash FROM participants WHERE name = ?', [name])
}

export async function findParticipantById(id) {
  return get('SELECT id, name FROM participants WHERE id = ?', [id])
}

export async function createParticipant(name, accessCodeHash) {
  const result = await run(
    'INSERT INTO participants (name, access_code_hash, created_at, last_seen_at) VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
    [name, accessCodeHash],
  )

  return {
    id: result.lastID,
    name,
  }
}

export async function touchParticipant(id) {
  await run('UPDATE participants SET last_seen_at = CURRENT_TIMESTAMP WHERE id = ?', [id])
}
