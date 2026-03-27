import { useState } from 'react'
import type {
  AdminQuestion,
  ExtraAnswers,
  FixtureTip,
  GroupPlacement,
  KnockoutPredictionRound,
  MyTipsSectionTab,
  ParticipantScoreDetail,
  SpecialPredictions,
} from '../types'
import { myTipsSectionTabs } from '../types'
import { ParticipantScorePanel } from './ResultsPage'

export function MyTipsPage({
  fixtureTips,
  groupPlacements,
  knockoutPredictions,
  specialPredictions,
  extraAnswers,
  publishedQuestions,
  participantScoreDetail,
  isParticipantScoreLoading,
  lastSavedLabel,
  phase,
}: {
  fixtureTips: FixtureTip[]
  groupPlacements: GroupPlacement[]
  knockoutPredictions: KnockoutPredictionRound[]
  specialPredictions: SpecialPredictions
  extraAnswers: ExtraAnswers
  publishedQuestions: AdminQuestion[]
  participantScoreDetail: ParticipantScoreDetail | null
  isParticipantScoreLoading: boolean
  lastSavedLabel: string
  phase: 'B' | 'C'
}) {
  const [activeSection, setActiveSection] = useState<MyTipsSectionTab>('Gruppspel')
  const displayedScoreDetail = participantScoreDetail
  const showLoadingState = isParticipantScoreLoading
  const showScorePanel = phase === 'C'

  const extraQuestionItems = publishedQuestions
    .map((question) => {
      const chosen = extraAnswers[String(question.id)]
      if (!chosen) {
        return null
      }
      return `${question.questionText}: ${chosen}`
    })
    .filter((item): item is string => item !== null)

  return (
    <div className="page-stack">
      <section className="panel panel-sticky-head">
        <div>
          <p className="eyebrow">Mina tips</p>
          <h1 className="section-title">Dina inskickade tips</h1>
        </div>
        <span className="save-pill">{lastSavedLabel}</span>
      </section>

      <p className="lead-text" style={{ padding: '0 4px' }}>Här ser du exakt vad du har skickat in. Tips med status Låst kan inte redigeras.</p>

      {showScorePanel && (
        <ParticipantScorePanel
          eyebrow="Poäng"
          title="Din poängöversikt"
          participantScoreDetail={displayedScoreDetail}
          isLoading={showLoadingState}
        />
      )}

      <section className="tab-row" aria-label="Sektioner">
        {myTipsSectionTabs.map((tab) => (
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

      {activeSection === 'Gruppspel' && (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Match</th>
                <th>Datum/tid</th>
                <th>Resultat</th>
                <th>1/X/2</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {fixtureTips.map((row) => (
                <tr key={row.match}>
                  <td data-label="Match">{row.match}</td>
                  <td data-label="Datum/tid">{row.date}</td>
                  <td data-label="Resultat">{row.homeScore === '' || row.awayScore === '' ? '—' : `${row.homeScore}-${row.awayScore}`}</td>
                  <td data-label="1/X/2">{row.sign || '—'}</td>
                  <td data-label="Status">
                    <span className={row.status === 'Låst' ? 'status-badge locked' : 'status-badge'}>
                      {row.status === 'Låst' ? 'Låst' : 'Ändringsbar'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeSection === 'Grupplaceringar' && (
        <section className="panel">
          <ul>
            {groupPlacements.map((group) => (
              <li key={group.group}>{group.group}: {group.picks.join(', ')}</li>
            ))}
          </ul>
        </section>
      )}

      {activeSection === 'Slutspel' && (
        <section className="panel">
          <ul>
            {knockoutPredictions.map((round) => (
              <li key={round.title}>{round.title}: {round.picks.join(', ')}</li>
            ))}
          </ul>
        </section>
      )}

      {activeSection === 'Extrafrågor' && (
        <section className="panel">
          <ul>
            <li>Slutsegrare: {specialPredictions.winner || '—'}</li>
            <li>Skytteligavinnare: {specialPredictions.topScorer || '—'}</li>
          </ul>
          {extraQuestionItems.length > 0 ? (
            <ul>
              {extraQuestionItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <p>Inga extrafrågor besvarade ännu.</p>
          )}
        </section>
      )}
    </div>
  )
}
