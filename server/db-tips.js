import { run, get, runTransaction } from './db-core.js'
import { parseJsonOrNull } from './json-utils.js'

export async function getTipsByParticipantId(participantId) {
    const row = await get('SELECT tips_json, updated_at FROM participant_tips WHERE participant_id = ?', [participantId])

    if (!row) {
        return null
    }

    return {
        tips: parseJsonOrNull(row.tips_json),
        updatedAt: row.updated_at,
    }
}

async function syncFixtureTipsToNormalized(participantId, fixtureTips) {
    await run('DELETE FROM participant_fixture_tips WHERE participant_id = ?', [participantId])

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
    await run('DELETE FROM participant_group_placements WHERE participant_id = ?', [participantId])

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
    await run('DELETE FROM participant_knockout_predictions WHERE participant_id = ?', [participantId])

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
    await run('DELETE FROM participant_special_predictions WHERE participant_id = ?', [participantId])

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
    await run('DELETE FROM participant_extra_answers WHERE participant_id = ?', [participantId])

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

    return runTransaction(async () => {
        await run(
            `
        INSERT INTO participant_tips (participant_id, tips_json, created_at, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT(participant_id)
        DO UPDATE SET tips_json = excluded.tips_json, updated_at = CURRENT_TIMESTAMP
      `,
            [participantId, tipsJson],
        )

        if (tips.fixtureTips) await syncFixtureTipsToNormalized(participantId, tips.fixtureTips)
        if (tips.groupPlacements) await syncGroupPlacementsToNormalized(participantId, tips.groupPlacements)
        if (tips.knockoutPredictions) await syncKnockoutPredictionsToNormalized(participantId, tips.knockoutPredictions)
        if (tips.specialPredictions) await syncSpecialPredictionsToNormalized(participantId, tips.specialPredictions)
        if (tips.extraAnswers) await syncExtraAnswersToNormalized(participantId, tips.extraAnswers)

        return getTipsByParticipantId(participantId)
    })
}

export async function deleteTipsByParticipantId(participantId) {
    await runTransaction(async () => {
        await run('DELETE FROM participant_tips WHERE participant_id = ?', [participantId])
        await run('DELETE FROM participant_fixture_tips WHERE participant_id = ?', [participantId])
        await run('DELETE FROM participant_group_placements WHERE participant_id = ?', [participantId])
        await run('DELETE FROM participant_knockout_predictions WHERE participant_id = ?', [participantId])
        await run('DELETE FROM participant_special_predictions WHERE participant_id = ?', [participantId])
        await run('DELETE FROM participant_extra_answers WHERE participant_id = ?', [participantId])
    })
}
