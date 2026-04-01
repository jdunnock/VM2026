/**
 * Scoring calculation and ranking logic.
 * Pure scoring functions that operate on pre-built lookup maps
 * from db-scoring-lookups.js.
 */

import { KNOCKOUT_ROUND_POINTS } from './db-core.js'
import {
    normalizeText,
    normalizeComparableText,
    extractGroupCode,
    uniqueNormalizedTexts,
} from './scoring-helpers.js'
import {
    buildScoringLookups,
    listParticipantsWithTips,
    getParticipantWithTipsById,
} from './db-scoring-lookups.js'

/**
 * Calculate and rank scores for all participants.
 * @returns {Promise<Array<object>>} Ranked score summaries.
 */
export async function listParticipantScores() {
    const participants = await listParticipantsWithTips()
    const { lookups, questionLookups, groupStandingsLookups, knockoutRoundLookups } = await buildScoringLookups()

    const summaries = participants.map((participant) => {
        const score = calculateParticipantScore(
            participant,
            lookups,
            questionLookups,
            groupStandingsLookups,
            knockoutRoundLookups,
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
            extraQuestionPoints: score.extraQuestionPoints,
            updatedAt: participant.updatedAt,
        }
    })

    return rankParticipantScoreSummaries(summaries)
}

/**
 * Calculate the full score breakdown for a single participant, including their rank.
 * @param {number} participantId
 * @returns {Promise<object|null>} Full score with rank, or null if participant not found.
 */
export async function getParticipantScoreByParticipantId(participantId) {
    const participant = await getParticipantWithTipsById(participantId)
    if (!participant) {
        return null
    }

    // Build all lookups once and share across score calculation and ranking
    const { lookups, questionLookups, groupStandingsLookups, knockoutRoundLookups } = await buildScoringLookups()

    // Calculate full score for this participant
    const score = calculateParticipantScore(
        participant,
        lookups,
        questionLookups,
        groupStandingsLookups,
        knockoutRoundLookups,
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

/**
 * Calculate the complete score for a single participant against all lookup maps.
 * @param {{participantId: number, name: string, tips: object|null, updatedAt: string|null}} participant
 * @param {{byId: Map, byGroupMatchDate: Map, byGroupMatch: Map}} lookups
 * @param {{byId: Map}} questionLookups
 * @param {{byGroup: Map}} groupStandingsLookups
 * @param {{byRound: Map}} knockoutRoundLookups
 * @returns {object} Full score breakdown with fixture, group, knockout, and extra question details.
 */
function calculateParticipantScore(participant, lookups, questionLookups, groupStandingsLookups, knockoutRoundLookups) {
    const rawFixtureTips = Array.isArray(participant.tips?.fixtureTips) ? participant.tips.fixtureTips : []
    const rawGroupPlacements = Array.isArray(participant.tips?.groupPlacements) ? participant.tips.groupPlacements : []
    const rawKnockoutPredictions = Array.isArray(participant.tips?.knockoutPredictions) ? participant.tips.knockoutPredictions : []
    const rawExtraAnswers =
        participant.tips?.extraAnswers && typeof participant.tips.extraAnswers === 'object' && !Array.isArray(participant.tips.extraAnswers)
            ? participant.tips.extraAnswers
            : {}

    let totalPoints = 0
    let fixturePoints = 0
    let groupPlacementPoints = 0
    let knockoutPoints = 0
    let extraQuestionPoints = 0
    let settledMatches = 0
    let settledGroups = 0
    let settledKnockoutRounds = 0
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
        extraQuestionPoints,
        settledMatches,
        settledGroups,
        settledKnockoutRounds,
        settledQuestions,
        breakdown,
        groupPlacementBreakdown,
        knockoutBreakdown,
        extraBreakdown,
        updatedAt: participant.updatedAt,
    }
}

/**
 * Sort and assign rank positions to score summaries.
 * Ties share the same rank.
 * @param {Array<object>} summaries
 * @returns {Array<object>} Summaries with `rank` and `positionLabel` fields.
 */
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

/**
 * Score a single extra question answer against the published correct answer.
 * @param {string} selectedAnswer
 * @param {{correctAnswer: string|null, points: number}|undefined} question
 * @returns {{points: number, reason: string, settled: boolean}}
 */
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

    const answerNorm = selectedAnswer.trim().toLowerCase()
    if (answerNorm === correctAnswer.toLowerCase()) {
        return {
            points: Number.isInteger(question.points) ? question.points : 0,
            reason: 'correct-answer',
            settled: true,
        }
    }

    const accepted = Array.isArray(question.acceptedAnswers) ? question.acceptedAnswers : []
    if (accepted.length > 0) {
        const isAccepted = accepted.some((a) => a.trim().toLowerCase() === answerNorm)
        if (isAccepted) {
            return {
                points: Number.isInteger(question.points) ? question.points : 0,
                reason: 'correct-answer',
                settled: true,
            }
        }
    }

    return {
        points: 0,
        reason: 'wrong-answer',
        settled: true,
    }
}

/**
 * Resolve which completed match result corresponds to a given fixture tip.
 * Uses direct fixture_id → match_id lookup (IDs are aligned).
 * @param {object} tip
 * @param {{byId: Map}} lookups
 * @returns {object|null} The matched result or null.
 */
function resolveResultForTip(tip, lookups) {
    if (typeof tip?.fixtureId === 'string' && lookups.byId.has(tip.fixtureId)) {
        return lookups.byId.get(tip.fixtureId)
    }

    return null
}

/**
 * Score a single fixture tip against a completed match result.
 * Returns 3 points for exact score (2 result + 1 sign), 1 for correct sign (1/X/2), 0 otherwise.
 * @param {object} tip
 * @param {object|null} result
 * @returns {{points: number, reason: string, predictedSign: string|null, actualSign: string|null}}
 */
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
            points: 3,
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

/**
 * Derive the predicted match sign from a tip (1, X, or 2).
 * Falls back to computing from homeScore/awayScore if sign is not explicit.
 * @param {object} tip
 * @returns {string|null}
 */
function derivePredictedSign(tip) {
    if (tip?.sign === '1' || tip?.sign === 'X' || tip?.sign === '2') {
        return tip.sign
    }

    if (Number.isInteger(tip?.homeScore) && Number.isInteger(tip?.awayScore)) {
        return deriveOutcomeSign(tip.homeScore, tip.awayScore)
    }

    return null
}

/**
 * Derive the outcome sign from a home/away score pair.
 * @param {number} homeScore
 * @param {number} awayScore
 * @returns {'1'|'X'|'2'}
 */
function deriveOutcomeSign(homeScore, awayScore) {
    if (homeScore > awayScore) {
        return '1'
    }

    if (homeScore < awayScore) {
        return '2'
    }

    return 'X'
}
