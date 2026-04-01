import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { after, before, test } from 'node:test'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')

let baseUrl = ''
let apiProcess = null
let tempDir = ''

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms)
    })
}

async function waitForHealth(url, timeoutMs = 10000) {
    const startedAt = Date.now()

    while (Date.now() - startedAt < timeoutMs) {
        try {
            const response = await fetch(`${url}/api/health`)
            if (response.ok) {
                return
            }
        } catch {
            // Retry until timeout.
        }

        await sleep(200)
    }

    throw new Error('API did not become healthy in time.')
}

async function request(method, endpoint, body, headers = {}) {
    const response = await fetch(`${baseUrl}${endpoint}`, {
        method,
        headers: {
            ...(body ? { 'Content-Type': 'application/json' } : {}),
            ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
    })

    if (response.status === 204) {
        return { status: response.status, data: null }
    }

    const text = await response.text()
    const data = text ? JSON.parse(text) : null
    return { status: response.status, data }
}

async function createParticipant(name, code) {
    const response = await request('POST', '/api/auth/sign-in', { name, code })
    assert.ok(response.status === 200 || response.status === 201)
    assert.ok(Number.isInteger(response.data.participantId))
    return response.data.participantId
}

async function saveTips(participantId, tips) {
    const response = await request('PUT', `/api/tips/${participantId}`, { tips })
    assert.equal(response.status, 200)
    return response.data
}

before(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), 'vm2026-api-test-'))
    const port = String(43000 + Math.floor(Math.random() * 1000))
    baseUrl = `http://localhost:${port}`

    apiProcess = spawn('node', [path.join(repoRoot, 'server/index.js')], {
        cwd: tempDir,
        env: {
            ...process.env,
            API_PORT: port,
            ADMIN_ACCESS_CODE: 'vm2026-admin',
            ADMIN_ACCESS_NAME: 'Admin',
            NODE_ENV: 'test',
        },
        stdio: ['ignore', 'pipe', 'pipe'],
    })

    await waitForHealth(baseUrl)
})

after(async () => {
    if (apiProcess && !apiProcess.killed) {
        apiProcess.kill('SIGTERM')
        await sleep(300)
        if (!apiProcess.killed) {
            apiProcess.kill('SIGKILL')
        }
    }

    if (tempDir) {
        await rm(tempDir, { recursive: true, force: true })
    }
})

test('scores API awards exact, sign-only, wrong, missing-tip, and unsettled match cases', async () => {
    const resultsResponse = await request(
        'PUT',
        '/api/admin/results/G-A-1',
        {
            stage: 'group',
            groupCode: 'A',
            homeTeam: 'Mexiko',
            awayTeam: 'Sydafrika',
            kickoffAt: '2026-06-11T19:00:00Z',
            homeScore: 2,
            awayScore: 1,
            resultStatus: 'completed',
            settledAt: '2026-06-11T21:05:00Z',
        },
        { 'x-admin-code': 'vm2026-admin' },
    )
    assert.equal(resultsResponse.status, 200)

    const makeTips = (fixtureTip) => ({
        fixtureTips: [fixtureTip],
        groupPlacements: [],
        knockoutPredictions: [],
        extraAnswers: {},
    })

    const exactParticipant = await createParticipant('Score Matrix Exact', 'code-1')
    await saveTips(
        exactParticipant,
        makeTips({
            fixtureId: 'G-A-1',
            group: 'A',
            match: 'Mexiko - Sydafrika',
            date: '2026-06-11 21:00',
            homeScore: 2,
            awayScore: 1,
            sign: '1',
            status: 'Öppet',
        }),
    )

    const signOnlyParticipant = await createParticipant('Score Matrix Sign', 'code-2')
    await saveTips(
        signOnlyParticipant,
        makeTips({
            fixtureId: 'G-A-1',
            group: 'A',
            match: 'Mexiko - Sydafrika',
            date: '2026-06-11 21:00',
            homeScore: 1,
            awayScore: 0,
            sign: '1',
            status: 'Öppet',
        }),
    )

    const wrongParticipant = await createParticipant('Score Matrix Wrong', 'code-3')
    await saveTips(
        wrongParticipant,
        makeTips({
            fixtureId: 'G-A-1',
            group: 'A',
            match: 'Mexiko - Sydafrika',
            date: '2026-06-11 21:00',
            homeScore: 0,
            awayScore: 1,
            sign: '2',
            status: 'Öppet',
        }),
    )

    const missingParticipant = await createParticipant('Score Matrix Missing', 'code-4')
    await saveTips(
        missingParticipant,
        makeTips({
            fixtureId: 'G-A-1',
            group: 'A',
            match: 'Mexiko - Sydafrika',
            date: '2026-06-11 21:00',
            homeScore: '',
            awayScore: '',
            sign: '',
            status: 'Öppet',
        }),
    )

    const unsettledParticipant = await createParticipant('Score Matrix Unsettled', 'code-5')
    await saveTips(
        unsettledParticipant,
        makeTips({
            fixtureId: 'G-A-2',
            group: 'A',
            match: 'Sydkorea - Tjeckien',
            date: '2026-06-12 04:00',
            homeScore: 2,
            awayScore: 0,
            sign: '1',
            status: 'Öppet',
        }),
    )

    const exactScore = await request('GET', `/api/scores/${exactParticipant}`)
    const signScore = await request('GET', `/api/scores/${signOnlyParticipant}`)
    const wrongScore = await request('GET', `/api/scores/${wrongParticipant}`)
    const missingScore = await request('GET', `/api/scores/${missingParticipant}`)
    const unsettledScore = await request('GET', `/api/scores/${unsettledParticipant}`)

    assert.equal(exactScore.status, 200)
    assert.equal(exactScore.data.totalPoints, 3)
    assert.equal(exactScore.data.breakdown[0].reason, 'exact-score')

    assert.equal(signScore.status, 200)
    assert.equal(signScore.data.totalPoints, 1)
    assert.equal(signScore.data.breakdown[0].reason, 'correct-sign')

    assert.equal(wrongScore.status, 200)
    assert.equal(wrongScore.data.totalPoints, 0)
    assert.equal(wrongScore.data.breakdown[0].reason, 'wrong-result')

    assert.equal(missingScore.status, 200)
    assert.equal(missingScore.data.totalPoints, 0)
    assert.equal(missingScore.data.breakdown[0].reason, 'missing-tip')

    assert.equal(unsettledScore.status, 200)
    assert.equal(unsettledScore.data.totalPoints, 0)
    assert.equal(unsettledScore.data.breakdown[0].reason, 'unsettled')
})

test('scores API tips without fixtureId are unsettled (no legacy fallback)', async () => {
    const participantId = await createParticipant('Score No Fallback', 'nofb-code')

    await saveTips(participantId, {
        fixtureTips: [
            {
                group: 'A',
                match: 'Mexiko - Sydafrika',
                date: '2026-06-11T19:00:00Z',
                homeScore: 1,
                awayScore: 0,
                sign: '1',
                status: 'Öppet',
            },
        ],
        groupPlacements: [],
        knockoutPredictions: [],
        extraAnswers: {},
    })

    const scoreResponse = await request('GET', `/api/scores/${participantId}`)

    assert.equal(scoreResponse.status, 200)
    assert.equal(scoreResponse.data.totalPoints, 0)
    assert.equal(scoreResponse.data.breakdown[0].reason, 'unsettled')
})

test('scores API includes extra question scoring', async () => {
    const questionsResponse = await request('GET', '/api/admin/questions', null, { 'x-admin-code': 'vm2026-admin' })
    assert.equal(questionsResponse.status, 200)

    const question = questionsResponse.data.questions.find((entry) => entry.questionText === 'Vilken grupp görs det flest mål i totalt?')
    assert.ok(question, 'Expected a manifest-backed group question')

    const settleResponse = await request(
        'PUT',
        `/api/admin/questions/${question.id}/accepted-answers`,
        { acceptedAnswers: [], correctAnswer: 'Grupp A' },
        { 'x-admin-code': 'vm2026-admin' },
    )
    assert.equal(settleResponse.status, 200)

    const correctParticipant = await createParticipant('Score Extra Correct', 'extra-1')
    await saveTips(correctParticipant, {
        fixtureTips: [],
        groupPlacements: [],
        knockoutPredictions: [],
        extraAnswers: {
            [String(question.id)]: 'Grupp A',
        },
    })

    const wrongParticipant = await createParticipant('Score Extra Wrong', 'extra-2')
    await saveTips(wrongParticipant, {
        fixtureTips: [],
        groupPlacements: [],
        knockoutPredictions: [],
        extraAnswers: {
            [String(question.id)]: 'Grupp B',
        },
    })

    const correctScore = await request('GET', `/api/scores/${correctParticipant}`)
    const wrongScore = await request('GET', `/api/scores/${wrongParticipant}`)

    assert.equal(correctScore.status, 200)
    assert.equal(correctScore.data.extraQuestionPoints, 2)
    assert.equal(correctScore.data.totalPoints, 2)
    assert.equal(correctScore.data.settledQuestions, 1)
    assert.equal(correctScore.data.extraBreakdown[0].reason, 'correct-answer')

    assert.equal(wrongScore.status, 200)
    assert.equal(wrongScore.data.extraQuestionPoints, 0)
    assert.equal(wrongScore.data.totalPoints, 0)
    assert.equal(wrongScore.data.settledQuestions, 1)
    assert.equal(wrongScore.data.extraBreakdown[0].reason, 'wrong-answer')
})

test('scores API returns leaderboard ordering with shared ranks', async () => {
    const resultResponse = await request(
        'PUT',
        '/api/admin/results/G-B-1',
        {
            stage: 'group',
            groupCode: 'B',
            homeTeam: 'Kanada',
            awayTeam: 'Qatar',
            kickoffAt: '2026-06-18T22:00:00Z',
            homeScore: 3,
            awayScore: 1,
            resultStatus: 'completed',
            settledAt: '2026-06-18T23:59:00Z',
        },
        { 'x-admin-code': 'vm2026-admin' },
    )

    assert.equal(resultResponse.status, 200)

    const makeTips = (homeScore, awayScore, sign) => ({
        fixtureTips: [
            {
                fixtureId: 'G-B-1',
                group: 'B',
                match: 'Kanada - Qatar',
                date: '2026-06-18 22:00',
                homeScore,
                awayScore,
                sign,
                status: 'Öppet',
            },
        ],
        groupPlacements: [],
        knockoutPredictions: [],
        extraAnswers: {},
    })

    const leaderId = await createParticipant('Leaderboard Leader', 'lb-1')
    await saveTips(leaderId, makeTips(3, 1, '1'))

    const tiedAId = await createParticipant('Leaderboard Tie A', 'lb-2')
    await saveTips(tiedAId, makeTips(2, 0, '1'))

    const tiedBId = await createParticipant('Leaderboard Tie B', 'lb-3')
    await saveTips(tiedBId, makeTips(4, 2, '1'))

    const leaderboardResponse = await request('GET', '/api/scores')
    assert.equal(leaderboardResponse.status, 200)

    const leaderboardEntries = leaderboardResponse.data.scores.filter((entry) => entry.name.startsWith('Leaderboard '))

    assert.equal(leaderboardEntries.length, 3)
    assert.deepEqual(leaderboardEntries.map((entry) => entry.name), ['Leaderboard Leader', 'Leaderboard Tie A', 'Leaderboard Tie B'])
    assert.deepEqual(leaderboardEntries.map((entry) => entry.totalPoints), [3, 1, 1])
    assert.ok(leaderboardEntries[0].rank < leaderboardEntries[1].rank)
    assert.equal(leaderboardEntries[1].rank, leaderboardEntries[2].rank)
    assert.equal(leaderboardEntries[1].positionLabel, leaderboardEntries[2].positionLabel)
    assert.equal(leaderboardEntries[1].positionLabel, String(leaderboardEntries[1].rank))

    const tiedParticipantResponse = await request('GET', `/api/scores/${tiedBId}`)
    assert.equal(tiedParticipantResponse.status, 200)
    assert.equal(tiedParticipantResponse.data.rank, leaderboardEntries[2].rank)
    assert.equal(tiedParticipantResponse.data.positionLabel, leaderboardEntries[2].positionLabel)
})

test('scores API group placement: all correct, partial, and none correct', async () => {
    // Setup all 6 group A matches with results
    const groupAMatches = [
        {
            matchId: 'G-A-1',
            teams: ['Mexico', 'Poland'],
            result: { home: 3, away: 1 },
        },
        {
            matchId: 'G-A-2',
            teams: ['Argentina', 'Saudi Arabia'],
            result: { home: 2, away: 0 },
        },
        {
            matchId: 'G-A-3',
            teams: ['Mexico', 'Saudi Arabia'],
            result: { home: 2, away: 1 },
        },
        {
            matchId: 'G-A-4',
            teams: ['Argentina', 'Poland'],
            result: { home: 2, away: 0 },
        },
        {
            matchId: 'G-A-5',
            teams: ['Argentina', 'Mexico'],
            result: { home: 2, away: 0 },
        },
        {
            matchId: 'G-A-6',
            teams: ['Poland', 'Saudi Arabia'],
            result: { home: 2, away: 1 },
        },
    ]

    for (const match of groupAMatches) {
        await request(
            'PUT',
            `/api/admin/results/${match.matchId}`,
            {
                stage: 'group',
                groupCode: 'A',
                homeTeam: match.teams[0],
                awayTeam: match.teams[1],
                kickoffAt: '2026-06-15T19:00:00Z',
                homeScore: match.result.home,
                awayScore: match.result.away,
                resultStatus: 'completed',
                settledAt: '2026-06-15T21:00:00Z',
            },
            { 'x-admin-code': 'vm2026-admin' },
        )
    }

    // Expected standings after all matches: Argentina 1st, Mexico 2nd, Poland 3rd, Saudi Arabia 4th
    const allCorrectParticipant = await createParticipant('Group Placement All Correct', 'gp-1')
    await saveTips(allCorrectParticipant, {
        fixtureTips: [],
        groupPlacements: [
            {
                group: 'Grupp A',
                picks: ['Argentina', 'Mexico', 'Poland', 'Saudi Arabia'],
            },
        ],
        knockoutPredictions: [],
        extraAnswers: {},
    })

    const partialCorrectParticipant = await createParticipant('Group Placement Partial', 'gp-2')
    await saveTips(partialCorrectParticipant, {
        fixtureTips: [],
        groupPlacements: [
            {
                group: 'Grupp A',
                picks: ['Argentina', 'Poland', 'Mexico', 'Saudi Arabia'],
            },
        ],
        knockoutPredictions: [],
        extraAnswers: {},
    })

    const noneCorrectParticipant = await createParticipant('Group Placement None Correct', 'gp-3')
    await saveTips(noneCorrectParticipant, {
        fixtureTips: [],
        groupPlacements: [
            {
                group: 'Grupp A',
                picks: ['Saudi Arabia', 'Poland', 'Mexico', 'Argentina'],
            },
        ],
        knockoutPredictions: [],
        extraAnswers: {},
    })

    const allCorrectScore = await request('GET', `/api/scores/${allCorrectParticipant}`)
    const partialScore = await request('GET', `/api/scores/${partialCorrectParticipant}`)
    const noneScore = await request('GET', `/api/scores/${noneCorrectParticipant}`)

    assert.equal(allCorrectScore.status, 200)
    assert.equal(allCorrectScore.data.groupPlacementPoints, 4)
    assert.equal(allCorrectScore.data.groupPlacementBreakdown[0].matchedPositions.length, 4)

    assert.equal(partialScore.status, 200)
    assert.equal(partialScore.data.groupPlacementPoints, 2)
    assert.equal(partialScore.data.groupPlacementBreakdown[0].matchedPositions.length, 2)

    assert.equal(noneScore.status, 200)
    assert.equal(noneScore.data.groupPlacementPoints, 0)
    assert.equal(noneScore.data.groupPlacementBreakdown[0].matchedPositions.length, 0)
})

test('scores API knockout predictions: settled round awards per-team points', async () => {
    const roundTitle = 'Sextondelsfinal'
    const allTeams = []

    // Round of 32 requires 32 teams confirmed in knockout_advancement.
    for (let index = 1; index <= 32; index += 1) {
        const teamName = `KO Team ${index}`
        allTeams.push(teamName)

        const response = await request(
            'PUT',
            '/api/admin/knockout-advancement',
            {
                round: roundTitle,
                teamName,
            },
            { 'x-admin-code': 'vm2026-admin' },
        )
        assert.equal(response.status, 200)
    }

    const fullParticipant = await createParticipant('Knockout Full Settled', 'ko-full')
    await saveTips(fullParticipant, {
        fixtureTips: [],
        groupPlacements: [],
        knockoutPredictions: [
            {
                title: roundTitle,
                picks: allTeams,
            },
        ],
        extraAnswers: {},
    })

    const partialParticipant = await createParticipant('Knockout Partial Settled', 'ko-partial')
    await saveTips(partialParticipant, {
        fixtureTips: [],
        groupPlacements: [],
        knockoutPredictions: [
            {
                title: roundTitle,
                picks: allTeams.slice(0, 10),
            },
        ],
        extraAnswers: {},
    })

    const fullScore = await request('GET', `/api/scores/${fullParticipant}`)
    const partialScore = await request('GET', `/api/scores/${partialParticipant}`)

    assert.equal(fullScore.status, 200)
    assert.equal(fullScore.data.settledKnockoutRounds, 1)
    assert.equal(fullScore.data.knockoutPoints, 32)
    assert.equal(fullScore.data.knockoutBreakdown[0].reason, 'settled-round')
    assert.equal(fullScore.data.knockoutBreakdown[0].matchedTeams.length, 32)

    assert.equal(partialScore.status, 200)
    assert.equal(partialScore.data.settledKnockoutRounds, 1)
    assert.equal(partialScore.data.knockoutPoints, 10)
    assert.equal(partialScore.data.knockoutBreakdown[0].matchedTeams.length, 10)
})

test('scores API edge case: partial match results track settled and unsettled correctly', async () => {
    const matchIds = ['SET-C-1', 'SET-C-2', 'SET-C-3', 'SET-C-4']

    // Settle only first 3 matches.
    for (let index = 0; index < 3; index += 1) {
        const response = await request(
            'PUT',
            `/api/admin/results/${matchIds[index]}`,
            {
                stage: 'group',
                groupCode: 'C',
                homeTeam: `SET Home ${index + 1}`,
                awayTeam: `SET Away ${index + 1}`,
                kickoffAt: `2026-06-${String(index + 20).padStart(2, '0')}T19:00:00Z`,
                homeScore: 2,
                awayScore: 1,
                resultStatus: 'completed',
                settledAt: `2026-06-${String(index + 20).padStart(2, '0')}T21:00:00Z`,
            },
            { 'x-admin-code': 'vm2026-admin' },
        )
        assert.equal(response.status, 200)
    }

    const participantId = await createParticipant('Settled Tracker Participant', 'set-1')
    await saveTips(participantId, {
        fixtureTips: [
            {
                fixtureId: 'SET-C-1',
                group: 'C',
                match: 'SET Home 1 - SET Away 1',
                date: '2026-06-20T19:00:00Z',
                homeScore: 2,
                awayScore: 1,
                sign: '1',
                status: 'Öppet',
            },
            {
                fixtureId: 'SET-C-2',
                group: 'C',
                match: 'SET Home 2 - SET Away 2',
                date: '2026-06-21T19:00:00Z',
                homeScore: 3,
                awayScore: 2,
                sign: '1',
                status: 'Öppet',
            },
            {
                fixtureId: 'SET-C-3',
                group: 'C',
                match: 'SET Home 3 - SET Away 3',
                date: '2026-06-22T19:00:00Z',
                homeScore: 1,
                awayScore: 1,
                sign: 'X',
                status: 'Öppet',
            },
            {
                fixtureId: 'SET-C-4',
                group: 'C',
                match: 'SET Home 4 - SET Away 4',
                date: '2026-06-23T19:00:00Z',
                homeScore: 2,
                awayScore: 0,
                sign: '1',
                status: 'Öppet',
            },
        ],
        groupPlacements: [],
        knockoutPredictions: [],
        extraAnswers: {},
    })

    const score = await request('GET', `/api/scores/${participantId}`)

    assert.equal(score.status, 200)
    assert.equal(score.data.settledMatches, 3)
    assert.equal(score.data.fixturePoints, 4)

    const unsettledEntry = score.data.breakdown.find((entry) => entry.fixtureId === 'SET-C-4')
    assert.ok(unsettledEntry)
    assert.equal(unsettledEntry.reason, 'unsettled')
})

test('tips API preserves full knockout round pick lengths (32/16/8/4/2)', async () => {
    const participantId = await createParticipant('Knockout Length Regression', 'ko-length-1')

    const knockoutPredictions = [
        {
            title: 'Sextondelsfinal',
            picks: Array.from({ length: 32 }, (_, index) => `R32 Team ${index + 1}`),
        },
        {
            title: 'Åttondelsfinal',
            picks: Array.from({ length: 16 }, (_, index) => `R16 Team ${index + 1}`),
        },
        {
            title: 'Kvartsfinal',
            picks: Array.from({ length: 8 }, (_, index) => `QF Team ${index + 1}`),
        },
        {
            title: 'Semifinal',
            picks: Array.from({ length: 4 }, (_, index) => `SF Team ${index + 1}`),
        },
        {
            title: 'Final',
            picks: Array.from({ length: 2 }, (_, index) => `F Team ${index + 1}`),
        },
    ]

    const saveResponse = await request('PUT', `/api/tips/${participantId}`, {
        tips: {
            fixtureTips: [],
            groupPlacements: [],
            knockoutPredictions,
            extraAnswers: {},
        },
    })
    assert.equal(saveResponse.status, 200)

    const readResponse = await request('GET', `/api/tips/${participantId}`)
    assert.equal(readResponse.status, 200)

    const persistedRounds = readResponse.data.tips.knockoutPredictions
    assert.ok(Array.isArray(persistedRounds))

    const expectedLengths = {
        Sextondelsfinal: 32,
        'Åttondelsfinal': 16,
        Kvartsfinal: 8,
        Semifinal: 4,
        Final: 2,
    }

    for (const [roundTitle, expectedLength] of Object.entries(expectedLengths)) {
        const round = persistedRounds.find((entry) => entry.title === roundTitle)
        assert.ok(round, `Missing round ${roundTitle}`)
        assert.equal(round.picks.length, expectedLength)
    }
})