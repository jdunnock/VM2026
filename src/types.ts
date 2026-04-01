export type PageId = 'login' | 'start' | 'tips' | 'mine' | 'alltips' | 'rules' | 'admin'

export type NavItem = {
    id: PageId
    label: string
}

export type SummaryCard = {
    title: string
    detail: string
}

export type RuleRow = {
    category: string
    prediction: string
    lockTime: string
}

export type ParticipantSession = {
    participantId: number
    name: string
}

export type AdminSession = {
    adminName: string
    adminCode: string
}

export type FixtureTip = {
    fixtureId?: string
    group?: string
    match: string
    date: string
    homeScore: number | ''
    awayScore: number | ''
    sign: '' | '1' | 'X' | '2'
    status: string
}

export type GroupPlacement = {
    group: string
    picks: string[]
}

export type KnockoutPredictionRound = {
    title: string
    picks: string[]
}

export type ExtraAnswers = Record<string, string>

export type AdminQuestionCategory = 'Gruppspelsfrågor' | 'Slutspelsfrågor' | 'Turneringsfrågor' | '33-33-33 frågor'
export type AdminQuestionStatus = 'draft' | 'published'

export type AdminQuestion = {
    id: number
    slug?: string | null
    questionText: string
    category: AdminQuestionCategory
    options: string[]
    correctAnswer?: string
    points: number
    lockTime: string
    status: AdminQuestionStatus
    allowFreeText: boolean
    acceptedAnswers: string[]
    createdAt?: string
    updatedAt?: string
}

export type LeaderboardEntry = {
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

export type MatchResultStage = 'group' | 'knockout'
export type MatchResultStatus = 'planned' | 'live' | 'completed'

export type MatchResult = {
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

export type FixtureScoreBreakdown = {
    matchId: string | null
    match: string
    points: number
    reason: string
    predictedHomeScore: number | null
    predictedAwayScore: number | null
    predictedSign: string | null
    actualSign: string | null
    group: string | null
    date: string | null
    result: { homeScore: number; awayScore: number } | null
}

export type GroupPlacementScoreBreakdown = {
    group: string
    predictedPicks: string[]
    actualPicks: string[] | null
    matchedPositions: number[]
    points: number
    reason: string
}

export type KnockoutScoreBreakdown = {
    round: string
    predictedTeams: string[]
    actualTeams: string[] | null
    matchedTeams: string[]
    points: number
    pointsPerTeam: number
    reason: string
}

export type ExtraScoreBreakdown = {
    questionId: number | null
    questionText: string | null
    selectedAnswer: string
    correctAnswer: string | null
    points: number
    settled: boolean
    reason: string
}

export type ParticipantScoreDetail = {
    participantId: number
    name: string
    totalPoints: number
    fixturePoints: number
    groupPlacementPoints: number
    knockoutPoints: number
    extraQuestionPoints: number
    settledMatches: number
    settledGroups: number
    settledKnockoutRounds: number
    settledQuestions: number
    breakdown: FixtureScoreBreakdown[]
    groupPlacementBreakdown: GroupPlacementScoreBreakdown[]
    knockoutBreakdown: KnockoutScoreBreakdown[]
    extraBreakdown: ExtraScoreBreakdown[]
    updatedAt: string | null
    rank: number | null
    positionLabel: string | null
}

export type PersistedTipsState = {
    fixtureTips: FixtureTip[]
    groupPlacements: GroupPlacement[]
    knockoutPredictions: KnockoutPredictionRound[]
    extraAnswers: ExtraAnswers
}

export type CorrectnessData = {
    groupStandings: Record<string, { settled: boolean; actualPicks: string[] | null }>
    knockoutRounds: Record<string, { settled: boolean; actualTeams: string[] }>
    /** Each extra answer includes correctAnswer, settled flag, and accepted variant answers (populated for allowFreeText questions). */
    extraAnswers: Record<string, { correctAnswer: string | null; settled: boolean; acceptedAnswers?: string[] }>
}

export type AllTipsParticipant = {
    participantId: number
    name: string
    tips: PersistedTipsState | null
    updatedAt: string | null
}

export const tipsSectionTabs = ['Gruppspel', 'Slutspel', 'Extrafrågor'] as const
export type TipsSectionTab = (typeof tipsSectionTabs)[number]

export const myTipsSectionTabs = ['Gruppspel', 'Grupplaceringar', 'Slutspel', 'Extrafrågor'] as const
export type MyTipsSectionTab = (typeof myTipsSectionTabs)[number]

export const adminQuestionCategories: AdminQuestionCategory[] = ['Gruppspelsfrågor', 'Slutspelsfrågor', 'Turneringsfrågor', '33-33-33 frågor']

export type AdminWorkspaceTab = 'matchdag' | 'slutspel' | 'questions'

export type AdminFixtureTemplate = {
    matchId: string
    stage: MatchResultStage
    round: string | null
    groupCode: string | null
    homeTeam: string
    awayTeam: string
    kickoffAt: string
}

export type AdminResultDraft = {
    resultStatus: MatchResultStatus
    homeScore: string
    awayScore: string
    settledAt: string
}
