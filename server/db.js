import fs from 'node:fs'
import path from 'node:path'
import sqlite3 from 'sqlite3'

const dataDir = path.resolve(process.cwd(), 'data')
const dbPath = path.join(dataDir, 'vm2026.db')

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const db = new sqlite3.Database(dbPath)

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(err) {
      if (err) {
        reject(err)
        return
      }
      resolve(this)
    })
  })
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err)
        return
      }
      resolve(row)
    })
  })
}

export async function initDatabase() {
  await run(`
    CREATE TABLE IF NOT EXISTS participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      access_code_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await run(`
    CREATE TABLE IF NOT EXISTS participant_tips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      participant_id INTEGER NOT NULL UNIQUE,
      tips_json TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (participant_id) REFERENCES participants (id)
    )
  `)
}

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

export async function getTipsByParticipantId(participantId) {
  const row = await get('SELECT tips_json, updated_at FROM participant_tips WHERE participant_id = ?', [participantId])

  if (!row) {
    return null
  }

  return {
    tips: JSON.parse(row.tips_json),
    updatedAt: row.updated_at,
  }
}

export async function upsertTipsByParticipantId(participantId, tips) {
  const tipsJson = JSON.stringify(tips)

  await run(
    `
      INSERT INTO participant_tips (participant_id, tips_json, created_at, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(participant_id)
      DO UPDATE SET tips_json = excluded.tips_json, updated_at = CURRENT_TIMESTAMP
    `,
    [participantId, tipsJson],
  )

  return getTipsByParticipantId(participantId)
}

export async function deleteTipsByParticipantId(participantId) {
  await run('DELETE FROM participant_tips WHERE participant_id = ?', [participantId])
}
