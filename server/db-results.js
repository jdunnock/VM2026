import { run, get, all } from './db-core.js'

export function mapMatchResultRow(row) {
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

// ─── Knockout advancement ────────────────────────────────────────────

const VALID_KNOCKOUT_ROUNDS = new Set([
  'Sextondelsfinal', 'Åttondelsfinal', 'Kvartsfinal', 'Semifinal', 'Final',
])

export async function listKnockoutAdvancements() {
  const rows = await all(
    `SELECT id, round, team_name, confirmed_at, source, created_at
     FROM knockout_advancement
     ORDER BY round ASC, team_name ASC`,
  )
  return rows.map(mapKnockoutAdvancementRow)
}

export async function listKnockoutAdvancementsByRound(round) {
  const rows = await all(
    `SELECT id, round, team_name, confirmed_at, source, created_at
     FROM knockout_advancement
     WHERE round = ?
     ORDER BY team_name ASC`,
    [round],
  )
  return rows.map(mapKnockoutAdvancementRow)
}

export async function upsertKnockoutAdvancement({ round, teamName, confirmedAt, source }) {
  if (!VALID_KNOCKOUT_ROUNDS.has(round)) {
    throw new Error(`Invalid knockout round: ${round}`)
  }
  await run(
    `INSERT INTO knockout_advancement (round, team_name, confirmed_at, source)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(round, team_name)
     DO UPDATE SET confirmed_at = excluded.confirmed_at, source = excluded.source`,
    [round, teamName, confirmedAt ?? new Date().toISOString(), source ?? 'manual'],
  )
  return { round, teamName, confirmedAt: confirmedAt ?? new Date().toISOString(), source: source ?? 'manual' }
}

export async function deleteKnockoutAdvancement(round, teamName) {
  await run(
    `DELETE FROM knockout_advancement WHERE round = ? AND team_name = ?`,
    [round, teamName],
  )
}

function mapKnockoutAdvancementRow(row) {
  return {
    id: row.id,
    round: row.round,
    teamName: row.team_name,
    confirmedAt: row.confirmed_at,
    source: row.source,
    createdAt: row.created_at,
  }
}
