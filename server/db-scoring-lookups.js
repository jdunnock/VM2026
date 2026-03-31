/**
 * Database lookup builders for the scoring subsystem.
 * Each function queries SQLite and returns structured lookup maps
 * consumed by the scoring calculation layer.
 */

import {
    all,
    get,
    GROUP_MATCH_COUNT,
    GROUP_TEAM_COUNT,
    KNOCKOUT_ROUND_TEAM_COUNTS,
} from './db-core.js'
import { mapMatchResultRow } from './db-results.js'
import { parseJsonOrNull, parseJsonOrArray } from './json-utils.js'
import {
    normalizeText,
    normalizeComparableText,
    normalizeGroupCode,
} from './scoring-helpers.js'

/**
 * Build all scoring lookups in parallel.
 * Shared by both listParticipantScores and getParticipantScoreByParticipantId
 * to avoid redundant database queries.
 * @returns {Promise<{lookups: object, questionLookups: object, groupStandingsLookups: object, knockoutRoundLookups: object}>}
 */
export async function buildScoringLookups() {
    const [lookups, questionLookups, groupStandingsLookups, knockoutRoundLookups] = await Promise.all([
        buildCompletedResultLookups(),
        buildPublishedQuestionLookups(),
        buildGroupStandingsLookups(),
        buildKnockoutRoundLookups(),
    ])

    return { lookups, questionLookups, groupStandingsLookups, knockoutRoundLookups }
}

/**
 * Name patterns for automated test participants — hidden from public views.
 */
const TEST_USER_PATTERNS = [
    'Admin',
    'CrudUser%',
    'FullPack%',
    'KnockoutSmoke%',
    'TestUser%',
    'Smoke Tester%',
    'Regression Tester%',
]

const TEST_USER_WHERE = TEST_USER_PATTERNS.map(() => `p.name NOT LIKE ?`).join(' AND ')

/**
 * List all participants with their parsed tips JSON.
 * @returns {Promise<Array<{participantId: number, name: string, tips: object|null, updatedAt: string|null}>>}
 */
export async function listParticipantsWithTips() {
    const rows = await all(
        `
      SELECT
        p.id,
        p.name,
        pt.tips_json,
        pt.updated_at
      FROM participants p
      LEFT JOIN participant_tips pt ON pt.participant_id = p.id
      WHERE ${TEST_USER_WHERE}
      ORDER BY p.name COLLATE NOCASE ASC, p.id ASC
    `,
        TEST_USER_PATTERNS,
    )

    return rows.map((row) => ({
        participantId: row.id,
        name: row.name,
        tips: parseJsonOrNull(row.tips_json),
        updatedAt: row.updated_at ?? null,
    }))
}

/**
 * Fetch a single participant with parsed tips by participant ID.
 * @param {number} participantId
 * @returns {Promise<{participantId: number, name: string, tips: object|null, updatedAt: string|null}|null>}
 */
export async function getParticipantWithTipsById(participantId) {
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
        tips: parseJsonOrNull(row.tips_json),
        updatedAt: row.updated_at ?? null,
    }
}

/**
 * Build lookup map for completed match results, keyed by match ID.
 * @returns {Promise<{byId: Map}>}
 */
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

    for (const result of results) {
        byId.set(result.matchId, result)
    }

    return { byId }
}

/**
 * Build a lookup map for published admin questions, keyed by question ID.
 * @returns {Promise<{byId: Map}>}
 */
export async function buildPublishedQuestionLookups() {
    const rows = await all(
        `
      SELECT
        id,
        question_text,
        category,
        correct_answer,
        points,
        status,
        accepted_answers_json
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
            acceptedAnswers: parseJsonOrArray(row.accepted_answers_json),
        })
    }

    return { byId }
}

/**
 * Build group standings lookups from completed group-stage results.
 * Each group entry includes whether all matches are settled and the
 * derived team ranking.
 * @returns {Promise<{byGroup: Map}>}
 */
export async function buildGroupStandingsLookups() {
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

    return { byGroup }
}

/**
 * Build knockout round lookups from the knockout_advancement table.
 * Each round entry indicates whether all expected teams have been confirmed
 * and which teams have advanced.
 * @returns {Promise<{byRound: Map}>}
 */
export async function buildKnockoutRoundLookups() {
    const rows = await all(
        `
      SELECT round, team_name
      FROM knockout_advancement
      WHERE confirmed_at IS NOT NULL
      ORDER BY round ASC, team_name ASC
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
        const normalizedKey = normalizeComparableText(row.team_name)
        if (normalizedKey && !roundTeams.has(normalizedKey)) {
            roundTeams.set(normalizedKey, normalizeText(row.team_name))
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

    return { byRound }
}

/**
 * Derive the group standing from a set of completed group match rows.
 * Returns sorted team names (1st to last) if the group is fully settled.
 * @param {Array<{home_team: string, away_team: string, home_score: number, away_score: number}>} groupRows
 * @returns {{settled: boolean, actualPicks: string[]|null}}
 */
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
