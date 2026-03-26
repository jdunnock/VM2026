import fs from 'node:fs'
import path from 'node:path'
import sqlite3 from 'sqlite3'

const dataDir = path.resolve(process.cwd(), 'data')
const dbPath = path.join(dataDir, 'vm2026.db')

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const db = new sqlite3.Database(dbPath)

const GROUP_MATCH_COUNT = 6
const GROUP_TEAM_COUNT = 4

const KNOCKOUT_ROUND_POINTS = {
  Sextondelsfinal: 1,
  'Åttondelsfinal': 1,
  Kvartsfinal: 2,
  Semifinal: 2,
  Final: 3,
}

const KNOCKOUT_ROUND_TEAM_COUNTS = {
  Sextondelsfinal: 32,
  'Åttondelsfinal': 16,
  Kvartsfinal: 8,
  Semifinal: 4,
  Final: 2,
}

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
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)

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
    CREATE TABLE IF NOT EXISTS special_results (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      winner TEXT NOT NULL DEFAULT '',
      top_scorer TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Normalized tables for breakdown reporting and scoring isolation
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
    CREATE TABLE IF NOT EXISTS participant_special_predictions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      participant_id INTEGER NOT NULL UNIQUE,
      winner_team TEXT,
      top_scorer_name TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      synced_from_json BOOLEAN DEFAULT 0,
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

  // Create indexes for normalized tables
  await run(`CREATE INDEX IF NOT EXISTS idx_fixture_tips_participant ON participant_fixture_tips (participant_id, updated_at)`)
  await run(`CREATE INDEX IF NOT EXISTS idx_group_placements_participant_group ON participant_group_placements (participant_id, group_code)`)
  await run(`CREATE INDEX IF NOT EXISTS idx_knockout_predictions_participant_round ON participant_knockout_predictions (participant_id, round_title)`)
  await run(`CREATE INDEX IF NOT EXISTS idx_extra_answers_participant ON participant_extra_answers (participant_id)`)
  await run(`CREATE INDEX IF NOT EXISTS idx_extra_answers_question ON participant_extra_answers (question_id)`)
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

// Normalized table write helpers (dual-write support)
async function syncFixtureTipsToNormalized(participantId, fixtureTips) {
  // Delete old normalized fixture tips for this participant
  await run('DELETE FROM participant_fixture_tips WHERE participant_id = ?', [participantId])

  // Insert new normalized fixture tips
  if (!Array.isArray(fixtureTips)) {
    return
  }

  for (const tip of fixtureTips) {
    const fixtureId = tip.fixtureId || `${tip.group}:${tip.match}:${tip.date}`
    const sign = tip.sign || ''
    const homeScore = tip.homeScore === '' ? null : tip.homeScore
    const awayScore = tip.awayScore === '' ? null : tip.awayScore

    await run(
      `
        INSERT OR REPLACE INTO participant_fixture_tips 
        (participant_id, fixture_id, match_key, home_score, away_score, sign, created_at, updated_at, synced_from_json)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1)
      `,
      [participantId, fixtureId, `${tip.group}:${tip.match}`, homeScore, awayScore, sign],
    )
  }
}

async function syncGroupPlacementsToNormalized(participantId, groupPlacements) {
  // Delete old normalized group placements for this participant
  await run('DELETE FROM participant_group_placements WHERE participant_id = ?', [participantId])

  // Insert new normalized group placements
  if (!Array.isArray(groupPlacements)) {
    return
  }

  for (const group of groupPlacements) {
    const groupCode = group.group.replace('Grupp ', '').trim()
    const picks = Array.isArray(group.picks) ? group.picks : []

    for (let position = 1; position <= 4; position++) {
      const teamName = picks[position - 1] || null

      await run(
        `
          INSERT OR REPLACE INTO participant_group_placements
          (participant_id, group_code, position, team_name, created_at, updated_at, synced_from_json)
          VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1)
        `,
        [participantId, groupCode, position, teamName],
      )
    }
  }
}

async function syncKnockoutPredictionsToNormalized(participantId, knockoutPredictions) {
  // Delete old normalized knockout predictions for this participant
  await run('DELETE FROM participant_knockout_predictions WHERE participant_id = ?', [participantId])

  // Insert new normalized knockout predictions
  if (!Array.isArray(knockoutPredictions)) {
    return
  }

  for (const round of knockoutPredictions) {
    const roundTitle = round.title || ''
    const picks = Array.isArray(round.picks) ? round.picks : []

    for (let position = 0; position < picks.length; position++) {
      const teamName = picks[position] || null

      await run(
        `
          INSERT OR REPLACE INTO participant_knockout_predictions
          (participant_id, round_title, position, team_name, created_at, updated_at, synced_from_json)
          VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1)
        `,
        [participantId, roundTitle, position, teamName],
      )
    }
  }
}

async function syncSpecialPredictionsToNormalized(participantId, specialPredictions) {
  // Delete old normalized special predictions for this participant
  await run('DELETE FROM participant_special_predictions WHERE participant_id = ?', [participantId])

  // Insert new normalized special predictions
  if (!specialPredictions || typeof specialPredictions !== 'object') {
    return
  }

  const winnerTeam = specialPredictions.winner || null
  const topScorerName = specialPredictions.topScorer || null

  await run(
    `
      INSERT OR REPLACE INTO participant_special_predictions
      (participant_id, winner_team, top_scorer_name, created_at, updated_at, synced_from_json)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1)
    `,
    [participantId, winnerTeam, topScorerName],
  )
}

async function syncExtraAnswersToNormalized(participantId, extraAnswers) {
  // Delete old normalized extra answers for this participant
  await run('DELETE FROM participant_extra_answers WHERE participant_id = ?', [participantId])

  // Insert new normalized extra answers
  if (!extraAnswers || typeof extraAnswers !== 'object') {
    return
  }

  for (const [questionIdStr, selectedAnswer] of Object.entries(extraAnswers)) {
    const questionId = Number(questionIdStr)
    if (!Number.isInteger(questionId) || questionId <= 0) {
      continue
    }

    if (typeof selectedAnswer !== 'string') {
      continue
    }

    await run(
      `
        INSERT OR REPLACE INTO participant_extra_answers
        (participant_id, question_id, selected_answer, created_at, updated_at, synced_from_json)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1)
      `,
      [participantId, questionId, selectedAnswer],
    )
  }
}

export async function upsertTipsByParticipantId(participantId, tips) {
  const tipsJson = JSON.stringify(tips)

  // Write to JSON column (primary API contract)
  await run(
    `
      INSERT INTO participant_tips (participant_id, tips_json, created_at, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(participant_id)
      DO UPDATE SET tips_json = excluded.tips_json, updated_at = CURRENT_TIMESTAMP
    `,
    [participantId, tipsJson],
  )

  // Dual-write: sync to normalized tables
  if (tips.fixtureTips) await syncFixtureTipsToNormalized(participantId, tips.fixtureTips)
  if (tips.groupPlacements) await syncGroupPlacementsToNormalized(participantId, tips.groupPlacements)
  if (tips.knockoutPredictions) await syncKnockoutPredictionsToNormalized(participantId, tips.knockoutPredictions)
  if (tips.specialPredictions) await syncSpecialPredictionsToNormalized(participantId, tips.specialPredictions)
  if (tips.extraAnswers) await syncExtraAnswersToNormalized(participantId, tips.extraAnswers)

  return getTipsByParticipantId(participantId)
}

export async function deleteTipsByParticipantId(participantId) {
  await run('DELETE FROM participant_tips WHERE participant_id = ?', [participantId])
  
  // Also delete from normalized tables
  await run('DELETE FROM participant_fixture_tips WHERE participant_id = ?', [participantId])
  await run('DELETE FROM participant_group_placements WHERE participant_id = ?', [participantId])
  await run('DELETE FROM participant_knockout_predictions WHERE participant_id = ?', [participantId])
  await run('DELETE FROM participant_special_predictions WHERE participant_id = ?', [participantId])
  await run('DELETE FROM participant_extra_answers WHERE participant_id = ?', [participantId])
}

export async function getSpecialResults() {
  const row = await get(
    `
      SELECT winner, top_scorer, updated_at
      FROM special_results
      WHERE id = 1
    `,
  )

  if (!row) {
    return {
      winner: '',
      topScorer: '',
      updatedAt: null,
    }
  }

  return {
    winner: row.winner,
    topScorer: row.top_scorer,
    updatedAt: row.updated_at,
  }
}

export async function upsertSpecialResults(payload) {
  await run(
    `
      INSERT INTO special_results (id, winner, top_scorer, updated_at)
      VALUES (1, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id)
      DO UPDATE SET winner = excluded.winner, top_scorer = excluded.top_scorer, updated_at = CURRENT_TIMESTAMP
    `,
    [payload.winner, payload.topScorer],
  )

  return getSpecialResults()
}

export async function listParticipantScores() {
  const participants = await listParticipantsWithTips()
  const lookups = await buildCompletedResultLookups()
  const questionLookups = await buildPublishedQuestionLookups()
  const groupStandingsLookups = await buildGroupStandingsLookups()
  const knockoutRoundLookups = await buildKnockoutRoundLookups()
  const specialResults = await getSpecialResults()

  const summaries = participants.map((participant) => {
    const score = calculateParticipantScore(
      participant,
      lookups,
      questionLookups,
      groupStandingsLookups,
      knockoutRoundLookups,
      specialResults,
    )
    return {
      participantId: score.participantId,
      name: score.name,
      totalPoints: score.totalPoints,
      settledMatches: score.settledMatches,
      settledQuestions: score.settledQuestions,
      fixturePoints: score.fixturePoints,
      groupPlacementPoints: score.groupPlacementPoints,
      knockoutPoints: score.knockoutPoints,
      specialPoints: score.specialPoints,
      extraQuestionPoints: score.extraQuestionPoints,
      updatedAt: participant.updatedAt,
    }
  })

  return rankParticipantScoreSummaries(summaries)
}

export async function getParticipantScoreByParticipantId(participantId) {
  const participant = await getParticipantWithTipsById(participantId)
  if (!participant) {
    return null
  }

  const lookups = await buildCompletedResultLookups()
  const questionLookups = await buildPublishedQuestionLookups()
  const groupStandingsLookups = await buildGroupStandingsLookups()
  const knockoutRoundLookups = await buildKnockoutRoundLookups()
  const specialResults = await getSpecialResults()
  const score = calculateParticipantScore(
    participant,
    lookups,
    questionLookups,
    groupStandingsLookups,
    knockoutRoundLookups,
    specialResults,
  )
  const rankedScores = await listParticipantScores()
  const leaderboardEntry = rankedScores.find((entry) => entry.participantId === participantId)

  return {
    ...score,
    rank: leaderboardEntry?.rank ?? null,
    positionLabel: leaderboardEntry?.positionLabel ?? null,
  }
}

export async function listAdminQuestions() {
  const rows = await all(
    `
      SELECT
        id,
        question_text,
        category,
        options_json,
        correct_answer,
        points,
        lock_time,
        status,
        created_at,
        updated_at
      FROM admin_questions
      ORDER BY id DESC
    `,
  )

  return rows.map((row) => ({
    id: row.id,
    questionText: row.question_text,
    category: row.category,
    options: JSON.parse(row.options_json),
    correctAnswer: row.correct_answer,
    points: row.points,
    lockTime: row.lock_time,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }))
}

export async function listPublishedAdminQuestions() {
  const rows = await all(
    `
      SELECT
        id,
        question_text,
        category,
        options_json,
        points,
        lock_time,
        status
      FROM admin_questions
      WHERE status = 'published'
      ORDER BY lock_time ASC, id ASC
    `,
  )

  return rows.map((row) => ({
    id: row.id,
    questionText: row.question_text,
    category: row.category,
    options: JSON.parse(row.options_json),
    points: row.points,
    lockTime: row.lock_time,
    status: row.status,
  }))
}

export async function createAdminQuestion(question) {
  const result = await run(
    `
      INSERT INTO admin_questions (
        question_text,
        category,
        options_json,
        correct_answer,
        points,
        lock_time,
        status,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `,
    [
      question.questionText,
      question.category,
      JSON.stringify(question.options),
      question.correctAnswer,
      question.points,
      question.lockTime,
      question.status,
    ],
  )

  return getAdminQuestionById(result.lastID)
}

export async function getAdminQuestionById(id) {
  const row = await get(
    `
      SELECT
        id,
        question_text,
        category,
        options_json,
        correct_answer,
        points,
        lock_time,
        status,
        created_at,
        updated_at
      FROM admin_questions
      WHERE id = ?
    `,
    [id],
  )

  if (!row) {
    return null
  }

  return {
    id: row.id,
    questionText: row.question_text,
    category: row.category,
    options: JSON.parse(row.options_json),
    correctAnswer: row.correct_answer,
    points: row.points,
    lockTime: row.lock_time,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function updateAdminQuestion(id, question) {
  await run(
    `
      UPDATE admin_questions
      SET
        question_text = ?,
        category = ?,
        options_json = ?,
        correct_answer = ?,
        points = ?,
        lock_time = ?,
        status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    [
      question.questionText,
      question.category,
      JSON.stringify(question.options),
      question.correctAnswer,
      question.points,
      question.lockTime,
      question.status,
      id,
    ],
  )

  return getAdminQuestionById(id)
}

export async function deleteAdminQuestion(id) {
  await run('DELETE FROM admin_questions WHERE id = ?', [id])
}

export async function listMatchResults() {
  const rows = await all(
    `
      SELECT
        match_id,
        stage,
        round,
        group_code,
        home_team,
        away_team,
        kickoff_at,
        home_score,
        away_score,
        result_status,
        settled_at,
        created_at,
        updated_at
      FROM match_results
      ORDER BY kickoff_at ASC, match_id ASC
    `,
  )

  return rows.map(mapMatchResultRow)
}

export async function getMatchResultById(matchId) {
  const row = await get(
    `
      SELECT
        match_id,
        stage,
        round,
        group_code,
        home_team,
        away_team,
        kickoff_at,
        home_score,
        away_score,
        result_status,
        settled_at,
        created_at,
        updated_at
      FROM match_results
      WHERE match_id = ?
    `,
    [matchId],
  )

  if (!row) {
    return null
  }

  return mapMatchResultRow(row)
}

export async function upsertMatchResult(matchResult) {
  await run(
    `
      INSERT INTO match_results (
        match_id,
        stage,
        round,
        group_code,
        home_team,
        away_team,
        kickoff_at,
        home_score,
        away_score,
        result_status,
        settled_at,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(match_id)
      DO UPDATE SET
        stage = excluded.stage,
        round = excluded.round,
        group_code = excluded.group_code,
        home_team = excluded.home_team,
        away_team = excluded.away_team,
        kickoff_at = excluded.kickoff_at,
        home_score = excluded.home_score,
        away_score = excluded.away_score,
        result_status = excluded.result_status,
        settled_at = excluded.settled_at,
        updated_at = CURRENT_TIMESTAMP
    `,
    [
      matchResult.matchId,
      matchResult.stage,
      matchResult.round,
      matchResult.groupCode,
      matchResult.homeTeam,
      matchResult.awayTeam,
      matchResult.kickoffAt,
      matchResult.homeScore,
      matchResult.awayScore,
      matchResult.resultStatus,
      matchResult.settledAt,
    ],
  )

  return getMatchResultById(matchResult.matchId)
}

async function listParticipantsWithTips() {
  const rows = await all(
    `
      SELECT
        p.id,
        p.name,
        pt.tips_json,
        pt.updated_at
      FROM participants p
      LEFT JOIN participant_tips pt ON pt.participant_id = p.id
      ORDER BY p.name COLLATE NOCASE ASC, p.id ASC
    `,
  )

  return rows.map((row) => ({
    participantId: row.id,
    name: row.name,
    tips: row.tips_json ? JSON.parse(row.tips_json) : null,
    updatedAt: row.updated_at ?? null,
  }))
}

async function getParticipantWithTipsById(participantId) {
  const row = await get(
    `
      SELECT
        p.id,
        p.name,
        pt.tips_json,
        pt.updated_at
      FROM participants p
      LEFT JOIN participant_tips pt ON pt.participant_id = p.id
      WHERE p.id = ?
    `,
    [participantId],
  )

  if (!row) {
    return null
  }

  return {
    participantId: row.id,
    name: row.name,
    tips: row.tips_json ? JSON.parse(row.tips_json) : null,
    updatedAt: row.updated_at ?? null,
  }
}

async function buildCompletedResultLookups() {
  const rows = await all(
    `
      SELECT
        match_id,
        stage,
        round,
        group_code,
        home_team,
        away_team,
        kickoff_at,
        home_score,
        away_score,
        result_status,
        settled_at,
        created_at,
        updated_at
      FROM match_results
      WHERE result_status = 'completed'
        AND home_score IS NOT NULL
        AND away_score IS NOT NULL
      ORDER BY kickoff_at ASC, match_id ASC
    `,
  )

  const results = rows.map(mapMatchResultRow)
  const byId = new Map()
  const byGroupMatchDate = new Map()
  const byGroupMatch = new Map()

  for (const result of results) {
    byId.set(result.matchId, result)

    const groupMatchDateKey = buildGroupMatchDateKey(result.groupCode, `${result.homeTeam} - ${result.awayTeam}`, result.kickoffAt)
    byGroupMatchDate.set(groupMatchDateKey, result)

    const groupMatchKey = buildGroupMatchKey(result.groupCode, `${result.homeTeam} - ${result.awayTeam}`)
    if (!byGroupMatch.has(groupMatchKey)) {
      byGroupMatch.set(groupMatchKey, result)
    }
  }

  return {
    byId,
    byGroupMatchDate,
    byGroupMatch,
  }
}

async function buildPublishedQuestionLookups() {
  const rows = await all(
    `
      SELECT
        id,
        question_text,
        category,
        correct_answer,
        points,
        status
      FROM admin_questions
      WHERE status = 'published'
      ORDER BY id ASC
    `,
  )

  const byId = new Map()
  for (const row of rows) {
    byId.set(row.id, {
      id: row.id,
      questionText: row.question_text,
      category: row.category,
      correctAnswer: row.correct_answer,
      points: row.points,
      status: row.status,
    })
  }

  return {
    byId,
  }
}

async function buildGroupStandingsLookups() {
  const rows = await all(
    `
      SELECT
        group_code,
        home_team,
        away_team,
        home_score,
        away_score
      FROM match_results
      WHERE stage = 'group'
        AND result_status = 'completed'
        AND home_score IS NOT NULL
        AND away_score IS NOT NULL
      ORDER BY group_code ASC, kickoff_at ASC, match_id ASC
    `,
  )

  const rowsByGroup = new Map()
  for (const row of rows) {
    const groupCode = normalizeGroupCode(row.group_code)
    if (!rowsByGroup.has(groupCode)) {
      rowsByGroup.set(groupCode, [])
    }

    rowsByGroup.get(groupCode).push(row)
  }

  const byGroup = new Map()
  for (const [groupCode, groupRows] of rowsByGroup.entries()) {
    byGroup.set(groupCode, deriveSettledGroupStanding(groupRows))
  }

  return {
    byGroup,
  }
}

async function buildKnockoutRoundLookups() {
  const rows = await all(
    `
      SELECT round, home_team, away_team
      FROM match_results
      WHERE stage = 'knockout'
        AND result_status = 'completed'
        AND home_score IS NOT NULL
        AND away_score IS NOT NULL
      ORDER BY kickoff_at ASC, match_id ASC
    `,
  )

  const teamsByRound = new Map()
  for (const row of rows) {
    const round = normalizeText(row.round)
    if (!round) {
      continue
    }

    if (!teamsByRound.has(round)) {
      teamsByRound.set(round, new Map())
    }

    const roundTeams = teamsByRound.get(round)
    for (const team of [row.home_team, row.away_team]) {
      const normalizedKey = normalizeComparableText(team)
      if (!normalizedKey) {
        continue
      }

      if (!roundTeams.has(normalizedKey)) {
        roundTeams.set(normalizedKey, normalizeText(team))
      }
    }
  }

  const byRound = new Map()
  for (const [round, teamsMap] of teamsByRound.entries()) {
    const actualTeams = [...teamsMap.values()].sort((left, right) => left.localeCompare(right, 'sv', { sensitivity: 'base' }))
    const expectedTeamCount = KNOCKOUT_ROUND_TEAM_COUNTS[round] ?? 0

    byRound.set(round, {
      settled: expectedTeamCount > 0 && actualTeams.length === expectedTeamCount,
      actualTeams,
      actualTeamKeys: new Set(actualTeams.map((team) => normalizeComparableText(team))),
      expectedTeamCount,
    })
  }

  return {
    byRound,
  }
}

function calculateParticipantScore(participant, lookups, questionLookups, groupStandingsLookups, knockoutRoundLookups, specialResults) {
  const rawFixtureTips = Array.isArray(participant.tips?.fixtureTips) ? participant.tips.fixtureTips : []
  const rawGroupPlacements = Array.isArray(participant.tips?.groupPlacements) ? participant.tips.groupPlacements : []
  const rawKnockoutPredictions = Array.isArray(participant.tips?.knockoutPredictions) ? participant.tips.knockoutPredictions : []
  const rawSpecialPredictions = participant.tips?.specialPredictions && typeof participant.tips.specialPredictions === 'object'
    ? participant.tips.specialPredictions
    : { winner: '', topScorer: '' }
  const rawExtraAnswers =
    participant.tips?.extraAnswers && typeof participant.tips.extraAnswers === 'object' && !Array.isArray(participant.tips.extraAnswers)
      ? participant.tips.extraAnswers
      : {}

  let totalPoints = 0
  let fixturePoints = 0
  let groupPlacementPoints = 0
  let knockoutPoints = 0
  let specialPoints = 0
  let extraQuestionPoints = 0
  let settledMatches = 0
  let settledGroups = 0
  let settledKnockoutRounds = 0
  let settledSpecialPredictions = 0
  let settledQuestions = 0

  const breakdown = rawFixtureTips.map((tip) => {
    const result = resolveResultForTip(tip, lookups)
    const scored = scoreFixtureTip(tip, result)

    if (result) {
      settledMatches += 1
    }

    totalPoints += scored.points
    fixturePoints += scored.points

    return {
      fixtureId: typeof tip.fixtureId === 'string' ? tip.fixtureId : null,
      matchId: result?.matchId ?? (typeof tip.fixtureId === 'string' ? tip.fixtureId : null),
      group: typeof tip.group === 'string' ? tip.group : null,
      match: typeof tip.match === 'string' ? tip.match : '',
      date: typeof tip.date === 'string' ? tip.date : '',
      points: scored.points,
      reason: scored.reason,
      predictedSign: scored.predictedSign,
      actualSign: scored.actualSign,
      result: result
        ? {
          homeScore: result.homeScore,
          awayScore: result.awayScore,
        }
        : null,
    }
  })

  const groupPlacementBreakdown = rawGroupPlacements.map((groupPlacement) => {
    const groupCode = extractGroupCode(groupPlacement?.group)
    const lookup = groupStandingsLookups.byGroup.get(groupCode)
    const predictedPicks = Array.isArray(groupPlacement?.picks)
      ? groupPlacement.picks.map((pick) => normalizeText(pick))
      : []

    if (!lookup?.settled) {
      return {
        group: typeof groupPlacement?.group === 'string' ? groupPlacement.group : `Grupp ${groupCode}`,
        predictedPicks,
        actualPicks: lookup?.actualPicks ?? null,
        matchedPositions: [],
        points: 0,
        reason: 'unsettled-group',
      }
    }

    settledGroups += 1
    const matchedPositions = []
    for (let index = 0; index < lookup.actualPicks.length; index += 1) {
      if (normalizeComparableText(predictedPicks[index]) === normalizeComparableText(lookup.actualPicks[index])) {
        matchedPositions.push(index + 1)
      }
    }

    const points = matchedPositions.length
    totalPoints += points
    groupPlacementPoints += points

    return {
      group: typeof groupPlacement?.group === 'string' ? groupPlacement.group : `Grupp ${groupCode}`,
      predictedPicks,
      actualPicks: lookup.actualPicks,
      matchedPositions,
      points,
      reason: matchedPositions.length > 0 ? 'settled-group' : 'wrong-group-order',
    }
  })

  const knockoutBreakdown = rawKnockoutPredictions.map((roundPrediction) => {
    const round = normalizeText(roundPrediction?.title)
    const lookup = knockoutRoundLookups.byRound.get(round)
    const predictedTeams = uniqueNormalizedTexts(Array.isArray(roundPrediction?.picks) ? roundPrediction.picks : [])
    const roundPoints = KNOCKOUT_ROUND_POINTS[round] ?? 0

    if (!lookup?.settled || roundPoints === 0) {
      return {
        round,
        predictedTeams,
        actualTeams: lookup?.actualTeams ?? null,
        matchedTeams: [],
        points: 0,
        pointsPerTeam: roundPoints,
        reason: 'unsettled-round',
      }
    }

    settledKnockoutRounds += 1
    const matchedTeams = predictedTeams.filter((team) => lookup.actualTeamKeys.has(normalizeComparableText(team)))
    const points = matchedTeams.length * roundPoints
    totalPoints += points
    knockoutPoints += points

    return {
      round,
      predictedTeams,
      actualTeams: lookup.actualTeams,
      matchedTeams,
      points,
      pointsPerTeam: roundPoints,
      reason: matchedTeams.length > 0 ? 'settled-round' : 'wrong-round-teams',
    }
  })

  const specialBreakdown = [
    scoreSpecialPrediction('winner', 'Slutsegrare', rawSpecialPredictions.winner, specialResults.winner, 4),
    scoreSpecialPrediction('topScorer', 'Skytteligavinnare', rawSpecialPredictions.topScorer, specialResults.topScorer, 4),
  ].map((entry) => {
    if (entry.settled) {
      settledSpecialPredictions += 1
    }

    totalPoints += entry.points
    specialPoints += entry.points
    return entry
  })

  const extraBreakdown = Object.entries(rawExtraAnswers).map(([questionIdRaw, selectedAnswer]) => {
    const questionId = Number(questionIdRaw)
    const normalizedAnswer = typeof selectedAnswer === 'string' ? selectedAnswer.trim() : ''
    const question = Number.isInteger(questionId) ? questionLookups.byId.get(questionId) : undefined
    const scored = scoreExtraAnswer(normalizedAnswer, question)

    if (scored.settled) {
      settledQuestions += 1
    }

    totalPoints += scored.points
    extraQuestionPoints += scored.points

    return {
      questionId: Number.isInteger(questionId) ? questionId : null,
      questionText: question?.questionText ?? null,
      category: question?.category ?? null,
      selectedAnswer: normalizedAnswer,
      correctAnswer: question?.correctAnswer?.trim() ? question.correctAnswer.trim() : null,
      points: scored.points,
      reason: scored.reason,
      settled: scored.settled,
    }
  })

  return {
    participantId: participant.participantId,
    name: participant.name,
    totalPoints,
    fixturePoints,
    groupPlacementPoints,
    knockoutPoints,
    specialPoints,
    extraQuestionPoints,
    settledMatches,
    settledGroups,
    settledKnockoutRounds,
    settledSpecialPredictions,
    settledQuestions,
    breakdown,
    groupPlacementBreakdown,
    knockoutBreakdown,
    specialBreakdown,
    extraBreakdown,
    updatedAt: participant.updatedAt,
  }
}

function rankParticipantScoreSummaries(summaries) {
  const sorted = [...summaries].sort((left, right) => {
    if (right.totalPoints !== left.totalPoints) {
      return right.totalPoints - left.totalPoints
    }

    const nameComparison = left.name.localeCompare(right.name, 'sv', { sensitivity: 'base' })
    if (nameComparison !== 0) {
      return nameComparison
    }

    return left.participantId - right.participantId
  })

  const totalsByPoints = new Map()
  for (const entry of sorted) {
    totalsByPoints.set(entry.totalPoints, (totalsByPoints.get(entry.totalPoints) ?? 0) + 1)
  }

  let previousPoints = null
  let currentRank = 0

  return sorted.map((entry, index) => {
    if (entry.totalPoints !== previousPoints) {
      currentRank = index + 1
      previousPoints = entry.totalPoints
    }

    const isSharedRank = (totalsByPoints.get(entry.totalPoints) ?? 0) > 1

    return {
      ...entry,
      rank: currentRank,
      positionLabel: isSharedRank ? `Delad ${currentRank}` : String(currentRank),
    }
  })
}

function scoreExtraAnswer(selectedAnswer, question) {
  if (!question) {
    return {
      points: 0,
      reason: 'question-missing',
      settled: false,
    }
  }

  const correctAnswer = typeof question.correctAnswer === 'string' ? question.correctAnswer.trim() : ''
  if (!correctAnswer) {
    return {
      points: 0,
      reason: 'unsettled-question',
      settled: false,
    }
  }

  if (selectedAnswer === correctAnswer) {
    return {
      points: Number.isInteger(question.points) ? question.points : 0,
      reason: 'correct-answer',
      settled: true,
    }
  }

  return {
    points: 0,
    reason: 'wrong-answer',
    settled: true,
  }
}

function resolveResultForTip(tip, lookups) {
  if (typeof tip?.fixtureId === 'string' && lookups.byId.has(tip.fixtureId)) {
    return lookups.byId.get(tip.fixtureId)
  }

  const groupMatchDateKey = buildGroupMatchDateKey(tip?.group, tip?.match, tip?.date)
  if (lookups.byGroupMatchDate.has(groupMatchDateKey)) {
    return lookups.byGroupMatchDate.get(groupMatchDateKey)
  }

  const groupMatchKey = buildGroupMatchKey(tip?.group, tip?.match)
  if (lookups.byGroupMatch.has(groupMatchKey)) {
    return lookups.byGroupMatch.get(groupMatchKey)
  }

  return null
}

function deriveSettledGroupStanding(groupRows) {
  const statsByTeam = new Map()

  for (const row of groupRows) {
    for (const teamName of [row.home_team, row.away_team]) {
      const teamKey = normalizeComparableText(teamName)
      if (!statsByTeam.has(teamKey)) {
        statsByTeam.set(teamKey, {
          team: normalizeText(teamName),
          points: 0,
          goalsFor: 0,
          goalsAgainst: 0,
        })
      }
    }

    const homeKey = normalizeComparableText(row.home_team)
    const awayKey = normalizeComparableText(row.away_team)
    const homeStats = statsByTeam.get(homeKey)
    const awayStats = statsByTeam.get(awayKey)
    homeStats.goalsFor += row.home_score
    homeStats.goalsAgainst += row.away_score
    awayStats.goalsFor += row.away_score
    awayStats.goalsAgainst += row.home_score

    if (row.home_score > row.away_score) {
      homeStats.points += 3
    } else if (row.home_score < row.away_score) {
      awayStats.points += 3
    } else {
      homeStats.points += 1
      awayStats.points += 1
    }
  }

  if (groupRows.length !== GROUP_MATCH_COUNT || statsByTeam.size !== GROUP_TEAM_COUNT) {
    return {
      settled: false,
      actualPicks: null,
    }
  }

  const actualPicks = [...statsByTeam.values()]
    .sort((left, right) => {
      if (right.points !== left.points) {
        return right.points - left.points
      }

      const rightGoalDifference = right.goalsFor - right.goalsAgainst
      const leftGoalDifference = left.goalsFor - left.goalsAgainst
      if (rightGoalDifference !== leftGoalDifference) {
        return rightGoalDifference - leftGoalDifference
      }

      if (right.goalsFor !== left.goalsFor) {
        return right.goalsFor - left.goalsFor
      }

      return left.team.localeCompare(right.team, 'sv', { sensitivity: 'base' })
    })
    .map((team) => team.team)

  return {
    settled: true,
    actualPicks,
  }
}

function scoreSpecialPrediction(key, label, predictedValue, actualValue, maxPoints) {
  const normalizedPredictedValue = normalizeText(predictedValue)
  const normalizedActualValue = normalizeText(actualValue)

  if (!normalizedActualValue) {
    return {
      key,
      label,
      predictedValue: normalizedPredictedValue,
      actualValue: null,
      points: 0,
      reason: 'unsettled-special',
      settled: false,
    }
  }

  if (normalizeComparableText(normalizedPredictedValue) === normalizeComparableText(normalizedActualValue)) {
    return {
      key,
      label,
      predictedValue: normalizedPredictedValue,
      actualValue: normalizedActualValue,
      points: maxPoints,
      reason: 'correct-special',
      settled: true,
    }
  }

  return {
    key,
    label,
    predictedValue: normalizedPredictedValue,
    actualValue: normalizedActualValue,
    points: 0,
    reason: 'wrong-special',
    settled: true,
  }
}

function scoreFixtureTip(tip, result) {
  if (!result) {
    return {
      points: 0,
      reason: 'unsettled',
      predictedSign: derivePredictedSign(tip),
      actualSign: null,
    }
  }

  const homeScore = Number.isInteger(tip?.homeScore) ? tip.homeScore : null
  const awayScore = Number.isInteger(tip?.awayScore) ? tip.awayScore : null
  const predictedSign = derivePredictedSign(tip)
  const actualSign = deriveOutcomeSign(result.homeScore, result.awayScore)

  if (homeScore === null || awayScore === null) {
    return {
      points: 0,
      reason: 'missing-tip',
      predictedSign,
      actualSign,
    }
  }

  if (homeScore === result.homeScore && awayScore === result.awayScore) {
    return {
      points: 2,
      reason: 'exact-score',
      predictedSign,
      actualSign,
    }
  }

  if (predictedSign && predictedSign === actualSign) {
    return {
      points: 1,
      reason: 'correct-sign',
      predictedSign,
      actualSign,
    }
  }

  return {
    points: 0,
    reason: 'wrong-result',
    predictedSign,
    actualSign,
  }
}

function derivePredictedSign(tip) {
  if (tip?.sign === '1' || tip?.sign === 'X' || tip?.sign === '2') {
    return tip.sign
  }

  if (Number.isInteger(tip?.homeScore) && Number.isInteger(tip?.awayScore)) {
    return deriveOutcomeSign(tip.homeScore, tip.awayScore)
  }

  return null
}

function deriveOutcomeSign(homeScore, awayScore) {
  if (homeScore > awayScore) {
    return '1'
  }

  if (homeScore < awayScore) {
    return '2'
  }

  return 'X'
}

function buildGroupMatchDateKey(groupCode, matchLabel, kickoffAt) {
  return `${normalizeGroupCode(groupCode)}|${normalizeMatchLabel(matchLabel)}|${normalizeText(kickoffAt)}`
}

function buildGroupMatchKey(groupCode, matchLabel) {
  return `${normalizeGroupCode(groupCode)}|${normalizeMatchLabel(matchLabel)}`
}

function normalizeGroupCode(groupCode) {
  if (typeof groupCode !== 'string') {
    return ''
  }

  return groupCode.trim().toUpperCase()
}

function normalizeMatchLabel(matchLabel) {
  return normalizeText(matchLabel)
}

function normalizeText(value) {
  if (typeof value !== 'string') {
    return ''
  }

  return value.trim().replace(/\s+/g, ' ')
}

function normalizeComparableText(value) {
  return normalizeText(value).toLowerCase()
}

function uniqueNormalizedTexts(values) {
  const uniqueValues = new Map()
  for (const value of values) {
    const normalizedValue = normalizeText(value)
    const normalizedKey = normalizeComparableText(normalizedValue)
    if (!normalizedKey || uniqueValues.has(normalizedKey)) {
      continue
    }

    uniqueValues.set(normalizedKey, normalizedValue)
  }

  return [...uniqueValues.values()]
}

function extractGroupCode(groupLabel) {
  const normalized = normalizeText(groupLabel)
  const match = normalized.match(/^Grupp\s+([A-L])$/i)
  return match ? match[1].toUpperCase() : ''
}

function mapMatchResultRow(row) {
  return {
    matchId: row.match_id,
    stage: row.stage,
    round: row.round,
    groupCode: row.group_code,
    homeTeam: row.home_team,
    awayTeam: row.away_team,
    kickoffAt: row.kickoff_at,
    homeScore: row.home_score,
    awayScore: row.away_score,
    resultStatus: row.result_status,
    settledAt: row.settled_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function all(sql, params = []) {
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
