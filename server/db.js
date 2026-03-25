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
}

export async function findParticipantByName(name) {
  return get('SELECT id, name, access_code_hash FROM participants WHERE name = ?', [name])
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
