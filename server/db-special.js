import { run, get } from './db-core.js'

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
