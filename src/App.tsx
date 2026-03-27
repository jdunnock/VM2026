import { useEffect, useState } from 'react'
import {
  navItems,
} from './constants'
import type {
  AdminQuestion,
  AdminSession,
  ExtraAnswers,
  FixtureTip,
  GroupPlacement,
  KnockoutPredictionRound,
  LeaderboardEntry,
  MatchResult,
  PageId,
  ParticipantScoreDetail,
  ParticipantSession,
  SpecialPredictions,
  SpecialResultsState,
} from './types'
import { StartPage } from './pages/StartPage'
import { ResultsPage } from './pages/ResultsPage'
import { TipsPage } from './pages/TipsPage'
import { MyTipsPage } from './pages/MyTipsPage'
import { RulesPage } from './pages/RulesPage'
import { AdminPage } from './pages/AdminPage'
import { useSession, useParticipantTips, usePhaseRouting } from './hooks'

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
              autoCapitalize="none"
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
    lastSavedFixtureTips: FixtureTip[]
    hasUnsavedChanges: boolean
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
    phase: 'B' | 'C'
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
          phase={pageProps.phase}
          fixtureTips={pageProps.fixtureTips}
          groupPlacements={pageProps.groupPlacements}
          knockoutPredictions={pageProps.knockoutPredictions}
          specialPredictions={pageProps.specialPredictions}
          extraAnswers={pageProps.extraAnswers}
          publishedQuestions={pageProps.publishedQuestions}
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
          savedFixtureTips={pageProps.lastSavedFixtureTips}
          hasUnsavedChanges={pageProps.hasUnsavedChanges}
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
          participantScoreDetail={pageProps.participantScoreDetail}
          isParticipantScoreLoading={pageProps.isParticipantScoreLoading}
          lastSavedLabel={pageProps.myTipsSavedLabel}
          phase={pageProps.phase}
        />
      )
    case 'rules':
      return (
        <RulesPage
          phase={pageProps.phase}
          globalDeadlineLabel={pageProps.globalDeadlineLabel}
        />
      )
    case 'admin':
      return <AdminPage adminSession={pageProps.adminSession} onAdminSessionChange={pageProps.onAdminSessionChange} />
    default:
      return null
  }
}

export function App() {
  // Core session and routing hooks
  const { participant, setParticipant, adminSession, setAdminSession, isLoggedIn, setIsLoggedIn } = useSession()
  const { globalDeadlineStr, activePage, setActivePage, isGlobalLockActive, globalDeadlineLabel, effectiveLifecyclePhase, isTrackingPhaseActive, normalizePageForPhase, phaseOverride, setPhaseOverride } = usePhaseRouting()
  const { fixtureTips, lastSavedFixtureTips, hasUnsavedChanges, groupPlacements, knockoutPredictions, specialPredictions, extraAnswers, isTipsSaving, tipsSaveMessage, myTipsSavedLabel, onChangeTip, onSetScorePreset, onChangeGroupPlacement, onChangeKnockoutPrediction, onChangeSpecialPrediction, onChangeExtraAnswer, onSaveTips: saveParticipantTips, onClearTips: clearParticipantTips } = useParticipantTips(participant, isGlobalLockActive, globalDeadlineLabel)

  // Guard: warn when navigating away from tips page with unsaved changes
  const guardedSetActivePage = (nextPage: string) => {
    if (activePage === 'tips' && hasUnsavedChanges && nextPage !== 'tips') {
      if (!window.confirm('Du har osparade ändringar. Vill du lämna sidan utan att spara?')) {
        return
      }
    }
    setActivePage(nextPage as any)
  }

  // Guard: warn on browser close/refresh with unsaved tips
  useEffect(() => {
    if (!hasUnsavedChanges || activePage !== 'tips') return
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault() }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [hasUnsavedChanges, activePage])

  const countdownLabel = (() => {
    const deadlineTimestamp = new Date(globalDeadlineStr).getTime()
    if (!Number.isFinite(deadlineTimestamp)) {
      return 'Okänd deadline'
    }

    const millisUntilDeadline = deadlineTimestamp - Date.now()
    if (millisUntilDeadline <= 0) {
      return '0 dagar kvar'
    }

    const daysUntilDeadline = Math.ceil(millisUntilDeadline / (1000 * 60 * 60 * 24))
    return `${daysUntilDeadline} dagar kvar`
  })()

  // Local state for results, leaderboard, scores, and UI state
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [participantScoreDetail, setParticipantScoreDetail] = useState<ParticipantScoreDetail | null>(null)
  const [isParticipantScoreLoading, setIsParticipantScoreLoading] = useState(false)
  const [results, setResults] = useState<MatchResult[]>([])
  const [specialResults, setSpecialResults] = useState<SpecialResultsState>({ winner: '', topScorer: '' })
  const [isResultsLoading, setIsResultsLoading] = useState(false)
  const [publishedQuestions, setPublishedQuestions] = useState<AdminQuestion[]>([])
  const [isTouchDevice, setIsTouchDevice] = useState(false)

  // Load leaderboard
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

  // Load participant score detail
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

  // Load public results and special results
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

  // Detect touch device
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

  // Load leaderboard when participant changes
  useEffect(() => {
    loadLeaderboard()
  }, [participant])

  // Load participant score detail when participant or active page changes
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

  // Load public results when active page changes to 'results'
  useEffect(() => {
    if (activePage !== 'results') {
      return
    }

    loadPublicResults()
  }, [activePage])

  // Load published questions when active page changes
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

  // Save tips with leaderboard and score refresh
  const onSaveTips = async () => {
    await saveParticipantTips(loadLeaderboard, loadParticipantScore)
  }

  // Clear tips with leaderboard and score refresh
  const onClearTips = async () => {
    await clearParticipantTips(loadLeaderboard, loadParticipantScore)
  }

  // Logout participant
  const onParticipantLogout = () => {
    setParticipant(null)
    setIsLoggedIn(false)
    setActivePage('start')
  }

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

    if (isTrackingPhaseActive && item.id === 'tips') {
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
              onClick={() => guardedSetActivePage(normalizePageForPhase(item.id))}
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
            <strong>{countdownLabel}</strong>
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
          lastSavedFixtureTips,
          hasUnsavedChanges,
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
          phase: effectiveLifecyclePhase,
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

      <button
        className="dev-phase-toggle"
        type="button"
        onClick={() => setPhaseOverride(phaseOverride === 'C' ? 'B' : 'C')}
        title={`Fas ${effectiveLifecyclePhase} (klicka för att byta)`}
      >
        {effectiveLifecyclePhase}
      </button>
    </div>
  )
}
