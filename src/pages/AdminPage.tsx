import { useEffect, useState } from 'react'
import {
  adminFixtureTemplates,
  defaultAdminResultDraft,
  defaultAdminQuestionDraft,
} from '../constants'
import type {
  AdminQuestion,
  AdminQuestionDraft,
  AdminResultDraft,
  AdminSession,
  AdminWorkspaceTab,
  MatchResult,
  SpecialResultsState,
} from '../types'
import { adminQuestionCategories } from '../types'
import {
  buildAdminResultDraft,
  toDateTimeLocalValue,
} from '../utils'
import { useFixtureFilter } from '../hooks/useFixtureFilter'
import { AdminSigninPanel } from './admin/AdminSigninPanel'
import { AdminQuestionsTab } from './admin/AdminQuestionsTab'
import { AdminResultsTab } from './admin/AdminResultsTab'

export function AdminPage({
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
  const [resultDraft, setResultDraft] = useState<AdminResultDraft>(defaultAdminResultDraft)
  const {
    resultFilterStage,
    setResultFilterStage,
    resultSearchQuery,
    setResultSearchQuery,
    selectedMatchId,
    setSelectedMatchId,
    filteredFixtures,
    filteredSavedResults,
    selectedFixture,
  } = useFixtureFilter(adminFixtureTemplates, results)

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

  const selectedResult = results.find((entry) => entry.matchId === selectedMatchId)

  useEffect(() => {
    if (!selectedFixture) {
      setResultDraft(defaultAdminResultDraft)
      return
    }

    setResultDraft(buildAdminResultDraft(selectedFixture, selectedResult))
  }, [selectedMatchId, results])

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

  const onAdminLogout = () => {
    onAdminSessionChange(null)
    setQuestions([])
    setResults([])
    setSpecialResults({ winner: '', topScorer: '' })
    setEditingId(null)
    setQuestionMessage('Admin utloggad.')
    setResultsMessage('')
  }

  if (!adminSession) {
    return (
      <AdminSigninPanel
        adminNameInput={adminNameInput}
        setAdminNameInput={setAdminNameInput}
        adminCodeInput={adminCodeInput}
        setAdminCodeInput={setAdminCodeInput}
        isSigningIn={isSigningIn}
        questionMessage={questionMessage}
        onSignIn={signInAdmin}
      />
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
            onClick={onAdminLogout}
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
        <AdminQuestionsTab
          questionMessage={questionMessage}
          isLoading={isLoading}
          questions={questions}
          isSaving={isSaving}
          startEditing={startEditing}
          deleteQuestion={deleteQuestion}
          editingId={editingId}
          formState={formState}
          setFormState={setFormState}
          adminQuestionCategories={adminQuestionCategories}
          saveQuestion={saveQuestion}
          resetForm={resetForm}
        />
      ) : (
        <AdminResultsTab
          resultsMessage={resultsMessage}
          isResultSaving={isResultSaving}
          isResultsLoading={isResultsLoading}
          resultFilterStage={resultFilterStage}
          setResultFilterStage={setResultFilterStage}
          resultSearchQuery={resultSearchQuery}
          setResultSearchQuery={setResultSearchQuery}
          selectedMatchId={selectedMatchId}
          setSelectedMatchId={setSelectedMatchId}
          filteredFixtures={filteredFixtures}
          selectedFixture={selectedFixture}
          resultDraft={resultDraft}
          setResultDraft={setResultDraft}
          saveMatchResult={saveMatchResult}
          resetResultDraft={resetResultDraft}
          specialResults={specialResults}
          setSpecialResults={setSpecialResults}
          saveSpecialResults={saveSpecialResults}
          filteredSavedResults={filteredSavedResults}
          setActiveAdminTab={setActiveAdminTab}
        />
      )}
    </div>
  )
}
