import { useEffect, useState } from 'react'
import {
  defaultAdminQuestionDraft,
} from '../constants'
import type {
  AdminQuestion,
  AdminQuestionDraft,
  AdminSession,
  AdminWorkspaceTab,
  MatchResult,
} from '../types'
import { adminQuestionCategories } from '../types'
import { AdminSigninPanel } from './admin/AdminSigninPanel'
import { AdminQuestionsTab } from './admin/AdminQuestionsTab'
import { AdminMatchdagTab } from './admin/AdminMatchdagTab'
import { AdminSlutspelTab } from './admin/AdminSlutspelTab'

export function AdminPage({
  adminSession,
  onAdminSessionChange,
}: {
  adminSession: AdminSession | null
  onAdminSessionChange: (session: AdminSession | null) => void
}) {
  const [activeAdminTab, setActiveAdminTab] = useState<AdminWorkspaceTab>('matchdag')
  const [questions, setQuestions] = useState<AdminQuestion[]>([])
  const [results, setResults] = useState<MatchResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isResultsLoading, setIsResultsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [questionMessage, setQuestionMessage] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formState, setFormState] = useState<AdminQuestionDraft>(defaultAdminQuestionDraft)
  const [adminNameInput, setAdminNameInput] = useState(adminSession?.adminName ?? '')
  const [adminCodeInput, setAdminCodeInput] = useState('')

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
      setIsResultsLoading(false)
      return
    }

    const headers = getAdminHeaders()
    if (!headers) {
      setResults([])
      setIsResultsLoading(false)
      return
    }

    setIsResultsLoading(true)
    try {
      const resultsResponse = await fetch('/api/admin/results', { headers })

      const resultsPayload = await resultsResponse.json()
      if (resultsResponse.ok) {
        setResults(Array.isArray(resultsPayload.results) ? (resultsPayload.results as MatchResult[]) : [])
      }
    } catch {
      // silently fail — MatchdagTab shows its own messages
    } finally {
      setIsResultsLoading(false)
    }
  }

  useEffect(() => {
    loadQuestions()
    loadResultsData()
  }, [adminSession])

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
      allowFreeText: question.allowFreeText,
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
      allowFreeText: formState.allowFreeText,
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

  const publishedCount = questions.filter((question) => question.status === 'published').length
  const savedResultsCount = results.filter((entry) => entry.resultStatus === 'completed').length

  const onAdminLogout = () => {
    onAdminSessionChange(null)
    setQuestions([])
    setResults([])
    setEditingId(null)
    setQuestionMessage('Admin utloggad.')
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
            Admin kan hantera både extrafrågor och de officiella matchresultat som driver poängräkningen.
          </p>
          <p className="status-note">Inloggad som admin: {adminSession.adminName}</p>
          <div className="tab-row">
            <button
              className={`tab-button ${activeAdminTab === 'matchdag' ? 'active' : ''}`}
              type="button"
              onClick={() => setActiveAdminTab('matchdag')}
            >
              Matchdag
            </button>
            <button
              className={`tab-button ${activeAdminTab === 'slutspel' ? 'active' : ''}`}
              type="button"
              onClick={() => setActiveAdminTab('slutspel')}
            >
              Slutspel
            </button>
            <button
              className={`tab-button ${activeAdminTab === 'questions' ? 'active' : ''}`}
              type="button"
              onClick={() => setActiveAdminTab('questions')}
            >
              Frågor
            </button>
          </div>
          <button
            className="ghost-button"
            type="button"
            disabled={isSaving}
            onClick={onAdminLogout}
          >
            Logga ut admin
          </button>
        </div>
        <article className="mini-card emphasis">
          <span className="mini-label">Status</span>
          <strong>{publishedCount} publicerade frågor, {savedResultsCount} slutresultat</strong>
          <p>Frågor och matchresultat hanteras från samma adminsession.</p>
        </article>
      </section>

      {activeAdminTab === 'matchdag' && (
        <AdminMatchdagTab
          results={results}
          isResultsLoading={isResultsLoading}
          getAdminHeaders={getAdminHeaders}
          onResultSaved={loadResultsData}
        />
      )}

      {activeAdminTab === 'slutspel' && (
        <AdminSlutspelTab
          getAdminHeaders={getAdminHeaders}
        />
      )}

      {activeAdminTab === 'questions' && (
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
          getAdminHeaders={getAdminHeaders}
        />
      )}
    </div>
  )
}
