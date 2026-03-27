export type PageId = 'login' | 'start' | 'results' | 'tips' | 'mine' | 'rules' | 'admin'

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

export type SpecialPredictions = {
  winner: string
  topScorer: string
}

export type ExtraAnswers = Record<string, string>

export type AdminQuestionCategory = 'Gruppspelsfrågor' | 'Slutspelsfrågor' | '33-33-33 frågor'
export type AdminQuestionStatus = 'draft' | 'published'

export type AdminQuestion = {
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

export type SpecialResultsState = {
  winner: string
  topScorer: string
  updatedAt?: string | null
}

export type FixtureScoreBreakdown = {
  matchId: string | null
  match: string
  points: number
  reason: string
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

export type SpecialScoreBreakdown = {
  key: keyof SpecialPredictions
  label: string
  predictedValue: string
  actualValue: string | null
  points: number
  maxPoints: number
  settled: boolean
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

export type PersistedTipsState = {
  fixtureTips: FixtureTip[]
  groupPlacements: GroupPlacement[]
  knockoutPredictions: KnockoutPredictionRound[]
  specialPredictions: SpecialPredictions
  extraAnswers: ExtraAnswers
}

export const tipsSectionTabs = ['Gruppspel', 'Slutspel', 'Extrafrågor'] as const
export type TipsSectionTab = (typeof tipsSectionTabs)[number]

export const myTipsSectionTabs = ['Gruppspel', 'Grupplaceringar', 'Slutspel', 'Extrafrågor'] as const
export type MyTipsSectionTab = (typeof myTipsSectionTabs)[number]

export const adminQuestionCategories: AdminQuestionCategory[] = ['Gruppspelsfrågor', 'Slutspelsfrågor', '33-33-33 frågor']

export type AdminQuestionDraft = {
  questionText: string
  category: AdminQuestionCategory
  optionsText: string
  correctAnswer: string
  points: string
  lockTime: string
  status: AdminQuestionStatus
}

export type AdminWorkspaceTab = 'questions' | 'results'

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
