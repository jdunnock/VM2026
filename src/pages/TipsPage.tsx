import { useState } from 'react'
import type {
  AdminQuestion,
  ExtraAnswers,
  FixtureTip,
  GroupPlacement,
  KnockoutPredictionRound,
  TipsSectionTab,
} from '../types'
import { tipsSectionTabs } from '../types'
import { GroupsFixturesCard } from './tips/GroupsFixturesCard'
import { KnockoutRoundsCard } from './tips/KnockoutRoundsCard'
import { SearchableCombobox } from '../components/SearchableCombobox'

export function TipsPage({
  fixtureTips,
  savedFixtureTips,
  hasUnsavedChanges,
  groupPlacements,
  knockoutPredictions,
  extraAnswers,
  publishedQuestions,
  onChangeTip,
  onSetScorePreset,
  onChangeGroupPlacement,
  onChangeKnockoutPrediction,
  onChangeExtraAnswer,
  onSave,
  onClear,
  isSaving,
  saveMessage,
  isTouchDevice,
  isGlobalLockActive,
  globalDeadlineLabel,
}: {
  fixtureTips: FixtureTip[]
  savedFixtureTips: FixtureTip[]
  hasUnsavedChanges: boolean
  groupPlacements: GroupPlacement[]
  knockoutPredictions: KnockoutPredictionRound[]
  extraAnswers: ExtraAnswers
  publishedQuestions: AdminQuestion[]
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
  onSave: () => void
  onClear: () => void
  isSaving: boolean
  saveMessage: string
  isTouchDevice: boolean
  isGlobalLockActive: boolean
  globalDeadlineLabel: string
}) {
  const [expandedManualEditor, setExpandedManualEditor] = useState<Record<string, boolean>>({})
  const [activeKnockoutField, setActiveKnockoutField] = useState<{ roundTitle: string; index: number } | null>(null)
  const [activeSection, setActiveSection] = useState<TipsSectionTab>('Gruppspel')
  const enableKnockoutTypeahead = !isTouchDevice

  const toggleManualEditor = (match: string) => {
    setExpandedManualEditor((current) => ({
      ...current,
      [match]: !current[match],
    }))
  }

  return (
    <div className="page-stack">
      <section className="panel panel-sticky-head page-hero">
        <div>
          <p className="eyebrow">Lämna tips</p>
          <h1 className="section-title">Lämna dina tips</h1>
          {isGlobalLockActive
            ? <p className="status-note">Tips är låsta (deadline passerad: {globalDeadlineLabel}).</p>
            : <p className="lead-text" style={{ margin: 0 }}>Fyll i dina tips och spara när du är klar.</p>}
        </div>
        <div className="inline-actions">
          {hasUnsavedChanges && <span className="save-pill unsaved">Osparade ändringar</span>}
          <span className="save-pill">{saveMessage}</span>
          <button className="primary-button" type="button" onClick={onSave} disabled={isSaving || isGlobalLockActive}>
            {isSaving ? 'Sparar...' : 'Spara'}
          </button>
        </div>
      </section>

      <section className="tab-row" aria-label="Sektioner">
        {tipsSectionTabs.map((tab) => (
          <button
            className={activeSection === tab ? 'tab-button active' : 'tab-button'}
            key={tab}
            type="button"
            onClick={() => setActiveSection(tab)}
          >
            {tab}
          </button>
        ))}
      </section>

      {activeSection === 'Gruppspel' ? (
        <GroupsFixturesCard
          fixtureTips={fixtureTips}
          savedFixtureTips={savedFixtureTips}
          groupPlacements={groupPlacements}
          expandedManualEditor={expandedManualEditor}
          toggleManualEditor={toggleManualEditor}
          onChangeTip={onChangeTip}
          onSetScorePreset={onSetScorePreset}
          onChangeGroupPlacement={onChangeGroupPlacement}
          isSaving={isSaving}
          isGlobalLockActive={isGlobalLockActive}
        />
      ) : null}

      {activeSection === 'Slutspel' ? (
        <KnockoutRoundsCard
          knockoutPredictions={knockoutPredictions}
          groupPlacements={groupPlacements}
          activeKnockoutField={activeKnockoutField}
          setActiveKnockoutField={setActiveKnockoutField}
          onChangeKnockoutPrediction={onChangeKnockoutPrediction}
          isSaving={isSaving}
          isGlobalLockActive={isGlobalLockActive}
          isTouchDevice={isTouchDevice}
          enableKnockoutTypeahead={enableKnockoutTypeahead}
        />
      ) : null}

      {activeSection === 'Extrafrågor' ? (
        <>
          {(['Gruppspelsfrågor', 'Slutspelsfrågor', 'Turneringsfrågor', '33-33-33 frågor'] as const).map((category) => {
            const categoryQuestions = publishedQuestions.filter((q) => q.category === category)
            if (categoryQuestions.length === 0) return null
            return (
              <section className="panel" key={category}>
                <div className="section-heading compact">
                  <p className="eyebrow">Extrafrågor</p>
                  <h2>{category}</h2>
                </div>
                <div className="stacked-cards">
                  {categoryQuestions.map((question) => {
                    const isLocked = isGlobalLockActive
                    const selectedAnswer = extraAnswers[String(question.id)] ?? ''
                    return (
                      <article className="mini-card" key={question.id}>
                        <span className="mini-label">{question.questionText}</span>
                        <span className="status-note">Låstid: {globalDeadlineLabel}</span>
                        {question.options.length > 10 ? (
                          <SearchableCombobox
                            options={question.options}
                            value={selectedAnswer}
                            onChange={(val) => onChangeExtraAnswer(question.id, val)}
                            placeholder="Sök spelare…"
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
                  })}
                </div>
              </section>
            )
          })}
        </>
      ) : null}

      <section className="action-bar">
        <button className="ghost-button" type="button" onClick={() => { if (window.confirm('Vill du verkligen rensa alla sparade tips? Detta kan inte ångras.')) { onClear() } }} disabled={isSaving || isGlobalLockActive}>Rensa sparade</button>
        {hasUnsavedChanges && <span className="save-pill unsaved">Osparade ändringar</span>}
        <span className="save-pill">{saveMessage}</span>
        <button className="primary-button" type="button" onClick={onSave} disabled={isSaving || isGlobalLockActive}>
          {isSaving ? 'Sparar...' : 'Spara'}
        </button>
      </section>
    </div>
  )
}