import { useEffect, useState } from 'react'
import type {
  AdminQuestion,
  AdminSession,
  AdminWorkspaceTab,
  MatchResult,
} from '../types'
import { AdminSigninPanel } from './admin/AdminSigninPanel'
import { AdminQuestionsTab } from './admin/AdminQuestionsTab'
import { AdminMatchdagTab } from './admin/AdminMatchdagTab'
import { AdminSlutspelTab } from './admin/AdminSlutspelTab'

export function AdminPage({
  adminSession,
  onAdminSessionChange,
  phase,
}: {
  adminSession: AdminSession | null
  onAdminSessionChange: (session: AdminSession | null) => void
  phase: 'B' | 'C'
}) {
  const [activeAdminTab, setActiveAdminTab] = useState<AdminWorkspaceTab>('questions')
  const [questions, setQuestions] = useState<AdminQuestion[]>([])
  const [results, setResults] = useState<MatchResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isResultsLoading, setIsResultsLoading] = useState(true)
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [questionMessage, setQuestionMessage] = useState('')
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

  const publishedCount = questions.filter((question) => question.status === 'published').length
  const savedResultsCount = results.filter((entry) => entry.resultStatus === 'completed').length
  const tournamentStarted = phase === 'C'

  const onAdminLogout = () => {
    onAdminSessionChange(null)
    setQuestions([])
    setResults([])
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
            Admin hanterar officiella matchresultat och fastställer svar för de fördefinierade extrafrågorna.
          </p>
          <p className="status-note">Inloggad som admin: {adminSession.adminName}</p>
          <div className="tab-row">
            {tournamentStarted && (
              <>
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
              </>
            )}
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
            disabled={isSigningIn}
            onClick={onAdminLogout}
          >
            Logga ut admin
          </button>
        </div>
        <article className="mini-card emphasis">
          <span className="mini-label">Status</span>
          <strong>{publishedCount} fasta frågor, {savedResultsCount} slutresultat</strong>
          <p>Frågestruktur synkas från manifestet. Adminpanelen används bara för rättning och resultat.</p>
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
          getAdminHeaders={getAdminHeaders}
          loadQuestions={loadQuestions}
          savedResultsCount={savedResultsCount}
        />
      )}
    </div>
  )
}
