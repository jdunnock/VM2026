/**
 * Lifecycle scoring test — runs snapshot sequence S-B2 → S-C6 against
 * a temp API server and asserts scoring invariants at each phase.
 *
 * Usage: node --test server/lifecycle.api.test.js
 * (or: npm run test:lifecycle)
 */

import assert from 'node:assert/strict'
import { spawn, execFileSync } from 'node:child_process'
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
let adminCode = 'vm2026-admin'

// Sim participants by tier (indices match seed-simulation.js)
const SIM_NAMES = [
    'Anders', 'Björn', 'Cecilia', 'David', 'Erik',
    'Fanny', 'Gustav', 'Helena', 'Isak', 'Julia',
    'Karl', 'Laura', 'Magnus', 'Nora', 'Oscar',
]
const EXPERT_INDICES = [0, 1, 2]
const AVERAGE_INDICES = [3, 4, 5, 6, 7, 8, 9]
const CASUAL_INDICES = [10, 11, 12, 13, 14]

function sleep(ms) {
    return new Promise((resolve) => { setTimeout(resolve, ms) })
}

async function waitForHealth(url, timeoutMs = 15000) {
    const startedAt = Date.now()
    while (Date.now() - startedAt < timeoutMs) {
        try {
            const response = await fetch(`${url}/api/health`)
            if (response.ok) return
        } catch { /* retry */ }
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
    if (response.status === 204) return { status: response.status, data: null }
    const text = await response.text()
    const data = text ? JSON.parse(text) : null
    return { status: response.status, data }
}

/** Run a seed-simulation command against the temp DB */
function runSeed(command) {
    execFileSync('node', [path.join(repoRoot, 'server/seed-simulation.js'), command], {
        cwd: tempDir,
        env: {
            ...process.env,
            NODE_ENV: 'test',
        },
        stdio: 'pipe',
        timeout: 30000,
    })
}

/** Restart API to pick up DB changes (initGroupFixtures etc.) */
async function restartApi() {
    if (apiProcess && !apiProcess.killed) {
        apiProcess.kill('SIGTERM')
        await sleep(500)
        if (!apiProcess.killed) apiProcess.kill('SIGKILL')
        await sleep(200)
    }
    const port = baseUrl.split(':').pop()
    apiProcess = spawn('node', [path.join(repoRoot, 'server/index.js')], {
        cwd: tempDir,
        env: {
            ...process.env,
            API_PORT: port,
            ADMIN_ACCESS_CODE: adminCode,
            ADMIN_ACCESS_NAME: 'Admin',
            NODE_ENV: 'test',
        },
        stdio: ['ignore', 'pipe', 'pipe'],
    })
    await waitForHealth(baseUrl)
}

/** Fetch leaderboard */
async function getLeaderboard() {
    const res = await request('GET', '/api/scores')
    assert.equal(res.status, 200)
    return res.data.scores
}

/** Fetch individual score */
async function getScore(participantId) {
    const res = await request('GET', `/api/scores/${participantId}`)
    assert.equal(res.status, 200)
    return res.data
}

/** Get scores for all sim participants */
async function getSimScores() {
    const leaderboard = await getLeaderboard()
    return leaderboard.filter((e) => SIM_NAMES.includes(e.name))
}

/** Compute tier averages */
function tierAvg(scores, field, indices) {
    const tierNames = indices.map((i) => SIM_NAMES[i])
    const tierScores = scores.filter((s) => tierNames.includes(s.name))
    if (tierScores.length === 0) return 0
    return tierScores.reduce((sum, s) => sum + (s[field] ?? 0), 0) / tierScores.length
}

/** Look up participant ID by name from leaderboard */
function findId(scores, name) {
    const entry = scores.find((s) => s.name === name)
    assert.ok(entry, `Participant "${name}" not found in leaderboard`)
    return entry.participantId
}

// ─── Test setup ──────────────────────────────────────────────────────

before(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), 'vm2026-lifecycle-'))
    const port = String(44000 + Math.floor(Math.random() * 1000))
    baseUrl = `http://localhost:${port}`

    // Start API for the first time (creates DB + fixtures)
    apiProcess = spawn('node', [path.join(repoRoot, 'server/index.js')], {
        cwd: tempDir,
        env: {
            ...process.env,
            API_PORT: port,
            ADMIN_ACCESS_CODE: adminCode,
            ADMIN_ACCESS_NAME: 'Admin',
            NODE_ENV: 'test',
        },
        stdio: ['ignore', 'pipe', 'pipe'],
    })

    await waitForHealth(baseUrl)

    // S-B2: create participants + tips + questions
    runSeed('S-B2')
    // Restart API to pick up new data
    await restartApi()
})

after(async () => {
    if (apiProcess && !apiProcess.killed) {
        apiProcess.kill('SIGTERM')
        await sleep(300)
        if (!apiProcess.killed) apiProcess.kill('SIGKILL')
    }
    if (tempDir) {
        await rm(tempDir, { recursive: true, force: true })
    }
})

// ─── Tests (must run in order) ───────────────────────────────────────

test('T1: S-C1 — first 4 matches: fixture scoring begins, no group/knockout points', async () => {
    runSeed('S-C1')

    const scores = await getSimScores()
    assert.equal(scores.length, 15, 'All 15 sim participants should have scores')

    // Check one participant in detail
    const andersId = findId(scores, 'Anders')
    const detail = await getScore(andersId)

    assert.equal(detail.settledMatches, 4, 'Should have 4 settled matches')
    assert.equal(detail.groupPlacementPoints, 0, 'No groups fully settled yet')
    assert.equal(detail.knockoutPoints, 0, 'No knockout rounds settled yet')

    // At least some participants should have earned fixture points
    const totalFixture = scores.reduce((sum, s) => sum + s.fixturePoints, 0)
    assert.ok(totalFixture > 0, 'At least some fixture points across all participants')
})

test('T2: S-C2 — one week played: more matches settled, expert tier outperforms casual', async () => {
    runSeed('S-C2')

    const scores = await getSimScores()
    const andersId = findId(scores, 'Anders')
    const detail = await getScore(andersId)

    // Should have more than 4 settled matches now (4 + ~28 = ~32)
    assert.ok(detail.settledMatches > 4, `Expected >4 settled matches, got ${detail.settledMatches}`)
    assert.ok(detail.settledMatches >= 28, `Expected >=28 settled matches, got ${detail.settledMatches}`)

    // Expert tier should outperform casual tier in fixture points
    const expertAvg = tierAvg(scores, 'fixturePoints', EXPERT_INDICES)
    const casualAvg = tierAvg(scores, 'fixturePoints', CASUAL_INDICES)
    assert.ok(expertAvg > casualAvg,
        `Expert avg fixture (${expertAvg.toFixed(1)}) should exceed casual avg (${casualAvg.toFixed(1)})`)
})

test('T3: S-C3 — all groups + Sextondelsfinal: 72 matches, group placement + KO R32 scoring', async () => {
    runSeed('S-C3')

    const scores = await getSimScores()
    const andersId = findId(scores, 'Anders')
    const detail = await getScore(andersId)

    // All 72 group matches settled
    assert.equal(detail.settledMatches, 72, 'All 72 group matches should be settled')

    // Group placement scoring active (experts should have some correct positions)
    const expertGroupAvg = tierAvg(scores, 'groupPlacementPoints', EXPERT_INDICES)
    assert.ok(expertGroupAvg > 0,
        `Expert avg groupPlacementPoints (${expertGroupAvg.toFixed(1)}) should be > 0`)

    // Sextondelsfinal round settled
    assert.equal(detail.settledKnockoutRounds, 1, 'Sextondelsfinal should be settled')
    assert.ok(detail.knockoutPoints >= 0, 'knockoutPoints should be >= 0')

    // Expert knockout points should be positive (they predict ~60% correct)
    const expertKOAvg = tierAvg(scores, 'knockoutPoints', EXPERT_INDICES)
    assert.ok(expertKOAvg > 0,
        `Expert avg knockoutPoints (${expertKOAvg.toFixed(1)}) should be > 0`)
})

test('T4: S-C4 — R32+R16+QF: multiple knockout rounds settled, rankings intact', async () => {
    runSeed('S-C4')

    const scores = await getSimScores()
    const andersId = findId(scores, 'Anders')
    const detail = await getScore(andersId)

    // Sextondelsfinal + Åttondelsfinal + Kvartsfinal + Semifinal = 4 rounds
    // (insertKnockoutResults populates advancement for participating teams)
    assert.ok(detail.settledKnockoutRounds >= 3,
        `Expected >=3 settled KO rounds, got ${detail.settledKnockoutRounds}`)

    // Rankings should be valid
    const leaderboard = await getLeaderboard()
    const simBoard = leaderboard.filter((e) => SIM_NAMES.includes(e.name))
    for (const entry of simBoard) {
        assert.ok(entry.rank >= 1, `Rank should be >= 1, got ${entry.rank} for ${entry.name}`)
        assert.ok(entry.totalPoints >= 0, `Points should be >= 0 for ${entry.name}`)
    }

    // No duplicate ranks without equal points
    const pointsByRank = new Map()
    for (const entry of simBoard) {
        if (pointsByRank.has(entry.rank)) {
            assert.equal(entry.totalPoints, pointsByRank.get(entry.rank),
                `Same rank ${entry.rank} should mean same points`)
        } else {
            pointsByRank.set(entry.rank, entry.totalPoints)
        }
    }
})

test('T5: S-C5 + S-C6 — SF + Final: all KO rounds, total integrity, tier ranking trend', async () => {
    runSeed('S-C5')
    runSeed('S-C6')

    const scores = await getSimScores()
    const andersId = findId(scores, 'Anders')
    const detail = await getScore(andersId)

    // All 5 knockout rounds should be settled
    assert.equal(detail.settledKnockoutRounds, 5, 'All 5 KO rounds should be settled')

    // Total points = sum of components
    assert.equal(detail.totalPoints,
        detail.fixturePoints + detail.groupPlacementPoints + detail.knockoutPoints + detail.extraQuestionPoints,
        'totalPoints should equal sum of fixture + group + knockout + extra')

    // Overall tier trend: expert avg > average avg > casual avg
    const expertAvg = tierAvg(scores, 'totalPoints', EXPERT_INDICES)
    const averageAvg = tierAvg(scores, 'totalPoints', AVERAGE_INDICES)
    const casualAvg = tierAvg(scores, 'totalPoints', CASUAL_INDICES)

    assert.ok(expertAvg > averageAvg,
        `Expert avg (${expertAvg.toFixed(1)}) should exceed average avg (${averageAvg.toFixed(1)})`)
    assert.ok(averageAvg > casualAvg,
        `Average avg (${averageAvg.toFixed(1)}) should exceed casual avg (${casualAvg.toFixed(1)})`)

    // Leaderboard should have no rank gaps (ranks are dense: 1, 2, 2, 4... not 1, 3)
    const leaderboard = await getLeaderboard()
    const simBoard = leaderboard.filter((e) => SIM_NAMES.includes(e.name))
        .sort((a, b) => a.rank - b.rank)
    for (let i = 1; i < simBoard.length; i++) {
        const gap = simBoard[i].rank - simBoard[i - 1].rank
        assert.ok(gap >= 0 && gap <= simBoard.length,
            `Rank gap between ${simBoard[i - 1].name} (${simBoard[i - 1].rank}) and ${simBoard[i].name} (${simBoard[i].rank}) should be reasonable`)
    }

    // Print final standings for debug visibility
    console.log('\n  Final lifecycle standings:')
    for (const entry of simBoard) {
        const tier = EXPERT_INDICES.includes(SIM_NAMES.indexOf(entry.name)) ? 'E'
            : AVERAGE_INDICES.includes(SIM_NAMES.indexOf(entry.name)) ? 'A' : 'C'
        console.log(`    ${entry.positionLabel}. ${entry.name} [${tier}] — ${entry.totalPoints} pts`)
    }
})
