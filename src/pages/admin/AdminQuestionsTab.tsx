import React, { useCallback, useMemo, useState } from 'react'
import type { AdminQuestion, AdminQuestionCategory } from '../../types'
import { adminQuestionCategories } from '../../types'

type AnswerEntry = {
    answer: string
    count: number
    participants: string[]
}

type ReviewPanelState = {
    questionId: number | null
    answers: AnswerEntry[]
    accepted: string[]
    correctAnswer: string
    loading: boolean
    message: string
}

const initialReviewState: ReviewPanelState = {
    questionId: null,
    answers: [],
    accepted: [],
    correctAnswer: '',
    loading: false,
    message: '',
}

type AdminQuestionsTabProps = {
    questionMessage: string
    isLoading: boolean
    questions: AdminQuestion[]
    getAdminHeaders: () => Record<string, string> | null
    loadQuestions: () => Promise<void>
    savedResultsCount: number
}

const CATEGORY_SETTLE_THRESHOLD: Record<string, number> = {
    'Gruppspelsfrågor': 72,
    'Slutspelsfrågor': 100,
    'Turneringsfrågor': 103,
    '33-33-33 frågor': 103,
}

const QUESTION_SETTLE_RESULT_THRESHOLD_BY_SLUG: Record<string, number> = {
    'group-most-goals-total': 72,
    'group-five-plus-goal-matches': 72,
    'group-zero-goal-teams': 72,
    'group-sweden-goals': 72,
    'final-regulation-goals': 103,
    'top-scorer-goals': 103,
    'tournament-zero-zero-matches': 103,
    'knockout-regulation-draws': 103,
    'tournament-winner': 103,
    'top-scorer': 103,
    'top-scorer-kane-lukaku-griezmann': 103,
    'top-scorer-gvardiol-maguire-van-dijk': 103,
    'top-scorer-bruno-kdb-bellingham': 103,
    'team-most-goals-sweden-czechia-norway': 103,
    'team-most-goals-spain-germany-portugal': 103,
}

function getSettleThreshold(question: AdminQuestion) {
    if (question.slug && QUESTION_SETTLE_RESULT_THRESHOLD_BY_SLUG[question.slug] !== undefined) {
        return QUESTION_SETTLE_RESULT_THRESHOLD_BY_SLUG[question.slug]
    }

    return CATEGORY_SETTLE_THRESHOLD[question.category] ?? 103
}

export function AdminQuestionsTab({
    questionMessage,
    isLoading,
    questions,
    getAdminHeaders,
    loadQuestions,
    savedResultsCount,
}: AdminQuestionsTabProps) {
    const [settlingId, setSettlingId] = useState<number | null>(null)
    const [settleAnswer, setSettleAnswer] = useState('')
    const [settleMessage, setSettleMessage] = useState('')
    const [settleLoading, setSettleLoading] = useState(false)
    const [review, setReview] = useState<ReviewPanelState>(initialReviewState)

    const closeReviewPanel = useCallback(() => {
        setReview(initialReviewState)
    }, [])

    const openReviewPanel = useCallback(async (questionId: number) => {
        const headers = getAdminHeaders()
        if (!headers) return
        setReview({ ...initialReviewState, questionId, loading: true })
        try {
            const response = await fetch(`/api/admin/questions/${questionId}/answers`, { headers })
            const data = await response.json()
            setReview((prev) => ({
                ...prev,
                answers: data.answers ?? [],
                accepted: data.acceptedAnswers ?? [],
                correctAnswer: data.correctAnswer ?? '',
                loading: false,
            }))
        } catch {
            setReview((prev) => ({ ...prev, message: 'Kunde inte hämta svar.', loading: false }))
        }
    }, [getAdminHeaders])

    const toggleAccepted = (answer: string) => {
        setReview((prev) => ({
            ...prev,
            accepted: prev.accepted.includes(answer)
                ? prev.accepted.filter((item) => item !== answer)
                : [...prev.accepted, answer],
        }))
    }

    const saveAcceptedAnswers = async () => {
        if (review.questionId === null) return
        const headers = getAdminHeaders()
        if (!headers) return
        setReview((prev) => ({ ...prev, loading: true }))
        try {
            const response = await fetch(`/api/admin/questions/${review.questionId}/accepted-answers`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ acceptedAnswers: review.accepted, correctAnswer: review.correctAnswer.trim() }),
            })
            if (!response.ok) {
                const errorPayload = await response.json().catch(() => ({ error: 'Okänt fel' }))
                setReview((prev) => ({ ...prev, message: errorPayload.error ?? 'Kunde inte spara.', loading: false }))
                return
            }

            setReview((prev) => ({
                ...prev,
                message: review.correctAnswer.trim() ? 'Rätt svar och godkända varianter sparade — poäng uppdateras.' : 'Godkända svar sparade.',
                loading: false,
            }))
            await loadQuestions()
        } catch {
            setReview((prev) => ({ ...prev, message: 'Kunde inte spara godkända svar.', loading: false }))
        }
    }

    const isSettleable = (question: AdminQuestion) => savedResultsCount >= getSettleThreshold(question)

    const settleQuestion = async (questionId: number) => {
        if (!settleAnswer.trim()) return
        const headers = getAdminHeaders()
        if (!headers) return
        setSettleLoading(true)
        try {
            const response = await fetch(`/api/admin/questions/${questionId}/accepted-answers`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ acceptedAnswers: [], correctAnswer: settleAnswer.trim() }),
            })
            if (!response.ok) {
                const errorPayload = await response.json().catch(() => ({ error: 'Okänt fel' }))
                setSettleMessage(errorPayload.error ?? 'Kunde inte kuitta svaret.')
                return
            }

            setSettleMessage('Rätt svar sparat — poäng uppdateras.')
            setSettlingId(null)
            setSettleAnswer('')
            await loadQuestions()
        } catch {
            setSettleMessage('Kunde inte kuitta svaret.')
        } finally {
            setSettleLoading(false)
        }
    }

    const questionsByCategory = useMemo(() => {
        const grouped = new Map<AdminQuestionCategory, AdminQuestion[]>()
        for (const category of adminQuestionCategories) {
            grouped.set(category, [])
        }
        for (const question of questions) {
            const list = grouped.get(question.category)
            if (list) list.push(question)
        }
        return grouped
    }, [questions])

    const renderReviewPanel = (questionText: string) => (
        <div className="inline-edit-form">
            <article className="mini-card">
                <span className="mini-label">Granska svar</span>
                <h2>{questionText}</h2>
                {review.message && <p className="save-pill">{review.message}</p>}
                {review.loading ? (
                    <p>Laddar svar...</p>
                ) : review.answers.length === 0 ? (
                    <p>Inga svar inlämnade ännu.</p>
                ) : (
                    <div className="table-wrap">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Svar</th>
                                    <th>Antal</th>
                                    <th>Deltagare</th>
                                    <th>Godkänd</th>
                                </tr>
                            </thead>
                            <tbody>
                                {review.answers.map((entry) => (
                                    <tr key={entry.answer}>
                                        <td data-label="Svar">{entry.answer}</td>
                                        <td data-label="Antal">{entry.count}</td>
                                        <td data-label="Deltagare">{entry.participants.join(', ')}</td>
                                        <td data-label="Godkänd">
                                            <label className="checkbox-label">
                                                <input
                                                    type="checkbox"
                                                    checked={review.accepted.includes(entry.answer)}
                                                    onChange={() => toggleAccepted(entry.answer)}
                                                />
                                            </label>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                <label style={{ marginTop: '0.5rem' }}>
                    Rätt svar (kanoniskt)
                    <input
                        className="special-input"
                        type="text"
                        value={review.correctAnswer}
                        onChange={(event) => setReview((prev) => ({ ...prev, correctAnswer: event.target.value }))}
                        placeholder="Ange det kanoniska rätta svaret…"
                    />
                </label>
                <p className="status-note" style={{ margin: '0.25rem 0' }}>
                    När rätt svar anges och sparas räknas poäng för alla deltagare vars svar matchar rätt svar eller en godkänd variant.
                </p>
                <div className="stacked-actions" style={{ marginTop: '0.5rem' }}>
                    <button className="primary-button" type="button" disabled={review.loading} onClick={saveAcceptedAnswers}>
                        {review.correctAnswer.trim() ? 'Lås svar och spara' : 'Spara godkända svar'}
                    </button>
                    <button className="ghost-button" type="button" onClick={closeReviewPanel}>
                        Stäng
                    </button>
                </div>
            </article>
        </div>
    )

    return (
        <>
            <section className="panel">
                {questionMessage ? <p className="save-pill">{questionMessage}</p> : null}
                <div className="lock-warning" style={{ marginBottom: '1rem' }}>
                    <p>Frågestrukturen styrs av den fasta manifestlistan. Här kan du bara sätta rätt svar och godkända varianter.</p>
                </div>

                {isLoading ? (
                    <p>Laddar frågor...</p>
                ) : questions.length === 0 ? (
                    <div className="lock-warning">
                        <p>Inga manifestfrågor synkade ännu.</p>
                    </div>
                ) : (
                    adminQuestionCategories.map((category) => {
                        const categoryQuestions = questionsByCategory.get(category) ?? []
                        if (categoryQuestions.length === 0) return null

                        const answeredCount = categoryQuestions.filter((question) => question.correctAnswer?.trim()).length
                        const readyCount = categoryQuestions.filter((question) => !question.allowFreeText && !question.correctAnswer?.trim() && isSettleable(question)).length
                        const waitingCount = categoryQuestions.filter((question) => !question.allowFreeText && !question.correctAnswer?.trim() && !isSettleable(question)).length

                        return (
                            <div key={category} className="question-category-group">
                                <div className="matchday-card-header">
                                    <div>
                                        <strong>{category}</strong>
                                        <span className="score-breakdown-meta">
                                            {categoryQuestions.length} frågor · {answeredCount}/{categoryQuestions.length} rätt svar satta
                                        </span>
                                        {(readyCount > 0 || waitingCount > 0) && (
                                            <div className="inline-stats question-settlement-summary">
                                                {readyCount > 0 && (
                                                    <span className="result-status-pill live">{readyCount} redo att bekräfta</span>
                                                )}
                                                {waitingCount > 0 && (
                                                    <span className="result-status-pill planned">{waitingCount} väntar på resultat</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="table-wrap">
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>Fråga</th>
                                                <th>Poäng</th>
                                                <th>Låstid</th>
                                                <th>Svar</th>
                                                <th>Status</th>
                                                <th>Åtgärder</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {categoryQuestions.map((question) => (
                                                <React.Fragment key={question.id}>
                                                    {(() => {
                                                        const hasCorrectAnswer = Boolean(question.correctAnswer?.trim())
                                                        const questionIsSettleable = isSettleable(question)
                                                        const threshold = getSettleThreshold(question)
                                                        const resultsRemaining = Math.max(0, threshold - savedResultsCount)
                                                        const rowClassName = question.allowFreeText
                                                            ? ''
                                                            : hasCorrectAnswer
                                                                ? ''
                                                                : questionIsSettleable
                                                                    ? 'question-row-ready'
                                                                    : 'question-row-waiting'

                                                        return (
                                                    <tr className={rowClassName}>
                                                        <td data-label="Fråga">{question.questionText}</td>
                                                        <td data-label="Poäng">{question.points} p</td>
                                                        <td data-label="Låstid">{new Date(question.lockTime).toLocaleString('sv-SE')}</td>
                                                        <td data-label="Svar">
                                                            {hasCorrectAnswer ? (
                                                                <span className="result-status-pill completed" title={question.correctAnswer}>✅ rätt svar satt</span>
                                                            ) : question.allowFreeText ? (
                                                                <span className="result-status-pill planned">Manuell granskning</span>
                                                            ) : questionIsSettleable ? (
                                                                <span className="result-status-pill live">Redo att bekräfta</span>
                                                            ) : (
                                                                <div className="question-pending-status">
                                                                    <span className="result-status-pill planned">Väntar på resultat</span>
                                                                    <span className="score-breakdown-meta">
                                                                        {savedResultsCount}/{threshold} resultat sparade · {resultsRemaining} kvar
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td data-label="Status">
                                                            <span className={question.status === 'published' ? 'status-badge' : 'status-badge locked'}>
                                                                {question.status === 'published' ? 'Publicerad' : 'Utkast'}
                                                            </span>
                                                        </td>
                                                        <td data-label="Åtgärder">
                                                            <div className="stacked-actions">
                                                                {question.allowFreeText && (
                                                                    <button
                                                                        className="ghost-button"
                                                                        type="button"
                                                                        onClick={() => {
                                                                            if (review.questionId === question.id) {
                                                                                closeReviewPanel()
                                                                                return
                                                                            }
                                                                            setSettlingId(null)
                                                                            setSettleAnswer('')
                                                                            setSettleMessage('')
                                                                            openReviewPanel(question.id)
                                                                        }}
                                                                    >
                                                                            {review.questionId === question.id ? 'Stäng' : 'Granska svar'}
                                                                    </button>
                                                                )}
                                                                {!question.allowFreeText && !hasCorrectAnswer && (
                                                                    <button
                                                                        className={questionIsSettleable ? 'ghost-button question-action-button ready' : 'ghost-button question-action-button'}
                                                                        type="button"
                                                                        disabled={!questionIsSettleable}
                                                                        onClick={() => {
                                                                                closeReviewPanel()
                                                                            setSettlingId(settlingId === question.id ? null : question.id)
                                                                            setSettleAnswer('')
                                                                            setSettleMessage('')
                                                                        }}
                                                                        title={!questionIsSettleable ? `Resultaten är inte klara ännu (${savedResultsCount}/${threshold})` : undefined}
                                                                    >
                                                                        {settlingId === question.id ? 'Stäng' : questionIsSettleable ? 'Bekräfta resultat' : 'Väntar på resultat'}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                        )
                                                    })()}
                                                    {review.questionId === question.id && (
                                                        <tr className="inline-edit-row">
                                                            <td colSpan={6}>
                                                                {renderReviewPanel(question.questionText)}
                                                            </td>
                                                        </tr>
                                                    )}
                                                    {settlingId === question.id && (
                                                        <tr className="inline-edit-row">
                                                            <td colSpan={6}>
                                                                <div className="inline-edit-form">
                                                                    <article className="mini-card">
                                                                        <span className="mini-label">Bekräfta resultat</span>
                                                                        <h2>{question.questionText}</h2>
                                                                        {settleMessage && <p className="save-pill">{settleMessage}</p>}
                                                                        <label>
                                                                            Välj rätt svar
                                                                            <select
                                                                                className="special-input"
                                                                                value={settleAnswer}
                                                                                onChange={(event) => setSettleAnswer(event.target.value)}
                                                                            >
                                                                                <option value="">— Välj —</option>
                                                                                {question.options.map((option) => (
                                                                                    <option key={option} value={option}>{option}</option>
                                                                                ))}
                                                                            </select>
                                                                        </label>
                                                                        <div className="stacked-actions" style={{ marginTop: '0.5rem' }}>
                                                                            <button
                                                                                className="primary-button"
                                                                                type="button"
                                                                                disabled={!settleAnswer.trim() || settleLoading}
                                                                                onClick={() => settleQuestion(question.id)}
                                                                            >
                                                                                Bekräfta och ge poäng
                                                                            </button>
                                                                            <button
                                                                                className="ghost-button"
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    setSettlingId(null)
                                                                                    setSettleAnswer('')
                                                                                    setSettleMessage('')
                                                                                }}
                                                                            >
                                                                                Avbryt
                                                                            </button>
                                                                        </div>
                                                                    </article>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )
                    })
                )}
            </section>
        </>
    )
}
