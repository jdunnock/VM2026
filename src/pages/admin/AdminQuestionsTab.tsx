import { useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type {
    AdminQuestion,
    AdminQuestionCategory,
    AdminQuestionDraft,
    AdminQuestionStatus,
} from '../../types'
import squadsData from '../../data/vm2026-squads.json'

type SquadData = Record<string, string[]>

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
}: AdminQuestionsTabProps) {
    const [showPlayerPicker, setShowPlayerPicker] = useState(false)
    const [playerSearch, setPlayerSearch] = useState('')
    const [selectedCountry, setSelectedCountry] = useState('')

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
        </>
    )
}
