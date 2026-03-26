import { useEffect, useState, type ReactNode } from 'react'
import { allTournamentFixtures, fixtureCounts, groupStageFixtureTemplates } from './fixtures'

type PageId = 'login' | 'start' | 'results' | 'tips' | 'mine' | 'rules' | 'admin'

type NavItem = {
  id: PageId
  label: string
}

type SummaryCard = {
  title: string
  detail: string
}

type RuleRow = {
  category: string
  prediction: string
  lockTime: string
}

type ParticipantSession = {
  participantId: number
  name: string
}

type AdminSession = {
  adminName: string
  adminCode: string
}

type FixtureTip = {
  fixtureId?: string
  group?: string
  match: string
  date: string
  homeScore: number | ''
  awayScore: number | ''
  sign: '' | '1' | 'X' | '2'
  status: string
}

type GroupPlacement = {
  group: string
  picks: string[]
}

type KnockoutPredictionRound = {
  title: string
  picks: string[]
}

type SpecialPredictions = {
  winner: string
  topScorer: string
}

type ExtraAnswers = Record<string, string>

type AdminQuestionCategory = 'Gruppspelsfrågor' | 'Slutspelsfrågor' | '33-33-33 frågor'
type AdminQuestionStatus = 'draft' | 'published'

type AdminQuestion = {
  id: number
  questionText: string
  category: AdminQuestionCategory
  options: string[]
  correctAnswer?: string
  points: number
  lockTime: string
  status: AdminQuestionStatus
  createdAt?: string
  updatedAt?: string
}

type LeaderboardEntry = {
  participantId: number
  name: string
  totalPoints: number
  settledMatches: number
  settledQuestions: number
  fixturePoints: number
  extraQuestionPoints: number
  updatedAt: string | null
  rank: number
  positionLabel: string
}

type MatchResultStage = 'group' | 'knockout'
type MatchResultStatus = 'planned' | 'live' | 'completed'

type MatchResult = {
  matchId: string
  stage: MatchResultStage
  round: string | null
  groupCode: string | null
  homeTeam: string
  awayTeam: string
  kickoffAt: string
  homeScore: number | null
  awayScore: number | null
  resultStatus: MatchResultStatus
  settledAt: string | null
  createdAt: string
  updatedAt: string
}

type SpecialResultsState = {
  winner: string
  topScorer: string
  updatedAt?: string | null
}

type FixtureScoreBreakdown = {
  matchId: string | null
  match: string
  points: number
  reason: string
}

type GroupPlacementScoreBreakdown = {
  group: string
  predictedPicks: string[]
  actualPicks: string[] | null
  matchedPositions: number[]
  points: number
  reason: string
}

type KnockoutScoreBreakdown = {
  round: string
  predictedTeams: string[]
  actualTeams: string[] | null
  matchedTeams: string[]
  points: number
  pointsPerTeam: number
  reason: string
}

type SpecialScoreBreakdown = {
  key: keyof SpecialPredictions
  label: string
  predictedValue: string
  actualValue: string | null
  points: number
  maxPoints: number
  settled: boolean
  reason: string
}

type ExtraScoreBreakdown = {
  questionId: number | null
  questionText: string | null
  selectedAnswer: string
  correctAnswer: string | null
  points: number
  settled: boolean
  reason: string
}

type ParticipantScoreDetail = {
  participantId: number
  name: string
  totalPoints: number
  fixturePoints: number
  groupPlacementPoints: number
  knockoutPoints: number
  specialPoints: number
  extraQuestionPoints: number
  settledMatches: number
  settledGroups: number
  settledKnockoutRounds: number
  settledSpecialPredictions: number
  settledQuestions: number
  breakdown: FixtureScoreBreakdown[]
  groupPlacementBreakdown: GroupPlacementScoreBreakdown[]
  knockoutBreakdown: KnockoutScoreBreakdown[]
  specialBreakdown: SpecialScoreBreakdown[]
  extraBreakdown: ExtraScoreBreakdown[]
  updatedAt: string | null
  rank: number | null
  positionLabel: string | null
}

type PersistedTipsState = {
  fixtureTips: FixtureTip[]
  groupPlacements: GroupPlacement[]
  knockoutPredictions: KnockoutPredictionRound[]
  specialPredictions: SpecialPredictions
  extraAnswers: ExtraAnswers
}

const tipsSectionTabs = ['Gruppspel', 'Slutspel', 'Special', 'Extrafrågor'] as const
type TipsSectionTab = (typeof tipsSectionTabs)[number]

const adminQuestionCategories: AdminQuestionCategory[] = ['Gruppspelsfrågor', 'Slutspelsfrågor', '33-33-33 frågor']

const navItems: NavItem[] = [
  { id: 'start', label: 'Start' },
  { id: 'results', label: 'Resultat & poäng' },
  { id: 'tips', label: 'Lämna tips' },
  { id: 'mine', label: 'Mina tips' },
  { id: 'rules', label: 'Regler' },
  { id: 'admin', label: 'Admin' },
]

const summaryCards: SummaryCard[] = [
  { title: '48 lag', detail: 'Deltagande nationer' },
  { title: 'Grupp A-L', detail: '12 grupper med 4 lag' },
  { title: '32 → Final', detail: 'Från sextondelsfinaler till final' },
]

const categoryItems = [
  { label: 'Gruppspelsmatcher', count: fixtureCounts.groupStage },
  { label: 'Gruppplaceringar', count: 12 },
  { label: 'Slutspel', count: 31 },
  { label: 'Slutsegrare', count: 1 },
  { label: 'Skytteligavinnare', count: 1 },
  { label: 'Extrafrågor', count: 5 },
]

const progressItems = [
  { label: 'Gruppspel', value: 72 },
  { label: 'Gruppplaceringar', value: 40 },
  { label: 'Slutspel', value: 18 },
  { label: 'Special', value: 100 },
  { label: 'Extrafrågor', value: 50 },
]

const fixtureTemplates = groupStageFixtureTemplates

const GROUP_CODES = 'ABCDEFGHIJKL'.split('')

function buildGroupPlacementTemplates(): GroupPlacement[] {
  const teamsByGroup = new Map<string, string[]>()

  for (const fixture of fixtureTemplates) {
    if (!fixture.group) {
      continue
    }

    const [homeTeam, awayTeam] = fixture.match.split(' - ')
    const groupTeams = teamsByGroup.get(fixture.group) ?? []

    for (const team of [homeTeam, awayTeam]) {
      if (team && !groupTeams.includes(team)) {
        groupTeams.push(team)
      }
    }

    teamsByGroup.set(fixture.group, groupTeams)
  }

  return GROUP_CODES.map((groupCode) => {
    const picks = [...(teamsByGroup.get(groupCode) ?? [])]
    while (picks.length < 4) {
      picks.push('')
    }

    return {
      group: `Grupp ${groupCode}`,
      picks: picks.slice(0, 4),
    }
  })
}

const groupPlacementTemplates: GroupPlacement[] = buildGroupPlacementTemplates()

const groupTeamOptions = Object.fromEntries(
  groupPlacementTemplates.map((template) => [template.group, template.picks]),
) as Record<string, string[]>

function getAvailableGroupTeams(placement: GroupPlacement, index: number): string[] {
  const currentPick = placement.picks[index]
  const availableTeams = [...(groupTeamOptions[placement.group] ?? [])]

  if (currentPick.trim() && !availableTeams.includes(currentPick)) {
    return [currentPick, ...availableTeams]
  }

  return availableTeams
}

const defaultSpecialPredictions: SpecialPredictions = {
  winner: 'Argentina',
  topScorer: 'Kylian Mbappé',
}

const PARTICIPANT_STORAGE_KEY = 'vm2026.participant'
const ADMIN_SESSION_STORAGE_KEY = 'vm2026.adminSession'
const GLOBAL_DEADLINE_LOCAL = '2026-06-09T22:00:00'
const GLOBAL_DEADLINE = new Date(GLOBAL_DEADLINE_LOCAL)
const GLOBAL_DEADLINE_LABEL = '2026-06-09 22:00'
const QUICK_SCORE_GROUPS: Array<{
  key: 'home-win' | 'draw' | 'away-win'
  label: string
  presets: Array<{ home: number; away: number }>
}> = [
  {
    key: 'home-win',
    label: 'Hemmaseger',
    presets: [
      { home: 1, away: 0 },
      { home: 2, away: 0 },
      { home: 2, away: 1 },
      { home: 3, away: 0 },
      { home: 3, away: 1 },
      { home: 4, away: 1 },
    ],
  },
  {
    key: 'draw',
    label: 'Oavgjort',
    presets: [
      { home: 0, away: 0 },
      { home: 1, away: 1 },
      { home: 2, away: 2 },
      { home: 3, away: 3 },
      { home: 4, away: 4 },
      { home: 5, away: 5 },
    ],
  },
  {
    key: 'away-win',
    label: 'Bortaseger',
    presets: [
      { home: 0, away: 1 },
      { home: 0, away: 2 },
      { home: 1, away: 2 },
      { home: 0, away: 3 },
      { home: 1, away: 3 },
      { home: 1, away: 4 },
    ],
  },
]

function deriveSignFromScore(homeScore: number | '', awayScore: number | ''): '' | '1' | 'X' | '2' {
  if (!Number.isInteger(homeScore) || !Number.isInteger(awayScore)) {
    return ''
  }

  if (homeScore > awayScore) {
    return '1'
  }

  if (homeScore < awayScore) {
    return '2'
  }

  return 'X'
}

function createDefaultFixtureTips(): FixtureTip[] {
  return fixtureTemplates.map((row) => {
    const [home, away] = row.defaultScore ? row.defaultScore.split('-') : ['', '']

    return {
      fixtureId: row.id,
      group: row.group,
      match: row.match,
      date: row.date,
      status: row.status,
      homeScore: home === '' ? '' : Number(home),
      awayScore: away === '' ? '' : Number(away),
      sign: row.defaultSign,
    }
  })
}

function normalizeFixtureTips(rawTips: unknown): FixtureTip[] {
  if (!Array.isArray(rawTips)) {
    return createDefaultFixtureTips()
  }

  return fixtureTemplates.map((template) => {
    const foundByFixtureId = rawTips.find(
      (item) =>
        item &&
        typeof item === 'object' &&
        'fixtureId' in item &&
        typeof (item as { fixtureId?: string }).fixtureId === 'string' &&
        (item as { fixtureId?: string }).fixtureId === template.id,
    ) as Partial<FixtureTip> | undefined

    const found = rawTips.find(
      (item) =>
        item &&
        typeof item === 'object' &&
        'match' in item &&
        'date' in item &&
        (item as { match?: string }).match === template.match &&
        (item as { date?: string }).date === template.date,
    ) as Partial<FixtureTip> | undefined

    const matchedTip = foundByFixtureId ?? found

    if (!matchedTip) {
      const [home, away] = template.defaultScore ? template.defaultScore.split('-') : ['', '']
      return {
        fixtureId: template.id,
        group: template.group,
        match: template.match,
        date: template.date,
        status: template.status,
        homeScore: home === '' ? '' : Number(home),
        awayScore: away === '' ? '' : Number(away),
        sign: template.defaultSign,
      }
    }

    const normalizedHomeScore = typeof matchedTip.homeScore === 'number' ? matchedTip.homeScore : ''
    const normalizedAwayScore = typeof matchedTip.awayScore === 'number' ? matchedTip.awayScore : ''

    return {
      fixtureId: template.id,
      group: template.group,
      match: template.match,
      date: template.date,
      status: template.status,
      homeScore: normalizedHomeScore,
      awayScore: normalizedAwayScore,
      sign: matchedTip.sign === '1' || matchedTip.sign === 'X' || matchedTip.sign === '2' ? matchedTip.sign : '',
    }
  })
}

function normalizeGroupPlacements(rawPlacements: unknown): GroupPlacement[] {
  if (!Array.isArray(rawPlacements)) {
    return groupPlacementTemplates
  }

  return groupPlacementTemplates.map((template) => {
    const found = rawPlacements.find(
      (item) => item && typeof item === 'object' && 'group' in item && (item as { group?: string }).group === template.group,
    ) as Partial<GroupPlacement> | undefined

    if (!found || !Array.isArray(found.picks) || found.picks.length !== 4) {
      return template
    }

    return {
      group: template.group,
      picks: found.picks.map((pick, index) => (typeof pick === 'string' && pick.trim() ? pick : template.picks[index])),
    }
  })
}

function normalizeSpecialPredictions(rawSpecial: unknown): SpecialPredictions {
  if (!rawSpecial || typeof rawSpecial !== 'object') {
    return defaultSpecialPredictions
  }

  const candidate = rawSpecial as Partial<SpecialPredictions>

  return {
    winner: typeof candidate.winner === 'string' && candidate.winner.trim() ? candidate.winner : defaultSpecialPredictions.winner,
    topScorer: typeof candidate.topScorer === 'string' && candidate.topScorer.trim() ? candidate.topScorer : defaultSpecialPredictions.topScorer,
  }
}

function normalizeExtraAnswers(rawExtraAnswers: unknown): ExtraAnswers {
  if (!rawExtraAnswers || typeof rawExtraAnswers !== 'object' || Array.isArray(rawExtraAnswers)) {
    return {}
  }

  const entries = Object.entries(rawExtraAnswers)
    .filter(([questionId, answer]) => Number.isInteger(Number(questionId)) && Number(questionId) > 0 && typeof answer === 'string')
    .map(([questionId, answer]) => [questionId, answer.trim()])
    .filter(([, answer]) => answer.length > 0)

  return Object.fromEntries(entries)
}

function normalizeKnockoutPickLabel(rawPick: string): string {
  const trimmed = rawPick.trim()
  if (!trimmed) {
    return ''
  }

  const separatorIndex = trimmed.indexOf(':')
  if (separatorIndex < 0) {
    return trimmed
  }

  return trimmed.slice(separatorIndex + 1).trim() || trimmed
}

function getKnockoutListId(roundTitle: string): string {
  return `knockout-options-${roundTitle.toLowerCase().replace(/\s+/g, '-')}`
}

function getBaseKnockoutTeams(groupPlacements: GroupPlacement[]): string[] {
  const uniqueTeams = new Set<string>()

  groupPlacements.forEach((group) => {
    group.picks.forEach((pick) => {
      if (pick.trim()) {
        uniqueTeams.add(pick)
      }
    })
  })

  return [...uniqueTeams]
}

function getRoundKnockoutTeams(
  knockoutPredictions: KnockoutPredictionRound[],
  groupPlacements: GroupPlacement[],
  roundIndex: number,
): string[] {
  if (roundIndex === 0) {
    return getBaseKnockoutTeams(groupPlacements)
  }

  const previousRound = knockoutPredictions[roundIndex - 1]
  if (!previousRound) {
    return getBaseKnockoutTeams(groupPlacements)
  }

  const uniqueTeams = new Set<string>()
  previousRound.picks.forEach((pick) => {
    const normalized = normalizeKnockoutPickLabel(pick)
    if (normalized) {
      uniqueTeams.add(normalized)
    }
  })

  const candidates = [...uniqueTeams]
  return candidates.length > 0 ? candidates : getBaseKnockoutTeams(groupPlacements)
}

function normalizeKnockoutPredictions(rawKnockoutPredictions: unknown): KnockoutPredictionRound[] {
  if (!Array.isArray(rawKnockoutPredictions)) {
    return knockoutPredictionTemplates
  }

  return knockoutPredictionTemplates.map((template) => {
    const found = rawKnockoutPredictions.find(
      (item) => item && typeof item === 'object' && 'title' in item && (item as { title?: string }).title === template.title,
    ) as Partial<KnockoutPredictionRound> | undefined

    if (!found || !Array.isArray(found.picks) || found.picks.length !== template.picks.length) {
      return template
    }

    return {
      title: template.title,
      picks: found.picks.map((pick, index) => {
        if (typeof pick === 'string' && pick.trim()) {
          return normalizeKnockoutPickLabel(pick)
        }

        return template.picks[index]
      }),
    }
  })
}

function normalizePersistedTipsState(rawTips: unknown): PersistedTipsState {
  if (Array.isArray(rawTips)) {
    return {
      fixtureTips: normalizeFixtureTips(rawTips),
      groupPlacements: groupPlacementTemplates,
      knockoutPredictions: knockoutPredictionTemplates,
      specialPredictions: defaultSpecialPredictions,
      extraAnswers: {},
    }
  }

  if (!rawTips || typeof rawTips !== 'object') {
    return {
      fixtureTips: createDefaultFixtureTips(),
      groupPlacements: groupPlacementTemplates,
      knockoutPredictions: knockoutPredictionTemplates,
      specialPredictions: defaultSpecialPredictions,
      extraAnswers: {},
    }
  }

  const candidate = rawTips as Partial<PersistedTipsState>

  return {
    fixtureTips: normalizeFixtureTips(candidate.fixtureTips),
    groupPlacements: normalizeGroupPlacements(candidate.groupPlacements),
    knockoutPredictions: normalizeKnockoutPredictions(candidate.knockoutPredictions),
    specialPredictions: normalizeSpecialPredictions(candidate.specialPredictions),
    extraAnswers: normalizeExtraAnswers((candidate as { extraAnswers?: unknown }).extraAnswers),
  }
}

const knockoutPredictionTemplates: KnockoutPredictionRound[] = [
  {
    title: 'Sextondelsfinal',
    picks: Array.from({ length: 32 }, () => ''),
  },
  {
    title: 'Åttondelsfinal',
    picks: Array.from({ length: 16 }, () => ''),
  },
  {
    title: 'Kvartsfinal',
    picks: Array.from({ length: 8 }, () => ''),
  },
  {
    title: 'Semifinal',
    picks: Array.from({ length: 4 }, () => ''),
  },
  {
    title: 'Final',
    picks: Array.from({ length: 2 }, () => ''),
  },
]

const myTipsSections: Array<{ title: string; count: number; status: string; items: string[] }> = [
  { title: 'Gruppspel', count: 104, status: `Låser ${GLOBAL_DEADLINE_LABEL}`, items: [] },
  { title: 'Gruppplaceringar', count: 12, status: `Låser ${GLOBAL_DEADLINE_LABEL}`, items: ['Grupp A: Kanada, SWE/POL/ALB/UKR, Ghana, Peru'] },
  { title: 'Slutspel', count: 31, status: `Låser ${GLOBAL_DEADLINE_LABEL}`, items: [] },
  { title: 'Special', count: 2, status: `Låser ${GLOBAL_DEADLINE_LABEL}`, items: ['Slutsegrare: Argentina', 'Skytteligavinnare: Kylian Mbappé'] },
  { title: 'Extrafrågor', count: 5, status: `Låser ${GLOBAL_DEADLINE_LABEL}`, items: [] },
]

const ruleRows: RuleRow[] = [
  {
    category: 'Gruppspelsmatcher',
    prediction: 'Exakt resultat och 1/X/2',
    lockTime: `Gemensam deadline: ${GLOBAL_DEADLINE_LABEL}`,
  },
  {
    category: 'Gruppplaceringar',
    prediction: 'Slutlig ordning 1-4 i Grupp A-L',
    lockTime: `Gemensam deadline: ${GLOBAL_DEADLINE_LABEL}`,
  },
  {
    category: 'Slutspel',
    prediction: 'Lagval per slutspelsrunda',
    lockTime: `Gemensam deadline: ${GLOBAL_DEADLINE_LABEL}`,
  },
  {
    category: 'Slutsegrare',
    prediction: 'Vinnande lag',
    lockTime: `Gemensam deadline: ${GLOBAL_DEADLINE_LABEL}`,
  },
  {
    category: 'Skytteligavinnare',
    prediction: 'Spelare med flest mål',
    lockTime: `Gemensam deadline: ${GLOBAL_DEADLINE_LABEL}`,
  },
  {
    category: 'Extrafrågor',
    prediction: 'Frågespecifik svarstyp',
    lockTime: `Gemensam deadline: ${GLOBAL_DEADLINE_LABEL}`,
  },
]

type AdminQuestionDraft = {
  questionText: string
  category: AdminQuestionCategory
  optionsText: string
  correctAnswer: string
  points: string
  lockTime: string
  status: AdminQuestionStatus
}

type AdminWorkspaceTab = 'questions' | 'results'

type AdminFixtureTemplate = {
  matchId: string
  stage: MatchResultStage
  round: string | null
  groupCode: string | null
  homeTeam: string
  awayTeam: string
  kickoffAt: string
}

type AdminResultDraft = {
  resultStatus: MatchResultStatus
  homeScore: string
  awayScore: string
  settledAt: string
}

const defaultAdminQuestionDraft: AdminQuestionDraft = {
  questionText: '',
  category: 'Gruppspelsfrågor',
  optionsText: '',
  correctAnswer: '',
  points: '2',
  lockTime: '',
  status: 'draft',
}

const defaultAdminResultDraft: AdminResultDraft = {
  resultStatus: 'planned',
  homeScore: '',
  awayScore: '',
  settledAt: '',
}

const adminFixtureTemplates: AdminFixtureTemplate[] = allTournamentFixtures.map((fixture) => ({
  matchId: fixture.id,
  stage: fixture.stage,
  round: fixture.round ?? null,
  groupCode: fixture.group ?? null,
  homeTeam: fixture.homeTeam,
  awayTeam: fixture.awayTeam,
  kickoffAt: fixture.kickoffAt,
}))

function toDateTimeLocalValue(value: string | null | undefined): string {
  if (!value) {
    return ''
  }

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
    return value
  }

  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(value)) {
    return value.replace(' ', 'T')
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return ''
  }

  const year = parsed.getFullYear()
  const month = String(parsed.getMonth() + 1).padStart(2, '0')
  const day = String(parsed.getDate()).padStart(2, '0')
  const hours = String(parsed.getHours()).padStart(2, '0')
  const minutes = String(parsed.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day}T${hours}:${minutes}`
}

function buildAdminResultDraft(_template: AdminFixtureTemplate, existingResult?: MatchResult): AdminResultDraft {
  if (!existingResult) {
    return defaultAdminResultDraft
  }

  return {
    resultStatus: existingResult.resultStatus,
    homeScore: existingResult.homeScore === null ? '' : String(existingResult.homeScore),
    awayScore: existingResult.awayScore === null ? '' : String(existingResult.awayScore),
    settledAt: toDateTimeLocalValue(existingResult.settledAt),
  }
}

function formatMatchResultStatusLabel(status: MatchResultStatus): string {
  switch (status) {
    case 'planned':
      return 'Planerad'
    case 'live':
      return 'Live'
    case 'completed':
      return 'Slut'
    default:
      return status
  }
}

function formatFixtureReason(reason: string) {
  if (reason === 'exact-score') {
    return 'Exakt resultat'
  }

  if (reason === 'correct-sign') {
    return 'Rätt 1/X/2'
  }

  if (reason === 'wrong-result') {
    return 'Missad match'
  }

  if (reason === 'missing-tip') {
    return 'Inget tips sparat'
  }

  return 'Inte avgjord ännu'
}

function formatGroupReason(reason: string, matchedPositions: number[]) {
  if (reason === 'settled-group' && matchedPositions.length > 0) {
    return `Rätt placeringar: ${matchedPositions.join(', ')}`
  }

  if (reason === 'wrong-group-order') {
    return 'Inga rätta placeringar'
  }

  return 'Inte avgjord ännu'
}

function formatRoundReason(reason: string, matchedTeams: string[]) {
  if (reason === 'settled-round' && matchedTeams.length > 0) {
    return `Rätt lag: ${matchedTeams.join(', ')}`
  }

  if (reason === 'wrong-round-teams') {
    return 'Inga rätta lag'
  }

  return 'Inte avgjord ännu'
}

function formatSpecialReason(reason: string) {
  if (reason === 'correct-special') {
    return 'Korrekt specialtips'
  }

  if (reason === 'wrong-special') {
    return 'Missad special'
  }

  return 'Inte avgjord ännu'
}

function formatExtraReason(reason: string) {
  if (reason === 'correct-answer') {
    return 'Rätt svar'
  }

  if (reason === 'wrong-answer') {
    return 'Fel svar'
  }

  return 'Inte avgjord ännu'
}

function getReasonTone(reason: string) {
  if (reason === 'exact-score') {
    return 'exact'
  }

  if (reason === 'correct-sign' || reason === 'correct-answer' || reason === 'correct-special') {
    return 'success'
  }

  if (reason === 'settled-group' || reason === 'settled-round') {
    return 'accent'
  }

  if (
    reason === 'wrong-result' ||
    reason === 'missing-tip' ||
    reason === 'wrong-group-order' ||
    reason === 'wrong-round-teams' ||
    reason === 'wrong-special' ||
    reason === 'wrong-answer'
  ) {
    return 'danger'
  }

  return 'neutral'
}

function formatPositionsMeta(positions: number[]) {
  if (positions.length === 0) {
    return ''
  }

  return `Rätt på plats: ${positions.join(', ')}`
}

function formatTeamsMeta(teams: string[]) {
  if (teams.length === 0) {
    return ''
  }

  return `Rätt lag: ${teams.join(', ')}`
}

function formatDateTimeLabel(value: string | null | undefined) {
  if (!value) {
    return '—'
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return parsed.toLocaleString('sv-SE')
}

function LoginPage({ onSuccess }: { onSuccess: (participant: ParticipantSession) => void }) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const normalizedName = name.trim().replace(/\s+/g, ' ')
    const normalizedCode = code.trim()

    if (!normalizedName || !normalizedCode) {
      setError('Namn och åtkomstkod krävs.')
      return
    }

    setError('')
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/auth/sign-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: normalizedName,
          code: normalizedCode,
        }),
      })

      const payload = await response.json()

      if (!response.ok) {
        setError(payload.error ?? 'Ett oväntat fel inträffade. Försök igen.')
        setCode('')
        return
      }

      onSuccess({
        participantId: payload.participantId,
        name: payload.name,
      })
    } catch {
      setError('Kunde inte ansluta till servern. Försök igen.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <p className="eyebrow">Tipset</p>
          <h1>Åtkomst</h1>
          <p className="lead-text">Ange ditt namn och åtkomstkoden för att komma igång.</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="name">Namn</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ditt namn"
              autoComplete="name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="code">Åtkomstkod</label>
            <input
              id="code"
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Åtkomstkod"
              autoComplete="current-password"
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="primary-button" disabled={isSubmitting}>
            {isSubmitting ? 'Kontrollerar...' : 'Gå vidare'}
          </button>
        </form>
      </div>
    </div>
  )
}

function renderPage(
  activePage: PageId,
  pageProps: {
    fixtureTips: FixtureTip[]
    groupPlacements: GroupPlacement[]
    knockoutPredictions: KnockoutPredictionRound[]
    specialPredictions: SpecialPredictions
    extraAnswers: ExtraAnswers
    publishedQuestions: AdminQuestion[]
    adminSession: AdminSession | null
    onChangeTip: (
      match: string,
      key: 'homeScore' | 'awayScore' | 'sign',
      value: number | '' | '1' | 'X' | '2',
      source?: 'quick-score' | 'quick-sign' | 'fallback-score' | 'wheel-score',
    ) => void
    onSetScorePreset: (match: string, home: number, away: number, source?: 'quick-score' | 'fallback-score') => void
    onChangeGroupPlacement: (group: string, index: number, value: string) => void
    onChangeKnockoutPrediction: (roundTitle: string, index: number, value: string) => void
    onChangeSpecialPrediction: (key: keyof SpecialPredictions, value: string) => void
    onChangeExtraAnswer: (questionId: number, answer: string) => void
    onAdminSessionChange: (session: AdminSession | null) => void
    onSaveTips: () => void
    onClearTips: () => void
    isSavingTips: boolean
    tipsSaveMessage: string
    myTipsSavedLabel: string
    isTouchDevice: boolean
    isGlobalLockActive: boolean
    globalDeadlineLabel: string
    participant: ParticipantSession | null
    leaderboard: LeaderboardEntry[]
    participantScoreDetail: ParticipantScoreDetail | null
    isParticipantScoreLoading: boolean
    results: MatchResult[]
    specialResults: SpecialResultsState
    isResultsLoading: boolean
    canUseLifecyclePreview: boolean
    lifecyclePreviewMode: 'auto' | 'B' | 'C'
    onLifecyclePreviewModeChange: (mode: 'auto' | 'B' | 'C') => void
  },
) {
  switch (activePage) {
    case 'login':
      return null
    case 'start':
      return (
        <StartPage
          participant={pageProps.participant}
          leaderboard={pageProps.leaderboard}
          tipsSaveMessage={pageProps.tipsSaveMessage}
          isGlobalLockActive={pageProps.isGlobalLockActive}
          canUseLifecyclePreview={pageProps.canUseLifecyclePreview}
          lifecyclePreviewMode={pageProps.lifecyclePreviewMode}
          onLifecyclePreviewModeChange={pageProps.onLifecyclePreviewModeChange}
        />
      )
    case 'results':
      return (
        <ResultsPage
          participant={pageProps.participant}
          leaderboard={pageProps.leaderboard}
          participantScoreDetail={pageProps.participantScoreDetail}
          isParticipantScoreLoading={pageProps.isParticipantScoreLoading}
          results={pageProps.results}
          specialResults={pageProps.specialResults}
          isResultsLoading={pageProps.isResultsLoading}
        />
      )
    case 'tips':
      return (
        <TipsPage
          fixtureTips={pageProps.fixtureTips}
          groupPlacements={pageProps.groupPlacements}
          knockoutPredictions={pageProps.knockoutPredictions}
          specialPredictions={pageProps.specialPredictions}
          extraAnswers={pageProps.extraAnswers}
          publishedQuestions={pageProps.publishedQuestions}
          onChangeTip={pageProps.onChangeTip}
          onSetScorePreset={pageProps.onSetScorePreset}
          onChangeGroupPlacement={pageProps.onChangeGroupPlacement}
          onChangeKnockoutPrediction={pageProps.onChangeKnockoutPrediction}
          onChangeSpecialPrediction={pageProps.onChangeSpecialPrediction}
          onChangeExtraAnswer={pageProps.onChangeExtraAnswer}
          onSave={pageProps.onSaveTips}
          onClear={pageProps.onClearTips}
          isSaving={pageProps.isSavingTips}
          saveMessage={pageProps.tipsSaveMessage}
          isTouchDevice={pageProps.isTouchDevice}
          isGlobalLockActive={pageProps.isGlobalLockActive}
          globalDeadlineLabel={pageProps.globalDeadlineLabel}
        />
      )
    case 'mine':
      return (
        <MyTipsPage
          fixtureTips={pageProps.fixtureTips}
          groupPlacements={pageProps.groupPlacements}
          knockoutPredictions={pageProps.knockoutPredictions}
          specialPredictions={pageProps.specialPredictions}
          extraAnswers={pageProps.extraAnswers}
          publishedQuestions={pageProps.publishedQuestions}
          participant={pageProps.participant}
          participantScoreDetail={pageProps.participantScoreDetail}
          isParticipantScoreLoading={pageProps.isParticipantScoreLoading}
          lastSavedLabel={pageProps.myTipsSavedLabel}
          isGlobalLockActive={pageProps.isGlobalLockActive}
          canUseLifecyclePreview={pageProps.canUseLifecyclePreview}
          lifecyclePreviewMode={pageProps.lifecyclePreviewMode}
        />
      )
    case 'rules':
      return (
        <RulesPage
          isGlobalLockActive={pageProps.isGlobalLockActive}
          canUseLifecyclePreview={pageProps.canUseLifecyclePreview}
          lifecyclePreviewMode={pageProps.lifecyclePreviewMode}
        />
      )
    case 'admin':
      return <AdminPage adminSession={pageProps.adminSession} onAdminSessionChange={pageProps.onAdminSessionChange} />
    default:
      return null
  }
}

function StartPage({
  participant,
  leaderboard,
  tipsSaveMessage,
  isGlobalLockActive,
  canUseLifecyclePreview,
  lifecyclePreviewMode,
  onLifecyclePreviewModeChange,
}: {
  participant: ParticipantSession | null
  leaderboard: LeaderboardEntry[]
  tipsSaveMessage: string
  isGlobalLockActive: boolean
  canUseLifecyclePreview: boolean
  lifecyclePreviewMode: 'auto' | 'B' | 'C'
  onLifecyclePreviewModeChange: (mode: 'auto' | 'B' | 'C') => void
}) {
  const currentEntry = participant
    ? leaderboard.find((entry) => entry.participantId === participant.participantId) ?? null
    : null
  const topEntries = leaderboard.slice(0, 5)
  const previewMode = canUseLifecyclePreview ? lifecyclePreviewMode : 'auto'
  const effectivePhase = previewMode === 'auto' ? (isGlobalLockActive ? 'C' : 'B') : previewMode
  const isTrackingPhase = effectivePhase === 'C'

  const renderLeaderboard = () => {
    if (topEntries.length === 0) {
      return <p className="status-note">Ingen poängställning ännu.</p>
    }

    return (
      <ul className="updates-list">
        {topEntries.map((entry) => (
          <li key={entry.participantId}>
            <strong>{entry.positionLabel}</strong> {entry.name} - {entry.totalPoints} p
          </li>
        ))}
      </ul>
    )
  }

  return (
    <div className="page-stack">
      <section className="panel panel-split start-overview">
        <div>
          <div className="section-heading compact">
            <p className="eyebrow">Start</p>
            <h1>{isTrackingPhase ? 'Följ VM 2026' : 'Lägg dina tips för VM 2026'}</h1>
          </div>
          <p className="lead-text">
            {isTrackingPhase
              ? 'Turneringen är igång. Följ topplistan och din aktuella placering här.'
              : 'Allt du behöver finns samlat här: lämna tips, följ dina framsteg och håll koll på vad som låser härnäst.'}
          </p>

          {canUseLifecyclePreview ? (
            <div className="inline-actions">
              <span className="status-note">Lokal faspreview (Jarmo):</span>
              <label className="form-group results-select-group">
                <span>Visa fas</span>
                <select
                  className="special-input start-phase-select"
                  value={lifecyclePreviewMode}
                  onChange={(e) => onLifecyclePreviewModeChange(e.target.value as 'auto' | 'B' | 'C')}
                >
                  <option value="auto">Auto</option>
                  <option value="B">Fas B</option>
                  <option value="C">Fas C</option>
                </select>
              </label>
              <span className="save-pill">Aktiv fas: {effectivePhase}</span>
            </div>
          ) : null}
        </div>
        <div className="start-stats">
          <div className="start-stat">
            <span>Din placering</span>
            <strong>{currentEntry ? currentEntry.positionLabel : '-'}</strong>
          </div>
          <div className="start-stat">
            <span>Dina poäng</span>
            <strong>{currentEntry ? `${currentEntry.totalPoints} p` : '0 p'}</strong>
          </div>
          <div className="start-stat">
            <span>Status</span>
            <strong>{participant ? (isTrackingPhase ? 'Turnering pågår' : tipsSaveMessage) : 'Inte inloggad'}</strong>
          </div>
        </div>
      </section>

      {!isTrackingPhase ? (
        <>
          <section className="summary-grid">
            {summaryCards.map((card) => (
              <article className="summary-card" key={card.title}>
                <h2>{card.title}</h2>
                <p>{card.detail}</p>
              </article>
            ))}
          </section>

          <section className="panel">
            <div className="section-heading">
              <p className="eyebrow">Kategorier</p>
              <h2>Det här kan du tippa</h2>
            </div>
            <div className="category-grid">
              {categoryItems.map((item) => (
                <div className="category-chip" key={item.label}>
                  <span className="chip-count">{item.count}</span>
                  {item.label}
                </div>
              ))}
            </div>
          </section>

          <section className="panel panel-split">
            <div>
              <div className="section-heading">
                <p className="eyebrow">Framsteg</p>
                <h2>Du har fyllt i: 0%</h2>
                <p className="tips-total">0 av 154 tips inskickade</p>
              </div>
              <div className="progress-list">
                {progressItems.map((item) => (
                  <div className="progress-row" key={item.label}>
                    <div className="progress-label">
                      <span>{item.label}</span>
                      <strong>{item.value}%</strong>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${item.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="updates-card">
              <div className="section-heading compact">
                <p className="eyebrow">Topplista</p>
                <h2>Aktuell ställning</h2>
              </div>
              {renderLeaderboard()}
            </div>
          </section>
        </>
      ) : (
        <section className="panel">
          <div className="section-heading compact">
            <p className="eyebrow">Topplista</p>
            <h2>Aktuell ställning</h2>
            <p className="status-note">Prediktioner är låsta. Startsidan visar nu bara turneringsläge och poängstatus.</p>
          </div>
          {renderLeaderboard()}
        </section>
      )}
    </div>
  )
}

function ParticipantScorePanel({
  eyebrow,
  title,
  participantScoreDetail,
  isLoading,
  controls,
}: {
  eyebrow: string
  title: string
  participantScoreDetail: ParticipantScoreDetail | null
  isLoading: boolean
  controls?: ReactNode
}) {
  const settledFixtureEntries = participantScoreDetail?.breakdown.filter((entry) => entry.reason !== 'unsettled') ?? []
  const settledGroupEntries = participantScoreDetail?.groupPlacementBreakdown.filter((entry) => entry.reason !== 'unsettled-group') ?? []
  const settledKnockoutEntries = participantScoreDetail?.knockoutBreakdown.filter((entry) => entry.reason !== 'unsettled-round') ?? []
  const settledSpecialEntries = participantScoreDetail?.specialBreakdown.filter((entry) => entry.settled) ?? []
  const settledExtraEntries = participantScoreDetail?.extraBreakdown.filter((entry) => entry.settled) ?? []

  return (
    <section className="panel">
      <div className="section-heading compact">
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
      </div>

      {controls}

      {isLoading ? (
        <p className="status-note">Laddar poängdetaljer...</p>
      ) : !participantScoreDetail ? (
        <p className="status-note">Ingen poängdata tillgänglig ännu.</p>
      ) : (
        <>
          <div className="stats-grid">
            <article className="mini-card">
              <span className="mini-label">Totalpoäng</span>
              <strong>{participantScoreDetail.totalPoints} p</strong>
              <span className="status-note">Placering: {participantScoreDetail.positionLabel ?? '-'}</span>
            </article>
            <article className="mini-card">
              <span className="mini-label">Gruppspel</span>
              <strong>{participantScoreDetail.fixturePoints} p</strong>
              <span className="status-note">Avgjorda matcher: {participantScoreDetail.settledMatches}</span>
            </article>
            <article className="mini-card">
              <span className="mini-label">Gruppplaceringar</span>
              <strong>{participantScoreDetail.groupPlacementPoints} p</strong>
              <span className="status-note">Avgjorda grupper: {participantScoreDetail.settledGroups}</span>
            </article>
            <article className="mini-card">
              <span className="mini-label">Slutspel</span>
              <strong>{participantScoreDetail.knockoutPoints} p</strong>
              <span className="status-note">Avgjorda rundor: {participantScoreDetail.settledKnockoutRounds}</span>
            </article>
            <article className="mini-card">
              <span className="mini-label">Special</span>
              <strong>{participantScoreDetail.specialPoints} p</strong>
              <span className="status-note">Avgjorda special: {participantScoreDetail.settledSpecialPredictions}</span>
            </article>
            <article className="mini-card">
              <span className="mini-label">Extrafrågor</span>
              <strong>{participantScoreDetail.extraQuestionPoints} p</strong>
              <span className="status-note">Avgjorda frågor: {participantScoreDetail.settledQuestions}</span>
            </article>
          </div>

          <details className="accordion-card">
            <summary>
              <strong>Avgjorda gruppspelsmatcher</strong>
              <span className="count-badge">{settledFixtureEntries.length}</span>
            </summary>
            {settledFixtureEntries.length === 0 ? (
              <p>Inga avgjorda gruppspelsmatcher ännu.</p>
            ) : (
              <ul className="score-breakdown-list">
                {settledFixtureEntries.map((entry) => (
                  <li className="score-breakdown-item" key={`${entry.matchId ?? entry.match}-${entry.reason}`}>
                    <div className="score-breakdown-main">
                      <strong>{entry.match}</strong>
                      <div className="score-breakdown-badges">
                        <span className={entry.points > 0 ? 'points-badge' : 'points-badge zero'}>{entry.points} p</span>
                        <span className={`reason-badge ${getReasonTone(entry.reason)}`}>{formatFixtureReason(entry.reason)}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </details>

          <details className="accordion-card">
            <summary>
              <strong>Avgjorda gruppplaceringar</strong>
              <span className="count-badge">{settledGroupEntries.length}</span>
            </summary>
            {settledGroupEntries.length === 0 ? (
              <p>Inga avgjorda gruppplaceringar ännu.</p>
            ) : (
              <ul className="score-breakdown-list">
                {settledGroupEntries.map((entry) => (
                  <li className="score-breakdown-item" key={`${entry.group}-${entry.points}`}>
                    <div className="score-breakdown-main">
                      <strong>{entry.group}</strong>
                      <div className="score-breakdown-badges">
                        <span className={entry.points > 0 ? 'points-badge' : 'points-badge zero'}>{entry.points} p</span>
                        <span className={`reason-badge ${getReasonTone(entry.reason)}`}>{formatGroupReason(entry.reason, entry.matchedPositions)}</span>
                      </div>
                    </div>
                    {formatPositionsMeta(entry.matchedPositions) ? (
                      <span className="score-breakdown-meta">{formatPositionsMeta(entry.matchedPositions)}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </details>

          <details className="accordion-card">
            <summary>
              <strong>Avgjorda slutspel</strong>
              <span className="count-badge">{settledKnockoutEntries.length}</span>
            </summary>
            {settledKnockoutEntries.length === 0 ? (
              <p>Inga avgjorda slutspelsprediktioner ännu.</p>
            ) : (
              <ul className="score-breakdown-list">
                {settledKnockoutEntries.map((entry) => (
                  <li className="score-breakdown-item" key={`${entry.round}-${entry.points}`}>
                    <div className="score-breakdown-main">
                      <strong>{entry.round}</strong>
                      <div className="score-breakdown-badges">
                        <span className={entry.points > 0 ? 'points-badge' : 'points-badge zero'}>{entry.points} p</span>
                        <span className={`reason-badge ${getReasonTone(entry.reason)}`}>{formatRoundReason(entry.reason, entry.matchedTeams)}</span>
                      </div>
                    </div>
                    {formatTeamsMeta(entry.matchedTeams) ? <span className="score-breakdown-meta">{formatTeamsMeta(entry.matchedTeams)}</span> : null}
                  </li>
                ))}
              </ul>
            )}
          </details>

          <details className="accordion-card">
            <summary>
              <strong>Avgjorda special</strong>
              <span className="count-badge">{settledSpecialEntries.length}</span>
            </summary>
            {settledSpecialEntries.length === 0 ? (
              <p>Inga avgjorda specialprediktioner ännu.</p>
            ) : (
              <ul className="score-breakdown-list">
                {settledSpecialEntries.map((entry) => (
                  <li className="score-breakdown-item" key={entry.key}>
                    <div className="score-breakdown-main">
                      <strong>{entry.label}</strong>
                      <div className="score-breakdown-badges">
                        <span className={entry.points > 0 ? 'points-badge' : 'points-badge zero'}>{entry.points} p</span>
                        <span className={`reason-badge ${getReasonTone(entry.reason)}`}>{formatSpecialReason(entry.reason)}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </details>

          <details className="accordion-card">
            <summary>
              <strong>Avgjorda extrafrågor</strong>
              <span className="count-badge">{settledExtraEntries.length}</span>
            </summary>
            {settledExtraEntries.length === 0 ? (
              <p>Inga avgjorda extrafrågor ännu.</p>
            ) : (
              <ul className="score-breakdown-list">
                {settledExtraEntries.map((entry) => (
                  <li className="score-breakdown-item" key={`${entry.questionId ?? 'unknown'}-${entry.points}`}>
                    <div className="score-breakdown-main">
                      <strong>{entry.questionText ?? 'Fråga'}</strong>
                      <div className="score-breakdown-badges">
                        <span className={entry.points > 0 ? 'points-badge' : 'points-badge zero'}>{entry.points} p</span>
                        <span className={`reason-badge ${getReasonTone(entry.reason)}`}>{formatExtraReason(entry.reason)}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </details>
        </>
      )}
    </section>
  )
}

function ResultsPage({
  participant,
  leaderboard,
  participantScoreDetail,
  isParticipantScoreLoading,
  results,
  specialResults,
  isResultsLoading,
}: {
  participant: ParticipantSession | null
  leaderboard: LeaderboardEntry[]
  participantScoreDetail: ParticipantScoreDetail | null
  isParticipantScoreLoading: boolean
  results: MatchResult[]
  specialResults: SpecialResultsState
  isResultsLoading: boolean
}) {
  const [activeStage, setActiveStage] = useState<'all' | MatchResultStage>('all')
  const [activeStatus, setActiveStatus] = useState<'all' | MatchResultStatus>('all')
  const canUseMockResultsPreview = Boolean(participant?.name && /jarmo/i.test(participant.name))
  const [useMockResultsPreview, setUseMockResultsPreview] = useState(false)

  useEffect(() => {
    setUseMockResultsPreview(false)
  }, [participant?.participantId])

  const mockResults: MatchResult[] = canUseMockResultsPreview
    ? [
        {
          matchId: 'G-A-1',
          stage: 'group',
          round: null,
          groupCode: 'A',
          homeTeam: 'Mexiko',
          awayTeam: 'Sydafrika',
          kickoffAt: '2026-06-11 21:00',
          homeScore: 2,
          awayScore: 1,
          resultStatus: 'completed',
          settledAt: '2026-06-11T21:58:00Z',
          createdAt: '2026-06-11T19:00:00Z',
          updatedAt: '2026-06-11T21:58:00Z',
        },
        {
          matchId: 'G-B-2',
          stage: 'group',
          round: null,
          groupCode: 'B',
          homeTeam: 'Qatar',
          awayTeam: 'Schweiz',
          kickoffAt: '2026-06-13 21:00',
          homeScore: 1,
          awayScore: 1,
          resultStatus: 'live',
          settledAt: null,
          createdAt: '2026-06-13T19:00:00Z',
          updatedAt: '2026-06-13T19:52:00Z',
        },
        {
          matchId: 'G-C-3',
          stage: 'group',
          round: null,
          groupCode: 'C',
          homeTeam: 'Brasilien',
          awayTeam: 'Haiti',
          kickoffAt: '2026-06-20 03:00',
          homeScore: null,
          awayScore: null,
          resultStatus: 'planned',
          settledAt: null,
          createdAt: '2026-06-18T12:00:00Z',
          updatedAt: '2026-06-18T12:00:00Z',
        },
        {
          matchId: 'KO-R16-2',
          stage: 'knockout',
          round: 'Åttondelsfinal',
          groupCode: null,
          homeTeam: 'Kanada',
          awayTeam: 'Nederländerna',
          kickoffAt: '2026-07-24 21:00',
          homeScore: 0,
          awayScore: 2,
          resultStatus: 'completed',
          settledAt: '2026-07-24T21:55:00Z',
          createdAt: '2026-07-24T18:00:00Z',
          updatedAt: '2026-07-24T21:55:00Z',
        },
        {
          matchId: 'KO-QF-1',
          stage: 'knockout',
          round: 'Kvartsfinal',
          groupCode: null,
          homeTeam: 'Brasilien',
          awayTeam: 'Spanien',
          kickoffAt: '2026-07-27 20:00',
          homeScore: 1,
          awayScore: 1,
          resultStatus: 'live',
          settledAt: null,
          createdAt: '2026-07-27T18:00:00Z',
          updatedAt: '2026-07-27T19:47:00Z',
        },
      ]
    : []

  const mockSpecialResults: SpecialResultsState = canUseMockResultsPreview
    ? {
        winner: 'Argentina',
        topScorer: 'Kylian Mbappé',
        updatedAt: '2026-07-27T19:50:00Z',
      }
    : { winner: '', topScorer: '' }

  const mockParticipantScoreDetail: ParticipantScoreDetail | null = canUseMockResultsPreview
    ? {
        participantId: participant?.participantId ?? 0,
        name: participant?.name ?? 'Jarmo',
        totalPoints: 42,
        fixturePoints: 12,
        groupPlacementPoints: 7,
        knockoutPoints: 11,
        specialPoints: 8,
        extraQuestionPoints: 4,
        settledMatches: 10,
        settledGroups: 5,
        settledKnockoutRounds: 2,
        settledSpecialPredictions: 2,
        settledQuestions: 3,
        breakdown: [
          { matchId: 'G-A-1', match: 'Mexiko - Sydafrika', points: 2, reason: 'exact-score' },
          { matchId: 'G-B-2', match: 'Qatar - Schweiz', points: 1, reason: 'correct-sign' },
          { matchId: 'G-C-1', match: 'Brasilien - Marocko', points: 0, reason: 'wrong-result' },
          { matchId: 'G-D-1', match: 'USA - Paraguay', points: 2, reason: 'exact-score' },
        ],
        groupPlacementBreakdown: [
          {
            group: 'Grupp A',
            predictedPicks: ['Mexiko', 'Sydafrika', 'Sydkorea', 'DEN/MKD/CZE/IRL'],
            actualPicks: ['Mexiko', 'Sydafrika', 'Sydkorea', 'DEN/MKD/CZE/IRL'],
            matchedPositions: [1, 2, 3, 4],
            points: 4,
            reason: 'settled-group',
          },
          {
            group: 'Grupp B',
            predictedPicks: ['Kanada', 'Schweiz', 'Qatar', 'ITA/NIR/WAL/BIH'],
            actualPicks: ['Kanada', 'Qatar', 'Schweiz', 'ITA/NIR/WAL/BIH'],
            matchedPositions: [1, 4],
            points: 2,
            reason: 'settled-group',
          },
        ],
        knockoutBreakdown: [
          {
            round: 'Åttondelsfinal',
            predictedTeams: ['Brasilien', 'Kanada', 'Spanien', 'Argentina'],
            actualTeams: ['Brasilien', 'Kanada', 'Spanien', 'Argentina'],
            matchedTeams: ['Brasilien', 'Kanada', 'Spanien', 'Argentina'],
            points: 4,
            pointsPerTeam: 1,
            reason: 'settled-round',
          },
          {
            round: 'Kvartsfinal',
            predictedTeams: ['Brasilien', 'Spanien', 'Frankrike', 'Argentina'],
            actualTeams: ['Brasilien', 'Spanien', 'Frankrike', 'Argentina'],
            matchedTeams: ['Brasilien', 'Spanien', 'Frankrike', 'Argentina'],
            points: 8,
            pointsPerTeam: 2,
            reason: 'settled-round',
          },
        ],
        specialBreakdown: [
          {
            key: 'winner',
            label: 'Slutsegrare',
            predictedValue: 'Argentina',
            actualValue: 'Argentina',
            points: 4,
            maxPoints: 4,
            settled: true,
            reason: 'correct-special',
          },
          {
            key: 'topScorer',
            label: 'Skytteligavinnare',
            predictedValue: 'Kylian Mbappé',
            actualValue: 'Kylian Mbappé',
            points: 4,
            maxPoints: 4,
            settled: true,
            reason: 'correct-special',
          },
        ],
        extraBreakdown: [
          {
            questionId: 201,
            questionText: 'Hur många mål blir det i finalen?',
            selectedAnswer: '3',
            correctAnswer: '3',
            points: 2,
            settled: true,
            reason: 'correct-answer',
          },
          {
            questionId: 202,
            questionText: 'Vilken grupp gör flest mål?',
            selectedAnswer: 'Grupp A',
            correctAnswer: 'Grupp C',
            points: 0,
            settled: true,
            reason: 'wrong-answer',
          },
          {
            questionId: 203,
            questionText: 'Hur många oavgjorda åttondelar?',
            selectedAnswer: '2',
            correctAnswer: '2',
            points: 2,
            settled: true,
            reason: 'correct-answer',
          },
        ],
        updatedAt: '2026-07-27T19:52:00Z',
        rank: 2,
        positionLabel: '2',
      }
    : null

  const displayedResults = useMockResultsPreview && canUseMockResultsPreview ? mockResults : results
  const displayedSpecialResults = useMockResultsPreview && canUseMockResultsPreview ? mockSpecialResults : specialResults
  const displayedParticipantScoreDetail =
    useMockResultsPreview && canUseMockResultsPreview ? mockParticipantScoreDetail : participantScoreDetail
  const showResultsLoading = isResultsLoading && !(useMockResultsPreview && canUseMockResultsPreview)
  const showParticipantScoreLoading =
    isParticipantScoreLoading && !(useMockResultsPreview && canUseMockResultsPreview)

  const currentEntry = participant
    ? leaderboard.find((entry) => entry.participantId === participant.participantId) ?? null
    : null
  const displayedPositionLabel = displayedParticipantScoreDetail?.positionLabel ?? currentEntry?.positionLabel ?? '-'
  const displayedTotalPoints =
    displayedParticipantScoreDetail?.totalPoints ?? currentEntry?.totalPoints ?? 0

  const filteredResults = displayedResults.filter((entry) => {
    if (activeStage !== 'all' && entry.stage !== activeStage) {
      return false
    }

    if (activeStatus !== 'all' && entry.resultStatus !== activeStatus) {
      return false
    }

    return true
  })

  const liveCount = displayedResults.filter((entry) => entry.resultStatus === 'live').length
  const completedCount = displayedResults.filter((entry) => entry.resultStatus === 'completed').length
  const plannedCount = displayedResults.filter((entry) => entry.resultStatus === 'planned').length

  return (
    <div className="page-stack">
      <section className="panel panel-split start-overview">
        <div>
          <div className="section-heading compact">
            <p className="eyebrow">Resultat & poäng</p>
            <h1>Matchläge och din poäng just nu</h1>
          </div>
          <p className="lead-text">
            Följ officiella matchresultat, specialutfall och hur de påverkar din nuvarande ställning.
          </p>
        </div>
        <div className="start-stats">
          <div className="start-stat">
            <span>Din placering</span>
            <strong>{displayedPositionLabel}</strong>
          </div>
          <div className="start-stat">
            <span>Totalpoäng</span>
            <strong>{displayedTotalPoints} p</strong>
          </div>
          <div className="start-stat">
            <span>Avgjorda matcher</span>
            <strong>{completedCount}</strong>
          </div>
        </div>
      </section>

      <section className="summary-grid">
        <article className="summary-card">
          <h2>{liveCount}</h2>
          <p>Live just nu</p>
        </article>
        <article className="summary-card">
          <h2>{completedCount}</h2>
          <p>Slutförda matcher</p>
        </article>
        <article className="summary-card">
          <h2>{plannedCount}</h2>
          <p>Planerade matcher</p>
        </article>
      </section>

      <section className="panel results-panel">
        <div className="section-heading compact">
          <p className="eyebrow">Matcher</p>
          <h2>Officiella resultat</h2>
        </div>

        {canUseMockResultsPreview ? (
          <div className="inline-actions">
            <button className="ghost-button" type="button" onClick={() => setUseMockResultsPreview((current) => !current)}>
              {useMockResultsPreview ? 'Visa riktiga resultat' : 'Visa mockdata'}
            </button>
            <span className="status-note">Lokal preview för Jarmo. Ingen data sparas och backend påverkas inte.</span>
          </div>
        ) : null}

        <div className="results-toolbar">
          <div className="tab-row" aria-label="Filtrera steg">
            {[
              { value: 'all', label: 'Alla' },
              { value: 'group', label: 'Gruppspel' },
              { value: 'knockout', label: 'Slutspel' },
            ].map((option) => (
              <button
                className={activeStage === option.value ? 'tab-button active' : 'tab-button'}
                key={option.value}
                type="button"
                onClick={() => setActiveStage(option.value as 'all' | MatchResultStage)}
              >
                {option.label}
              </button>
            ))}
          </div>

          <label className="form-group results-select-group">
            <span>Status</span>
            <select value={activeStatus} onChange={(e) => setActiveStatus(e.target.value as 'all' | MatchResultStatus)}>
              <option value="all">Alla statusar</option>
              <option value="planned">Planerad</option>
              <option value="live">Live</option>
              <option value="completed">Slut</option>
            </select>
          </label>
        </div>

        {showResultsLoading ? (
          <p className="status-note">Laddar officiella resultat...</p>
        ) : filteredResults.length === 0 ? (
          <p className="status-note">Inga matcher matchar filtret ännu.</p>
        ) : (
          <div className="results-grid">
            {filteredResults.map((entry) => {
              const scoreline =
                entry.homeScore === null || entry.awayScore === null ? 'Ej avgjord ännu' : `${entry.homeScore}-${entry.awayScore}`

              return (
                <article className="result-card" key={entry.matchId}>
                  <div className="result-card-header">
                    <div>
                      <span className="mini-label">{entry.stage === 'group' ? entry.groupCode ? `Grupp ${entry.groupCode}` : 'Gruppspel' : entry.round ?? 'Slutspel'}</span>
                      <strong>{entry.homeTeam} - {entry.awayTeam}</strong>
                    </div>
                    <span className={`result-status-pill ${entry.resultStatus}`}>{formatMatchResultStatusLabel(entry.resultStatus)}</span>
                  </div>

                  <div className="result-scoreline-row">
                    <span className="result-scoreline">{scoreline}</span>
                    <span className="status-note">Avspark: {formatDateTimeLabel(entry.kickoffAt)}</span>
                  </div>

                  <div className="result-card-meta">
                    <span>Match-ID: {entry.matchId}</span>
                    <span>Senast uppdaterad: {formatDateTimeLabel(entry.updatedAt)}</span>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      <section className="panel">
        <div className="section-heading compact">
          <p className="eyebrow">Special</p>
          <h2>Avgjorda specialutfall</h2>
        </div>

        <div className="stats-grid">
          <article className="mini-card">
            <span className="mini-label">Slutsegrare</span>
            <strong>{displayedSpecialResults.winner || 'Inte satt ännu'}</strong>
          </article>
          <article className="mini-card">
            <span className="mini-label">Skytteligavinnare</span>
            <strong>{displayedSpecialResults.topScorer || 'Inte satt ännu'}</strong>
          </article>
          <article className="mini-card">
            <span className="mini-label">Senast uppdaterad</span>
            <strong>{formatDateTimeLabel(displayedSpecialResults.updatedAt)}</strong>
          </article>
        </div>
      </section>

      <section className="panel">
        <div className="section-heading compact">
          <p className="eyebrow">Om poängvyn</p>
          <h2>Varför syns poäng även i Mina tips?</h2>
        </div>
        <div className="lock-warning">
          <ul>
            <li><strong>Mina tips</strong> visar vad du har lämnat in.</li>
            <li><strong>Resultat & poäng</strong> visar officiella utfall och hur de påverkar samma personliga poängdata.</li>
            <li>Poängen hämtas från samma källa, men visas i två olika sammanhang för snabbare uppföljning.</li>
          </ul>
        </div>
      </section>

      <ParticipantScorePanel
        eyebrow="Poäng"
        title="Din poängöversikt"
        participantScoreDetail={displayedParticipantScoreDetail}
        isLoading={showParticipantScoreLoading}
      />
    </div>
  )
}

function TipsPage({
  fixtureTips,
  groupPlacements,
  knockoutPredictions,
  specialPredictions,
  extraAnswers,
  publishedQuestions,
  onChangeTip,
  onSetScorePreset,
  onChangeGroupPlacement,
  onChangeKnockoutPrediction,
  onChangeSpecialPrediction,
  onChangeExtraAnswer,
  onSave,
  onClear,
  isSaving,
  saveMessage,
  isTouchDevice,
  isGlobalLockActive,
  globalDeadlineLabel,
}: {
  fixtureTips: FixtureTip[]
  groupPlacements: GroupPlacement[]
  knockoutPredictions: KnockoutPredictionRound[]
  specialPredictions: SpecialPredictions
  extraAnswers: ExtraAnswers
  publishedQuestions: AdminQuestion[]
  onChangeTip: (
    match: string,
    key: 'homeScore' | 'awayScore' | 'sign',
    value: number | '' | '1' | 'X' | '2',
    source?: 'quick-score' | 'quick-sign' | 'fallback-score' | 'wheel-score',
  ) => void
  onSetScorePreset: (match: string, home: number, away: number, source?: 'quick-score' | 'fallback-score') => void
  onChangeGroupPlacement: (group: string, index: number, value: string) => void
  onChangeKnockoutPrediction: (roundTitle: string, index: number, value: string) => void
  onChangeSpecialPrediction: (key: keyof SpecialPredictions, value: string) => void
  onChangeExtraAnswer: (questionId: number, answer: string) => void
  onSave: () => void
  onClear: () => void
  isSaving: boolean
  saveMessage: string
  isTouchDevice: boolean
  isGlobalLockActive: boolean
  globalDeadlineLabel: string
}) {
  const [expandedManualEditor, setExpandedManualEditor] = useState<Record<string, boolean>>({})
  const [activeKnockoutField, setActiveKnockoutField] = useState<{ roundTitle: string; index: number } | null>(null)
  const [activeSection, setActiveSection] = useState<TipsSectionTab>('Gruppspel')
  const enableKnockoutTypeahead = !isTouchDevice

  const getInlineKnockoutSuggestions = (options: string[], inputValue: string): string[] => {
    const uniqueOptions = Array.from(
      new Set(options.map((option) => normalizeKnockoutPickLabel(option)).filter((option) => option.length > 0)),
    )

    const query = normalizeKnockoutPickLabel(inputValue).toLowerCase()
    if (!query) {
      return uniqueOptions.slice(0, 8)
    }

    const startsWith = uniqueOptions.filter((option) => option.toLowerCase().startsWith(query))
    const contains = uniqueOptions.filter(
      (option) => !option.toLowerCase().startsWith(query) && option.toLowerCase().includes(query),
    )

    return [...startsWith, ...contains].slice(0, 8)
  }

  const toggleManualEditor = (match: string) => {
    setExpandedManualEditor((current) => ({
      ...current,
      [match]: !current[match],
    }))
  }

  const groupedFixtureTips = GROUP_CODES.map((groupCode) => ({
    groupCode,
    matches: fixtureTips.filter((tip) => tip.group === groupCode),
    placement: groupPlacements.find((item) => item.group === `Grupp ${groupCode}`),
  }))

  return (
    <div className="page-stack">
      <section className="panel panel-sticky-head">
        <div>
          <p className="eyebrow">Lämna tips</p>
          <h1 className="section-title">Lämna dina tips</h1>
          {isGlobalLockActive ? <p className="status-note">Tips är låsta (deadline passerad: {globalDeadlineLabel}).</p> : null}
        </div>
        <div className="inline-actions">
          <span className="save-pill">{saveMessage}</span>
          <button className="primary-button" type="button" onClick={onSave} disabled={isSaving || isGlobalLockActive}>
            {isSaving ? 'Sparar...' : 'Spara'}
          </button>
        </div>
      </section>

      <section className="tab-row" aria-label="Sektioner">
        {tipsSectionTabs.map((tab) => (
          <button
            className={activeSection === tab ? 'tab-button active' : 'tab-button'}
            key={tab}
            type="button"
            onClick={() => setActiveSection(tab)}
          >
            {tab}
          </button>
        ))}
      </section>

      {activeSection === 'Gruppspel' ? (
      <section className="panel">
        <div className="section-heading compact">
          <p className="eyebrow">Gruppspel</p>
          <h2>Gruppkort med matcher och placeringar</h2>
        </div>
        <div className="grouped-fixtures-grid">
          {groupedFixtureTips.map(({ groupCode, matches, placement }) => (
            <article className="group-card grouped-group-card" key={groupCode}>
              <div className="grouped-card-heading">
                <h3>Grupp {groupCode}</h3>
              </div>

              <div className="grouped-match-list">
                {matches.map((row) => {
                  const isLocked = isGlobalLockActive || row.status === 'Låst'

                  return (
                    <div className="grouped-match-row" key={`${row.match}-${row.date}`}>
                      <div className="grouped-row-head">
                        <strong>{row.match}</strong>
                        <span>{row.date}</span>
                      </div>

                      <div className="quick-score-wrap">
                        {QUICK_SCORE_GROUPS.map((group) => (
                          <div className="quick-score-group" key={`${row.match}-${group.key}`}>
                            <span className="quick-score-group-label">{group.label}</span>
                            <div className="quick-score-grid" role="group" aria-label={`${group.label} ${row.match}`}>
                              {group.presets.map((preset) => {
                                const active = row.homeScore === preset.home && row.awayScore === preset.away
                                return (
                                  <button
                                    key={`${row.match}-${group.key}-${preset.home}-${preset.away}`}
                                    type="button"
                                    className={active ? 'quick-score-button active' : 'quick-score-button'}
                                    disabled={isLocked || isSaving}
                                    onClick={() => onSetScorePreset(row.match, preset.home, preset.away, 'quick-score')}
                                  >
                                    {preset.home}-{preset.away}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        ))}

                        <div className="mobile-spinner-row" role="group" aria-label={`Mobil spinner ${row.match}`}>
                          <label className="spinner-field">
                            <span className="spinner-label">Hemma</span>
                            <select
                              className="wheel-select"
                              value={row.homeScore === '' ? 0 : row.homeScore}
                              disabled={isLocked || isSaving}
                              onChange={(e) => onChangeTip(row.match, 'homeScore', Number(e.target.value), 'wheel-score')}
                            >
                              {Array.from({ length: 11 }, (_, index) => (
                                <option key={`${row.match}-home-wheel-${index}`} value={index}>
                                  {index}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="spinner-field">
                            <span className="spinner-label">Borta</span>
                            <select
                              className="wheel-select"
                              value={row.awayScore === '' ? 0 : row.awayScore}
                              disabled={isLocked || isSaving}
                              onChange={(e) => onChangeTip(row.match, 'awayScore', Number(e.target.value), 'wheel-score')}
                            >
                              {Array.from({ length: 11 }, (_, index) => (
                                <option key={`${row.match}-away-wheel-${index}`} value={index}>
                                  {index}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>

                        <button
                          type="button"
                          className="ghost-button quick-more-button"
                          disabled={isLocked || isSaving}
                          onClick={() => toggleManualEditor(row.match)}
                        >
                          {expandedManualEditor[row.match] ? 'Stäng +More' : '+More'}
                        </button>

                        {expandedManualEditor[row.match] && (
                          <div className="score-editor">
                            <input
                              className="tip-input"
                              type="number"
                              min={0}
                              value={row.homeScore}
                              disabled={isLocked || isSaving}
                              onChange={(e) => onChangeTip(row.match, 'homeScore', e.target.value === '' ? '' : Number(e.target.value), 'fallback-score')}
                            />
                            <span>-</span>
                            <input
                              className="tip-input"
                              type="number"
                              min={0}
                              value={row.awayScore}
                              disabled={isLocked || isSaving}
                              onChange={(e) => onChangeTip(row.match, 'awayScore', e.target.value === '' ? '' : Number(e.target.value), 'fallback-score')}
                            />
                          </div>
                        )}
                      </div>

                      <div className="grouped-row-bottom">
                        <div className="sign-segment" role="group" aria-label={`Utfall ${row.match}`}>
                          {(['1', 'X', '2'] as const).map((signOption) => (
                            <button
                              key={`${row.match}-${signOption}`}
                              type="button"
                              className={row.sign === signOption ? 'segment-button active' : 'segment-button'}
                              disabled={isLocked || isSaving}
                              onClick={() => onChangeTip(row.match, 'sign', signOption, 'quick-sign')}
                            >
                              {signOption}
                            </button>
                          ))}
                        </div>
                        <span className={row.status === 'Låst' ? 'status-badge locked' : 'status-badge'}>{row.status}</span>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="grouped-placements">
                <div className="grouped-placements-head">
                  <p className="mini-label">Placeringar</p>
                  <strong>Välj topp 4 i gruppen</strong>
                </div>
                {placement ? (
                  <ol>
                    {placement.picks.map((pick, index) => (
                      <li key={`${placement.group}-${index}`}>
                        <select
                          className="group-pick-input"
                          value={pick}
                          disabled={isSaving || isGlobalLockActive}
                          aria-label={`${placement.group} placering ${index + 1}`}
                          onChange={(e) => onChangeGroupPlacement(placement.group, index, e.target.value)}
                        >
                          <option value="">Välj lag</option>
                          {getAvailableGroupTeams(placement, index).map((team) => (
                            <option key={`${placement.group}-${index}-${team}`} value={team}>
                              {team}
                            </option>
                          ))}
                        </select>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="status-note">Placeringar saknas för grupp {groupCode}.</p>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
      ) : null}

      {activeSection === 'Slutspel' ? (
      <section className="panel">
        <div className="section-heading compact">
          <p className="eyebrow">Slutspel</p>
          <h2>Runda för runda</h2>
        </div>
        <div className="knockout-grid">
          {knockoutPredictions.map((round, roundIndex) => {
            const roundOptions = getRoundKnockoutTeams(knockoutPredictions, groupPlacements, roundIndex)
            const activeRoundOptions = [...roundOptions]

            round.picks.forEach((pick) => {
              const normalized = normalizeKnockoutPickLabel(pick)
              if (normalized && !activeRoundOptions.includes(normalized)) {
                activeRoundOptions.push(normalized)
              }
            })

            return (
              <article className="round-card" key={round.title}>
                <h3>{round.title}</h3>
                {enableKnockoutTypeahead ? (
                  <datalist id={getKnockoutListId(round.title)}>
                    {activeRoundOptions.map((option) => (
                      <option key={`${round.title}-${option}`} value={option} />
                    ))}
                  </datalist>
                ) : null}
                <ul>
                  {round.picks.map((pick, index) => (
                    <li className="knockout-pick-item" key={`${round.title}-${index}`}>
                      <input
                        className="special-input"
                        type="text"
                        list={enableKnockoutTypeahead ? getKnockoutListId(round.title) : undefined}
                        value={pick}
                        disabled={isSaving || isGlobalLockActive}
                        onFocus={() => {
                          if (isTouchDevice) {
                            setActiveKnockoutField({ roundTitle: round.title, index })
                          }
                        }}
                        onBlur={() => {
                          if (isTouchDevice) {
                            setTimeout(() => {
                              setActiveKnockoutField((current) => {
                                if (current?.roundTitle === round.title && current.index === index) {
                                  return null
                                }

                                return current
                              })
                            }, 120)
                          }
                        }}
                        onChange={(e) => {
                          onChangeKnockoutPrediction(round.title, index, e.target.value)

                          if (isTouchDevice) {
                            setActiveKnockoutField({ roundTitle: round.title, index })
                          }
                        }}
                      />
                      {isTouchDevice && activeKnockoutField?.roundTitle === round.title && activeKnockoutField.index === index ? (
                        <div className="knockout-suggestions" role="listbox" aria-label={`${round.title} förslag`}>
                          {getInlineKnockoutSuggestions(activeRoundOptions, pick).map((option) => (
                            <button
                              className="knockout-suggestion-button"
                              key={`${round.title}-${index}-${option}`}
                              type="button"
                              onMouseDown={(event) => {
                                event.preventDefault()
                                onChangeKnockoutPrediction(round.title, index, option)
                                setActiveKnockoutField(null)
                              }}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </article>
            )
          })}
        </div>
      </section>
      ) : null}

      {activeSection === 'Special' ? (
      <section className="panel">
        <div className="section-heading compact">
          <p className="eyebrow">Special</p>
          <h2>Specialfrågor</h2>
        </div>
        <div className="stacked-cards">
          <article className="mini-card">
            <span className="mini-label">Slutsegrare</span>
            <input
              className="special-input"
              type="text"
              value={specialPredictions.winner}
              disabled={isSaving || isGlobalLockActive}
              onChange={(e) => onChangeSpecialPrediction('winner', e.target.value)}
            />
          </article>
          <article className="mini-card">
            <span className="mini-label">Skytteligavinnare</span>
            <input
              className="special-input"
              type="text"
              value={specialPredictions.topScorer}
              disabled={isSaving || isGlobalLockActive}
              onChange={(e) => onChangeSpecialPrediction('topScorer', e.target.value)}
            />
          </article>
        </div>
      </section>
      ) : null}

      {activeSection === 'Extrafrågor' ? (
      <section className="panel">
        <div className="section-heading compact">
          <p className="eyebrow">Extrafrågor</p>
          <h2>Dynamiska frågor</h2>
        </div>
        <div className="stacked-cards">
          {publishedQuestions.length === 0 ? (
            <article className="mini-card">
              <span className="mini-label">Extrafrågor</span>
              <strong>Inga publicerade frågor ännu</strong>
              <span className="status-note">Admin publicerar frågor i adminfliken.</span>
            </article>
          ) : (
            publishedQuestions.map((question) => {
              const isLocked = isGlobalLockActive
              const selectedAnswer = extraAnswers[String(question.id)] ?? ''

              return (
                <article className="mini-card" key={question.id}>
                  <span className="mini-label">{question.category}</span>
                  <strong>{question.questionText}</strong>
                  <span className="status-note">Låstid: {globalDeadlineLabel}</span>
                  <select
                    className="special-input"
                    value={selectedAnswer}
                    disabled={isSaving || isLocked}
                    onChange={(e) => onChangeExtraAnswer(question.id, e.target.value)}
                  >
                    <option value="">Välj svar</option>
                    {question.options.map((option) => (
                      <option key={`${question.id}-${option}`} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <span className={isLocked ? 'status-badge locked' : 'status-badge'}>{isLocked ? 'Låst' : 'Öppen'}</span>
                </article>
              )
            })
          )}
        </div>
      </section>
      ) : null}

      <section className="action-bar">
        <button className="ghost-button" type="button" onClick={onClear} disabled={isSaving || isGlobalLockActive}>Rensa sparade</button>
        <button className="primary-button" type="button" onClick={onSave} disabled={isSaving || isGlobalLockActive}>
          {isSaving ? 'Sparar...' : 'Skicka in tips'}
        </button>
      </section>
    </div>
  )
}

function MyTipsPage({
  fixtureTips,
  groupPlacements,
  knockoutPredictions,
  specialPredictions,
  extraAnswers,
  publishedQuestions,
  participant,
  participantScoreDetail,
  isParticipantScoreLoading,
  lastSavedLabel,
  isGlobalLockActive,
  canUseLifecyclePreview,
  lifecyclePreviewMode,
}: {
  fixtureTips: FixtureTip[]
  groupPlacements: GroupPlacement[]
  knockoutPredictions: KnockoutPredictionRound[]
  specialPredictions: SpecialPredictions
  extraAnswers: ExtraAnswers
  publishedQuestions: AdminQuestion[]
  participant: ParticipantSession | null
  participantScoreDetail: ParticipantScoreDetail | null
  isParticipantScoreLoading: boolean
  lastSavedLabel: string
  isGlobalLockActive: boolean
  canUseLifecyclePreview: boolean
  lifecyclePreviewMode: 'auto' | 'B' | 'C'
}) {
  const canUseMockScorePreview = Boolean(participant?.name && /jarmo/i.test(participant.name))
  const [useMockScorePreview, setUseMockScorePreview] = useState(false)

  useEffect(() => {
    setUseMockScorePreview(false)
  }, [participant?.participantId])

  const mockScoreDetail: ParticipantScoreDetail | null = canUseMockScorePreview
    ? {
        participantId: participant?.participantId ?? 0,
        name: participant?.name ?? 'Jarmo',
        totalPoints: 37,
        fixturePoints: 9,
        groupPlacementPoints: 6,
        knockoutPoints: 10,
        specialPoints: 8,
        extraQuestionPoints: 4,
        settledMatches: 8,
        settledGroups: 4,
        settledKnockoutRounds: 2,
        settledSpecialPredictions: 2,
        settledQuestions: 3,
        breakdown: [
          { matchId: 'G-A-1', match: 'Mexiko - Sydafrika', points: 2, reason: 'exact-score' },
          { matchId: 'G-A-2', match: 'Sydkorea - DEN/MKD/CZE/IRL', points: 0, reason: 'wrong-result' },
          { matchId: 'G-B-1', match: 'Kanada - Qatar', points: 1, reason: 'correct-sign' },
          { matchId: 'G-B-2', match: 'Schweiz - ITA/NIR/WAL/BIH', points: 0, reason: 'missing-tip' },
          { matchId: 'G-C-2', match: 'Haiti - Skottland', points: 2, reason: 'exact-score' },
          { matchId: 'G-D-3', match: 'USA - Australien', points: 1, reason: 'correct-sign' },
          { matchId: 'G-E-2', match: 'Elfenbenskusten - Ecuador', points: 2, reason: 'exact-score' },
          { matchId: 'G-F-4', match: 'Japan - Tunisien', points: 1, reason: 'correct-sign' },
        ],
        groupPlacementBreakdown: [
          {
            group: 'Grupp A',
            predictedPicks: ['Mexiko', 'Sydafrika', 'Sydkorea', 'DEN/MKD/CZE/IRL'],
            actualPicks: ['Mexiko', 'Sydafrika', 'Sydkorea', 'DEN/MKD/CZE/IRL'],
            matchedPositions: [1, 2, 3, 4],
            points: 4,
            reason: 'settled-group',
          },
          {
            group: 'Grupp B',
            predictedPicks: ['Kanada', 'Schweiz', 'Qatar', 'ITA/NIR/WAL/BIH'],
            actualPicks: ['Kanada', 'Qatar', 'Schweiz', 'ITA/NIR/WAL/BIH'],
            matchedPositions: [1, 4],
            points: 2,
            reason: 'settled-group',
          },
          {
            group: 'Grupp C',
            predictedPicks: ['Brasilien', 'Skottland', 'Marocko', 'Haiti'],
            actualPicks: ['Brasilien', 'Marocko', 'Haiti', 'Skottland'],
            matchedPositions: [],
            points: 0,
            reason: 'wrong-group-order',
          },
        ],
        knockoutBreakdown: [
          {
            round: 'Åttondelsfinal',
            predictedTeams: ['Mexiko', 'Kanada', 'Brasilien', 'Spanien'],
            actualTeams: ['Mexiko', 'Kanada', 'Brasilien', 'Spanien'],
            matchedTeams: ['Mexiko', 'Kanada', 'Brasilien', 'Spanien'],
            points: 4,
            pointsPerTeam: 1,
            reason: 'settled-round',
          },
          {
            round: 'Kvartsfinal',
            predictedTeams: ['Brasilien', 'Spanien', 'Frankrike'],
            actualTeams: ['Brasilien', 'Spanien', 'Frankrike', 'Argentina'],
            matchedTeams: ['Brasilien', 'Spanien', 'Frankrike'],
            points: 6,
            pointsPerTeam: 2,
            reason: 'settled-round',
          },
          {
            round: 'Semifinal',
            predictedTeams: ['Portugal', 'Tyskland', 'USA', 'Japan'],
            actualTeams: ['Brasilien', 'Spanien', 'Frankrike', 'Argentina'],
            matchedTeams: [],
            points: 0,
            pointsPerTeam: 2,
            reason: 'wrong-round-teams',
          },
        ],
        specialBreakdown: [
          {
            key: 'winner',
            label: 'Slutsegrare',
            predictedValue: 'Argentina',
            actualValue: 'Argentina',
            points: 4,
            maxPoints: 4,
            settled: true,
            reason: 'correct-special',
          },
          {
            key: 'topScorer',
            label: 'Skytteligavinnare',
            predictedValue: 'Sam Kerr',
            actualValue: 'Kylian Mbappé',
            points: 0,
            maxPoints: 4,
            settled: true,
            reason: 'wrong-special',
          },
        ],
        extraBreakdown: [
          {
            questionId: 101,
            questionText: 'Vilket lag gör flest mål i Grupp A?',
            selectedAnswer: 'Mexiko',
            correctAnswer: 'Mexiko',
            points: 2,
            settled: true,
            reason: 'correct-answer',
          },
          {
            questionId: 102,
            questionText: 'Hur många oavgjorda matcher blir det i åttondelsfinalerna?',
            selectedAnswer: '1',
            correctAnswer: '2',
            points: 0,
            settled: true,
            reason: 'wrong-answer',
          },
        ],
        updatedAt: null,
        rank: 2,
        positionLabel: '2',
      }
    : null

  const displayedScoreDetail = useMockScorePreview && mockScoreDetail ? mockScoreDetail : participantScoreDetail
  const showLoadingState = isParticipantScoreLoading && !(useMockScorePreview && mockScoreDetail)
  const effectivePhase =
    canUseLifecyclePreview && lifecyclePreviewMode !== 'auto'
      ? lifecyclePreviewMode
      : isGlobalLockActive
        ? 'C'
        : 'B'
  const showScorePanel = effectivePhase === 'C'

  const extraQuestionItems = publishedQuestions
    .map((question) => {
      const chosen = extraAnswers[String(question.id)]
      if (!chosen) {
        return null
      }
      return `${question.questionText}: ${chosen}`
    })
    .filter((item): item is string => item !== null)

  return (
    <div className="page-stack">
      <section className="panel panel-sticky-head">
        <div>
          <p className="eyebrow">Mina tips</p>
          <h1 className="section-title">Dina inskickade tips</h1>
        </div>
        <span className="save-pill">{lastSavedLabel}</span>
      </section>

      <p className="lead-text" style={{ padding: '0 4px' }}>Här ser du exakt vad du har skickat in. Tips med status Låst kan inte redigeras.</p>

      {canUseLifecyclePreview ? (
        <div className="inline-actions" style={{ padding: '0 4px' }}>
          <span className="save-pill">Lokal faspreview aktiv: {effectivePhase}</span>
          <span className="status-note">Källa: {lifecyclePreviewMode === 'auto' ? 'Auto (deadline)' : `Tvingad Fas ${lifecyclePreviewMode}`}</span>
        </div>
      ) : null}

      {showScorePanel ? (
        <ParticipantScorePanel
          eyebrow="Poäng"
          title="Din poängöversikt"
          participantScoreDetail={displayedScoreDetail}
          isLoading={showLoadingState}
          controls={
            canUseMockScorePreview ? (
              <div className="inline-actions">
                <button className="ghost-button" type="button" onClick={() => setUseMockScorePreview((current) => !current)}>
                  {useMockScorePreview ? 'Visa riktiga poäng' : 'Visa mockpoäng'}
                </button>
                <span className="status-note">Lokal preview för Jarmo. Ingen data sparas och backend påverkas inte.</span>
              </div>
            ) : undefined
          }
        />
      ) : (
        <section className="panel">
          <div className="section-heading compact">
            <p className="eyebrow">Poäng</p>
            <h2>Din poängöversikt</h2>
          </div>
          <p className="status-note">Poängvisning öppnas när turneringen är igång (Fas C).</p>
        </section>
      )}

      <section className="accordion-list">
        {myTipsSections.map((section) => (
          <details className="accordion-card" key={section.title} open={section.title === 'Gruppspel'}>
            <summary>
              <strong>{section.title}</strong>
              <span className="count-badge">{section.count}</span>
            </summary>
            {section.title === 'Gruppspel' ? (
              <div className="table-wrap accordion-table">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Match</th>
                      <th>Datum/tid</th>
                      <th>Resultat</th>
                      <th>1/X/2</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fixtureTips.map((row) => (
                      <tr key={row.match}>
                        <td data-label="Match">{row.match}</td>
                        <td data-label="Datum/tid">{row.date}</td>
                        <td data-label="Resultat">{row.homeScore === '' || row.awayScore === '' ? '—' : `${row.homeScore}-${row.awayScore}`}</td>
                        <td data-label="1/X/2">{row.sign || '—'}</td>
                        <td data-label="Status">
                          <span className={row.status === 'Låst' ? 'status-badge locked' : 'status-badge'}>
                            {row.status === 'Låst' ? 'Låst' : 'Ändringsbar'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : section.title === 'Gruppplaceringar' ? (
              <ul>
                {groupPlacements.map((group) => (
                  <li key={group.group}>{group.group}: {group.picks.join(', ')}</li>
                ))}
              </ul>
            ) : section.title === 'Slutspel' ? (
              <ul>
                {knockoutPredictions.map((round) => (
                  <li key={round.title}>{round.title}: {round.picks.join(', ')}</li>
                ))}
              </ul>
            ) : section.title === 'Special' ? (
              <ul>
                <li>Slutsegrare: {specialPredictions.winner}</li>
                <li>Skytteligavinnare: {specialPredictions.topScorer}</li>
              </ul>
            ) : section.title === 'Extrafrågor' ? (
              extraQuestionItems.length > 0 ? (
                <ul>
                  {extraQuestionItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p>Inga extrafrågor besvarade ännu.</p>
              )
            ) : section.items.length > 0 ? (
              <ul>
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </details>
        ))}
      </section>
    </div>
  )
}

function RulesPage({
  isGlobalLockActive,
  canUseLifecyclePreview,
  lifecyclePreviewMode,
}: {
  isGlobalLockActive: boolean
  canUseLifecyclePreview: boolean
  lifecyclePreviewMode: 'auto' | 'B' | 'C'
}) {
  const effectivePhase =
    canUseLifecyclePreview && lifecyclePreviewMode !== 'auto'
      ? lifecyclePreviewMode
      : isGlobalLockActive
        ? 'C'
        : 'B'

  const isTrackingPhase = effectivePhase === 'C'

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="section-heading">
          <p className="eyebrow">Regler och låsning</p>
          <h1>Regler och låsning</h1>
        </div>
        <p className="lead-text">
          Här hittar du all information om vad du kan tippa på och den gemensamma deadline som gäller för alla kategorier.
        </p>

        {canUseLifecyclePreview ? (
          <div className="inline-actions">
            <span className="save-pill">Lokal faspreview aktiv: {effectivePhase}</span>
            <span className="status-note">Källa: {lifecyclePreviewMode === 'auto' ? 'Auto (deadline)' : `Tvingad Fas ${lifecyclePreviewMode}`}</span>
          </div>
        ) : null}
      </section>

      <section className="panel">
        <div className="section-heading compact">
          <p className="eyebrow">Fasguide</p>
          <h2>{isTrackingPhase ? 'Fas C: Turneringen pågår' : 'Fas B: Tipsperioden är öppen'}</h2>
        </div>
        {isTrackingPhase ? (
          <div className="lock-warning">
            <ul>
              <li>Tips och extrafrågor är låsta efter deadline.</li>
              <li>Fokus ligger på resultat, poäng och topplista.</li>
              <li>Poängdetaljer visas i `Mina tips` och `Resultat & poäng`.</li>
            </ul>
          </div>
        ) : (
          <div className="lock-warning">
            <ul>
              <li>Du kan fortfarande redigera och spara dina tips.</li>
              <li>Kontrollera att alla kategorier är ifyllda före deadline.</li>
              <li>Poängvisning öppnas först i Fas C när turneringen är igång.</li>
            </ul>
          </div>
        )}
      </section>

      <section className="panel">
        <div className="section-heading compact">
          <p className="eyebrow">Låsregler</p>
          <h2>Låsregler</h2>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Kategori</th>
                <th>Vad du tippar</th>
                <th>När det låser</th>
              </tr>
            </thead>
            <tbody>
              {ruleRows.map((row) => (
                <tr key={row.category}>
                  <td data-label="Kategori">{row.category}</td>
                  <td data-label="Vad du tippar">{row.prediction}</td>
                  <td data-label="När det låser">{row.lockTime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="lock-warning">
          <ul>
            <li>När en kategori eller match är låst kan den <strong>INTE</strong> ändras.</li>
            <li>Gemensam deadline för allt är <strong>{GLOBAL_DEADLINE_LABEL}</strong>.</li>
            <li>Se till att skicka in dina tips i god tid före den tiden.</li>
            <li>Efter deadline är alla tips och extrafrågor låsta.</li>
          </ul>
        </div>
      </section>

      <section className="panel">
        <div className="section-heading compact">
          <p className="eyebrow">FAQ</p>
          <h2>Vanliga frågor</h2>
        </div>
        <div className="faq-grid">
          <article className="mini-card">
            <strong>Vad händer om ett lag ännu inte är fastställt?</strong>
            <p>Om ett lag visas som en placeholder (t.ex. DEN/MKD/CZE/IRL) gäller ditt tips på den platsen tills FIFA fastställer laget.</p>
          </article>
          <article className="mini-card">
            <strong>Kan jag ändra tips efter att jag skickat in?</strong>
            <p>Ja, du kan ändra dina tips fram till den gemensamma deadlinen. Efter deadline kan inga tips längre ändras.</p>
          </article>
          <article className="mini-card">
            <strong>Hur räknas poäng?</strong>
            <p>Poängsystemet definieras av admin och kan variera per kategori. Exakta resultat ger oftast högre poäng än rätt 1/X/2.</p>
          </article>
          <article className="mini-card">
            <strong>Vad händer om en match flyttas eller ställs in?</strong>
            <p>Vid schemaändringar justeras låsningstiden automatiskt. Vid inställda matcher återfås tipsen och ingen poäng räknas.</p>
          </article>
        </div>
      </section>

      <section className="panel">
        <div className="section-heading compact">
          <p className="eyebrow">Turneringen</p>
          <h2>Turneringsinformation</h2>
        </div>
        <div className="tournament-info-grid">
          <article className="info-card">
            <span className="mini-label">Turneringsstart</span>
            <strong>11 juni 2026, 18:00 CET</strong>
          </article>
          <article className="info-card">
            <span className="mini-label">Final</span>
            <strong>19 juli 2026</strong>
          </article>
          <article className="info-card">
            <span className="mini-label">Antal matcher</span>
            <strong>104 matcher totalt</strong>
          </article>
          <article className="info-card">
            <span className="mini-label">Värdländer</span>
            <strong>USA, Mexiko, Kanada</strong>
          </article>
        </div>
      </section>
    </div>
  )
}

function AdminPage({
  adminSession,
  onAdminSessionChange,
}: {
  adminSession: AdminSession | null
  onAdminSessionChange: (session: AdminSession | null) => void
}) {
  const [activeAdminTab, setActiveAdminTab] = useState<AdminWorkspaceTab>('questions')
  const [questions, setQuestions] = useState<AdminQuestion[]>([])
  const [results, setResults] = useState<MatchResult[]>([])
  const [specialResults, setSpecialResults] = useState<SpecialResultsState>({ winner: '', topScorer: '' })
  const [isLoading, setIsLoading] = useState(true)
  const [isResultsLoading, setIsResultsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isResultSaving, setIsResultSaving] = useState(false)
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [questionMessage, setQuestionMessage] = useState('')
  const [resultsMessage, setResultsMessage] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formState, setFormState] = useState<AdminQuestionDraft>(defaultAdminQuestionDraft)
  const [adminNameInput, setAdminNameInput] = useState(adminSession?.adminName ?? '')
  const [adminCodeInput, setAdminCodeInput] = useState('')
  const [selectedMatchId, setSelectedMatchId] = useState(adminFixtureTemplates[0]?.matchId ?? '')
  const [resultFilterStage, setResultFilterStage] = useState<'all' | MatchResultStage>('group')
  const [resultSearchQuery, setResultSearchQuery] = useState('')
  const [resultDraft, setResultDraft] = useState<AdminResultDraft>(defaultAdminResultDraft)

  const getAdminHeaders = () => {
    if (!adminSession?.adminCode) {
      return null
    }

    return {
      'Content-Type': 'application/json',
      'x-admin-code': adminSession.adminCode,
    }
  }

  const loadQuestions = async () => {
    if (!adminSession) {
      setQuestions([])
      setIsLoading(false)
      return
    }

    const headers = getAdminHeaders()
    if (!headers) {
      setQuestions([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/questions', {
        headers,
      })
      const payload = await response.json()
      if (!response.ok) {
        setQuestionMessage(payload.error ?? 'Kunde inte hämta adminfrågor.')
        return
      }

      const normalizedQuestions = Array.isArray(payload.questions)
        ? (payload.questions as AdminQuestion[])
        : []

      setQuestions(normalizedQuestions)
    } catch {
      setQuestionMessage('Kunde inte hämta adminfrågor.')
    } finally {
      setIsLoading(false)
    }
  }

  const loadResultsData = async () => {
    if (!adminSession) {
      setResults([])
      setSpecialResults({ winner: '', topScorer: '' })
      setIsResultsLoading(false)
      return
    }

    const headers = getAdminHeaders()
    if (!headers) {
      setResults([])
      setSpecialResults({ winner: '', topScorer: '' })
      setIsResultsLoading(false)
      return
    }

    setIsResultsLoading(true)
    try {
      const [resultsResponse, specialResponse] = await Promise.all([
        fetch('/api/admin/results', { headers }),
        fetch('/api/admin/special-results', { headers }),
      ])

      const resultsPayload = await resultsResponse.json()
      if (!resultsResponse.ok) {
        setResultsMessage(resultsPayload.error ?? 'Kunde inte hämta adminresultat.')
      } else {
        setResults(Array.isArray(resultsPayload.results) ? (resultsPayload.results as MatchResult[]) : [])
      }

      const specialPayload = await specialResponse.json()
      if (!specialResponse.ok) {
        setResultsMessage(specialPayload.error ?? 'Kunde inte hämta specialresultat.')
      } else {
        setSpecialResults({
          winner: typeof specialPayload.winner === 'string' ? specialPayload.winner : '',
          topScorer: typeof specialPayload.topScorer === 'string' ? specialPayload.topScorer : '',
          updatedAt: typeof specialPayload.updatedAt === 'string' ? specialPayload.updatedAt : null,
        })
      }
    } catch {
      setResultsMessage('Kunde inte hämta adminresultat.')
    } finally {
      setIsResultsLoading(false)
    }
  }

  useEffect(() => {
    loadQuestions()
    loadResultsData()
  }, [adminSession])

  const filteredFixtures = adminFixtureTemplates.filter((fixture) => {
    if (resultFilterStage !== 'all' && fixture.stage !== resultFilterStage) {
      return false
    }

    const query = resultSearchQuery.trim().toLowerCase()
    if (!query) {
      return true
    }

    return [
      fixture.matchId,
      fixture.homeTeam,
      fixture.awayTeam,
      fixture.groupCode ?? '',
      fixture.round ?? '',
    ].some((value) => value.toLowerCase().includes(query))
  })

  useEffect(() => {
    if (filteredFixtures.length === 0) {
      setSelectedMatchId('')
      return
    }

    if (!filteredFixtures.some((fixture) => fixture.matchId === selectedMatchId)) {
      setSelectedMatchId(filteredFixtures[0].matchId)
    }
  }, [resultFilterStage, resultSearchQuery])

  const selectedFixture = adminFixtureTemplates.find((fixture) => fixture.matchId === selectedMatchId) ?? null
  const selectedResult = results.find((entry) => entry.matchId === selectedMatchId)

  useEffect(() => {
    if (!selectedFixture) {
      setResultDraft(defaultAdminResultDraft)
      return
    }

    setResultDraft(buildAdminResultDraft(selectedFixture, selectedResult))
  }, [selectedMatchId, results])

  const filteredSavedResults = results.filter((entry) => {
    if (resultFilterStage !== 'all' && entry.stage !== resultFilterStage) {
      return false
    }

    const query = resultSearchQuery.trim().toLowerCase()
    if (!query) {
      return true
    }

    return [
      entry.matchId,
      entry.homeTeam,
      entry.awayTeam,
      entry.groupCode ?? '',
      entry.round ?? '',
    ].some((value) => value.toLowerCase().includes(query))
  })

  const signInAdmin = async (event: React.FormEvent) => {
    event.preventDefault()

    const normalizedName = adminNameInput.trim().replace(/\s+/g, ' ')
    const normalizedCode = adminCodeInput.trim()
    if (!normalizedName || !normalizedCode) {
      setQuestionMessage('Adminnamn och adminkod krävs.')
      return
    }

    setIsSigningIn(true)
    setQuestionMessage('Kontrollerar admininloggning...')

    try {
      const response = await fetch('/api/auth/admin-sign-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: normalizedName,
          code: normalizedCode,
        }),
      })

      const payload = await response.json()
      if (!response.ok) {
        setQuestionMessage(payload.error ?? 'Kunde inte logga in som admin.')
        return
      }

      onAdminSessionChange({
        adminName: payload.adminName,
        adminCode: normalizedCode,
      })
      setAdminCodeInput('')
      setQuestionMessage('Admin inloggad.')
      setResultsMessage('')
    } catch {
      setQuestionMessage('Kunde inte logga in som admin.')
    } finally {
      setIsSigningIn(false)
    }
  }

  const startEditing = (question: AdminQuestion) => {
    setEditingId(question.id)
    setFormState({
      questionText: question.questionText,
      category: question.category,
      optionsText: question.options.join('\n'),
      correctAnswer: question.correctAnswer ?? '',
      points: String(question.points),
      lockTime: question.lockTime.slice(0, 16),
      status: question.status,
    })
    setQuestionMessage('')
  }

  const resetForm = () => {
    setEditingId(null)
    setFormState(defaultAdminQuestionDraft)
  }

  const parseFormPayload = () => {
    const options = formState.optionsText
      .split('\n')
      .map((item) => item.trim())
      .filter((item) => item.length > 0)

    const points = Number(formState.points)
    if (!formState.questionText.trim() || options.length < 2 || Number.isNaN(points)) {
      return null
    }

    return {
      questionText: formState.questionText.trim(),
      category: formState.category,
      options,
      correctAnswer: formState.correctAnswer.trim(),
      points,
      lockTime: formState.lockTime,
      status: formState.status,
    }
  }

  const saveQuestion = async () => {
    const headers = getAdminHeaders()
    if (!headers) {
      setQuestionMessage('Admin-inloggning krävs.')
      return
    }

    const payload = parseFormPayload()
    if (!payload) {
      setQuestionMessage('Fyll i alla fält. Minst två svarsalternativ krävs.')
      return
    }

    setIsSaving(true)
    setQuestionMessage('Sparar...')

    try {
      const response = await fetch(editingId ? `/api/admin/questions/${editingId}` : '/api/admin/questions', {
        method: editingId ? 'PUT' : 'POST',
        headers,
        body: JSON.stringify(payload),
      })

      const responsePayload = await response.json()
      if (!response.ok) {
        setQuestionMessage(responsePayload.error ?? 'Kunde inte spara frågan.')
        return
      }

      setQuestionMessage(editingId ? 'Frågan uppdaterad.' : 'Frågan skapad.')
      resetForm()
      await loadQuestions()
    } catch {
      setQuestionMessage('Kunde inte spara frågan.')
    } finally {
      setIsSaving(false)
    }
  }

  const deleteQuestion = async (questionId: number) => {
    const headers = getAdminHeaders()
    if (!headers) {
      setQuestionMessage('Admin-inloggning krävs.')
      return
    }

    setIsSaving(true)
    setQuestionMessage('Tar bort fråga...')

    try {
      const response = await fetch(`/api/admin/questions/${questionId}`, {
        method: 'DELETE',
        headers,
      })

      if (!response.ok) {
        const payload = await response.json()
        setQuestionMessage(payload.error ?? 'Kunde inte ta bort frågan.')
        return
      }

      setQuestionMessage('Frågan borttagen.')
      if (editingId === questionId) {
        resetForm()
      }
      await loadQuestions()
    } catch {
      setQuestionMessage('Kunde inte ta bort frågan.')
    } finally {
      setIsSaving(false)
    }
  }

  const resetResultDraft = () => {
    if (!selectedFixture) {
      setResultDraft(defaultAdminResultDraft)
      return
    }

    setResultDraft(buildAdminResultDraft(selectedFixture, selectedResult))
  }

  const saveMatchResult = async () => {
    const headers = getAdminHeaders()
    if (!headers || !selectedFixture) {
      setResultsMessage('Admin-inloggning krävs.')
      return
    }

    const normalizedHomeScore = resultDraft.homeScore.trim()
    const normalizedAwayScore = resultDraft.awayScore.trim()
    const hasHomeScore = normalizedHomeScore !== ''
    const hasAwayScore = normalizedAwayScore !== ''

    if (hasHomeScore !== hasAwayScore) {
      setResultsMessage('Fyll i båda målen eller lämna båda tomma.')
      return
    }

    if (resultDraft.resultStatus === 'completed' && (!hasHomeScore || !hasAwayScore)) {
      setResultsMessage('Slutförda matcher kräver båda målresultaten.')
      return
    }

    if (resultDraft.resultStatus === 'planned' && (hasHomeScore || hasAwayScore)) {
      setResultsMessage('Planerade matcher får inte ha sparade mål.')
      return
    }

    setIsResultSaving(true)
    setResultsMessage('Sparar matchresultat...')

    try {
      const response = await fetch(`/api/admin/results/${selectedFixture.matchId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          stage: selectedFixture.stage,
          round: selectedFixture.round ?? '',
          groupCode: selectedFixture.groupCode ?? '',
          homeTeam: selectedFixture.homeTeam,
          awayTeam: selectedFixture.awayTeam,
          kickoffAt: toDateTimeLocalValue(selectedFixture.kickoffAt),
          homeScore: hasHomeScore ? Number(normalizedHomeScore) : '',
          awayScore: hasAwayScore ? Number(normalizedAwayScore) : '',
          resultStatus: resultDraft.resultStatus,
          settledAt: resultDraft.settledAt.trim(),
        }),
      })

      const payload = await response.json()
      if (!response.ok) {
        setResultsMessage(payload.error ?? 'Kunde inte spara matchresultat.')
        return
      }

      setResultsMessage('Matchresultat sparat.')
      await loadResultsData()
    } catch {
      setResultsMessage('Kunde inte spara matchresultat.')
    } finally {
      setIsResultSaving(false)
    }
  }

  const saveSpecialResults = async () => {
    const headers = getAdminHeaders()
    if (!headers) {
      setResultsMessage('Admin-inloggning krävs.')
      return
    }

    setIsResultSaving(true)
    setResultsMessage('Sparar specialresultat...')

    try {
      const response = await fetch('/api/admin/special-results', {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          winner: specialResults.winner,
          topScorer: specialResults.topScorer,
        }),
      })

      const payload = await response.json()
      if (!response.ok) {
        setResultsMessage(payload.error ?? 'Kunde inte spara specialresultat.')
        return
      }

      setSpecialResults({
        winner: typeof payload.winner === 'string' ? payload.winner : '',
        topScorer: typeof payload.topScorer === 'string' ? payload.topScorer : '',
        updatedAt: typeof payload.updatedAt === 'string' ? payload.updatedAt : null,
      })
      setResultsMessage('Specialresultat sparade.')
    } catch {
      setResultsMessage('Kunde inte spara specialresultat.')
    } finally {
      setIsResultSaving(false)
    }
  }

  const publishedCount = questions.filter((question) => question.status === 'published').length
  const savedResultsCount = results.filter((entry) => entry.resultStatus === 'completed').length

  if (!adminSession) {
    return (
      <div className="page-stack">
        <section className="panel">
          <div className="section-heading">
            <p className="eyebrow">Admin</p>
            <h1>Admin-inloggning</h1>
          </div>
          <p className="lead-text">Logga in med adminnamn och adminkod för att hantera frågor.</p>

          <form className="stacked-actions" onSubmit={signInAdmin}>
            <label>
              Adminnamn
              <input
                className="special-input"
                type="text"
                value={adminNameInput}
                onChange={(e) => setAdminNameInput(e.target.value)}
                placeholder="Admin"
                autoComplete="username"
                required
              />
            </label>
            <label>
              Adminkod
              <input
                className="special-input"
                type="password"
                value={adminCodeInput}
                onChange={(e) => setAdminCodeInput(e.target.value)}
                placeholder="Adminkod"
                autoComplete="current-password"
                required
              />
            </label>
            <button className="primary-button" type="submit" disabled={isSigningIn}>
              {isSigningIn ? 'Kontrollerar...' : 'Logga in som admin'}
            </button>
          </form>

          {questionMessage ? <p className="save-pill">{questionMessage}</p> : null}
        </section>
      </div>
    )
  }

  return (
    <div className="page-stack">
      <section className="panel panel-split">
        <div>
          <div className="section-heading">
            <p className="eyebrow">Admin</p>
            <h1>Adminpanel</h1>
          </div>
          <p className="lead-text">
            Admin kan hantera både extrafrågor och de officiella resultat som driver poängräkningen.
          </p>
          <p className="status-note">Inloggad som admin: {adminSession.adminName}</p>
          <div className="tab-row">
            <button
              className={`tab-button ${activeAdminTab === 'questions' ? 'active' : ''}`}
              type="button"
              onClick={() => setActiveAdminTab('questions')}
            >
              Frågor
            </button>
            <button
              className={`tab-button ${activeAdminTab === 'results' ? 'active' : ''}`}
              type="button"
              onClick={() => setActiveAdminTab('results')}
            >
              Resultat och special
            </button>
          </div>
          <button
            className="ghost-button"
            type="button"
            disabled={isSaving || isResultSaving}
            onClick={() => {
              onAdminSessionChange(null)
              setQuestions([])
              setResults([])
              setSpecialResults({ winner: '', topScorer: '' })
              setEditingId(null)
              setQuestionMessage('Admin utloggad.')
              setResultsMessage('')
            }}
          >
            Logga ut admin
          </button>
        </div>
        <article className="mini-card emphasis">
          <span className="mini-label">Status</span>
          <strong>{publishedCount} publicerade frågor, {savedResultsCount} slutresultat</strong>
          <p>Frågor, matchresultat och specialutfall hanteras från samma adminsession.</p>
        </article>
      </section>

      {activeAdminTab === 'questions' ? (
        <>
          <section className="panel">
            {questionMessage ? <p className="save-pill">{questionMessage}</p> : null}
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Fråga</th>
                    <th>Kategori</th>
                    <th>Poäng</th>
                    <th>Låstid</th>
                    <th>Status</th>
                    <th>Åtgärder</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={6}>Laddar frågor...</td>
                    </tr>
                  ) : questions.length === 0 ? (
                    <tr>
                      <td colSpan={6}>Inga frågor skapade ännu.</td>
                    </tr>
                  ) : (
                    questions.map((question) => (
                      <tr key={question.id}>
                        <td data-label="Fråga">{question.questionText}</td>
                        <td data-label="Kategori">{question.category}</td>
                        <td data-label="Poäng">{question.points} p</td>
                        <td data-label="Låstid">{new Date(question.lockTime).toLocaleString('sv-SE')}</td>
                        <td data-label="Status">
                          <span className={question.status === 'published' ? 'status-badge' : 'status-badge locked'}>
                            {question.status === 'published' ? 'Publicerad' : 'Utkast'}
                          </span>
                        </td>
                        <td data-label="Åtgärder">
                          <div className="stacked-actions">
                            <button className="ghost-button" type="button" disabled={isSaving} onClick={() => startEditing(question)}>
                              Redigera
                            </button>
                            <button className="ghost-button danger" type="button" disabled={isSaving} onClick={() => deleteQuestion(question.id)}>
                              Ta bort
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="form-grid">
            <article className="mini-card">
              <span className="mini-label">{editingId ? 'Redigera fråga' : 'Skapa fråga'}</span>
              <h2>Frågeformulär</h2>
              <div className="stacked-actions">
                <label>
                  Frågetext
                  <input
                    className="special-input"
                    type="text"
                    value={formState.questionText}
                    onChange={(e) => setFormState((current) => ({ ...current, questionText: e.target.value }))}
                  />
                </label>
                <label>
                  Kategori
                  <select
                    className="special-input"
                    value={formState.category}
                    onChange={(e) => setFormState((current) => ({ ...current, category: e.target.value as AdminQuestionCategory }))}
                  >
                    {adminQuestionCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Svarsalternativ (ett per rad)
                  <textarea
                    className="special-input"
                    rows={5}
                    value={formState.optionsText}
                    onChange={(e) => setFormState((current) => ({ ...current, optionsText: e.target.value }))}
                  />
                </label>
                <label>
                  Rätt svar
                  <input
                    className="special-input"
                    type="text"
                    value={formState.correctAnswer}
                    onChange={(e) => setFormState((current) => ({ ...current, correctAnswer: e.target.value }))}
                    placeholder="Valfritt tills svaret är känt"
                  />
                </label>
                <label>
                  Poäng
                  <input
                    className="special-input"
                    type="number"
                    min={0}
                    max={100}
                    value={formState.points}
                    onChange={(e) => setFormState((current) => ({ ...current, points: e.target.value }))}
                  />
                </label>
                <label>
                  Låstid
                  <input
                    className="special-input"
                    type="datetime-local"
                    value={formState.lockTime}
                    onChange={(e) => setFormState((current) => ({ ...current, lockTime: e.target.value }))}
                  />
                </label>
                <label>
                  Status
                  <select
                    className="special-input"
                    value={formState.status}
                    onChange={(e) => setFormState((current) => ({ ...current, status: e.target.value as AdminQuestionStatus }))}
                  >
                    <option value="draft">Utkast</option>
                    <option value="published">Publicerad</option>
                  </select>
                </label>
              </div>
            </article>
            <article className="mini-card">
              <span className="mini-label">Adminåtgärder</span>
              <div className="stacked-actions">
                <button className="primary-button" type="button" disabled={isSaving} onClick={saveQuestion}>
                  {isSaving ? 'Sparar...' : editingId ? 'Uppdatera fråga' : 'Skapa fråga'}
                </button>
                <button className="ghost-button" type="button" disabled={isSaving} onClick={resetForm}>
                  Återställ formulär
                </button>
              </div>
            </article>
          </section>
        </>
      ) : (
        <>
          <section className="panel">
            <div className="section-heading compact">
              <p className="eyebrow">Rollfördelning</p>
              <h2>Admin redigerar, deltagare läser</h2>
            </div>
            <div className="lock-warning">
              <ul>
                <li>Här i Admin uppdaterar du officiella matchresultat och specialutfall.</li>
                <li>Deltagare ser dessa utfall i <strong>Resultat & poäng</strong> som read-only.</li>
                <li>Samma utfallsdata används i båda vyerna, men endast Admin kan göra ändringar.</li>
              </ul>
            </div>

            {resultsMessage ? <p className="save-pill">{resultsMessage}</p> : null}
            <div className="admin-results-grid">
              <article className="mini-card">
                <span className="mini-label">Matchresultat</span>
                <h2>Redigera match</h2>
                <div className="admin-filter-grid">
                  <label>
                    Visa
                    <select
                      className="special-input"
                      value={resultFilterStage}
                      onChange={(e) => setResultFilterStage(e.target.value as 'all' | MatchResultStage)}
                    >
                      <option value="group">Gruppspel</option>
                      <option value="knockout">Slutspel</option>
                      <option value="all">Alla matcher</option>
                    </select>
                  </label>
                  <label>
                    Sök match
                    <input
                      className="special-input"
                      type="text"
                      value={resultSearchQuery}
                      onChange={(e) => setResultSearchQuery(e.target.value)}
                      placeholder="Lag, grupp eller match-id"
                    />
                  </label>
                </div>

                <label>
                  Match
                  <select
                    className="special-input"
                    value={selectedMatchId}
                    onChange={(e) => setSelectedMatchId(e.target.value)}
                    disabled={filteredFixtures.length === 0}
                  >
                    {filteredFixtures.map((fixture) => (
                      <option key={fixture.matchId} value={fixture.matchId}>
                        {fixture.matchId} · {fixture.homeTeam} - {fixture.awayTeam}
                      </option>
                    ))}
                  </select>
                </label>

                {selectedFixture ? (
                  <>
                    <div className="result-fixture-summary">
                      <strong>{selectedFixture.homeTeam} - {selectedFixture.awayTeam}</strong>
                      <span>{selectedFixture.kickoffAt}</span>
                    </div>

                    <div className="inline-stats">
                      <span className="status-note">{selectedFixture.matchId}</span>
                      {selectedFixture.groupCode ? <span className="status-note">Grupp {selectedFixture.groupCode}</span> : null}
                      {selectedFixture.round ? <span className="status-note">{selectedFixture.round}</span> : null}
                    </div>

                    <div className="admin-filter-grid compact">
                      <label>
                        Status
                        <select
                          className="special-input"
                          value={resultDraft.resultStatus}
                          onChange={(e) => setResultDraft((current) => ({ ...current, resultStatus: e.target.value as MatchResultStatus }))}
                        >
                          <option value="planned">Planerad</option>
                          <option value="live">Live</option>
                          <option value="completed">Slut</option>
                        </select>
                      </label>
                      <label>
                        Avgjord tid
                        <input
                          className="special-input"
                          type="datetime-local"
                          value={resultDraft.settledAt}
                          onChange={(e) => setResultDraft((current) => ({ ...current, settledAt: e.target.value }))}
                        />
                      </label>
                    </div>

                    <div className="admin-score-grid">
                      <label>
                        {selectedFixture.homeTeam}
                        <input
                          className="special-input"
                          type="number"
                          min={0}
                          max={99}
                          value={resultDraft.homeScore}
                          onChange={(e) => setResultDraft((current) => ({ ...current, homeScore: e.target.value }))}
                          placeholder=""
                        />
                      </label>
                      <label>
                        {selectedFixture.awayTeam}
                        <input
                          className="special-input"
                          type="number"
                          min={0}
                          max={99}
                          value={resultDraft.awayScore}
                          onChange={(e) => setResultDraft((current) => ({ ...current, awayScore: e.target.value }))}
                          placeholder=""
                        />
                      </label>
                    </div>

                    <div className="stacked-actions">
                      <button className="primary-button" type="button" disabled={isResultSaving} onClick={saveMatchResult}>
                        {isResultSaving ? 'Sparar...' : 'Spara matchresultat'}
                      </button>
                      <button className="ghost-button" type="button" disabled={isResultSaving} onClick={resetResultDraft}>
                        Återställ match
                      </button>
                    </div>
                  </>
                ) : (
                  <p>Ingen match matchar ditt filter ännu.</p>
                )}
              </article>

              <article className="mini-card emphasis">
                <span className="mini-label">Special</span>
                <h2>Slututfall</h2>
                <div className="stacked-actions">
                  <label>
                    Slutsegrare
                    <input
                      className="special-input"
                      type="text"
                      value={specialResults.winner}
                      onChange={(e) => setSpecialResults((current) => ({ ...current, winner: e.target.value }))}
                    />
                  </label>
                  <label>
                    Skytteligavinnare
                    <input
                      className="special-input"
                      type="text"
                      value={specialResults.topScorer}
                      onChange={(e) => setSpecialResults((current) => ({ ...current, topScorer: e.target.value }))}
                    />
                  </label>
                </div>
                {specialResults.updatedAt ? (
                  <p className="status-note">Senast uppdaterad: {new Date(specialResults.updatedAt).toLocaleString('sv-SE')}</p>
                ) : null}
                <div className="stacked-actions">
                  <button className="primary-button" type="button" disabled={isResultSaving} onClick={saveSpecialResults}>
                    {isResultSaving ? 'Sparar...' : 'Spara specialresultat'}
                  </button>
                </div>
              </article>
            </div>
          </section>

          <section className="panel">
            <div className="section-heading compact">
              <p className="eyebrow">Sparade resultat</p>
              <h2>Översikt</h2>
            </div>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Match</th>
                    <th>Status</th>
                    <th>Resultat</th>
                    <th>Avgjord</th>
                    <th>Åtgärd</th>
                  </tr>
                </thead>
                <tbody>
                  {isResultsLoading ? (
                    <tr>
                      <td colSpan={5}>Laddar adminresultat...</td>
                    </tr>
                  ) : filteredSavedResults.length === 0 ? (
                    <tr>
                      <td colSpan={5}>Inga sparade resultat för aktuellt filter.</td>
                    </tr>
                  ) : (
                    filteredSavedResults.map((entry) => (
                      <tr key={entry.matchId}>
                        <td data-label="Match">
                          <strong>{entry.homeTeam} - {entry.awayTeam}</strong>
                          <div className="score-breakdown-meta">
                            {entry.matchId}
                            {entry.groupCode ? ` · Grupp ${entry.groupCode}` : ''}
                            {entry.round ? ` · ${entry.round}` : ''}
                          </div>
                        </td>
                        <td data-label="Status">
                          <span className={`status-badge admin-result-badge ${entry.resultStatus}`}>
                            {formatMatchResultStatusLabel(entry.resultStatus)}
                          </span>
                        </td>
                        <td data-label="Resultat">
                          <span className="admin-scoreline">
                            {entry.homeScore === null || entry.awayScore === null ? 'Ej satt' : `${entry.homeScore}-${entry.awayScore}`}
                          </span>
                        </td>
                        <td data-label="Avgjord">{entry.settledAt ? new Date(entry.settledAt).toLocaleString('sv-SE') : '-'}</td>
                        <td data-label="Åtgärd">
                          <button
                            className="ghost-button"
                            type="button"
                            onClick={() => {
                              setSelectedMatchId(entry.matchId)
                              setActiveAdminTab('results')
                            }}
                          >
                            Redigera
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  )
}

export function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [participant, setParticipant] = useState<ParticipantSession | null>(null)
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [participantScoreDetail, setParticipantScoreDetail] = useState<ParticipantScoreDetail | null>(null)
  const [isParticipantScoreLoading, setIsParticipantScoreLoading] = useState(false)
  const [results, setResults] = useState<MatchResult[]>([])
  const [specialResults, setSpecialResults] = useState<SpecialResultsState>({ winner: '', topScorer: '' })
  const [isResultsLoading, setIsResultsLoading] = useState(false)
  const [activePage, setActivePage] = useState<PageId>('start')
  const [fixtureTips, setFixtureTips] = useState<FixtureTip[]>(createDefaultFixtureTips())
  const [groupPlacements, setGroupPlacements] = useState<GroupPlacement[]>(groupPlacementTemplates)
  const [knockoutPredictions, setKnockoutPredictions] = useState<KnockoutPredictionRound[]>(knockoutPredictionTemplates)
  const [specialPredictions, setSpecialPredictions] = useState<SpecialPredictions>(defaultSpecialPredictions)
  const [extraAnswers, setExtraAnswers] = useState<ExtraAnswers>({})
  const [publishedQuestions, setPublishedQuestions] = useState<AdminQuestion[]>([])
  const [isTipsSaving, setIsTipsSaving] = useState(false)
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  const [tipsSaveMessage, setTipsSaveMessage] = useState('Inte sparad ännu')
  const [myTipsSavedLabel, setMyTipsSavedLabel] = useState('Senast uppdaterad: inte sparad')
  const [lifecyclePreviewMode, setLifecyclePreviewMode] = useState<'auto' | 'B' | 'C'>('auto')
  const isGlobalLockActive = Date.now() >= GLOBAL_DEADLINE.getTime()
  const globalDeadlineLabel = GLOBAL_DEADLINE.toLocaleString('sv-SE')
  const canUseLifecyclePreview = Boolean(participant?.name && /jarmo/i.test(participant.name))
  const effectiveLifecyclePhase = canUseLifecyclePreview && lifecyclePreviewMode !== 'auto'
    ? lifecyclePreviewMode
    : isGlobalLockActive
      ? 'C'
      : 'B'
  const isTrackingPhaseActive = effectiveLifecyclePhase === 'C'
  const normalizePageForPhase = (page: PageId): PageId => {
    if (isTrackingPhaseActive && page === 'mine') {
      return 'results'
    }

    if (!isTrackingPhaseActive && page === 'results') {
      return 'tips'
    }

    return page
  }

  useEffect(() => {
    setLifecyclePreviewMode('auto')
  }, [participant?.participantId])

  const loadLeaderboard = async () => {
    try {
      const response = await fetch('/api/scores')
      if (!response.ok) {
        setLeaderboard([])
        return
      }

      const payload = await response.json()
      const nextLeaderboard = Array.isArray(payload.scores) ? (payload.scores as LeaderboardEntry[]) : []
      setLeaderboard(nextLeaderboard)
    } catch {
      setLeaderboard([])
    }
  }

  const loadParticipantScore = async (participantId: number) => {
    setIsParticipantScoreLoading(true)
    try {
      const response = await fetch(`/api/scores/${participantId}`)
      if (!response.ok) {
        setParticipantScoreDetail(null)
        return
      }

      const payload = await response.json()
      setParticipantScoreDetail(payload as ParticipantScoreDetail)
    } catch {
      setParticipantScoreDetail(null)
    } finally {
      setIsParticipantScoreLoading(false)
    }
  }

  const loadPublicResults = async () => {
    setIsResultsLoading(true)

    try {
      const [resultsResponse, specialResultsResponse] = await Promise.all([
        fetch('/api/results'),
        fetch('/api/special-results'),
      ])

      if (resultsResponse.ok) {
        const payload = await resultsResponse.json()
        setResults(Array.isArray(payload.results) ? (payload.results as MatchResult[]) : [])
      } else {
        setResults([])
      }

      if (specialResultsResponse.ok) {
        const payload = await specialResultsResponse.json()
        setSpecialResults({
          winner: typeof payload.winner === 'string' ? payload.winner : '',
          topScorer: typeof payload.topScorer === 'string' ? payload.topScorer : '',
          updatedAt: typeof payload.updatedAt === 'string' ? payload.updatedAt : null,
        })
      } else {
        setSpecialResults({ winner: '', topScorer: '' })
      }
    } catch {
      setResults([])
      setSpecialResults({ winner: '', topScorer: '' })
    } finally {
      setIsResultsLoading(false)
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return
    }

    const media = window.matchMedia('(hover: none) and (pointer: coarse)')
    const updateTouchMode = () => setIsTouchDevice(media.matches)

    updateTouchMode()
    media.addEventListener('change', updateTouchMode)
    return () => media.removeEventListener('change', updateTouchMode)
  }, [])

  useEffect(() => {
    try {
      const rawParticipant = localStorage.getItem(PARTICIPANT_STORAGE_KEY)
      if (!rawParticipant) {
        return
      }

      const parsed = JSON.parse(rawParticipant) as ParticipantSession

      if (parsed?.participantId && parsed?.name) {
        setParticipant(parsed)
        setIsLoggedIn(true)
      }
    } catch {
      localStorage.removeItem(PARTICIPANT_STORAGE_KEY)
    }
  }, [])

  useEffect(() => {
    try {
      const rawAdminSession = localStorage.getItem(ADMIN_SESSION_STORAGE_KEY)
      if (!rawAdminSession) {
        return
      }

      const parsed = JSON.parse(rawAdminSession) as AdminSession
      if (parsed?.adminName && parsed?.adminCode) {
        setAdminSession(parsed)
      }
    } catch {
      localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY)
    }
  }, [])

  useEffect(() => {
    if (!participant) {
      localStorage.removeItem(PARTICIPANT_STORAGE_KEY)
      return
    }

    localStorage.setItem(PARTICIPANT_STORAGE_KEY, JSON.stringify(participant))
  }, [participant])

  useEffect(() => {
    if (!adminSession) {
      localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY)
      return
    }

    localStorage.setItem(ADMIN_SESSION_STORAGE_KEY, JSON.stringify(adminSession))
  }, [adminSession])

  useEffect(() => {
    if (!participant) {
      setFixtureTips(createDefaultFixtureTips())
      setGroupPlacements(groupPlacementTemplates)
      setKnockoutPredictions(knockoutPredictionTemplates)
      setSpecialPredictions(defaultSpecialPredictions)
      setExtraAnswers({})
      setTipsSaveMessage('Inte sparad ännu')
      setMyTipsSavedLabel('Senast uppdaterad: inte sparad')
      setParticipantScoreDetail(null)
      return
    }

    const loadTips = async () => {
      try {
        const response = await fetch(`/api/tips/${participant.participantId}`)
        if (!response.ok) {
          setTipsSaveMessage('Kunde inte hämta sparade tips')
          return
        }

        const payload = await response.json()
        const normalizedState = normalizePersistedTipsState(payload.tips)
        setFixtureTips(normalizedState.fixtureTips)
        setGroupPlacements(normalizedState.groupPlacements)
        setKnockoutPredictions(normalizedState.knockoutPredictions)
        setSpecialPredictions(normalizedState.specialPredictions)
        setExtraAnswers(normalizedState.extraAnswers)

        if (payload.updatedAt) {
          const formatted = new Date(payload.updatedAt).toLocaleString('sv-SE')
          setTipsSaveMessage(`Sparad: ${formatted}`)
          setMyTipsSavedLabel(`Senast uppdaterad: ${formatted}`)
        } else {
          setTipsSaveMessage('Inte sparad ännu')
          setMyTipsSavedLabel('Senast uppdaterad: inte sparad')
        }
      } catch {
        setTipsSaveMessage('Kunde inte hämta sparade tips')
      }
    }

    loadTips()
  }, [participant])

  useEffect(() => {
    if (!participant) {
      setParticipantScoreDetail(null)
      return
    }

    if (activePage !== 'mine' && activePage !== 'results') {
      return
    }

    loadParticipantScore(participant.participantId)
  }, [participant, activePage])

  useEffect(() => {
    if (activePage !== 'results') {
      return
    }

    loadPublicResults()
  }, [activePage])

  useEffect(() => {
    const loadPublishedQuestions = async () => {
      try {
        const response = await fetch('/api/questions/published')
        if (!response.ok) {
          return
        }

        const payload = await response.json()
        const normalizedQuestions = Array.isArray(payload.questions)
          ? (payload.questions as AdminQuestion[])
          : []
        setPublishedQuestions(normalizedQuestions)
      } catch {
        setPublishedQuestions([])
      }
    }

    loadPublishedQuestions()
  }, [activePage])

  useEffect(() => {
    loadLeaderboard()
  }, [participant])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isAdminShortcutKey = event.code === 'KeyA' || event.key.toLowerCase() === 'a'
      if (event.altKey && event.shiftKey && isAdminShortcutKey) {
        setActivePage('admin')
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const onChangeGroupPlacement = (group: string, index: number, value: string) => {
    if (isGlobalLockActive) {
      return
    }

    setGroupPlacements((current) =>
      current.map((item) => {
        if (item.group !== group) {
          return item
        }

        const nextPicks = [...item.picks]
        const previousValue = nextPicks[index]

        if (!value) {
          nextPicks[index] = ''

          return {
            ...item,
            picks: nextPicks,
          }
        }

        const existingIndex = nextPicks.findIndex((pick, pickIndex) => pickIndex !== index && pick === value)

        if (existingIndex >= 0) {
          nextPicks[existingIndex] = previousValue
        }

        nextPicks[index] = value

        return {
          ...item,
          picks: nextPicks,
        }
      }),
    )
  }

  const onChangeSpecialPrediction = (key: keyof SpecialPredictions, value: string) => {
    if (isGlobalLockActive) {
      return
    }

    setSpecialPredictions((current) => ({
      ...current,
      [key]: value,
    }))
  }

  const onChangeKnockoutPrediction = (roundTitle: string, index: number, value: string) => {
    if (isGlobalLockActive) {
      return
    }

    setKnockoutPredictions((current) =>
      current.map((round) => {
        if (round.title !== roundTitle) {
          return round
        }

        return {
          ...round,
          picks: round.picks.map((pick, pickIndex) => (pickIndex === index ? value : pick)),
        }
      }),
    )
  }

  const onChangeExtraAnswer = (questionId: number, answer: string) => {
    if (isGlobalLockActive) {
      return
    }

    setExtraAnswers((current) => {
      const next = { ...current }
      if (!answer) {
        delete next[String(questionId)]
        return next
      }

      next[String(questionId)] = answer
      return next
    })
  }

  const onChangeTip = (
    match: string,
    key: 'homeScore' | 'awayScore' | 'sign',
    value: number | '' | '1' | 'X' | '2',
    source: 'quick-score' | 'quick-sign' | 'fallback-score' | 'wheel-score' = 'quick-score',
  ) => {
    if (isGlobalLockActive) {
      return
    }

    setFixtureTips((current) =>
      current.map((tip) => {
        if (tip.match !== match || tip.status === 'Låst') {
          return tip
        }

        if (key === 'homeScore' || key === 'awayScore') {
          const scoreValue = typeof value === 'number' || value === '' ? value : tip[key]

          const nextTip: FixtureTip = {
            ...tip,
            [key]: scoreValue,
          }

          if (source === 'wheel-score') {
            if (key === 'homeScore' && nextTip.awayScore === '') {
              nextTip.awayScore = 0
            }

            if (key === 'awayScore' && nextTip.homeScore === '') {
              nextTip.homeScore = 0
            }
          }

          return {
            ...nextTip,
            sign: deriveSignFromScore(nextTip.homeScore, nextTip.awayScore),
          }
        }

        const signValue: FixtureTip['sign'] = value === '1' || value === 'X' || value === '2' ? value : ''

        return {
          ...tip,
          sign: signValue,
        }
      }),
    )
  }

  const onSetScorePreset = (match: string, home: number, away: number, _source: 'quick-score' | 'fallback-score' = 'quick-score') => {
    if (isGlobalLockActive) {
      return
    }

    setFixtureTips((current) =>
      current.map((tip) => {
        if (tip.match !== match || tip.status === 'Låst') {
          return tip
        }

        return {
          ...tip,
          homeScore: home,
          awayScore: away,
          sign: deriveSignFromScore(home, away),
        }
      }),
    )
  }

  const onSaveTips = async () => {
    if (!participant) {
      return
    }

    if (isGlobalLockActive) {
      setTipsSaveMessage(`Tips är låsta sedan ${globalDeadlineLabel}`)
      return
    }

    setIsTipsSaving(true)
    setTipsSaveMessage('Sparar...')

    try {
      const response = await fetch(`/api/tips/${participant.participantId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tips: {
            fixtureTips,
            groupPlacements,
            knockoutPredictions,
            specialPredictions,
            extraAnswers,
          },
        }),
      })

      const payload = await response.json()
      if (!response.ok) {
        setTipsSaveMessage(payload.error ?? 'Kunde inte spara tips')
        return
      }

      const normalizedState = normalizePersistedTipsState(payload.tips)
      setFixtureTips(normalizedState.fixtureTips)
      setGroupPlacements(normalizedState.groupPlacements)
      setKnockoutPredictions(normalizedState.knockoutPredictions)
      setSpecialPredictions(normalizedState.specialPredictions)
      setExtraAnswers(normalizedState.extraAnswers)
      const formatted = payload.updatedAt ? new Date(payload.updatedAt).toLocaleString('sv-SE') : new Date().toLocaleString('sv-SE')
      setTipsSaveMessage(`Sparad: ${formatted}`)
      setMyTipsSavedLabel(`Senast uppdaterad: ${formatted}`)
      await loadLeaderboard()
      await loadParticipantScore(participant.participantId)
    } catch {
      setTipsSaveMessage('Kunde inte spara tips')
    } finally {
      setIsTipsSaving(false)
    }
  }

  const onClearTips = async () => {
    if (!participant) {
      return
    }

    if (isGlobalLockActive) {
      setTipsSaveMessage(`Tips är låsta sedan ${globalDeadlineLabel}`)
      return
    }

    setIsTipsSaving(true)

    try {
      const response = await fetch(`/api/tips/${participant.participantId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        setTipsSaveMessage('Kunde inte rensa tips')
        return
      }

      setFixtureTips(createDefaultFixtureTips())
      setGroupPlacements(groupPlacementTemplates)
      setKnockoutPredictions(knockoutPredictionTemplates)
      setSpecialPredictions(defaultSpecialPredictions)
      setExtraAnswers({})
      setTipsSaveMessage('Sparade tips rensade')
      setMyTipsSavedLabel('Senast uppdaterad: inte sparad')
      await loadLeaderboard()
      await loadParticipantScore(participant.participantId)
    } catch {
      setTipsSaveMessage('Kunde inte rensa tips')
    } finally {
      setIsTipsSaving(false)
    }
  }

  const onParticipantLogout = () => {
    setParticipant(null)
    setAdminSession(null)
    setIsLoggedIn(false)
    setActivePage('start')
    setTipsSaveMessage('Inte sparad ännu')
    setMyTipsSavedLabel('Senast uppdaterad: inte sparad')
    setQuestionMessage('')
    setResultsMessage('')
  }

  // Keep active page aligned with current lifecycle phase visibility rules.
  useEffect(() => {
    const normalizedPage = normalizePageForPhase(activePage)
    if (normalizedPage !== activePage) {
      setActivePage(normalizedPage)
    }
  }, [isTrackingPhaseActive, activePage])

  if (!isLoggedIn) {
    return (
      <div className="app-shell">
        <LoginPage
          onSuccess={(nextParticipant) => {
            setParticipant(nextParticipant)
            setIsLoggedIn(true)
            setActivePage('start')
          }}
        />
      </div>
    )
  }

  // Phase visibility rules are always applied; admin session only controls admin-tab visibility.
  const visibleNavItems = navItems.filter((item) => {
    if (item.id === 'admin') {
      return Boolean(adminSession)
    }

    if (isTrackingPhaseActive && item.id === 'mine') {
      return false
    }

    if (!isTrackingPhaseActive && item.id === 'results') {
      return false
    }

    return true
  })

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-block">
          <p className="brand-kicker">VM2026</p>
          <span className="brand-title">Tipset</span>
        </div>

        <nav className="nav-tabs" aria-label="Huvudnavigation">
          {visibleNavItems.map((item) => (
            <button
              className={item.id === activePage ? 'nav-button active' : 'nav-button'}
              key={item.id}
              type="button"
              onClick={() => setActivePage(normalizePageForPhase(item.id))}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="utility-panel">
          <div className="utility-item">
            <span className="utility-label">Inloggad som</span>
            <strong>{participant?.name ?? 'Deltagare'}</strong>
          </div>
          <div className="utility-item">
            <span className="utility-label">Nedräkning</span>
            <strong>79 dagar kvar</strong>
          </div>
          <div className="utility-item">
            <span className="utility-label">Senast sparad</span>
            <strong>{tipsSaveMessage.replace('Sparad: ', '')}</strong>
          </div>
          <div className="utility-item">
            <span className="utility-label">Session</span>
            <button className="ghost-button utility-logout-button" type="button" onClick={onParticipantLogout}>
              Logga ut
            </button>
          </div>
        </div>
      </header>

      <main className="content-shell">
        {renderPage(activePage, {
          fixtureTips,
          groupPlacements,
          knockoutPredictions,
          specialPredictions,
          extraAnswers,
          publishedQuestions,
          participant,
          leaderboard,
          participantScoreDetail,
          isParticipantScoreLoading,
          results,
          specialResults,
          isResultsLoading,
          canUseLifecyclePreview,
          lifecyclePreviewMode,
          onLifecyclePreviewModeChange: setLifecyclePreviewMode,
          adminSession,
          onChangeTip,
          onSetScorePreset,
          onChangeGroupPlacement,
          onChangeKnockoutPrediction,
          onChangeSpecialPrediction,
          onChangeExtraAnswer,
          onAdminSessionChange: setAdminSession,
          onSaveTips,
          onClearTips,
          isSavingTips: isTipsSaving,
          tipsSaveMessage,
          myTipsSavedLabel,
          isTouchDevice,
          isGlobalLockActive,
          globalDeadlineLabel,
        })}
      </main>
    </div>
  )
}