import { useState, useCallback } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type {
    AdminQuestion,
    AdminQuestionCategory,
    AdminQuestionDraft,
    AdminQuestionStatus,
} from '../../types'
import squadsData from '../../data/vm2026-squads.json'

type SquadData = Record<string, string[]>

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
    isSaving: boolean
    startEditing: (question: AdminQuestion) => void
    deleteQuestion: (questionId: number) => void
    editingId: number | null
    formState: AdminQuestionDraft
    setFormState: Dispatch<SetStateAction<AdminQuestionDraft>>
    adminQuestionCategories: AdminQuestionCategory[]
    saveQuestion: () => void
    resetForm: () => void
    getAdminHeaders: () => Record<string, string> | null
}

export function AdminQuestionsTab({
    questionMessage,
    isLoading,
    questions,
    isSaving,
    startEditing,
    deleteQuestion,
    editingId,
    formState,
    setFormState,
    adminQuestionCategories,
    saveQuestion,
    resetForm,
    getAdminHeaders,
}: AdminQuestionsTabProps) {
    const [showPlayerPicker, setShowPlayerPicker] = useState(false)
    const [playerSearch, setPlayerSearch] = useState('')
    const [selectedCountry, setSelectedCountry] = useState('')
    const [review, setReview] = useState<ReviewPanelState>(initialReviewState)

    const squads = squadsData as SquadData

    const existingOptions = new Set(
        formState.optionsText.split('\n').map((s) => s.trim()).filter(Boolean)
    )

    function addPlayerToOptions(player: string) {
        if (existingOptions.has(player)) return
        const current = formState.optionsText.trim()
        const updated = current ? `${current}\n${player}` : player
        setFormState((prev) => ({ ...prev, optionsText: updated }))
    }

    function getFilteredPlayers(): Array<{ player: string; country: string }> {
        const results: Array<{ player: string; country: string }> = []
        const countries = selectedCountry ? [selectedCountry] : Object.keys(squads).sort()
        const q = playerSearch.toLowerCase()
        for (const country of countries) {
            const players = squads[country] ?? []
            for (const player of players) {
                if (!q || player.toLowerCase().includes(q) || country.toLowerCase().includes(q)) {
                    results.push({ player, country })
                }
            }
        }
        return results.slice(0, 100)
    }

    const openReviewPanel = useCallback(async (questionId: number) => {
        const headers = getAdminHeaders()
        if (!headers) return
        setReview({ ...initialReviewState, questionId, loading: true })
        try {
            const res = await fetch(`/api/admin/questions/${questionId}/answers`, { headers })
            const data = await res.json()
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
                ? prev.accepted.filter((a) => a !== answer)
                : [...prev.accepted, answer],
        }))
    }

    const saveAcceptedAnswers = async () => {
        if (review.questionId === null) return
        const headers = getAdminHeaders()
        if (!headers) return
        setReview((prev) => ({ ...prev, loading: true }))
        try {
            const res = await fetch(`/api/admin/questions/${review.questionId}/accepted-answers`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ acceptedAnswers: review.accepted, correctAnswer: review.correctAnswer.trim() }),
            })
            if (!res.ok) {
                const err = await res.json().catch(() => ({ error: 'Okänt fel' }))
                setReview((prev) => ({ ...prev, message: err.error ?? 'Kunde inte spara.', loading: false }))
                return
            }
            setReview((prev) => ({
                ...prev,
                message: review.correctAnswer.trim() ? 'Rätt svar och godkända varianter sparade — poäng uppdateras.' : 'Godkända svar sparade.',
                loading: false,
            }))
        } catch {
            setReview((prev) => ({ ...prev, message: 'Kunde inte spara godkända svar.', loading: false }))
        }
    }

    return (
        <>
            <section className="panel">
                {questionMessage ? <p className="save-pill">{questionMessage}</p> : null}
                <div className="table-wrap">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Fråga</th>
                                <th>Kategori</th>
                                <th>Poäng</th>
                                <th>Låstid</th>
                                <th>Status</th>
                                <th>Åtgärder</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6}>Laddar frågor...</td>
                                </tr>
                            ) : questions.length === 0 ? (
                                <tr>
                                    <td colSpan={6}>Inga frågor skapade ännu.</td>
                                </tr>
                            ) : (
                                questions.map((question) => (
                                    <tr key={question.id}>
                                        <td data-label="Fråga">{question.questionText}</td>
                                        <td data-label="Kategori">{question.category}</td>
                                        <td data-label="Poäng">{question.points} p</td>
                                        <td data-label="Låstid">{new Date(question.lockTime).toLocaleString('sv-SE')}</td>
                                        <td data-label="Status">
                                            <span className={question.status === 'published' ? 'status-badge' : 'status-badge locked'}>
                                                {question.status === 'published' ? 'Publicerad' : 'Utkast'}
                                            </span>
                                        </td>
                                        <td data-label="Åtgärder">
                                            <div className="stacked-actions">
                                                <button className="ghost-button" type="button" disabled={isSaving} onClick={() => startEditing(question)}>
                                                    Redigera
                                                </button>
                                                {question.allowFreeText && (
                                                    <button className="ghost-button" type="button" onClick={() => openReviewPanel(question.id)}>
                                                        Granska svar
                                                    </button>
                                                )}
                                                <button className="ghost-button danger" type="button" disabled={isSaving} onClick={() => deleteQuestion(question.id)}>
                                                    Ta bort
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="form-grid">
                <article className="mini-card">
                    <span className="mini-label">{editingId ? 'Redigera fråga' : 'Skapa fråga'}</span>
                    <h2>Frågeformulär</h2>
                    <div className="stacked-actions">
                        <label>
                            Frågetext
                            <input
                                className="special-input"
                                type="text"
                                value={formState.questionText}
                                onChange={(e) => setFormState((current) => ({ ...current, questionText: e.target.value }))}
                            />
                        </label>
                        <label>
                            Kategori
                            <select
                                className="special-input"
                                value={formState.category}
                                onChange={(e) => setFormState((current) => ({ ...current, category: e.target.value as AdminQuestionCategory }))}
                            >
                                {adminQuestionCategories.map((category) => (
                                    <option key={category} value={category}>
                                        {category}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label>
                            Svarsalternativ (ett per rad)
                            <textarea
                                className="special-input"
                                rows={5}
                                value={formState.optionsText}
                                onChange={(e) => setFormState((current) => ({ ...current, optionsText: e.target.value }))}
                            />
                        </label>
                        <button
                            type="button"
                            className="admin-link-btn"
                            onClick={() => setShowPlayerPicker((v) => !v)}
                        >
                            {showPlayerPicker ? '▲ Stäng spelarväljare' : '▼ Välj spelare från trupper'}
                        </button>
                        {showPlayerPicker && (
                            <div className="player-picker-panel">
                                <div className="player-picker-controls">
                                    <select
                                        className="special-input"
                                        value={selectedCountry}
                                        onChange={(e) => setSelectedCountry(e.target.value)}
                                    >
                                        <option value="">Alla länder</option>
                                        {Object.keys(squads).sort().map((c) => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                    <input
                                        className="special-input"
                                        type="text"
                                        placeholder="Sök spelare…"
                                        value={playerSearch}
                                        onChange={(e) => setPlayerSearch(e.target.value)}
                                    />
                                </div>
                                <div className="player-picker-list">
                                    {getFilteredPlayers().map(({ player, country }) => (
                                        <button
                                            key={`${country}-${player}`}
                                            type="button"
                                            className={`player-picker-item${existingOptions.has(player) ? ' already-added' : ''}`}
                                            onClick={() => addPlayerToOptions(player)}
                                            disabled={existingOptions.has(player)}
                                        >
                                            {player} <span className="player-country">({country})</span>
                                        </button>
                                    ))}
                                    {getFilteredPlayers().length === 0 && (
                                        <p className="player-picker-empty">Inga spelare hittades</p>
                                    )}
                                </div>
                            </div>
                        )}
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={formState.allowFreeText}
                                onChange={(e) => setFormState((current) => ({ ...current, allowFreeText: e.target.checked }))}
                            />
                            Tillåt fritt textsvar (fuzzy-sökning + eget svar)
                        </label>
                        <label>
                            Rätt svar
                            <input
                                className="special-input"
                                type="text"
                                value={formState.correctAnswer}
                                onChange={(e) => setFormState((current) => ({ ...current, correctAnswer: e.target.value }))}
                                placeholder="Valfritt tills svaret är känt"
                            />
                        </label>
                        <label>
                            Poäng
                            <input
                                className="special-input"
                                type="number"
                                min={0}
                                max={100}
                                value={formState.points}
                                onChange={(e) => setFormState((current) => ({ ...current, points: e.target.value }))}
                            />
                        </label>
                        <label>
                            Låstid
                            <input
                                className="special-input"
                                type="datetime-local"
                                value={formState.lockTime}
                                onChange={(e) => setFormState((current) => ({ ...current, lockTime: e.target.value }))}
                            />
                        </label>
                        <label>
                            Status
                            <select
                                className="special-input"
                                value={formState.status}
                                onChange={(e) => setFormState((current) => ({ ...current, status: e.target.value as AdminQuestionStatus }))}
                            >
                                <option value="draft">Utkast</option>
                                <option value="published">Publicerad</option>
                            </select>
                        </label>
                    </div>
                </article>
                <article className="mini-card">
                    <span className="mini-label">Adminåtgärder</span>
                    <div className="stacked-actions">
                        <button className="primary-button" type="button" disabled={isSaving} onClick={saveQuestion}>
                            {isSaving ? 'Sparar...' : editingId ? 'Uppdatera fråga' : 'Skapa fråga'}
                        </button>
                        <button className="ghost-button" type="button" disabled={isSaving} onClick={resetForm}>
                            Återställ formulär
                        </button>
                    </div>
                </article>
            </section>

            {review.questionId !== null && (
                <section className="panel">
                    <h3>Granska svar — Fråga #{review.questionId}</h3>
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
                            onChange={(e) => setReview((prev) => ({ ...prev, correctAnswer: e.target.value }))}
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
                        <button className="ghost-button" type="button" onClick={() => setReview(initialReviewState)}>
                            Stäng
                        </button>
                    </div>
                </section>
            )}
        </>
    )
}
