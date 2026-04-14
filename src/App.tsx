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
  SimulationStatus,
} from './types'
import { LoginPage } from './pages/LoginPage'
import { StartPage } from './pages/StartPage'
import { TipsPage } from './pages/TipsPage'
import { MyTipsPage } from './pages/MyTipsPage'
import { AllTipsPage } from './pages/AllTipsPage'
import { RulesPage } from './pages/RulesPage'
import { AdminPage } from './pages/AdminPage'
import { useSession, useParticipantTips, usePhaseRouting, useLeaderboard, useParticipantScoreDetail, usePublicData, useAllTipsData } from './hooks'

interface RenderPageTipsProps {
  fixtureTips: FixtureTip[]
  lastSavedFixtureTips: FixtureTip[]
  hasUnsavedChanges: boolean
  groupPlacements: GroupPlacement[]
  knockoutPredictions: KnockoutPredictionRound[]
  extraAnswers: ExtraAnswers
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
  onSaveTips: () => void
  onClearTips: () => void
  isSavingTips: boolean
  tipsSaveMessage: string
  myTipsSavedLabel: string
}

interface RenderPageScoresProps {
  leaderboard: LeaderboardEntry[]
  participantScoreDetail: ParticipantScoreDetail | null
  isParticipantScoreLoading: boolean
  results: MatchResult[]
  allTipsParticipants: AllTipsParticipant[]
  isAllTipsLoading: boolean
  correctnessData: CorrectnessData | null
}

interface RenderPageUIProps {
  publishedQuestions: AdminQuestion[]
  simulationStatus: SimulationStatus
  adminSession: AdminSession | null
  onAdminSessionChange: (session: AdminSession | null) => void
  isTouchDevice: boolean
  isGlobalLockActive: boolean
  globalDeadlineLabel: string
  participant: ParticipantSession | null
  phase: 'B' | 'C'
}

function renderPage(
  activePage: PageId,
  { tips, scores, ui }: { tips: RenderPageTipsProps; scores: RenderPageScoresProps; ui: RenderPageUIProps },
) {
  switch (activePage) {
    case 'login':
      return null
    case 'start':
      return (
        <StartPage
          participant={ui.participant}
          leaderboard={scores.leaderboard}
          tipsSaveMessage={tips.tipsSaveMessage}
          phase={ui.phase}
          fixtureTips={tips.fixtureTips}
          groupPlacements={tips.groupPlacements}
          knockoutPredictions={tips.knockoutPredictions}
          extraAnswers={tips.extraAnswers}
          publishedQuestions={ui.publishedQuestions}
          simulationStatus={ui.simulationStatus}
        />
      )
    case 'tips':
      return (
        <TipsPage
          fixtureTips={tips.fixtureTips}
          savedFixtureTips={tips.lastSavedFixtureTips}
          hasUnsavedChanges={tips.hasUnsavedChanges}
          groupPlacements={tips.groupPlacements}
          knockoutPredictions={tips.knockoutPredictions}
          extraAnswers={tips.extraAnswers}
          publishedQuestions={ui.publishedQuestions}
          onChangeTip={tips.onChangeTip}
          onSetScorePreset={tips.onSetScorePreset}
          onChangeGroupPlacement={tips.onChangeGroupPlacement}
          onChangeKnockoutPrediction={tips.onChangeKnockoutPrediction}
          onChangeExtraAnswer={tips.onChangeExtraAnswer}
          onSave={tips.onSaveTips}
          onClear={tips.onClearTips}
          isSaving={tips.isSavingTips}
          saveMessage={tips.tipsSaveMessage}
          isTouchDevice={ui.isTouchDevice}
          isGlobalLockActive={ui.isGlobalLockActive}
          globalDeadlineLabel={ui.globalDeadlineLabel}
        />
      )
    case 'mine':
      return (
        <MyTipsPage
          fixtureTips={tips.fixtureTips}
          groupPlacements={tips.groupPlacements}
          knockoutPredictions={tips.knockoutPredictions}
          extraAnswers={tips.extraAnswers}
          publishedQuestions={ui.publishedQuestions}
          participantScoreDetail={scores.participantScoreDetail}
          isParticipantScoreLoading={scores.isParticipantScoreLoading}
          lastSavedLabel={tips.myTipsSavedLabel}
          phase={ui.phase}
          participant={ui.participant}
          leaderboard={scores.leaderboard}
          results={scores.results}
        />
      )
    case 'rules':
      return (
        <RulesPage
          phase={ui.phase}
          globalDeadlineLabel={ui.globalDeadlineLabel}
        />
      )
    case 'alltips':
      return (
        <AllTipsPage
          participant={ui.participant}
          allTipsParticipants={scores.allTipsParticipants}
          isLoading={scores.isAllTipsLoading}
          results={scores.results}
          publishedQuestions={ui.publishedQuestions}
          correctnessData={scores.correctnessData}
        />
      )
    case 'admin':
      return <AdminPage adminSession={ui.adminSession} onAdminSessionChange={ui.onAdminSessionChange} phase={ui.phase} />
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
  const { results, publishedQuestions, simulationStatus } = usePublicData(activePage)
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

    if (item.id === 'alltips') {
      // Admin can review all submitted tips already in phase B; participants still see this in phase C only.
      return Boolean(adminSession) || isTrackingPhaseActive
    }

    if (isTrackingPhaseActive && item.id === 'tips') {
      return false
    }

    return true
  })

  const isSnapshotPhaseBCommand = typeof simulationStatus.command === 'string' && simulationStatus.command.startsWith('S-B')
  const showDevPhaseToggle = !isSnapshotPhaseBCommand && effectiveLifecyclePhase !== 'B'

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
          tips: {
            fixtureTips,
            lastSavedFixtureTips,
            hasUnsavedChanges,
            groupPlacements,
            knockoutPredictions,
            extraAnswers,
            onChangeTip,
            onSetScorePreset,
            onChangeGroupPlacement,
            onChangeKnockoutPrediction,
            onChangeExtraAnswer,
            onSaveTips,
            onClearTips,
            isSavingTips: isTipsSaving,
            tipsSaveMessage,
            myTipsSavedLabel,
          },
          scores: {
            leaderboard,
            participantScoreDetail,
            isParticipantScoreLoading,
            results,
            allTipsParticipants,
            isAllTipsLoading,
            correctnessData,
          },
          ui: {
            publishedQuestions,
            simulationStatus,
            adminSession,
            onAdminSessionChange: setAdminSession,
            isTouchDevice,
            isGlobalLockActive,
            globalDeadlineLabel,
            participant,
            phase: effectiveLifecyclePhase as 'B' | 'C',
          },
        })}
      </main>

      {showDevPhaseToggle ? (
        <button
          className="dev-phase-toggle"
          type="button"
          onClick={() => setPhaseOverride(phaseOverride === 'C' ? 'B' : 'C')}
          title={`Fas ${effectiveLifecyclePhase} (klicka för att byta)`}
        >
          {effectiveLifecyclePhase}
        </button>
      ) : null}
    </div>
  )
}
