import { allTournamentFixtures, fixtureCounts, groupStageFixtureTemplates } from './fixtures'
import type {
    NavItem,
    SummaryCard,
    RuleRow,
    GroupPlacement,
    KnockoutPredictionRound,
    SpecialPredictions,
    AdminQuestionCategory,
    AdminQuestionDraft,
    AdminQuestionStatus,
    AdminResultDraft,
    MatchResultStage,
    MatchResultStatus,
    AdminFixtureTemplate,
} from './types'

export const navItems: NavItem[] = [
    { id: 'start', label: 'Start' },
    { id: 'tips', label: 'Lämna tips' },
    { id: 'mine', label: 'Mina tips' },
    { id: 'alltips', label: 'Alla tips' },
    { id: 'rules', label: 'Regler' },
    { id: 'admin', label: 'Admin' },
]

export const summaryCards: SummaryCard[] = [
    { title: '48 lag', detail: 'Deltagande nationer' },
    { title: 'Grupp A-L', detail: '12 grupper med 4 lag' },
    { title: '32 → Final', detail: 'Från sextondelsfinaler till final' },
]

export const categoryItems = [
    { label: 'Gruppspelsmatcher', count: fixtureCounts.groupStage },
    { label: 'Grupplaceringar', count: 12 },
    { label: 'Slutspel', count: 31 },
    { label: 'Slutsegrare', count: 1 },
    { label: 'Skytteligavinnare', count: 1 },
    { label: 'Extrafrågor', count: 5 },
]

export const fixtureTemplates = groupStageFixtureTemplates

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

export const groupPlacementTemplates: GroupPlacement[] = buildGroupPlacementTemplates()

export const groupTeamOptions = Object.fromEntries(
    groupPlacementTemplates.map((template) => [template.group, template.picks]),
) as Record<string, string[]>

export function getAvailableGroupTeams(placement: GroupPlacement, index: number): string[] {
    const currentPick = placement.picks[index]
    const availableTeams = [...(groupTeamOptions[placement.group] ?? [])]

    if (currentPick.trim() && !availableTeams.includes(currentPick)) {
        return [currentPick, ...availableTeams]
    }

    return availableTeams
}

export const defaultSpecialPredictions: SpecialPredictions = {
    winner: 'Argentina',
    topScorer: 'Kylian Mbappé',
}

export const PARTICIPANT_STORAGE_KEY = 'vm2026.participant'
export const ADMIN_SESSION_STORAGE_KEY = 'vm2026.adminSession'
export const GLOBAL_DEADLINE_FALLBACK = '2026-06-09T22:00:00'
export const GLOBAL_DEADLINE_LABEL = new Date(GLOBAL_DEADLINE_FALLBACK).toLocaleString('sv-SE')

export const QUICK_SCORE_GROUPS: Array<{
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

export const knockoutPredictionTemplates: KnockoutPredictionRound[] = [
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

export const myTipsSections: Array<{ title: string; count: number; status: string; items: string[] }> = [
    { title: 'Gruppspel', count: 104, status: `Låser ${GLOBAL_DEADLINE_LABEL}`, items: [] },
    { title: 'Grupplaceringar', count: 12, status: `Låser ${GLOBAL_DEADLINE_LABEL}`, items: ['Grupp A: Kanada, SWE/POL/ALB/UKR, Ghana, Peru'] },
    { title: 'Slutspel', count: 31, status: `Låser ${GLOBAL_DEADLINE_LABEL}`, items: [] },
    { title: 'Extrafrågor', count: 7, status: `Låser ${GLOBAL_DEADLINE_LABEL}`, items: [] },
]

export const ruleRows: RuleRow[] = [
    {
        category: 'Gruppspelsmatcher',
        prediction: 'Exakt resultat och 1/X/2',
        lockTime: `Gemensam deadline: ${GLOBAL_DEADLINE_LABEL}`,
    },
    {
        category: 'Grupplaceringar',
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

export const defaultAdminQuestionDraft: AdminQuestionDraft = {
    questionText: '',
    category: 'Gruppspelsfrågor',
    optionsText: '',
    correctAnswer: '',
    points: '2',
    lockTime: '',
    status: 'draft',
}

export const defaultAdminResultDraft: AdminResultDraft = {
    resultStatus: 'planned',
    homeScore: '',
    awayScore: '',
    settledAt: '',
}

export const adminFixtureTemplates: AdminFixtureTemplate[] = allTournamentFixtures.map((fixture) => ({
    matchId: fixture.id,
    stage: fixture.stage as MatchResultStage,
    round: fixture.round ?? null,
    groupCode: fixture.group ?? null,
    homeTeam: fixture.homeTeam,
    awayTeam: fixture.awayTeam,
    kickoffAt: fixture.kickoffAt,
}))
