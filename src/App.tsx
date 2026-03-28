import { useEffect, useState } from 'react'
import {
  navItems,
} from './constants'
import type {
  AdminQuestion,
  AdminSession,
  AllTipsParticipant,
  CorrectnessData,
  ExtraAnswers,
  FixtureTip,
  GroupPlacement,
  KnockoutPredictionRound,
  LeaderboardEntry,
  MatchResult,
  PageId,
  ParticipantScoreDetail,
  ParticipantSession,
} from './types'
import { signIn, ApiError } from './api'
import { StartPage } from './pages/StartPage'
import { TipsPage } from './pages/TipsPage'
import { MyTipsPage } from './pages/MyTipsPage'
import { AllTipsPage } from './pages/AllTipsPage'
import { RulesPage } from './pages/RulesPage'
import { AdminPage } from './pages/AdminPage'
import { useSession, useParticipantTips, usePhaseRouting, useLeaderboard, useParticipantScoreDetail, usePublicData, useAllTipsData } from './hooks'

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
      const session = await signIn(normalizedName, normalizedCode)
      onSuccess(session)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Kunde inte ansluta till servern. Försök igen.')
      }
      setCode('')
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
    allTipsParticipants: AllTipsParticipant[]
    isAllTipsLoading: boolean
    correctnessData: CorrectnessData | null
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
          extraAnswers={pageProps.extraAnswers}
          publishedQuestions={pageProps.publishedQuestions}
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
          extraAnswers={pageProps.extraAnswers}
          publishedQuestions={pageProps.publishedQuestions}
          onChangeTip={pageProps.onChangeTip}
          onSetScorePreset={pageProps.onSetScorePreset}
          onChangeGroupPlacement={pageProps.onChangeGroupPlacement}
          onChangeKnockoutPrediction={pageProps.onChangeKnockoutPrediction}
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
          extraAnswers={pageProps.extraAnswers}
          publishedQuestions={pageProps.publishedQuestions}
          participantScoreDetail={pageProps.participantScoreDetail}
          isParticipantScoreLoading={pageProps.isParticipantScoreLoading}
          lastSavedLabel={pageProps.myTipsSavedLabel}
          phase={pageProps.phase}
          participant={pageProps.participant}
          leaderboard={pageProps.leaderboard}
        />
      )
    case 'rules':
      return (
        <RulesPage
          phase={pageProps.phase}
          globalDeadlineLabel={pageProps.globalDeadlineLabel}
        />
      )
    case 'alltips':
      return (
        <AllTipsPage
          participant={pageProps.participant}
          allTipsParticipants={pageProps.allTipsParticipants}
          isLoading={pageProps.isAllTipsLoading}
          results={pageProps.results}
          publishedQuestions={pageProps.publishedQuestions}
          correctnessData={pageProps.correctnessData}
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
  const { fixtureTips, lastSavedFixtureTips, hasUnsavedChanges, groupPlacements, knockoutPredictions, extraAnswers, isTipsSaving, tipsSaveMessage, myTipsSavedLabel, onChangeTip, onSetScorePreset, onChangeGroupPlacement, onChangeKnockoutPrediction, onChangeExtraAnswer, onSaveTips: saveParticipantTips, onClearTips: clearParticipantTips } = useParticipantTips(participant, isGlobalLockActive, globalDeadlineLabel, () => {
    setParticipant(null)
    setIsLoggedIn(false)
  })

  // Data hooks
  const { leaderboard, loadLeaderboard } = useLeaderboard(participant)
  const { participantScoreDetail, isParticipantScoreLoading, loadParticipantScore } = useParticipantScoreDetail(participant, activePage)
  const { results, publishedQuestions } = usePublicData(activePage)
  const { allTipsParticipants, isAllTipsLoading, correctnessData } = useAllTipsData(activePage)

  // UI state
  const [isTouchDevice, setIsTouchDevice] = useState(false)

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

  // Save/clear tips with leaderboard and score refresh
  const onSaveTips = async () => {
    await saveParticipantTips(async () => {
      await loadLeaderboard()
      if (participant) await loadParticipantScore(participant.participantId)
    })
  }

  const onClearTips = async () => {
    await clearParticipantTips(async () => {
      await loadLeaderboard()
      if (participant) await loadParticipantScore(participant.participantId)
    })
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

    if (!isTrackingPhaseActive && item.id === 'alltips') {
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
          extraAnswers,
          publishedQuestions,
          participant,
          leaderboard,
          participantScoreDetail,
          isParticipantScoreLoading,
          results,
          allTipsParticipants,
          isAllTipsLoading,
          correctnessData,
          phase: effectiveLifecyclePhase,
          adminSession,
          onChangeTip,
          onSetScorePreset,
          onChangeGroupPlacement,
          onChangeKnockoutPrediction,
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
