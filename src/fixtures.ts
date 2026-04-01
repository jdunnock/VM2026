type FixtureStatus = 'Öppet' | 'Låst'

type Stage = 'group' | 'knockout'

type RoundName = 'Sextondelsfinal' | 'Åttondelsfinal' | 'Kvartsfinal' | 'Semifinal' | 'Final'

export type TournamentFixture = {
  id: string
  stage: Stage
  group?: string
  round?: RoundName
  homeTeam: string
  awayTeam: string
  kickoffAt: string
  status: FixtureStatus
}

export type FixtureTemplateRow = {
  id: string
  group?: string
  match: string
  date: string
  status: FixtureStatus
  defaultScore: string
  defaultSign: '' | '1' | 'X' | '2'
}

const GROUP_TEAMS: Record<string, string[]> = {
  A: ['Mexico', 'South Africa', 'Korea Republic', 'Czechia'],
  B: ['Canada', 'Qatar', 'Switzerland', 'Bosnia and Herzegovina'],
  C: ['Brazil', 'Morocco', 'Haiti', 'Scotland'],
  D: ['USA', 'Paraguay', 'Australia', 'Türkiye'],
  E: ['Germany', 'Curaçao', "Côte d'Ivoire", 'Ecuador'],
  F: ['Netherlands', 'Japan', 'Sweden', 'Tunisia'],
  G: ['Belgium', 'Egypt', 'IR Iran', 'New Zealand'],
  H: ['Spain', 'Cabo Verde', 'Saudi Arabia', 'Uruguay'],
  I: ['France', 'Senegal', 'Iraq', 'Norway'],
  J: ['Argentina', 'Algeria', 'Austria', 'Jordan'],
  K: ['Portugal', 'Congo DR', 'Uzbekistan', 'Colombia'],
  L: ['England', 'Croatia', 'Ghana', 'Panama'],
}

const GROUP_PAIR_ORDER: Array<[number, number]> = [
  [0, 1],
  [2, 3],
  [0, 2],
  [1, 3],
  [0, 3],
  [1, 2],
]

const SWEDISH_TEAM_NAMES: Record<string, string> = {
  Mexico: 'Mexiko',
  'South Africa': 'Sydafrika',
  'Korea Republic': 'Sydkorea',
  Czechia: 'Tjeckien',
  Canada: 'Kanada',
  'Bosnia and Herzegovina': 'Bosnien och Hercegovina',
  Switzerland: 'Schweiz',
  Brazil: 'Brasilien',
  Morocco: 'Marocko',
  Scotland: 'Skottland',
  Australia: 'Australien',
  'Türkiye': 'Turkiet',
  Germany: 'Tyskland',
  "Côte d'Ivoire": 'Elfenbenskusten',
  Netherlands: 'Nederländerna',
  Sweden: 'Sverige',
  Tunisia: 'Tunisien',
  Belgium: 'Belgien',
  Egypt: 'Egypten',
  'IR Iran': 'Iran',
  'New Zealand': 'Nya Zeeland',
  Spain: 'Spanien',
  'Cabo Verde': 'Kap Verde',
  'Saudi Arabia': 'Saudiarabien',
  France: 'Frankrike',
  Iraq: 'Irak',
  Norway: 'Norge',
  Algeria: 'Algeriet',
  Austria: 'Österrike',
  Jordan: 'Jordanien',
  'Congo DR': 'DR Kongo',
  England: 'England',
  Croatia: 'Kroatien',
}

const OFFICIAL_GROUP_KICKOFF_UTC: Record<string, string> = {
  'A|Mexico|South Africa': '2026-06-11T19:00:00Z',
  'A|Korea Republic|Czechia': '2026-06-12T02:00:00Z',
  'A|Mexico|Korea Republic': '2026-06-19T01:00:00Z',
  'A|South Africa|Czechia': '2026-06-18T16:00:00Z',
  'A|Mexico|Czechia': '2026-06-25T01:00:00Z',
  'A|South Africa|Korea Republic': '2026-06-25T01:00:00Z',
  'B|Canada|Qatar': '2026-06-18T22:00:00Z',
  'B|Switzerland|Bosnia and Herzegovina': '2026-06-18T19:00:00Z',
  'B|Canada|Switzerland': '2026-06-24T19:00:00Z',
  'B|Qatar|Bosnia and Herzegovina': '2026-06-24T19:00:00Z',
  'B|Canada|Bosnia and Herzegovina': '2026-06-12T19:00:00Z',
  'B|Qatar|Switzerland': '2026-06-13T19:00:00Z',
  'C|Brazil|Morocco': '2026-06-13T22:00:00Z',
  'C|Haiti|Scotland': '2026-06-14T01:00:00Z',
  'C|Brazil|Haiti': '2026-06-20T01:00:00Z',
  'C|Morocco|Scotland': '2026-06-19T22:00:00Z',
  'C|Brazil|Scotland': '2026-06-24T22:00:00Z',
  'C|Morocco|Haiti': '2026-06-24T22:00:00Z',
  'D|USA|Paraguay': '2026-06-13T01:00:00Z',
  'D|Australia|Türkiye': '2026-06-14T04:00:00Z',
  'D|USA|Australia': '2026-06-19T19:00:00Z',
  'D|Paraguay|Türkiye': '2026-06-20T04:00:00Z',
  'D|USA|Türkiye': '2026-06-26T02:00:00Z',
  'D|Paraguay|Australia': '2026-06-26T02:00:00Z',
  'E|Germany|Curaçao': '2026-06-14T17:00:00Z',
  "E|Côte d'Ivoire|Ecuador": '2026-06-14T23:00:00Z',
  "E|Germany|Côte d'Ivoire": '2026-06-20T20:00:00Z',
  'E|Curaçao|Ecuador': '2026-06-21T00:00:00Z',
  'E|Germany|Ecuador': '2026-06-25T20:00:00Z',
  "E|Curaçao|Côte d'Ivoire": '2026-06-25T20:00:00Z',
  'F|Netherlands|Japan': '2026-06-14T20:00:00Z',
  'F|Sweden|Tunisia': '2026-06-15T02:00:00Z',
  'F|Netherlands|Sweden': '2026-06-20T17:00:00Z',
  'F|Japan|Tunisia': '2026-06-21T04:00:00Z',
  'F|Netherlands|Tunisia': '2026-06-25T23:00:00Z',
  'F|Japan|Sweden': '2026-06-25T23:00:00Z',
  'G|Belgium|Egypt': '2026-06-15T19:00:00Z',
  'G|IR Iran|New Zealand': '2026-06-16T01:00:00Z',
  'G|Belgium|IR Iran': '2026-06-21T19:00:00Z',
  'G|Egypt|New Zealand': '2026-06-22T01:00:00Z',
  'G|Belgium|New Zealand': '2026-06-27T03:00:00Z',
  'G|Egypt|IR Iran': '2026-06-27T03:00:00Z',
  'H|Spain|Cabo Verde': '2026-06-15T16:00:00Z',
  'H|Saudi Arabia|Uruguay': '2026-06-15T22:00:00Z',
  'H|Spain|Saudi Arabia': '2026-06-21T16:00:00Z',
  'H|Cabo Verde|Uruguay': '2026-06-21T22:00:00Z',
  'H|Spain|Uruguay': '2026-06-27T00:00:00Z',
  'H|Cabo Verde|Saudi Arabia': '2026-06-27T00:00:00Z',
  'I|France|Senegal': '2026-06-16T19:00:00Z',
  'I|Iraq|Norway': '2026-06-16T22:00:00Z',
  'I|France|Iraq': '2026-06-22T21:00:00Z',
  'I|Senegal|Norway': '2026-06-23T00:00:00Z',
  'I|France|Norway': '2026-06-26T19:00:00Z',
  'I|Senegal|Iraq': '2026-06-26T19:00:00Z',
  'J|Argentina|Algeria': '2026-06-17T01:00:00Z',
  'J|Austria|Jordan': '2026-06-17T04:00:00Z',
  'J|Argentina|Austria': '2026-06-22T17:00:00Z',
  'J|Algeria|Jordan': '2026-06-23T03:00:00Z',
  'J|Argentina|Jordan': '2026-06-28T02:00:00Z',
  'J|Algeria|Austria': '2026-06-28T02:00:00Z',
  'K|Portugal|Congo DR': '2026-06-17T17:00:00Z',
  'K|Uzbekistan|Colombia': '2026-06-18T02:00:00Z',
  'K|Portugal|Uzbekistan': '2026-06-23T17:00:00Z',
  'K|Congo DR|Colombia': '2026-06-24T02:00:00Z',
  'K|Portugal|Colombia': '2026-06-27T23:30:00Z',
  'K|Congo DR|Uzbekistan': '2026-06-27T23:30:00Z',
  'L|England|Croatia': '2026-06-17T20:00:00Z',
  'L|Ghana|Panama': '2026-06-17T23:00:00Z',
  'L|England|Ghana': '2026-06-23T20:00:00Z',
  'L|Croatia|Panama': '2026-06-23T23:00:00Z',
  'L|England|Panama': '2026-06-27T21:00:00Z',
  'L|Croatia|Ghana': '2026-06-27T21:00:00Z',
}

function translateTeamName(teamName: string): string {
  return SWEDISH_TEAM_NAMES[teamName] ?? teamName
}

function groupFixtureKey(groupCode: string, homeTeam: string, awayTeam: string): string {
  return `${groupCode}|${homeTeam}|${awayTeam}`
}

function formatKickoff(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day} ${hours}:${minutes}`
}

function buildGroupStageFixtures(): TournamentFixture[] {
  const fixtures: TournamentFixture[] = []

  const groupCodes = Object.keys(GROUP_TEAMS).sort()

  for (const groupCode of groupCodes) {
    const teams = GROUP_TEAMS[groupCode]
    for (let i = 0; i < GROUP_PAIR_ORDER.length; i += 1) {
      const [homeIndex, awayIndex] = GROUP_PAIR_ORDER[i]
      const homeTeam = teams[homeIndex]
      const awayTeam = teams[awayIndex]
      const kickoffKey = groupFixtureKey(groupCode, homeTeam, awayTeam)
      const reverseKickoffKey = groupFixtureKey(groupCode, awayTeam, homeTeam)
      const kickoffUtc = OFFICIAL_GROUP_KICKOFF_UTC[kickoffKey] ?? OFFICIAL_GROUP_KICKOFF_UTC[reverseKickoffKey]

      if (!kickoffUtc) {
        throw new Error(`Missing official kickoff time for group fixture ${kickoffKey}.`)
      }

      const kickoff = new Date(kickoffUtc)

      fixtures.push({
        id: `G-${groupCode}-${i + 1}`,
        stage: 'group',
        group: groupCode,
        homeTeam: translateTeamName(homeTeam),
        awayTeam: translateTeamName(awayTeam),
        kickoffAt: formatKickoff(kickoff),
        status: 'Öppet',
      })
    }
  }

  return fixtures
}

function buildRoundFixtures(
  round: RoundName,
  roundCode: string,
  count: number,
  kickoffStart: Date,
  homeLabel: (matchNumber: number) => string,
  awayLabel: (matchNumber: number) => string,
): TournamentFixture[] {
  const fixtures: TournamentFixture[] = []

  for (let i = 1; i <= count; i += 1) {
    const kickoff = new Date(kickoffStart.getTime() + (i - 1) * 3 * 60 * 60 * 1000)
    fixtures.push({
      id: `KO-${roundCode}-${i}`,
      stage: 'knockout',
      round,
      homeTeam: homeLabel(i),
      awayTeam: awayLabel(i),
      kickoffAt: formatKickoff(kickoff),
      status: 'Öppet',
    })
  }

  return fixtures
}

function buildKnockoutFixtures(): TournamentFixture[] {
  const roundOf32 = buildRoundFixtures(
    'Sextondelsfinal',
    'R32',
    32,
    new Date('2026-07-20T18:00:00Z'),
    (i) => `Slot ${i * 2 - 1}`,
    (i) => `Slot ${i * 2}`,
  )

  const roundOf16 = buildRoundFixtures(
    'Åttondelsfinal',
    'R16',
    16,
    new Date('2026-07-24T18:00:00Z'),
    (i) => `Vinnare R32-${i * 2 - 1}`,
    (i) => `Vinnare R32-${i * 2}`,
  )

  const quarterfinals = buildRoundFixtures(
    'Kvartsfinal',
    'QF',
    8,
    new Date('2026-07-27T18:00:00Z'),
    (i) => `Vinnare R16-${i * 2 - 1}`,
    (i) => `Vinnare R16-${i * 2}`,
  )

  const semifinals = buildRoundFixtures(
    'Semifinal',
    'SF',
    4,
    new Date('2026-07-29T18:00:00Z'),
    (i) => `Vinnare QF-${i * 2 - 1}`,
    (i) => `Vinnare QF-${i * 2}`,
  )

  const finals = buildRoundFixtures(
    'Final',
    'F',
    2,
    new Date('2026-07-31T18:00:00Z'),
    (i) => (i === 1 ? 'Vinnare SF-1' : 'Förlorare SF-1'),
    (i) => (i === 1 ? 'Vinnare SF-2' : 'Förlorare SF-2'),
  )

  return [...roundOf32, ...roundOf16, ...quarterfinals, ...semifinals, ...finals]
}

function sortFixturesChronologically(fixtures: TournamentFixture[]): TournamentFixture[] {
  return [...fixtures].sort((a, b) => {
    const timeComparison = a.kickoffAt.localeCompare(b.kickoffAt)
    if (timeComparison !== 0) {
      return timeComparison
    }

    return a.id.localeCompare(b.id)
  })
}

function assertFixtureIntegrity(fixtures: TournamentFixture[]): void {
  const uniqueIds = new Set(fixtures.map((fixture) => fixture.id))
  if (uniqueIds.size !== fixtures.length) {
    throw new Error('Fixture IDs must be unique.')
  }

  const groupCount = fixtures.filter((fixture) => fixture.stage === 'group').length
  const knockoutCount = fixtures.filter((fixture) => fixture.stage === 'knockout').length

  if (groupCount !== 72) {
    throw new Error(`Expected 72 group-stage fixtures, got ${groupCount}.`)
  }

  if (knockoutCount !== 62) {
    throw new Error(`Expected 62 knockout fixtures, got ${knockoutCount}.`)
  }
}

const groupStageFixtures = sortFixturesChronologically(buildGroupStageFixtures())
const knockoutFixtures = sortFixturesChronologically(buildKnockoutFixtures())

export const allTournamentFixtures: TournamentFixture[] = sortFixturesChronologically([
  ...groupStageFixtures,
  ...knockoutFixtures,
])

assertFixtureIntegrity(allTournamentFixtures)

export const fixtureCounts = {
  groupStage: groupStageFixtures.length,
  knockout: knockoutFixtures.length,
  total: allTournamentFixtures.length,
} as const

export const allGroupCodes = Object.keys(GROUP_TEAMS).sort()

export const groupStageFixtureTemplates: FixtureTemplateRow[] = groupStageFixtures.map((fixture) => ({
  id: fixture.id,
  group: fixture.group,
  match: `${fixture.homeTeam} - ${fixture.awayTeam}`,
  date: fixture.kickoffAt,
  status: fixture.status,
  defaultScore: '',
  defaultSign: '',
}))
