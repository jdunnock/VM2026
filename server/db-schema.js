import { run, db } from './db-core.js'

export async function initDatabase() {
  await run('PRAGMA foreign_keys = ON')
  await run('PRAGMA journal_mode = WAL')

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

  await run(`
    CREATE TABLE IF NOT EXISTS admin_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_text TEXT NOT NULL,
      category TEXT NOT NULL,
      options_json TEXT NOT NULL,
      correct_answer TEXT NOT NULL,
      points INTEGER NOT NULL,
      lock_time TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('draft', 'published')),
      allow_free_text INTEGER NOT NULL DEFAULT 0,
      accepted_answers_json TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Migrations for existing databases
  try { await run('ALTER TABLE admin_questions ADD COLUMN allow_free_text INTEGER NOT NULL DEFAULT 0'); console.log('Migration: allow_free_text column added') } catch (_) {}
  try { await run("ALTER TABLE admin_questions ADD COLUMN accepted_answers_json TEXT NOT NULL DEFAULT '[]'"); console.log('Migration: accepted_answers_json column added') } catch (_) {}

  await run(`
    CREATE TABLE IF NOT EXISTS match_results (
      match_id TEXT PRIMARY KEY,
      stage TEXT NOT NULL CHECK (stage IN ('group', 'knockout')),
      round TEXT,
      group_code TEXT,
      home_team TEXT NOT NULL,
      away_team TEXT NOT NULL,
      kickoff_at TEXT NOT NULL,
      home_score INTEGER,
      away_score INTEGER,
      result_status TEXT NOT NULL CHECK (result_status IN ('planned', 'live', 'completed')),
      settled_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await run(`
    CREATE TABLE IF NOT EXISTS participant_fixture_tips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      participant_id INTEGER NOT NULL,
      fixture_id TEXT NOT NULL,
      match_key TEXT,
      home_score INTEGER,
      away_score INTEGER,
      sign TEXT CHECK (sign IN ('1', 'X', '2', '')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      synced_from_json BOOLEAN DEFAULT 0,
      UNIQUE(participant_id, fixture_id),
      FOREIGN KEY (participant_id) REFERENCES participants (id)
    )
  `)

  await run(`
    CREATE TABLE IF NOT EXISTS participant_group_placements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      participant_id INTEGER NOT NULL,
      group_code TEXT NOT NULL,
      position INTEGER NOT NULL CHECK (position IN (1, 2, 3, 4)),
      team_name TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      synced_from_json BOOLEAN DEFAULT 0,
      UNIQUE(participant_id, group_code, position),
      FOREIGN KEY (participant_id) REFERENCES participants (id)
    )
  `)

  await run(`
    CREATE TABLE IF NOT EXISTS participant_knockout_predictions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      participant_id INTEGER NOT NULL,
      round_title TEXT NOT NULL,
      position INTEGER NOT NULL,
      team_name TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      synced_from_json BOOLEAN DEFAULT 0,
      UNIQUE(participant_id, round_title, position),
      FOREIGN KEY (participant_id) REFERENCES participants (id)
    )
  `)

  await run(`
    CREATE TABLE IF NOT EXISTS participant_extra_answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      participant_id INTEGER NOT NULL,
      question_id INTEGER NOT NULL,
      selected_answer TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      synced_from_json BOOLEAN DEFAULT 0,
      UNIQUE(participant_id, question_id),
      FOREIGN KEY (participant_id) REFERENCES participants (id),
      FOREIGN KEY (question_id) REFERENCES admin_questions (id)
    )
  `)

  await run(`CREATE INDEX IF NOT EXISTS idx_fixture_tips_participant ON participant_fixture_tips (participant_id, updated_at)`)
  await run(`CREATE INDEX IF NOT EXISTS idx_group_placements_participant_group ON participant_group_placements (participant_id, group_code)`)
  await run(`CREATE INDEX IF NOT EXISTS idx_knockout_predictions_participant_round ON participant_knockout_predictions (participant_id, round_title)`)
  await run(`CREATE INDEX IF NOT EXISTS idx_extra_answers_participant ON participant_extra_answers (participant_id)`)
  await run(`CREATE INDEX IF NOT EXISTS idx_extra_answers_question ON participant_extra_answers (question_id)`)
}

export function closeDatabase() {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) reject(err)
      else resolve()
    })
  })
}
