import type {
  FixtureTip,
  GroupPlacement,
  KnockoutPredictionRound,
  ExtraAnswers,
  PersistedTipsState,
  MatchResultStatus,
  MatchResult,
  AdminFixtureTemplate,
  AdminResultDraft,
} from './types'
import {
  fixtureTemplates,
  groupPlacementTemplates,
  knockoutPredictionTemplates,
  defaultAdminResultDraft,
} from './constants'

export function deriveSignFromScore(homeScore: number | '', awayScore: number | ''): '' | '1' | 'X' | '2' {
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

export function createDefaultFixtureTips(): FixtureTip[] {
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

export function normalizeFixtureTips(rawTips: unknown): FixtureTip[] {
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

export function normalizeGroupPlacements(rawPlacements: unknown): GroupPlacement[] {
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

export function normalizeExtraAnswers(rawExtraAnswers: unknown): ExtraAnswers {
  if (!rawExtraAnswers || typeof rawExtraAnswers !== 'object' || Array.isArray(rawExtraAnswers)) {
    return {}
  }

  const entries = Object.entries(rawExtraAnswers)
    .filter(([questionId, answer]) => Number.isInteger(Number(questionId)) && Number(questionId) > 0 && typeof answer === 'string')
    .map(([questionId, answer]) => [questionId, (answer as string).trim()])
    .filter(([, answer]) => (answer as string).length > 0)

  return Object.fromEntries(entries)
}

export function normalizeKnockoutPickLabel(rawPick: string): string {
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

export function getKnockoutListId(roundTitle: string): string {
  return `knockout-options-${roundTitle.toLowerCase().replace(/\s+/g, '-')}`
}

export function getBaseKnockoutTeams(groupPlacements: GroupPlacement[]): string[] {
  const canonicalTeams = new Set<string>()
  groupPlacementTemplates.forEach((group) => {
    group.picks.forEach((pick) => {
      if (pick.trim()) {
        canonicalTeams.add(pick)
      }
    })
  })

  groupPlacements.forEach((group) => {
    group.picks.forEach((pick) => {
      if (pick.trim()) {
        canonicalTeams.add(pick)
      }
    })
  })

  return [...canonicalTeams]
}

export function getRoundKnockoutTeams(
  _knockoutPredictions: KnockoutPredictionRound[],
  groupPlacements: GroupPlacement[],
  _roundIndex: number,
): string[] {
  return getBaseKnockoutTeams(groupPlacements)
}

export function normalizeKnockoutPredictions(rawKnockoutPredictions: unknown): KnockoutPredictionRound[] {
  if (!Array.isArray(rawKnockoutPredictions)) {
    return knockoutPredictionTemplates
  }

  return knockoutPredictionTemplates.map((template) => {
    const found = rawKnockoutPredictions.find(
      (item) => item && typeof item === 'object' && 'title' in item && (item as { title?: string }).title === template.title,
    ) as Partial<KnockoutPredictionRound> | undefined

    if (!found || !Array.isArray(found.picks)) {
      return template
    }

    return {
      title: template.title,
      picks: template.picks.map((_, index) => {
        const pick = found.picks && index < found.picks.length ? found.picks[index] : ''
        if (typeof pick === 'string' && pick.trim()) {
          return normalizeKnockoutPickLabel(pick)
        }

        return template.picks[index]
      }),
    }
  })
}

export function normalizePersistedTipsState(rawTips: unknown): PersistedTipsState {
  if (Array.isArray(rawTips)) {
    return {
      fixtureTips: normalizeFixtureTips(rawTips),
      groupPlacements: groupPlacementTemplates,
      knockoutPredictions: knockoutPredictionTemplates,
      extraAnswers: {},
    }
  }

  if (!rawTips || typeof rawTips !== 'object') {
    return {
      fixtureTips: createDefaultFixtureTips(),
      groupPlacements: groupPlacementTemplates,
      knockoutPredictions: knockoutPredictionTemplates,
      extraAnswers: {},
    }
  }

  const candidate = rawTips as Partial<PersistedTipsState>

  return {
    fixtureTips: normalizeFixtureTips(candidate.fixtureTips),
    groupPlacements: normalizeGroupPlacements(candidate.groupPlacements),
    knockoutPredictions: normalizeKnockoutPredictions(candidate.knockoutPredictions),
    extraAnswers: normalizeExtraAnswers((candidate as { extraAnswers?: unknown }).extraAnswers),
  }
}

export function toDateTimeLocalValue(value: string | null | undefined): string {
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

export function buildAdminResultDraft(_template: AdminFixtureTemplate, existingResult?: MatchResult): AdminResultDraft {
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

export function formatMatchResultStatusLabel(status: MatchResultStatus): string {
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

export function formatFixtureReason(reason: string) {
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

export function formatDateTimeLabel(value: string | null | undefined) {
  if (!value) {
    return '—'
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return parsed.toLocaleString('sv-SE')
}

function getBigrams(str: string): Set<string> {
  const s = str.toLowerCase()
  const bigrams = new Set<string>()
  for (let i = 0; i < s.length - 1; i++) {
    bigrams.add(s.slice(i, i + 2))
  }
  return bigrams
}

export function bigramSimilarity(a: string, b: string): number {
  if (a === b) return 1
  if (a.length < 2 || b.length < 2) return 0
  const bigramsA = getBigrams(a)
  const bigramsB = getBigrams(b)
  let intersection = 0
  for (const bg of bigramsA) {
    if (bigramsB.has(bg)) intersection++
  }
  return (2 * intersection) / (bigramsA.size + bigramsB.size)
}
