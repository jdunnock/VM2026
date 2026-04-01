/**
 * Canonical group-stage fixture definitions for server-side use.
 * Mirrors src/fixtures.ts construction logic.
 *
 * Exports:
 *   GROUP_FIXTURES — Array of 72 group-stage fixture objects
 *   initGroupFixtures() — Pre-populates match_results with planned rows (INSERT OR IGNORE)
 */

import { run } from './db-core.js'

// ─── Data (Swedish team names, matching fixtures.ts output) ──────────

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

const GROUP_PAIR_ORDER = [[0, 1], [2, 3], [0, 2], [1, 3], [0, 3], [1, 2]]

// Kickoff times (UTC) keyed by 'group|homeIndex|awayIndex'
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

// ─── Helpers ─────────────────────────────────────────────────────────

function formatKickoff(isoUtc) {
  const d = new Date(isoUtc)
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  const h = String(d.getUTCHours()).padStart(2, '0')
  const min = String(d.getUTCMinutes()).padStart(2, '0')
  return `${y}-${m}-${day} ${h}:${min}`
}

// ─── Build fixture list ──────────────────────────────────────────────

function buildGroupFixtures() {
  const fixtures = []
  const groupCodes = Object.keys(GROUP_TEAMS).sort()

  for (const groupCode of groupCodes) {
    const teams = GROUP_TEAMS[groupCode]
    for (let i = 0; i < GROUP_PAIR_ORDER.length; i++) {
      const [homeIdx, awayIdx] = GROUP_PAIR_ORDER[i]
      const kickoffKey = `${groupCode}|${homeIdx}|${awayIdx}`
      const kickoffUtc = GROUP_KICKOFFS[kickoffKey]

      fixtures.push({
        matchId: `G-${groupCode}-${i + 1}`,
        stage: 'group',
        groupCode,
        homeTeam: teams[homeIdx],
        awayTeam: teams[awayIdx],
        kickoffAt: formatKickoff(kickoffUtc),
      })
    }
  }

  return fixtures
}

export const GROUP_FIXTURES = buildGroupFixtures()

// ─── Database pre-population ─────────────────────────────────────────

export async function initGroupFixtures() {
  let inserted = 0
  for (const f of GROUP_FIXTURES) {
    const result = await run(
      `INSERT OR IGNORE INTO match_results
        (match_id, stage, round, group_code, home_team, away_team, kickoff_at, home_score, away_score, result_status, settled_at)
       VALUES (?, 'group', NULL, ?, ?, ?, ?, NULL, NULL, 'planned', NULL)`,
      [f.matchId, f.groupCode, f.homeTeam, f.awayTeam, f.kickoffAt],
    )
    if (result.changes > 0) inserted++
  }
  if (inserted > 0) {
    console.log(`Pre-populated ${inserted} group fixtures as planned.`)
  }
}
