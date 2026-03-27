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
import { upsertMatchResult } from './db-results.js'
import { upsertSpecialResults } from './db-special.js'
import { createAdminQuestion, updateAdminQuestion, listAdminQuestions } from './db-questions.js'
import { hashAccessCode } from './middleware.js'

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
  A: ['Mexiko', 'Sydafrika', 'Sydkorea', 'DEN/MKD/CZE/IRL'],
  B: ['Kanada', 'Qatar', 'Schweiz', 'ITA/NIR/WAL/BIH'],
  C: ['Brasilien', 'Marocko', 'Haiti', 'Skottland'],
  D: ['USA', 'Paraguay', 'Australien', 'TUR/ROU/SVK/KOS'],
  E: ['Tyskland', 'Curaçao', 'Elfenbenskusten', 'Ecuador'],
  F: ['Nederländerna', 'Japan', 'UKR/SWE/POL/ALB', 'Tunisien'],
  G: ['Belgien', 'Egypten', 'Iran', 'Nya Zeeland'],
  H: ['Spanien', 'Kap Verde', 'Saudiarabien', 'Uruguay'],
  I: ['Frankrike', 'Senegal', 'BOL/SUR/IRQ', 'Norge'],
  J: ['Argentina', 'Algeriet', 'Österrike', 'Jordanien'],
  K: ['Portugal', 'NCL/JAM/COD', 'Uzbekistan', 'Colombia'],
  L: ['England', 'Kroatien', 'Ghana', 'Panama'],
}

// Match pairing order: indices into GROUP_TEAMS[group] array
const PAIR_ORDER = [[0,1],[2,3],[0,2],[1,3],[0,3],[1,2]]

// ─── Actual group match results [homeScore, awayScore] per group ─────
// 6 results per group following PAIR_ORDER

const GROUP_RESULTS = {
  A: [[2,0],[1,1],[1,0],[0,1],[3,1],[1,2]],
  B: [[1,0],[2,0],[0,0],[1,1],[2,1],[0,1]],
  C: [[3,0],[0,2],[2,0],[1,0],[1,1],[3,0]],
  D: [[2,1],[0,0],[1,0],[2,0],[0,0],[1,1]],
  E: [[3,0],[1,2],[2,1],[0,1],[1,0],[0,2]],
  F: [[2,1],[0,0],[2,0],[3,1],[2,1],[1,0]],
  G: [[2,0],[1,0],[1,0],[2,1],[3,0],[1,1]],
  H: [[3,0],[0,2],[1,0],[1,2],[2,2],[0,1]],
  I: [[2,0],[0,1],[3,0],[1,1],[1,1],[2,0]],
  J: [[2,0],[1,0],[3,1],[2,0],[1,0],[0,0]],
  K: [[2,0],[0,1],[1,1],[0,3],[0,0],[1,2]],
  L: [[2,0],[1,1],[3,1],[2,0],[1,0],[3,1]],
}

// Derived: final group standings (1st → 4th) per group
const GROUP_STANDINGS = {
  A: ['Mexiko', 'Sydkorea', 'DEN/MKD/CZE/IRL', 'Sydafrika'],
  B: ['Schweiz', 'Kanada', 'Qatar', 'ITA/NIR/WAL/BIH'],
  C: ['Brasilien', 'Marocko', 'Skottland', 'Haiti'],
  D: ['USA', 'Paraguay', 'Australien', 'TUR/ROU/SVK/KOS'],
  E: ['Tyskland', 'Ecuador', 'Elfenbenskusten', 'Curaçao'],
  F: ['Nederländerna', 'Japan', 'Tunisien', 'UKR/SWE/POL/ALB'],
  G: ['Belgien', 'Iran', 'Egypten', 'Nya Zeeland'],
  H: ['Spanien', 'Uruguay', 'Saudiarabien', 'Kap Verde'],
  I: ['Frankrike', 'Norge', 'Senegal', 'BOL/SUR/IRQ'],
  J: ['Argentina', 'Algeriet', 'Österrike', 'Jordanien'],
  K: ['Colombia', 'Portugal', 'Uzbekistan', 'NCL/JAM/COD'],
  L: ['England', 'Kroatien', 'Panama', 'Ghana'],
}

// Best 8 third-place teams that advance
const ADVANCING_THIRDS = [
  'Skottland', 'Senegal', 'Uzbekistan', 'DEN/MKD/CZE/IRL',
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
  ['KO-R32-1',  'Mexiko',         'Saudiarabien',     2, 0],
  ['KO-R32-2',  'Schweiz',        'Skottland',        1, 0],
  ['KO-R32-3',  'Brasilien',      'Österrike',        3, 1],
  ['KO-R32-4',  'USA',            'DEN/MKD/CZE/IRL',  2, 1],
  ['KO-R32-5',  'Tyskland',       'Egypten',          2, 0],
  ['KO-R32-6',  'Nederländerna',  'Elfenbenskusten',  1, 0],
  ['KO-R32-7',  'Belgien',        'Senegal',          2, 1],
  ['KO-R32-8',  'Spanien',        'Uzbekistan',       3, 0],
  ['KO-R32-9',  'Sydkorea',       'Colombia',         0, 2],
  ['KO-R32-10', 'Kanada',         'Argentina',        1, 3],
  ['KO-R32-11', 'Marocko',        'England',          0, 1],
  ['KO-R32-12', 'Paraguay',       'Kroatien',         1, 2],
  ['KO-R32-13', 'Ecuador',        'Frankrike',        1, 3],
  ['KO-R32-14', 'Japan',          'Norge',            2, 1],
  ['KO-R32-15', 'Iran',           'Algeriet',         0, 1],
  ['KO-R32-16', 'Uruguay',        'Portugal',         1, 0],
]

const R16_RESULTS = [
  ['KO-R16-1', 'Mexiko',    'Schweiz',        1, 2],
  ['KO-R16-2', 'Brasilien', 'USA',            2, 1],
  ['KO-R16-3', 'Tyskland',  'Nederländerna',  1, 0],
  ['KO-R16-4', 'Belgien',   'Spanien',        0, 1],
  ['KO-R16-5', 'Colombia',  'Argentina',      1, 2],
  ['KO-R16-6', 'England',   'Kroatien',       2, 0],
  ['KO-R16-7', 'Frankrike', 'Japan',          3, 1],
  ['KO-R16-8', 'Algeriet',  'Uruguay',        0, 1],
]

const QF_RESULTS = [
  ['KO-QF-1', 'Schweiz',   'Brasilien',  1, 2],
  ['KO-QF-2', 'Tyskland',  'Spanien',    0, 1],
  ['KO-QF-3', 'Argentina', 'England',    2, 1],
  ['KO-QF-4', 'Frankrike', 'Uruguay',    3, 0],
]

const SF_RESULTS = [
  ['KO-SF-1', 'Brasilien', 'Spanien',   2, 1],
  ['KO-SF-2', 'Argentina', 'Frankrike', 1, 2],
]

const FINAL_RESULTS = [
  ['KO-F-1', 'Brasilien', 'Frankrike', 2, 1],
]

// Tournament results
const TOURNAMENT_WINNER = 'Brasilien'
const TOP_SCORER = 'Kylian Mbappé'

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

// ─── Admin questions ─────────────────────────────────────────────────

const ADMIN_QUESTIONS = [
  {
    questionText: 'Vilken grupp får flest mål totalt?',
    category: 'Gruppspelsfrågor',
    options: ['Grupp A-D', 'Grupp E-H', 'Grupp I-L'],
    correctAnswer: '',
    points: 3,
    lockTime: '2026-06-09T22:00:00',
    status: 'published',
  },
  {
    questionText: 'Hur många 0-0-matcher blir det i gruppspelet?',
    category: 'Gruppspelsfrågor',
    options: ['0-3', '4-6', '7+'],
    correctAnswer: '',
    points: 3,
    lockTime: '2026-06-09T22:00:00',
    status: 'published',
  },
  {
    questionText: 'Kommer något europeiskt lag att nå semifinal?',
    category: 'Slutspelsfrågor',
    options: ['Ja', 'Nej'],
    correctAnswer: '',
    points: 4,
    lockTime: '2026-06-28T22:00:00',
    status: 'published',
  },
  {
    questionText: 'Hur många mål görs i kvartsfinalerna totalt?',
    category: 'Slutspelsfrågor',
    options: ['0-8', '9-12', '13+'],
    correctAnswer: '',
    points: 4,
    lockTime: '2026-06-28T22:00:00',
    status: 'published',
  },
  {
    questionText: 'Vilken kontinent vinner VM 2026?',
    category: '33-33-33 frågor',
    options: ['Europa', 'Sydamerika', 'Övrig'],
    correctAnswer: '',
    points: 5,
    lockTime: '2026-06-09T22:00:00',
    status: 'published',
  },
]

// Correct answers per question index (applied during settlement phases)
const QUESTION_ANSWERS = ['Grupp E-H', '4-6', 'Ja', '9-12', 'Sydamerika']

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

function generateSpecialPredictions(participantIndex) {
  const rng = makeRng(participantIndex * 3571 + 97)
  const isExpert = EXPERT.includes(participantIndex)

  const winnerOptions = ['Brasilien', 'Frankrike', 'Argentina', 'Spanien', 'Tyskland', 'England']
  const scorerOptions = ['Kylian Mbappé', 'Lionel Messi', 'Erling Haaland', 'Harry Kane', 'Vinícius Jr.', 'Lamine Yamal']

  let winner, topScorer

  if (isExpert && rng() > 0.4) {
    winner = TOURNAMENT_WINNER
    topScorer = rng() > 0.5 ? TOP_SCORER : scorerOptions[Math.floor(rng() * scorerOptions.length)]
  } else {
    winner = winnerOptions[Math.floor(rng() * winnerOptions.length)]
    topScorer = scorerOptions[Math.floor(rng() * scorerOptions.length)]
  }

  return { winner, topScorer }
}

function generateExtraAnswers(participantIndex, questions) {
  const rng = makeRng(participantIndex * 2203 + 41)
  const isExpert = EXPERT.includes(participantIndex)
  const isCasual = CASUAL.includes(participantIndex)
  const correctRate = isExpert ? 0.6 : isCasual ? 0.2 : 0.4

  const answers = {}
  for (let qi = 0; qi < questions.length; qi++) {
    const q = questions[qi]
    const correctAnswer = QUESTION_ANSWERS[qi]
    const options = typeof q.options === 'string' ? JSON.parse(q.options) : (q.options ?? [])
    if (rng() < correctRate) {
      answers[String(q.id)] = correctAnswer
    } else {
      // Pick wrong answer
      const wrong = options.filter(o => o !== correctAnswer)
      answers[String(q.id)] = wrong[Math.floor(rng() * wrong.length)]
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

  // Create admin questions (always create new ones, keep existing untouched)
  let questions = []
  const existingQuestions = await listAdminQuestions()
  // Check if our sim questions already exist (by matching text)
  const simTexts = new Set(ADMIN_QUESTIONS.map(q => q.questionText))
  const existingSim = existingQuestions.filter(q => simTexts.has(q.questionText ?? q.question_text))
  if (existingSim.length >= 5) {
    console.log(`  Sim questions already exist, reusing`)
    questions = existingSim.slice(0, 5)
  } else {
    for (const qDef of ADMIN_QUESTIONS) {
      const q = await createAdminQuestion(qDef)
      questions.push(q)
      console.log(`  Created question id=${q.id}: "${q.questionText}"`)
    }
  }

  // Generate and save tips for each participant
  for (let i = 0; i < SIM_NAMES.length; i++) {
    const tips = {
      fixtureTips: generateFixtureTips(i),
      groupPlacements: generateGroupPlacements(i),
      knockoutPredictions: generateKnockoutPredictions(i),
      specialPredictions: generateSpecialPredictions(i),
      extraAnswers: generateExtraAnswers(i, questions),
    }
    await upsertTipsByParticipantId(participantIds[i], tips)
    console.log(`  Saved tips for "${SIM_NAMES[i]}"`)
  }

  console.log(`\nSetup complete: ${participantIds.length} participants, ${questions.length} questions`)
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

async function insertKnockoutResults(resultSet) {
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
  }
}

async function settleQuestion(questionIndex, questions) {
  const allQ = questions || await listAdminQuestions()
  // Find sim questions by matching text, sort by ID ascending
  const simTexts = ADMIN_QUESTIONS.map(q => q.questionText)
  const simQ = allQ
    .filter(q => simTexts.includes(q.questionText ?? q.question_text))
    .sort((a, b) => a.id - b.id)
  if (questionIndex >= simQ.length) return
  const q = simQ[questionIndex]
  const correctAnswer = QUESTION_ANSWERS[questionIndex]
  await updateAdminQuestion(q.id, {
    questionText: q.questionText ?? q.question_text,
    category: q.category,
    options: typeof q.options === 'string' ? JSON.parse(q.options) : (q.options ?? []),
    correctAnswer,
    points: q.points,
    lockTime: q.lockTime ?? q.lock_time,
    status: 'published',
  })
}

async function phaseC1() {
  // Groups A-D complete (24 matches)
  const count = await insertGroupMatchResults(['A', 'B', 'C', 'D'])
  console.log(`C1: Inserted ${count} group match results (groups A-D)`)
}

async function phaseC2() {
  // All group matches complete (remaining E-L = 48 matches)
  const count = await insertGroupMatchResults(['E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'])
  console.log(`C2: Inserted ${count} group match results (groups E-L)`)

  // Settle Gruppspelsfrågor (questions 0, 1)
  const questions = await listAdminQuestions()
  await settleQuestion(0, questions)
  await settleQuestion(1, questions)
  console.log('C2: Settled 2 Gruppspelsfrågor')
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

  // Settle Slutspelsfrågor (questions 2, 3)
  const questions = await listAdminQuestions()
  await settleQuestion(2, questions)
  await settleQuestion(3, questions)
  console.log('C6: Settled 2 Slutspelsfrågor')
}

async function phaseC7() {
  await insertKnockoutResults(FINAL_RESULTS)
  console.log(`C7: Inserted ${FINAL_RESULTS.length} final match results`)

  // Set special results
  await upsertSpecialResults({ winner: TOURNAMENT_WINNER, topScorer: TOP_SCORER })
  console.log(`C7: Set special results: winner=${TOURNAMENT_WINNER}, topScorer=${TOP_SCORER}`)

  // Settle 33-33-33 frågor (question 4)
  const questions = await listAdminQuestions()
  await settleQuestion(4, questions)
  console.log('C7: Settled 33-33-33 fråga')
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
      await run('DELETE FROM participant_special_predictions WHERE participant_id = ?', [p.id])
      await run('DELETE FROM participant_extra_answers WHERE participant_id = ?', [p.id])
      await run('DELETE FROM participants WHERE id = ?', [p.id])
      console.log(`  Deleted participant "${name}" (id=${p.id})`)
    }
  }

  // Clear all match results
  await run('DELETE FROM match_results')
  console.log('  Cleared match_results')

  // Clear special results
  await run('DELETE FROM special_results')
  console.log('  Cleared special_results')

  // Clear admin questions (only sim questions)
  const simTexts = new Set(ADMIN_QUESTIONS.map(q => q.questionText))
  const allQ = await listAdminQuestions()
  for (const q of allQ) {
    const text = q.questionText ?? q.question_text
    if (simTexts.has(text)) {
      // Remove FK references first
      await run('DELETE FROM participant_extra_answers WHERE question_id = ?', [q.id])
      await run('DELETE FROM admin_questions WHERE id = ?', [q.id])
    }
  }
  console.log('  Cleared sim admin_questions')

  console.log('Reset complete.')
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
}

async function main() {
  const command = process.argv[2]

  if (!command || !PHASES[command]) {
    console.log('Usage: node server/seed-simulation.js <command>')
    console.log('Commands: setup | C0 | C1 | C2 | C3 | C4 | C5 | C6 | C7 | reset')
    console.log('')
    console.log('Workflow:')
    console.log('  setup → C0 → C1 → C2 → C3 → C4 → C5 → C6 → C7')
    console.log('  reset (clean up all simulation data)')
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
