import type { Dispatch, SetStateAction } from 'react'
import type {
  AdminQuestion,
  AdminQuestionCategory,
  AdminQuestionDraft,
  AdminQuestionStatus,
} from '../../types'

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
