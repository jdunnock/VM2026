import type { AdminQuestion, ExtraAnswers } from '../../types'
import { SearchableCombobox } from '../../components/SearchableCombobox'
import { COMBOBOX_OPTION_THRESHOLD } from '../../constants'

function getComboboxPlaceholder(question: AdminQuestion): string {
    if (question.allowFreeText) return 'Skriv eller sök svar…'
    if (question.options.every(o => /^\d+$/.test(o))) return 'Antal'
    if (question.slug === 'tournament-winner') return 'Sök land…'
    if (question.slug === 'group-most-goals-total') return 'Välj grupp'
    return 'Välj…'
}

type ExtraQuestionsCardProps = {
    publishedQuestions: AdminQuestion[]
    extraAnswers: ExtraAnswers
    onChangeExtraAnswer: (questionId: number, answer: string) => void
    isSaving: boolean
    isGlobalLockActive: boolean
}

export function ExtraQuestionsCard({
    publishedQuestions,
    extraAnswers,
    onChangeExtraAnswer,
    isSaving,
    isGlobalLockActive,
}: ExtraQuestionsCardProps) {
    return (
        <section className="panel">
            <div className="section-heading compact">
                <p className="eyebrow">Extrafrågor</p>
            </div>
            <div className="stacked-cards">
                {publishedQuestions.length === 0 ? (
                    <article className="mini-card">
                        <span className="mini-label">Extrafrågor</span>
                        <strong>Inga publicerade frågor ännu</strong>
                        <span className="status-note">Admin publicerar frågor i adminfliken.</span>
                    </article>
                ) : (
                    publishedQuestions.map((question) => {
                        const isLocked = isGlobalLockActive
                        const selectedAnswer = extraAnswers[String(question.id)] ?? ''

                        return (
                            <article className="mini-card" key={question.id}>
                                <span className="mini-label">{question.category}</span>
                                <strong>{question.questionText}</strong>
                                {question.allowFreeText || question.options.length > COMBOBOX_OPTION_THRESHOLD ? (
                                    <SearchableCombobox
                                        options={question.options}
                                        value={selectedAnswer}
                                        onChange={(val) => onChangeExtraAnswer(question.id, val)}
                                        placeholder={getComboboxPlaceholder(question)}
                                        disabled={isSaving || isLocked}
                                        allowFreeText={question.allowFreeText}
                                    />
                                ) : (
                                    <select
                                        className="special-input"
                                        value={selectedAnswer}
                                        disabled={isSaving || isLocked}
                                        onChange={(e) => onChangeExtraAnswer(question.id, e.target.value)}
                                    >
                                        <option value="">Välj svar</option>
                                        {question.options.map((option) => (
                                            <option key={`${question.id}-${option}`} value={option}>
                                                {option}
                                            </option>
                                        ))}
                                    </select>
                                )}
                                <span className={isLocked ? 'status-badge locked' : 'status-badge'}>{isLocked ? 'Låst' : 'Öppen'}</span>
                            </article>
                        )
                    })
                )}
            </div>
        </section>
    )
}
