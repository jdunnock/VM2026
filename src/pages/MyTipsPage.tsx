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
import {
  formatExtraReason,
  formatFixtureReason,
  formatGroupReason,
  formatPositionsMeta,
  formatRoundReason,
  formatSpecialReason,
  formatTeamsMeta,
  getReasonTone,
} from '../utils'

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

  const psd = participantScoreDetail
  const settledFixtureEntries = psd?.breakdown.filter((e) => e.reason !== 'unsettled') ?? []
  const settledGroupEntries = psd?.groupPlacementBreakdown.filter((e) => e.reason !== 'unsettled-group') ?? []
  const settledKnockoutEntries = psd?.knockoutBreakdown.filter((e) => e.reason !== 'unsettled-round') ?? []
  const settledSpecialEntries = psd?.specialBreakdown.filter((e) => e.settled) ?? []
  const settledExtraEntries = psd?.extraBreakdown.filter((e) => e.settled) ?? []

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
      <section className="panel panel-sticky-head page-hero">
        <div>
          <p className="eyebrow">Mina tips</p>
          <h1 className="section-title">Dina inskickade tips</h1>
          <p className="lead-text" style={{ margin: 0 }}>Här ser du exakt vad du har skickat in. Tips med status Låst kan inte redigeras.</p>
        </div>
        <span className="save-pill">{lastSavedLabel}</span>
      </section>

      {phase === 'C' && psd && (
        <section className="panel start-stats-row">
          <article className="mini-card">
            <span className="mini-label">Totalpoäng</span>
            <strong>{psd.totalPoints} p</strong>
            <span className="status-note">Placering: {psd.positionLabel ?? '-'}</span>
          </article>
          <article className="mini-card">
            <span className="mini-label">Gruppspel</span>
            <strong>{psd.fixturePoints} p</strong>
          </article>
          <article className="mini-card">
            <span className="mini-label">Grupplaceringar</span>
            <strong>{psd.groupPlacementPoints} p</strong>
          </article>
          <article className="mini-card">
            <span className="mini-label">Slutspel</span>
            <strong>{psd.knockoutPoints} p</strong>
          </article>
          <article className="mini-card">
            <span className="mini-label">Extrafrågor</span>
            <strong>{psd.specialPoints + psd.extraQuestionPoints} p</strong>
          </article>
        </section>
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
        <section className="panel">
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
        {phase === 'C' && (
          <details className="accordion-card">
            <summary>
              <strong>Avgjorda gruppspelsmatcher</strong>
              <span className="count-badge">{settledFixtureEntries.length}</span>
            </summary>
            {settledFixtureEntries.length === 0 ? (
              <p>Inga avgjorda gruppspelsmatcher ännu.</p>
            ) : (
              <ul className="score-breakdown-list">
                {settledFixtureEntries.map((entry) => (
                  <li className="score-breakdown-item" key={`${entry.matchId ?? entry.match}-${entry.reason}`}>
                    <div className="score-breakdown-main">
                      <strong>{entry.match}</strong>
                      <div className="score-breakdown-badges">
                        <span className={entry.points > 0 ? 'points-badge' : 'points-badge zero'}>{entry.points} p</span>
                        <span className={`reason-badge ${getReasonTone(entry.reason)}`}>{formatFixtureReason(entry.reason)}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </details>
        )}
        </section>
      )}

      {activeSection === 'Grupplaceringar' && (
        <section className="panel">
          <ul>
            {groupPlacements.map((group) => (
              <li key={group.group}>{group.group}: {group.picks.join(', ')}</li>
            ))}
          </ul>
          {phase === 'C' && (
            <details className="accordion-card">
              <summary>
                <strong>Avgjorda grupplaceringar</strong>
                <span className="count-badge">{settledGroupEntries.length}</span>
              </summary>
              {settledGroupEntries.length === 0 ? (
                <p>Inga avgjorda grupplaceringar ännu.</p>
              ) : (
                <ul className="score-breakdown-list">
                  {settledGroupEntries.map((entry) => (
                    <li className="score-breakdown-item" key={`${entry.group}-${entry.points}`}>
                      <div className="score-breakdown-main">
                        <strong>{entry.group}</strong>
                        <div className="score-breakdown-badges">
                          <span className={entry.points > 0 ? 'points-badge' : 'points-badge zero'}>{entry.points} p</span>
                          <span className={`reason-badge ${getReasonTone(entry.reason)}`}>{formatGroupReason(entry.reason, entry.matchedPositions)}</span>
                        </div>
                      </div>
                      {formatPositionsMeta(entry.matchedPositions) ? (
                        <span className="score-breakdown-meta">{formatPositionsMeta(entry.matchedPositions)}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </details>
          )}
        </section>
      )}

      {activeSection === 'Slutspel' && (
        <section className="panel">
          <ul>
            {knockoutPredictions.map((round) => (
              <li key={round.title}>{round.title}: {round.picks.join(', ')}</li>
            ))}
          </ul>
          {phase === 'C' && (
            <details className="accordion-card">
              <summary>
                <strong>Avgjorda slutspel</strong>
                <span className="count-badge">{settledKnockoutEntries.length}</span>
              </summary>
              {settledKnockoutEntries.length === 0 ? (
                <p>Inga avgjorda slutspelsprediktioner ännu.</p>
              ) : (
                <ul className="score-breakdown-list">
                  {settledKnockoutEntries.map((entry) => (
                    <li className="score-breakdown-item" key={`${entry.round}-${entry.points}`}>
                      <div className="score-breakdown-main">
                        <strong>{entry.round}</strong>
                        <div className="score-breakdown-badges">
                          <span className={entry.points > 0 ? 'points-badge' : 'points-badge zero'}>{entry.points} p</span>
                          <span className={`reason-badge ${getReasonTone(entry.reason)}`}>{formatRoundReason(entry.reason, entry.matchedTeams)}</span>
                        </div>
                      </div>
                      {formatTeamsMeta(entry.matchedTeams) ? <span className="score-breakdown-meta">{formatTeamsMeta(entry.matchedTeams)}</span> : null}
                    </li>
                  ))}
                </ul>
              )}
            </details>
          )}
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
          {phase === 'C' && (
            <details className="accordion-card">
              <summary>
                <strong>Avgjorda extrafrågor</strong>
                <span className="count-badge">{settledSpecialEntries.length + settledExtraEntries.length}</span>
              </summary>
              {settledSpecialEntries.length === 0 && settledExtraEntries.length === 0 ? (
                <p>Inga avgjorda extrafrågor ännu.</p>
              ) : (
                <ul className="score-breakdown-list">
                  {settledSpecialEntries.map((entry) => (
                    <li className="score-breakdown-item" key={entry.key}>
                      <div className="score-breakdown-main">
                        <strong>{entry.label}</strong>
                        <div className="score-breakdown-badges">
                          <span className={entry.points > 0 ? 'points-badge' : 'points-badge zero'}>{entry.points} p</span>
                          <span className={`reason-badge ${getReasonTone(entry.reason)}`}>{formatSpecialReason(entry.reason)}</span>
                        </div>
                      </div>
                    </li>
                  ))}
                  {settledExtraEntries.map((entry) => (
                    <li className="score-breakdown-item" key={`${entry.questionId ?? 'unknown'}-${entry.points}`}>
                      <div className="score-breakdown-main">
                        <strong>{entry.questionText ?? 'Fråga'}</strong>
                        <div className="score-breakdown-badges">
                          <span className={entry.points > 0 ? 'points-badge' : 'points-badge zero'}>{entry.points} p</span>
                          <span className={`reason-badge ${getReasonTone(entry.reason)}`}>{formatExtraReason(entry.reason)}</span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </details>
          )}
        </section>
      )}
    </div>
  )
}
