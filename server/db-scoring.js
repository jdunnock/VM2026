import {
    all,
    get,
    GROUP_MATCH_COUNT,
    GROUP_TEAM_COUNT,
    KNOCKOUT_ROUND_POINTS,
    KNOCKOUT_ROUND_TEAM_COUNTS,
} from './db-core.js'
import { getSpecialResults } from './db-special.js'
import { mapMatchResultRow } from './db-results.js'
import { parseJsonOrNull } from './json-utils.js'

/**
 * Build all scoring lookups in parallel. Shared by both listParticipantScores and getParticipantScoreByParticipantId
 * to avoid redundant database queries.
 */
async function buildScoringLookups() {
    const [lookups, questionLookups, groupStandingsLookups, knockoutRoundLookups, specialResults] = await Promise.all([
        buildCompletedResultLookups(),
        buildPublishedQuestionLookups(),
        buildGroupStandingsLookups(),
        buildKnockoutRoundLookups(),
        getSpecialResults(),
    ])

    return { lookups, questionLookups, groupStandingsLookups, knockoutRoundLookups, specialResults }
}

export async function listParticipantScores() {
    const participants = await listParticipantsWithTips()
    const { lookups, questionLookups, groupStandingsLookups, knockoutRoundLookups, specialResults } = await buildScoringLookups()

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

    // Build all lookups once and share across score calculation and ranking
    const { lookups, questionLookups, groupStandingsLookups, knockoutRoundLookups, specialResults } = await buildScoringLookups()

    // Calculate full score for this participant
    const score = calculateParticipantScore(
        participant,
        lookups,
        questionLookups,
        groupStandingsLookups,
        knockoutRoundLookups,
        specialResults,
    )

    // Build score summaries for all participants using shared lookups (no double-read)
    const allParticipants = await listParticipantsWithTips()
    const summaries = allParticipants.map((p) => {
        const s = calculateParticipantScore(
            p,
            lookups,
            questionLookups,
            groupStandingsLookups,
            knockoutRoundLookups,
            specialResults,
        )
        return {
            participantId: s.participantId,
            name: s.name,
            totalPoints: s.totalPoints,
            settledMatches: s.settledMatches,
            settledQuestions: s.settledQuestions,
            fixturePoints: s.fixturePoints,
            groupPlacementPoints: s.groupPlacementPoints,
            knockoutPoints: s.knockoutPoints,
            specialPoints: s.specialPoints,
            extraQuestionPoints: s.extraQuestionPoints,
            updatedAt: p.updatedAt,
        }
    })

    // Rank all summaries and extract this participant's rank
    const rankedScores = rankParticipantScoreSummaries(summaries)
    const leaderboardEntry = rankedScores.find((entry) => entry.participantId === participantId)

    return {
        ...score,
        rank: leaderboardEntry?.rank ?? null,
        positionLabel: leaderboardEntry?.positionLabel ?? null,
    }
}

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
      ORDER BY p.name COLLATE NOCASE ASC, p.id ASC
    `,
    )

    return rows.map((row) => ({
        participantId: row.id,
        name: row.name,
        tips: parseJsonOrNull(row.tips_json),
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
        tips: parseJsonOrNull(row.tips_json),
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

    return { byId, byGroupMatchDate, byGroupMatch }
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

    return { byId }
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

    return { byGroup }
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

    return { byRound }
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
            predictedHomeScore: Number.isInteger(tip?.homeScore) ? tip.homeScore : null,
            predictedAwayScore: Number.isInteger(tip?.awayScore) ? tip.awayScore : null,
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

        return {
            ...entry,
            rank: currentRank,
            positionLabel: String(currentRank),
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
