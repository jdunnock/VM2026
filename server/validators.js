/**
 * Validators and normalizers for API request payloads
 */

function parseParticipantId(value) {
    const id = Number(value)
    return Number.isInteger(id) && id > 0 ? id : null
}

function parseEntityId(value) {
    const id = Number(value)
    return Number.isInteger(id) && id > 0 ? id : null
}

function parseMatchId(value) {
    const raw = typeof value === 'string' ? value.trim() : ''
    if (!raw) {
        return null
    }

    return /^[A-Za-z0-9-]{3,40}$/.test(raw) ? raw : null
}

function isValidFixtureId(value) {
    if (value === undefined) {
        return true
    }

    return typeof value === 'string' && parseMatchId(value) !== null
}

function isValidFixtureTips(tips) {
    if (!Array.isArray(tips) || tips.length > 200) {
        return false
    }

    return tips.every((tip) => {
        if (!tip || typeof tip !== 'object') {
            return false
        }

        const isMatchValid = typeof tip.match === 'string' && tip.match.trim().length > 0
        const isDateValid = typeof tip.date === 'string' && tip.date.trim().length > 0
        const isSignValid = typeof tip.sign === 'string' && ['1', 'X', '2', ''].includes(tip.sign)
        const isStatusValid = typeof tip.status === 'string' && tip.status.trim().length > 0
        const isFixtureIdValid = isValidFixtureId(tip.fixtureId)

        const hasValidScore =
            (tip.homeScore === '' || Number.isInteger(tip.homeScore)) &&
            (tip.awayScore === '' || Number.isInteger(tip.awayScore))

        return isMatchValid && isDateValid && isSignValid && isStatusValid && isFixtureIdValid && hasValidScore
    })
}

function isValidGroupPlacements(groupPlacements) {
    if (!Array.isArray(groupPlacements) || groupPlacements.length > 12) {
        return false
    }

    return groupPlacements.every((group) => {
        if (!group || typeof group !== 'object') {
            return false
        }

        if (typeof group.group !== 'string' || !Array.isArray(group.picks) || group.picks.length !== 4) {
            return false
        }

        return group.picks.every((pick) => typeof pick === 'string')
    })
}

function isValidKnockoutPredictions(knockoutPredictions) {
    if (!Array.isArray(knockoutPredictions) || knockoutPredictions.length > 8) {
        return false
    }

    const maxPicksByRound = {
        Sextondelsfinal: 32,
        'Åttondelsfinal': 16,
        Kvartsfinal: 8,
        Semifinal: 4,
        Final: 2,
    }

    return knockoutPredictions.every((round) => {
        if (!round || typeof round !== 'object') {
            return false
        }

        const title = typeof round.title === 'string' ? round.title.trim() : ''
        const maxRoundPicks = maxPicksByRound[title] ?? 32

        if (typeof round.title !== 'string' || !Array.isArray(round.picks) || round.picks.length > maxRoundPicks) {
            return false
        }

        return round.picks.every((pick) => typeof pick === 'string')
    })
}

function isValidSpecialPredictions(specialPredictions) {
    if (!specialPredictions || typeof specialPredictions !== 'object') {
        return false
    }

    return (
        typeof specialPredictions.winner === 'string' &&
        typeof specialPredictions.topScorer === 'string'
    )
}

function isValidExtraAnswers(extraAnswers) {
    if (!extraAnswers || typeof extraAnswers !== 'object' || Array.isArray(extraAnswers)) {
        return false
    }

    return Object.entries(extraAnswers).every(([questionId, answer]) => {
        const parsedQuestionId = Number(questionId)
        return Number.isInteger(parsedQuestionId) && parsedQuestionId > 0 && typeof answer === 'string'
    })
}

function normalizeNullableScore(value) {
    if (value === null || value === undefined || value === '') {
        return null
    }

    const parsed = Number(value)
    if (!Number.isInteger(parsed) || parsed < 0 || parsed > 99) {
        return Number.NaN
    }

    return parsed
}

function normalizeAdminQuestionPayload(payload) {
    if (!payload || typeof payload !== 'object') {
        return null
    }

    const questionText = typeof payload.questionText === 'string' ? payload.questionText.trim() : ''
    const category = typeof payload.category === 'string' ? payload.category.trim() : ''
    const options = Array.isArray(payload.options)
        ? payload.options
            .filter((item) => typeof item === 'string')
            .map((item) => item.trim())
            .filter((item) => item.length > 0)
        : []
    const correctAnswer = typeof payload.correctAnswer === 'string' ? payload.correctAnswer.trim() : ''
    const points = Number(payload.points)
    const lockTime = typeof payload.lockTime === 'string' ? payload.lockTime.trim() : ''
    const status = typeof payload.status === 'string' ? payload.status.trim() : ''

    const allowedCategories = ['Gruppspelsfrågor', 'Slutspelsfrågor', '33-33-33 frågor']
    const allowedStatuses = ['draft', 'published']

    if (!questionText) {
        return null
    }

    if (!allowedCategories.includes(category)) {
        return null
    }

    if (options.length < 2) {
        return null
    }

    if (correctAnswer && !options.includes(correctAnswer)) {
        return null
    }

    if (!Number.isInteger(points) || points < 0 || points > 100) {
        return null
    }

    if (!lockTime || Number.isNaN(Date.parse(lockTime))) {
        return null
    }

    if (!allowedStatuses.includes(status)) {
        return null
    }

    return {
        questionText,
        category,
        options,
        correctAnswer,
        points,
        lockTime,
        status,
    }
}

function normalizeMatchResultPayload(payload, matchId) {
    if (!payload || typeof payload !== 'object' || !matchId) {
        return null
    }

    const stage = typeof payload.stage === 'string' ? payload.stage.trim() : ''
    const round = typeof payload.round === 'string' ? payload.round.trim() : ''
    const groupCodeRaw = typeof payload.groupCode === 'string' ? payload.groupCode.trim().toUpperCase() : ''
    const homeTeam = typeof payload.homeTeam === 'string' ? payload.homeTeam.trim() : ''
    const awayTeam = typeof payload.awayTeam === 'string' ? payload.awayTeam.trim() : ''
    const kickoffAt = typeof payload.kickoffAt === 'string' ? payload.kickoffAt.trim() : ''
    const resultStatus = typeof payload.resultStatus === 'string' ? payload.resultStatus.trim() : ''
    const settledAtRaw = typeof payload.settledAt === 'string' ? payload.settledAt.trim() : ''
    const homeScore = normalizeNullableScore(payload.homeScore)
    const awayScore = normalizeNullableScore(payload.awayScore)

    const allowedStages = ['group', 'knockout']
    const allowedStatuses = ['planned', 'live', 'completed']

    if (!allowedStages.includes(stage)) {
        return null
    }

    if (!homeTeam || !awayTeam || homeTeam === awayTeam) {
        return null
    }

    if (!kickoffAt || Number.isNaN(Date.parse(kickoffAt))) {
        return null
    }

    if (!allowedStatuses.includes(resultStatus)) {
        return null
    }

    if (Number.isNaN(homeScore) || Number.isNaN(awayScore)) {
        return null
    }

    if ((homeScore === null) !== (awayScore === null)) {
        return null
    }

    if (resultStatus === 'completed' && (homeScore === null || awayScore === null)) {
        return null
    }

    if (resultStatus === 'planned' && (homeScore !== null || awayScore !== null)) {
        return null
    }

    if (stage === 'group') {
        if (!/^[A-L]$/.test(groupCodeRaw)) {
            return null
        }

        if (round) {
            return null
        }
    }

    if (stage === 'knockout' && !round) {
        return null
    }

    if (stage === 'knockout' && groupCodeRaw) {
        return null
    }

    if (settledAtRaw && Number.isNaN(Date.parse(settledAtRaw))) {
        return null
    }

    return {
        matchId,
        stage,
        round: round || null,
        groupCode: groupCodeRaw || null,
        homeTeam,
        awayTeam,
        kickoffAt,
        homeScore,
        awayScore,
        resultStatus,
        settledAt: settledAtRaw || null,
    }
}

function normalizeSpecialResultsPayload(payload) {
    if (!payload || typeof payload !== 'object') {
        return null
    }

    return {
        winner: typeof payload.winner === 'string' ? payload.winner.trim() : '',
        topScorer: typeof payload.topScorer === 'string' ? payload.topScorer.trim() : '',
    }
}

function normalizeTipsPayload(tips) {
    if (Array.isArray(tips)) {
        if (!isValidFixtureTips(tips)) {
            return null
        }

        return {
            fixtureTips: tips,
            groupPlacements: [],
            knockoutPredictions: [],
            extraAnswers: {},
        }
    }

    if (!tips || typeof tips !== 'object') {
        return null
    }

    const fixtureTips = tips.fixtureTips
    const groupPlacements = tips.groupPlacements
    const knockoutPredictions = Array.isArray(tips.knockoutPredictions) ? tips.knockoutPredictions : []
    const extraAnswers = tips.extraAnswers ?? {}

    if (!isValidFixtureTips(fixtureTips)) {
        return null
    }

    if (!isValidGroupPlacements(groupPlacements)) {
        return null
    }

    if (!isValidKnockoutPredictions(knockoutPredictions)) {
        return null
    }

    if (!isValidExtraAnswers(extraAnswers)) {
        return null
    }

    return {
        fixtureTips,
        groupPlacements,
        knockoutPredictions,
        extraAnswers,
    }
}

export {
    parseParticipantId,
    parseEntityId,
    parseMatchId,
    isValidFixtureId,
    isValidFixtureTips,
    isValidGroupPlacements,
    isValidKnockoutPredictions,
    isValidExtraAnswers,
    normalizeNullableScore,
    normalizeAdminQuestionPayload,
    normalizeMatchResultPayload,
    normalizeTipsPayload,
}
