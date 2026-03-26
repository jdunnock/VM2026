import fs from 'node:fs'
import path from 'node:path'
import sqlite3 from 'sqlite3'

const dataDir = path.resolve(process.cwd(), 'data')
const dbPath = path.join(dataDir, 'vm2026.db')

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

export const db = new sqlite3.Database(dbPath)

export const GROUP_MATCH_COUNT = 6
export const GROUP_TEAM_COUNT = 4

export const KNOCKOUT_ROUND_POINTS = {
  Sextondelsfinal: 1,
  'Åttondelsfinal': 1,
  Kvartsfinal: 2,
  Semifinal: 2,
  Final: 3,
}

export const KNOCKOUT_ROUND_TEAM_COUNTS = {
  Sextondelsfinal: 32,
  'Åttondelsfinal': 16,
  Kvartsfinal: 8,
  Semifinal: 4,
  Final: 2,
}

export function run(sql, params = []) {
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

export async function runTransaction(work) {
  await run('BEGIN')
  try {
    const result = await work()
    await run('COMMIT')
    return result
  } catch (err) {
    try { await run('ROLLBACK') } catch (_) {}
    throw err
  }
}

export function get(sql, params = []) {
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

export function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err)
        return
      }
      resolve(rows)
    })
  })
}
