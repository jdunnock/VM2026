/**
 * Phase C QA simulation seed script.
 *
 * Usage: node server/seed-simulation.js <command>
 * Commands: setup | C0 | C1 | C2 | C3 | C4 | C5 | C6 | C7 | reset
 */

import fs from 'node:fs'
import path from 'node:path'
import { run, all, runTransaction, db } from './db-core.js'
import { initDatabase, closeDatabase } from './db-schema.js'
import { createParticipant, findParticipantByName } from './db-participants.js'
import { upsertTipsByParticipantId, deleteTipsByParticipantId } from './db-tips.js'
import { upsertMatchResult, upsertKnockoutAdvancement } from './db-results.js'
import { syncAdminQuestionsFromManifest, updateAdminQuestion, listAdminQuestions } from './db-questions.js'
import { hashAccessCode } from './middleware.js'
import { QUESTION_ANSWER_KEY, QUESTION_SETTLEMENT_STEPS } from './question-manifest.js'

// ─── Constants ───────────────────────────────────────────────────────

const DATA_DIR = path.resolve(process.cwd(), 'data')
const DB_PATH = path.join(DATA_DIR, 'vm2026.db')
const BACKUP_PATH = path.join(DATA_DIR, 'vm2026-pre-sim.db')
const ACCESS_CODE = '1234'

const SIM_NAMES = [
    'Anders', 'Björn', 'Cecilia', 'David', 'Erik',
    'Fanny', 'Gustav', 'Helena', 'Isak', 'Julia',
    'Karl', 'Laura', 'Magnus', 'Nora', 'Oscar',
]

// Quality tiers: expert (~65% signs), average (~45%), casual (~30%)
// Indices 0-2 = expert, 3-9 = average, 10-14 = casual
const EXPERT = [0, 1, 2]
const AVERAGE = [3, 4, 5, 6, 7, 8, 9]
const CASUAL = [10, 11, 12, 13, 14]

// ─── Group data (Swedish team names from fixtures.ts) ────────────────

const GROUP_TEAMS = {
    A: ['Mexiko', 'Sydafrika', 'Sydkorea', 'Tjeckien'],
    B: ['Kanada', 'Qatar', 'Schweiz', 'Bosnien och Hercegovina'],
    C: ['Brasilien', 'Marocko', 'Haiti', 'Skottland'],
    D: ['USA', 'Paraguay', 'Australien', 'Turkiet'],
    E: ['Tyskland', 'Curaçao', 'Elfenbenskusten', 'Ecuador'],
    F: ['Nederländerna', 'Japan', 'Sverige', 'Tunisien'],
    G: ['Belgien', 'Egypten', 'Iran', 'Nya Zeeland'],
    H: ['Spanien', 'Kap Verde', 'Saudiarabien', 'Uruguay'],
    I: ['Frankrike', 'Senegal', 'Irak', 'Norge'],
    J: ['Argentina', 'Algeriet', 'Österrike', 'Jordanien'],
    K: ['Portugal', 'DR Kongo', 'Uzbekistan', 'Colombia'],
    L: ['England', 'Kroatien', 'Ghana', 'Panama'],
}

// Match pairing order: indices into GROUP_TEAMS[group] array
const PAIR_ORDER = [[0, 1], [2, 3], [0, 2], [1, 3], [0, 3], [1, 2]]

// ─── Actual group match results [homeScore, awayScore] per group ─────
// 6 results per group following PAIR_ORDER

const GROUP_RESULTS = {
    A: [[2, 0], [1, 1], [1, 0], [0, 1], [3, 1], [1, 2]],
    B: [[1, 0], [2, 0], [0, 0], [1, 1], [2, 1], [0, 1]],
    C: [[3, 0], [0, 2], [2, 0], [1, 0], [1, 1], [3, 0]],
    D: [[2, 1], [0, 0], [1, 0], [2, 0], [0, 0], [1, 1]],
    E: [[3, 0], [1, 2], [2, 1], [0, 1], [1, 0], [0, 2]],
    F: [[2, 1], [0, 0], [2, 0], [3, 1], [2, 1], [1, 0]],
    G: [[2, 0], [1, 0], [1, 0], [2, 1], [3, 0], [1, 1]],
    H: [[3, 0], [0, 2], [1, 0], [1, 2], [2, 2], [0, 1]],
    I: [[2, 0], [0, 1], [3, 0], [1, 1], [1, 1], [2, 0]],
    J: [[2, 0], [1, 0], [3, 1], [2, 0], [1, 0], [0, 0]],
    K: [[2, 0], [0, 1], [1, 1], [0, 3], [0, 0], [1, 2]],
    L: [[2, 0], [1, 1], [3, 1], [2, 0], [1, 0], [3, 1]],
}

// Derived: final group standings (1st → 4th) per group
const GROUP_STANDINGS = {
    A: ['Mexiko', 'Sydkorea', 'Tjeckien', 'Sydafrika'],
    B: ['Schweiz', 'Kanada', 'Qatar', 'Bosnien och Hercegovina'],
    C: ['Brasilien', 'Marocko', 'Skottland', 'Haiti'],
    D: ['USA', 'Paraguay', 'Australien', 'Turkiet'],
    E: ['Tyskland', 'Ecuador', 'Elfenbenskusten', 'Curaçao'],
    F: ['Nederländerna', 'Japan', 'Tunisien', 'Sverige'],
    G: ['Belgien', 'Iran', 'Egypten', 'Nya Zeeland'],
    H: ['Spanien', 'Uruguay', 'Saudiarabien', 'Kap Verde'],
    I: ['Frankrike', 'Norge', 'Senegal', 'Irak'],
    J: ['Argentina', 'Algeriet', 'Österrike', 'Jordanien'],
    K: ['Colombia', 'Portugal', 'Uzbekistan', 'DR Kongo'],
    L: ['England', 'Kroatien', 'Panama', 'Ghana'],
}

// Best 8 third-place teams that advance
const ADVANCING_THIRDS = [
    'Skottland', 'Senegal', 'Uzbekistan', 'Tjeckien',
    'Egypten', 'Österrike', 'Elfenbenskusten', 'Saudiarabien',
]

// All 32 teams in the knockout stage
const ALL_KNOCKOUT_TEAMS = [
    ...Object.values(GROUP_STANDINGS).map(g => g[0]),   // 12 group winners
    ...Object.values(GROUP_STANDINGS).map(g => g[1]),   // 12 runners-up
    ...ADVANCING_THIRDS,                                 // 8 best thirds
]

// ─── Knockout match results ──────────────────────────────────────────
// [matchId, homeTeam, awayTeam, homeScore, awayScore]

const R32_RESULTS = [
    ['KO-R32-1', 'Mexiko', 'Saudiarabien', 2, 0],
    ['KO-R32-2', 'Schweiz', 'Skottland', 1, 0],
    ['KO-R32-3', 'Brasilien', 'Österrike', 3, 1],
    ['KO-R32-4', 'USA', 'Tjeckien', 2, 1],
    ['KO-R32-5', 'Tyskland', 'Egypten', 2, 0],
    ['KO-R32-6', 'Nederländerna', 'Elfenbenskusten', 1, 0],
    ['KO-R32-7', 'Belgien', 'Senegal', 2, 1],
    ['KO-R32-8', 'Spanien', 'Uzbekistan', 3, 0],
    ['KO-R32-9', 'Sydkorea', 'Colombia', 0, 2],
    ['KO-R32-10', 'Kanada', 'Argentina', 1, 3],
    ['KO-R32-11', 'Marocko', 'England', 0, 1],
    ['KO-R32-12', 'Paraguay', 'Kroatien', 1, 2],
    ['KO-R32-13', 'Ecuador', 'Frankrike', 1, 3],
    ['KO-R32-14', 'Japan', 'Norge', 2, 1],
    ['KO-R32-15', 'Iran', 'Algeriet', 0, 1],
    ['KO-R32-16', 'Uruguay', 'Portugal', 1, 0],
]

const R16_RESULTS = [
    ['KO-R16-1', 'Mexiko', 'Schweiz', 1, 2],
    ['KO-R16-2', 'Brasilien', 'USA', 2, 1],
    ['KO-R16-3', 'Tyskland', 'Nederländerna', 1, 0],
    ['KO-R16-4', 'Belgien', 'Spanien', 0, 1],
    ['KO-R16-5', 'Colombia', 'Argentina', 1, 2],
    ['KO-R16-6', 'England', 'Kroatien', 2, 0],
    ['KO-R16-7', 'Frankrike', 'Japan', 3, 1],
    ['KO-R16-8', 'Algeriet', 'Uruguay', 0, 1],
]

const QF_RESULTS = [
    ['KO-QF-1', 'Schweiz', 'Brasilien', 1, 2],
    ['KO-QF-2', 'Tyskland', 'Spanien', 0, 1],
    ['KO-QF-3', 'Argentina', 'England', 2, 1],
    ['KO-QF-4', 'Frankrike', 'Uruguay', 3, 0],
]

const SF_RESULTS = [
    ['KO-SF-1', 'Brasilien', 'Spanien', 2, 1],
    ['KO-SF-2', 'Argentina', 'Frankrike', 1, 2],
]

const FINAL_RESULTS = [
    ['KO-F-1', 'Brasilien', 'Frankrike', 2, 1],
]

// ─── Kickoff times (UTC, from fixtures.ts) ───────────────────────────

const GROUP_KICKOFFS = {
    'A|0|1': '2026-06-11T19:00:00Z', 'A|2|3': '2026-06-12T02:00:00Z',
    'A|0|2': '2026-06-19T01:00:00Z', 'A|1|3': '2026-06-18T16:00:00Z',
    'A|0|3': '2026-06-25T01:00:00Z', 'A|1|2': '2026-06-25T01:00:00Z',
    'B|0|1': '2026-06-18T22:00:00Z', 'B|2|3': '2026-06-18T19:00:00Z',
    'B|0|2': '2026-06-24T19:00:00Z', 'B|1|3': '2026-06-24T19:00:00Z',
    'B|0|3': '2026-06-12T19:00:00Z', 'B|1|2': '2026-06-13T19:00:00Z',
    'C|0|1': '2026-06-13T22:00:00Z', 'C|2|3': '2026-06-14T01:00:00Z',
    'C|0|2': '2026-06-20T01:00:00Z', 'C|1|3': '2026-06-19T22:00:00Z',
    'C|0|3': '2026-06-24T22:00:00Z', 'C|1|2': '2026-06-24T22:00:00Z',
    'D|0|1': '2026-06-13T01:00:00Z', 'D|2|3': '2026-06-14T04:00:00Z',
    'D|0|2': '2026-06-19T19:00:00Z', 'D|1|3': '2026-06-20T04:00:00Z',
    'D|0|3': '2026-06-26T02:00:00Z', 'D|1|2': '2026-06-26T02:00:00Z',
    'E|0|1': '2026-06-14T17:00:00Z', 'E|2|3': '2026-06-14T23:00:00Z',
    'E|0|2': '2026-06-20T20:00:00Z', 'E|1|3': '2026-06-21T00:00:00Z',
    'E|0|3': '2026-06-25T20:00:00Z', 'E|1|2': '2026-06-25T20:00:00Z',
    'F|0|1': '2026-06-14T20:00:00Z', 'F|2|3': '2026-06-15T02:00:00Z',
    'F|0|2': '2026-06-20T17:00:00Z', 'F|1|3': '2026-06-21T04:00:00Z',
    'F|0|3': '2026-06-25T23:00:00Z', 'F|1|2': '2026-06-25T23:00:00Z',
    'G|0|1': '2026-06-15T19:00:00Z', 'G|2|3': '2026-06-16T01:00:00Z',
    'G|0|2': '2026-06-21T19:00:00Z', 'G|1|3': '2026-06-22T01:00:00Z',
    'G|0|3': '2026-06-27T03:00:00Z', 'G|1|2': '2026-06-27T03:00:00Z',
    'H|0|1': '2026-06-15T16:00:00Z', 'H|2|3': '2026-06-15T22:00:00Z',
    'H|0|2': '2026-06-21T16:00:00Z', 'H|1|3': '2026-06-21T22:00:00Z',
    'H|0|3': '2026-06-27T00:00:00Z', 'H|1|2': '2026-06-27T00:00:00Z',
    'I|0|1': '2026-06-16T19:00:00Z', 'I|2|3': '2026-06-16T22:00:00Z',
    'I|0|2': '2026-06-22T21:00:00Z', 'I|1|3': '2026-06-23T00:00:00Z',
    'I|0|3': '2026-06-26T19:00:00Z', 'I|1|2': '2026-06-26T19:00:00Z',
    'J|0|1': '2026-06-17T01:00:00Z', 'J|2|3': '2026-06-17T04:00:00Z',
    'J|0|2': '2026-06-22T17:00:00Z', 'J|1|3': '2026-06-23T03:00:00Z',
    'J|0|3': '2026-06-28T02:00:00Z', 'J|1|2': '2026-06-28T02:00:00Z',
    'K|0|1': '2026-06-17T17:00:00Z', 'K|2|3': '2026-06-18T02:00:00Z',
    'K|0|2': '2026-06-23T17:00:00Z', 'K|1|3': '2026-06-24T02:00:00Z',
    'K|0|3': '2026-06-27T23:30:00Z', 'K|1|2': '2026-06-27T23:30:00Z',
    'L|0|1': '2026-06-17T20:00:00Z', 'L|2|3': '2026-06-17T23:00:00Z',
    'L|0|2': '2026-06-23T20:00:00Z', 'L|1|3': '2026-06-23T23:00:00Z',
    'L|0|3': '2026-06-27T21:00:00Z', 'L|1|2': '2026-06-27T21:00:00Z',
}

// ─── Deterministic pseudo-random ─────────────────────────────────────

function makeRng(seed) {
    let s = seed
    return function next() {
        s = (s * 1664525 + 1013904223) & 0x7FFFFFFF
        return s / 0x7FFFFFFF
    }
}

// ─── Prediction generators ───────────────────────────────────────────

function deriveSign(h, a) {
    if (h > a) return '1'
    if (h < a) return '2'
    return 'X'
}

function generateFixtureTips(participantIndex) {
    const rng = makeRng(participantIndex * 7919 + 31)
    const isExpert = EXPERT.includes(participantIndex)
    const isCasual = CASUAL.includes(participantIndex)
    const correctRate = isExpert ? 0.65 : isCasual ? 0.30 : 0.45
    const exactRate = isExpert ? 0.15 : isCasual ? 0.02 : 0.06

    const tips = []
    for (const group of 'ABCDEFGHIJKL'.split('')) {
        const teams = GROUP_TEAMS[group]
        const results = GROUP_RESULTS[group]

        for (let m = 0; m < 6; m++) {
            const [hi, ai] = PAIR_ORDER[m]
            const [actualH, actualA] = results[m]
            const fixtureId = `G-${group}-${m + 1}`
            const home = teams[hi]
            const away = teams[ai]
            const kickoffKey = `${group}|${hi}|${ai}`
            const kickoffUtc = GROUP_KICKOFFS[kickoffKey]
            const kickoff = kickoffUtc ? formatKickoff(new Date(kickoffUtc)) : '2026-06-11 21:00'

            let homeScore, awayScore, sign
            const r = rng()

            if (r < exactRate) {
                // Exact score match
                homeScore = actualH
                awayScore = actualA
                sign = deriveSign(homeScore, awayScore)
            } else if (r < correctRate) {
                // Correct sign but different score
                const actualSign = deriveSign(actualH, actualA)
                if (actualSign === '1') {
                    homeScore = actualH + 1; awayScore = actualA
                } else if (actualSign === '2') {
                    homeScore = actualH; awayScore = actualA + 1
                } else {
                    homeScore = actualH + 1; awayScore = actualA + 1
                }
                sign = actualSign
            } else {
                // Wrong prediction
                const wrongScores = [[0, 1], [1, 0], [1, 2], [2, 1], [0, 0], [2, 0]]
                const pick = wrongScores[Math.floor(rng() * wrongScores.length)]
                const actualSign = deriveSign(actualH, actualA)
                // Ensure different sign
                if (deriveSign(pick[0], pick[1]) === actualSign) {
                    homeScore = actualSign === '1' ? 0 : 2
                    awayScore = actualSign === '2' ? 0 : 1
                } else {
                    homeScore = pick[0]
                    awayScore = pick[1]
                }
                sign = deriveSign(homeScore, awayScore)
            }

            tips.push({
                fixtureId,
                group,
                match: `${home} - ${away}`,
                date: kickoff,
                homeScore,
                awayScore,
                sign,
                status: 'Låst',
            })
        }
    }
    return tips
}

function generateGroupPlacements(participantIndex) {
    const rng = makeRng(participantIndex * 6271 + 17)
    const isExpert = EXPERT.includes(participantIndex)
    const isCasual = CASUAL.includes(participantIndex)

    const placements = []
    for (const group of 'ABCDEFGHIJKL'.split('')) {
        const actual = GROUP_STANDINGS[group]
        const picks = [...actual]

        if (isCasual) {
            // Shuffle 2-3 positions
            for (let i = 0; i < 3; i++) {
                const a = Math.floor(rng() * 4)
                const b = Math.floor(rng() * 4)
                    ;[picks[a], picks[b]] = [picks[b], picks[a]]
            }
        } else if (!isExpert) {
            // Swap 1-2 positions
            const swaps = rng() > 0.5 ? 2 : 1
            for (let i = 0; i < swaps; i++) {
                const a = Math.floor(rng() * 4)
                const b = (a + 1 + Math.floor(rng() * 3)) % 4
                    ;[picks[a], picks[b]] = [picks[b], picks[a]]
            }
        }
        // Expert: keep actual order (most of the time)
        if (isExpert && rng() < 0.3) {
            const a = Math.floor(rng() * 2) + 2  // swap 3rd/4th only
            const b = (a === 2) ? 3 : 2
                ;[picks[a], picks[b]] = [picks[b], picks[a]]
        }

        placements.push({ group: `Grupp ${group}`, picks })
    }
    return placements
}

function generateKnockoutPredictions(participantIndex) {
    const rng = makeRng(participantIndex * 4999 + 53)
    const isExpert = EXPERT.includes(participantIndex)
    const isCasual = CASUAL.includes(participantIndex)

    // Actual teams per round
    const winnerOf = (r) => r[3] > r[4] ? r[1] : r[2]
    const actualByRound = {
        Sextondelsfinal: ALL_KNOCKOUT_TEAMS,
        'Åttondelsfinal': R32_RESULTS.map(winnerOf),
        Kvartsfinal: R16_RESULTS.map(winnerOf),
        Semifinal: QF_RESULTS.map(winnerOf),
        Final: SF_RESULTS.map(winnerOf),
    }

    // All 48 teams for picking non-qualifying teams
    const allTeams = Object.values(GROUP_TEAMS).flat()

    const predictions = []
    for (const [title, actual] of Object.entries(actualByRound)) {
        const count = actual.length
        const picks = []

        for (let i = 0; i < count; i++) {
            const correctChance = isExpert ? 0.6 : isCasual ? 0.25 : 0.4
            if (rng() < correctChance) {
                picks.push(actual[i])
            } else {
                // Pick a random team from all teams
                const randomTeam = allTeams[Math.floor(rng() * allTeams.length)]
                picks.push(randomTeam)
            }
        }

        predictions.push({ title, picks })
    }

    return predictions
}

function generateExtraAnswers(participantIndex, simQuestions, allPublishedQuestions) {
    const rng = makeRng(participantIndex * 2203 + 41)
    const isExpert = EXPERT.includes(participantIndex)
    const isCasual = CASUAL.includes(participantIndex)
    const correctRate = isExpert ? 0.6 : isCasual ? 0.2 : 0.4

    // Build lookup for manifest question correct answers by id
    const simCorrectById = {}
    for (const question of simQuestions) {
        const answer = question.slug ? QUESTION_ANSWER_KEY[question.slug] : null
        if (answer?.correctAnswer) {
            simCorrectById[question.id] = answer.correctAnswer
        }
    }

    const answers = {}
    for (const q of allPublishedQuestions) {
        const options = typeof q.options === 'string' ? JSON.parse(q.options) : (q.options ?? [])
        if (options.length === 0) continue
        const correctAnswer = simCorrectById[q.id]
        if (correctAnswer && rng() < correctRate) {
            answers[String(q.id)] = correctAnswer
        } else if (correctAnswer) {
            // Pick wrong answer for sim question
            const wrong = options.filter(o => o !== correctAnswer)
            answers[String(q.id)] = wrong.length > 0 ? wrong[Math.floor(rng() * wrong.length)] : options[0]
        } else {
            // Non-sim question: pick random option
            answers[String(q.id)] = options[Math.floor(rng() * options.length)]
        }
    }
    return answers
}

// ─── Utility ─────────────────────────────────────────────────────────

function formatKickoff(date) {
    const y = date.getFullYear()
    const mo = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    const h = String(date.getHours()).padStart(2, '0')
    const mi = String(date.getMinutes()).padStart(2, '0')
    return `${y}-${mo}-${d} ${h}:${mi}`
}

function addHours(dateStr, hours) {
    const d = new Date(dateStr)
    d.setHours(d.getHours() + hours)
    return d.toISOString()
}

// ─── Phase handlers ──────────────────────────────────────────────────

async function phaseSetup() {
    // Backup DB
    if (fs.existsSync(DB_PATH)) {
        fs.copyFileSync(DB_PATH, BACKUP_PATH)
        console.log(`Backup saved: ${BACKUP_PATH}`)
    }

    const codeHash = hashAccessCode(ACCESS_CODE)

    // Create 15 participants
    const participantIds = []
    for (const name of SIM_NAMES) {
        const existing = await findParticipantByName(name)
        if (existing) {
            console.log(`  Participant "${name}" already exists (id=${existing.id}), skipping create`)
            participantIds.push(existing.id)
            continue
        }
        const p = await createParticipant(name, codeHash)
        console.log(`  Created participant "${name}" (id=${p.id})`)
        participantIds.push(p.id)
    }

    await syncAdminQuestionsFromManifest()
    const questions = await listAdminQuestions()
    console.log(`  Synced ${questions.length} manifest questions`)

    const allPublished = questions.filter((q) => (q.status ?? '') === 'published')
    console.log(`  Found ${allPublished.length} published questions total`)

    // Generate and save tips for each participant
    for (let i = 0; i < SIM_NAMES.length; i++) {
        const tips = {
            fixtureTips: generateFixtureTips(i),
            groupPlacements: generateGroupPlacements(i),
            knockoutPredictions: generateKnockoutPredictions(i),
            extraAnswers: generateExtraAnswers(i, questions, allPublished),
        }
        await upsertTipsByParticipantId(participantIds[i], tips)
        console.log(`  Saved tips for "${SIM_NAMES[i]}"`)
    }

    console.log(`\nSetup complete: ${participantIds.length} participants, ${questions.length} manifest questions, ${allPublished.length} total published questions`)
}

async function phaseC0() {
    console.log('C0: Deadline passed. No match results inserted.')
    console.log('All participants should show 0 points.')
}

async function insertGroupMatchResults(groups) {
    let count = 0
    for (const group of groups) {
        const teams = GROUP_TEAMS[group]
        const results = GROUP_RESULTS[group]
        for (let m = 0; m < results.length; m++) {
            const [hi, ai] = PAIR_ORDER[m]
            const [homeScore, awayScore] = results[m]
            const matchId = `G-${group}-${m + 1}`
            const kickoffKey = `${group}|${hi}|${ai}`
            const kickoffUtc = GROUP_KICKOFFS[kickoffKey] || '2026-06-11T19:00:00Z'

            await upsertMatchResult({
                matchId,
                stage: 'group',
                round: null,
                groupCode: group,
                homeTeam: teams[hi],
                awayTeam: teams[ai],
                kickoffAt: formatKickoff(new Date(kickoffUtc)),
                homeScore,
                awayScore,
                resultStatus: 'completed',
                settledAt: addHours(kickoffUtc, 2),
            })
            count++
        }
    }
    return count
}

// Insert group matches chronologically up to (and including) a cutoff date.
// If excludeBefore is set, only matches AFTER that date are inserted (for incremental phases).
async function insertGroupMatchResultsBefore(cutoffUtc, excludeBeforeUtc) {
    const allGroups = Object.keys(GROUP_RESULTS)
    const cutoff = new Date(cutoffUtc).getTime()
    const excludeBefore = excludeBeforeUtc ? new Date(excludeBeforeUtc).getTime() : 0
    let count = 0

    // Build all matches, sort by kickoff
    const allMatches = []
    for (const group of allGroups) {
        const teams = GROUP_TEAMS[group]
        const results = GROUP_RESULTS[group]
        for (let m = 0; m < results.length; m++) {
            const [hi, ai] = PAIR_ORDER[m]
            const kickoffKey = `${group}|${hi}|${ai}`
            const kickoffUtc = GROUP_KICKOFFS[kickoffKey] || '2026-06-11T19:00:00Z'
            allMatches.push({ group, m, hi, ai, kickoffUtc, results: results[m], teams })
        }
    }
    allMatches.sort((a, b) => a.kickoffUtc.localeCompare(b.kickoffUtc))

    for (const match of allMatches) {
        const kickoffMs = new Date(match.kickoffUtc).getTime()
        if (kickoffMs > cutoff) continue
        if (kickoffMs <= excludeBefore) continue

        const [homeScore, awayScore] = match.results
        const matchId = `G-${match.group}-${match.m + 1}`

        await upsertMatchResult({
            matchId,
            stage: 'group',
            round: null,
            groupCode: match.group,
            homeTeam: match.teams[match.hi],
            awayTeam: match.teams[match.ai],
            kickoffAt: formatKickoff(new Date(match.kickoffUtc)),
            homeScore,
            awayScore,
            resultStatus: 'completed',
            settledAt: addHours(match.kickoffUtc, 2),
        })
        count++
    }
    return count
}

async function insertKnockoutResults(resultSet) {
    const advancementsByRound = new Map()

    for (const [matchId, home, away, homeScore, awayScore] of resultSet) {
        const round = matchId.startsWith('KO-R32') ? 'Sextondelsfinal'
            : matchId.startsWith('KO-R16') ? 'Åttondelsfinal'
                : matchId.startsWith('KO-QF') ? 'Kvartsfinal'
                    : matchId.startsWith('KO-SF') ? 'Semifinal'
                        : 'Final'

        await upsertMatchResult({
            matchId,
            stage: 'knockout',
            round,
            groupCode: null,
            homeTeam: home,
            awayTeam: away,
            kickoffAt: '2026-07-01 20:00',
            homeScore,
            awayScore,
            resultStatus: 'completed',
            settledAt: '2026-07-01T22:00:00Z',
        })

        // Track all participating teams for knockout advancement
        // (both home and away are teams that advanced TO this round)
        if (!advancementsByRound.has(round)) advancementsByRound.set(round, new Set())
        advancementsByRound.get(round).add(home)
        advancementsByRound.get(round).add(away)
    }

    // Populate knockout_advancement table with participating teams
    for (const [round, teams] of advancementsByRound) {
        for (const teamName of teams) {
            await upsertKnockoutAdvancement({
                round,
                teamName,
                confirmedAt: '2026-07-01T22:00:00Z',
                source: 'manual',
            })
        }
    }
}

async function settleQuestionBySlug(slug, questions) {
    const q = (questions || await listAdminQuestions()).find((question) => question.slug === slug)
    const answer = QUESTION_ANSWER_KEY[slug]
    if (!q || !answer?.correctAnswer) return
    await updateAdminQuestion(q.id, {
        ...q,
        correctAnswer: answer.correctAnswer,
        acceptedAnswers: answer.acceptedAnswers ?? [],
    })
}

// C1 cutoff: end of June 20 — all round-1 matches (all 12 groups) + round 2 for groups A-F
const C1_CUTOFF = '2026-06-21T04:59:59Z'

// ─── Snapshot cutoffs (S-* commands) ─────────────────────────────────
// SC1: first 4 matches (thru June 12 US evening)
const SC1_CUTOFF = '2026-06-13T06:00:00Z'
// SC2: one week played (thru June 19 US evening)
const SC2_CUTOFF = '2026-06-20T05:00:00Z'
// SC3: all group stage matches (thru June 27 US evening)
const SC3_CUTOFF = '2026-06-28T23:59:59Z'

async function phaseC1() {
    // Chronological: all group matches up to C1 cutoff (34 matches across all groups)
    const count = await insertGroupMatchResultsBefore(C1_CUTOFF)
    console.log(`C1: Inserted ${count} group match results (chronological, up to June 20)`)
}

async function phaseC2() {
    // All remaining group matches (38 matches, June 21-28)
    const remaining = await insertGroupMatchResultsBefore('2026-06-28T23:59:59Z', C1_CUTOFF)
    console.log(`C2: Inserted ${remaining} remaining group match results`)

    const questions = await listAdminQuestions()
    for (const slug of QUESTION_SETTLEMENT_STEPS.C2) {
        await settleQuestionBySlug(slug, questions)
    }
    console.log(`C2: Settled ${QUESTION_SETTLEMENT_STEPS.C2.length} Gruppspelsfrågor`)
}

async function phaseC3() {
    await insertKnockoutResults(R32_RESULTS)
    console.log(`C3: Inserted ${R32_RESULTS.length} R32 match results`)
}

async function phaseC4() {
    await insertKnockoutResults(R16_RESULTS)
    console.log(`C4: Inserted ${R16_RESULTS.length} R16 match results`)
}

async function phaseC5() {
    await insertKnockoutResults(QF_RESULTS)
    console.log(`C5: Inserted ${QF_RESULTS.length} QF match results`)
}

async function phaseC6() {
    await insertKnockoutResults(SF_RESULTS)
    console.log(`C6: Inserted ${SF_RESULTS.length} SF match results`)

    const questions = await listAdminQuestions()
    for (const slug of QUESTION_SETTLEMENT_STEPS.C6) {
        await settleQuestionBySlug(slug, questions)
    }
    console.log(`C6: Settled ${QUESTION_SETTLEMENT_STEPS.C6.length} Slutspelsfrågor`)
}

async function phaseC7() {
    await insertKnockoutResults(FINAL_RESULTS)
    console.log(`C7: Inserted ${FINAL_RESULTS.length} final match results`)

    const questions = await listAdminQuestions()
    for (const slug of QUESTION_SETTLEMENT_STEPS.C7) {
        await settleQuestionBySlug(slug, questions)
    }
    console.log(`C7: Settled ${QUESTION_SETTLEMENT_STEPS.C7.length} remaining questions`)
}

async function phaseReset() {
    console.log('Resetting simulation data...')

    // Delete sim participants and their tips
    for (const name of SIM_NAMES) {
        const p = await findParticipantByName(name)
        if (p) {
            await deleteTipsByParticipantId(p.id)
            await run('DELETE FROM participant_fixture_tips WHERE participant_id = ?', [p.id])
            await run('DELETE FROM participant_group_placements WHERE participant_id = ?', [p.id])
            await run('DELETE FROM participant_knockout_predictions WHERE participant_id = ?', [p.id])
            await run('DELETE FROM participant_extra_answers WHERE participant_id = ?', [p.id])
            // Legacy table — delete if it still exists
            await run('DELETE FROM participant_special_predictions WHERE participant_id = ?', [p.id]).catch(() => {})
            await run('DELETE FROM participants WHERE id = ?', [p.id])
            console.log(`  Deleted participant "${name}" (id=${p.id})`)
        }
    }

    // Clear all match results
    await run('DELETE FROM match_results')
    console.log('  Cleared match_results')

    // Clear knockout advancement data
    await run('DELETE FROM knockout_advancement')
    console.log('  Cleared knockout_advancement')

    const allQ = await listAdminQuestions()
    for (const q of allQ) {
        await updateAdminQuestion(q.id, {
            ...q,
            correctAnswer: '',
            acceptedAnswers: [],
        })
    }
    console.log('  Reset manifest question settlements')

    console.log('Reset complete.')
}

// ─── Snapshot phase handlers (S-B1 through S-C6) ─────────────────────

async function insertKnockoutAdvancementOnly(teams, round) {
    let count = 0
    for (const teamName of teams) {
        await upsertKnockoutAdvancement({
            round,
            teamName,
            confirmedAt: new Date().toISOString(),
            source: 'manual',
        })
        count++
    }
    return count
}

async function phaseSB1() {
    await phaseReset()
    console.log('\nS-B1: Clean simulation state. Manifest questions remain available; no simulated participants or results exist.')
}

async function phaseSB2() {
    await phaseSetup()
    console.log('\nS-B2: 15 participants + tips + manifest questions ready. Phase B complete.')
}

async function phaseSC1() {
    const count = await insertGroupMatchResultsBefore(SC1_CUTOFF)
    console.log(`S-C1: Inserted ${count} group match results (first 4 matches, thru June 12)`)
}

async function phaseSC2() {
    const count = await insertGroupMatchResultsBefore(SC2_CUTOFF, SC1_CUTOFF)
    console.log(`S-C2: Inserted ${count} additional group match results (thru June 19)`)
}

async function phaseSC3() {
    const remaining = await insertGroupMatchResultsBefore(SC3_CUTOFF, SC2_CUTOFF)
    console.log(`S-C3: Inserted ${remaining} remaining group match results (thru June 27)`)

    // Insert Sextondelsfinal advancement (32 teams) — no match results yet
    const advCount = await insertKnockoutAdvancementOnly(ALL_KNOCKOUT_TEAMS, 'Sextondelsfinal')
    console.log(`S-C3: Inserted ${advCount} Sextondelsfinal advancement teams`)
}

async function phaseSC4() {
    // R32 match results
    await insertKnockoutResults(R32_RESULTS)
    console.log(`S-C4: Inserted ${R32_RESULTS.length} R32 match results`)

    // R16 match results
    await insertKnockoutResults(R16_RESULTS)
    console.log(`S-C4: Inserted ${R16_RESULTS.length} R16 match results`)

    // QF match results
    await insertKnockoutResults(QF_RESULTS)
    console.log(`S-C4: Inserted ${QF_RESULTS.length} QF match results`)
}

async function phaseSC5() {
    await insertKnockoutResults(SF_RESULTS)
    console.log(`S-C5: Inserted ${SF_RESULTS.length} SF match results`)
}

async function phaseSC6() {
    await insertKnockoutResults(FINAL_RESULTS)
    console.log(`S-C6: Inserted ${FINAL_RESULTS.length} final match results`)
}

// ─── CLI dispatcher ──────────────────────────────────────────────────

const PHASES = {
    setup: phaseSetup,
    C0: phaseC0,
    C1: phaseC1,
    C2: phaseC2,
    C3: phaseC3,
    C4: phaseC4,
    C5: phaseC5,
    C6: phaseC6,
    C7: phaseC7,
    reset: phaseReset,
    'S-B1': phaseSB1,
    'S-B2': phaseSB2,
    'S-C1': phaseSC1,
    'S-C2': phaseSC2,
    'S-C3': phaseSC3,
    'S-C4': phaseSC4,
    'S-C5': phaseSC5,
    'S-C6': phaseSC6,
}

async function main() {
    const command = process.argv[2]

    if (!command || !PHASES[command]) {
        console.log('Usage: node server/seed-simulation.js <command>')
        console.log('')
        console.log('Legacy commands: setup | C0 | C1 | C2 | C3 | C4 | C5 | C6 | C7 | reset')
        console.log('')
        console.log('Snapshot commands (lifecycle QA):')
        console.log('  S-B1  Clean simulation state (manifest questions only)')
        console.log('  S-B2  15 participants + tips + 15 manifest questions')
        console.log('  S-C1  First 4 matches settled (12.6)')
        console.log('  S-C2  One week played (19.6)')
        console.log('  S-C3  All group matches + Sextondelsfinal teams (27.6)')
        console.log('  S-C4  R32 + R16 + QF played (11.7)')
        console.log('  S-C5  Semifinals played (15.7)')
        console.log('  S-C6  Final played (19.7)')
        console.log('')
        console.log('Snapshot workflow: S-B1 → S-B2 → S-C1 → S-C2 → S-C3 → S-C4 → S-C5 → S-C6')
        console.log('Legacy workflow:   setup → C0 → C1 → C2 → C3 → C4 → C5 → C6 → C7')
        console.log('Reset:             reset (clean up all simulation data)')
        process.exit(1)
    }

    await initDatabase()
    console.log(`\n=== Simulation: ${command} ===\n`)

    try {
        await PHASES[command]()
    } finally {
        await closeDatabase()
    }

    console.log('\nDone.')
}

main().catch((err) => {
    console.error('Simulation failed:', err)
    process.exit(1)
})

// ─── Exports for automated tests ────────────────────────────────────

export {
    phaseSetup, phaseReset,
    phaseSB1, phaseSB2, phaseSC1, phaseSC2, phaseSC3, phaseSC4, phaseSC5, phaseSC6,
    SIM_NAMES, EXPERT, AVERAGE, CASUAL,
}
