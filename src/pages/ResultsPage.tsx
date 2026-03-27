import { useState, type ReactNode } from 'react'
import type {
  LeaderboardEntry,
  MatchResult,
  MatchResultStage,
  MatchResultStatus,
  ParticipantScoreDetail,
  ParticipantSession,
  SpecialResultsState,
} from '../types'
import {
  formatDateTimeLabel,
  formatExtraReason,
  formatFixtureReason,
  formatGroupReason,
  formatMatchResultStatusLabel,
  formatPositionsMeta,
  formatRoundReason,
  formatSpecialReason,
  formatTeamsMeta,
  getReasonTone,
} from '../utils'

export function ParticipantScorePanel({
  eyebrow,
  title,
  participantScoreDetail,
  isLoading,
  controls,
}: {
  eyebrow: string
  title: string
  participantScoreDetail: ParticipantScoreDetail | null
  isLoading: boolean
  controls?: ReactNode
}) {
  const settledFixtureEntries = participantScoreDetail?.breakdown.filter((entry) => entry.reason !== 'unsettled') ?? []
  const settledGroupEntries = participantScoreDetail?.groupPlacementBreakdown.filter((entry) => entry.reason !== 'unsettled-group') ?? []
  const settledKnockoutEntries = participantScoreDetail?.knockoutBreakdown.filter((entry) => entry.reason !== 'unsettled-round') ?? []
  const settledSpecialEntries = participantScoreDetail?.specialBreakdown.filter((entry) => entry.settled) ?? []
  const settledExtraEntries = participantScoreDetail?.extraBreakdown.filter((entry) => entry.settled) ?? []

  return (
    <section className="panel">
      <div className="section-heading compact">
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
      </div>

      {controls}

      {isLoading ? (
        <p className="status-note">Laddar poängdetaljer...</p>
      ) : !participantScoreDetail ? (
        <p className="status-note">Ingen poängdata tillgänglig ännu.</p>
      ) : (
        <>
          <div className="stats-grid">
            <article className="mini-card">
              <span className="mini-label">Totalpoäng</span>
              <strong>{participantScoreDetail.totalPoints} p</strong>
              <span className="status-note">Placering: {participantScoreDetail.positionLabel ?? '-'}</span>
            </article>
            <article className="mini-card">
              <span className="mini-label">Gruppspel</span>
              <strong>{participantScoreDetail.fixturePoints} p</strong>
              <span className="status-note">Avgjorda matcher: {participantScoreDetail.settledMatches}</span>
            </article>
            <article className="mini-card">
              <span className="mini-label">Gruppplaceringar</span>
              <strong>{participantScoreDetail.groupPlacementPoints} p</strong>
              <span className="status-note">Avgjorda grupper: {participantScoreDetail.settledGroups}</span>
            </article>
            <article className="mini-card">
              <span className="mini-label">Slutspel</span>
              <strong>{participantScoreDetail.knockoutPoints} p</strong>
              <span className="status-note">Avgjorda rundor: {participantScoreDetail.settledKnockoutRounds}</span>
            </article>
            <article className="mini-card">
              <span className="mini-label">Special</span>
              <strong>{participantScoreDetail.specialPoints} p</strong>
              <span className="status-note">Avgjorda special: {participantScoreDetail.settledSpecialPredictions}</span>
            </article>
            <article className="mini-card">
              <span className="mini-label">Extrafrågor</span>
              <strong>{participantScoreDetail.extraQuestionPoints} p</strong>
              <span className="status-note">Avgjorda frågor: {participantScoreDetail.settledQuestions}</span>
            </article>
          </div>

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

          <details className="accordion-card">
            <summary>
              <strong>Avgjorda gruppplaceringar</strong>
              <span className="count-badge">{settledGroupEntries.length}</span>
            </summary>
            {settledGroupEntries.length === 0 ? (
              <p>Inga avgjorda gruppplaceringar ännu.</p>
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

          <details className="accordion-card">
            <summary>
              <strong>Avgjorda special</strong>
              <span className="count-badge">{settledSpecialEntries.length}</span>
            </summary>
            {settledSpecialEntries.length === 0 ? (
              <p>Inga avgjorda specialprediktioner ännu.</p>
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
              </ul>
            )}
          </details>

          <details className="accordion-card">
            <summary>
              <strong>Avgjorda extrafrågor</strong>
              <span className="count-badge">{settledExtraEntries.length}</span>
            </summary>
            {settledExtraEntries.length === 0 ? (
              <p>Inga avgjorda extrafrågor ännu.</p>
            ) : (
              <ul className="score-breakdown-list">
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
        </>
      )}
    </section>
  )
}

export function ResultsPage({
  participant,
  leaderboard,
  participantScoreDetail,
  isParticipantScoreLoading,
  results,
  specialResults,
  isResultsLoading,
}: {
  participant: ParticipantSession | null
  leaderboard: LeaderboardEntry[]
  participantScoreDetail: ParticipantScoreDetail | null
  isParticipantScoreLoading: boolean
  results: MatchResult[]
  specialResults: SpecialResultsState
  isResultsLoading: boolean
}) {
  const [activeStage, setActiveStage] = useState<'all' | MatchResultStage>('all')
  const [activeStatus, setActiveStatus] = useState<'all' | MatchResultStatus>('all')
  const displayedResults = results
  const displayedSpecialResults = specialResults
  const displayedParticipantScoreDetail = participantScoreDetail
  const showResultsLoading = isResultsLoading
  const showParticipantScoreLoading = isParticipantScoreLoading

  const currentEntry = participant
    ? leaderboard.find((entry) => entry.participantId === participant.participantId) ?? null
    : null
  const displayedPositionLabel = displayedParticipantScoreDetail?.positionLabel ?? currentEntry?.positionLabel ?? '-'
  const displayedTotalPoints =
    displayedParticipantScoreDetail?.totalPoints ?? currentEntry?.totalPoints ?? 0

  const filteredResults = displayedResults.filter((entry) => {
    if (activeStage !== 'all' && entry.stage !== activeStage) {
      return false
    }

    if (activeStatus !== 'all' && entry.resultStatus !== activeStatus) {
      return false
    }

    return true
  })

  const liveCount = displayedResults.filter((entry) => entry.resultStatus === 'live').length
  const completedCount = displayedResults.filter((entry) => entry.resultStatus === 'completed').length
  const plannedCount = displayedResults.filter((entry) => entry.resultStatus === 'planned').length

  return (
    <div className="page-stack">
      <section className="panel panel-sticky-head page-hero">
        <div>
          <p className="eyebrow">Resultat & poäng</p>
          <h1 className="section-title">Matchläge och din poäng just nu</h1>
          <p className="lead-text" style={{ margin: 0 }}>
            Följ officiella matchresultat, specialutfall och hur de påverkar din nuvarande ställning.
          </p>
        </div>
        <span className="save-pill">{displayedPositionLabel} · {displayedTotalPoints} p</span>
      </section>

      <section className="start-stats-row">
        <div className="start-stat">
          <span>Din placering</span>
          <strong>{displayedPositionLabel}</strong>
        </div>
        <div className="start-stat">
          <span>Totalpoäng</span>
          <strong>{displayedTotalPoints} p</strong>
        </div>
        <div className="start-stat">
          <span>Avgjorda matcher</span>
          <strong>{completedCount}</strong>
        </div>
      </section>

      <section className="summary-grid">
        <article className="summary-card">
          <h2>{liveCount}</h2>
          <p>Live just nu</p>
        </article>
        <article className="summary-card">
          <h2>{completedCount}</h2>
          <p>Slutförda matcher</p>
        </article>
        <article className="summary-card">
          <h2>{plannedCount}</h2>
          <p>Planerade matcher</p>
        </article>
      </section>

      <section className="panel results-panel">
        <div className="section-heading compact">
          <p className="eyebrow">Matcher</p>
          <h2>Officiella resultat</h2>
        </div>

        <div className="results-toolbar">
          <div className="tab-row" aria-label="Filtrera steg">
            {[
              { value: 'all', label: 'Alla' },
              { value: 'group', label: 'Gruppspel' },
              { value: 'knockout', label: 'Slutspel' },
            ].map((option) => (
              <button
                className={activeStage === option.value ? 'tab-button active' : 'tab-button'}
                key={option.value}
                type="button"
                onClick={() => setActiveStage(option.value as 'all' | MatchResultStage)}
              >
                {option.label}
              </button>
            ))}
          </div>

          <label className="form-group results-select-group">
            <span>Status</span>
            <select value={activeStatus} onChange={(e) => setActiveStatus(e.target.value as 'all' | MatchResultStatus)}>
              <option value="all">Alla statusar</option>
              <option value="planned">Planerad</option>
              <option value="live">Live</option>
              <option value="completed">Slut</option>
            </select>
          </label>
        </div>

        {showResultsLoading ? (
          <p className="status-note">Laddar officiella resultat...</p>
        ) : filteredResults.length === 0 ? (
          <p className="status-note">Inga matcher matchar filtret ännu.</p>
        ) : (
          <div className="results-grid">
            {filteredResults.map((entry) => {
              const scoreline =
                entry.homeScore === null || entry.awayScore === null ? 'Ej avgjord ännu' : `${entry.homeScore}-${entry.awayScore}`

              return (
                <article className="result-card" key={entry.matchId}>
                  <div className="result-card-header">
                    <div>
                      <span className="mini-label">{entry.stage === 'group' ? entry.groupCode ? `Grupp ${entry.groupCode}` : 'Gruppspel' : entry.round ?? 'Slutspel'}</span>
                      <strong>{entry.homeTeam} - {entry.awayTeam}</strong>
                    </div>
                    <span className={`result-status-pill ${entry.resultStatus}`}>{formatMatchResultStatusLabel(entry.resultStatus)}</span>
                  </div>

                  <div className="result-scoreline-row">
                    <span className="result-scoreline">{scoreline}</span>
                    <span className="status-note">Avspark: {formatDateTimeLabel(entry.kickoffAt)}</span>
                  </div>

                  <div className="result-card-meta">
                    <span>Match-ID: {entry.matchId}</span>
                    <span>Senast uppdaterad: {formatDateTimeLabel(entry.updatedAt)}</span>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      <section className="panel">
        <div className="section-heading compact">
          <p className="eyebrow">Special</p>
          <h2>Avgjorda specialutfall</h2>
        </div>

        <div className="stats-grid">
          <article className="mini-card">
            <span className="mini-label">Slutsegrare</span>
            <strong>{displayedSpecialResults.winner || 'Inte satt ännu'}</strong>
          </article>
          <article className="mini-card">
            <span className="mini-label">Skytteligavinnare</span>
            <strong>{displayedSpecialResults.topScorer || 'Inte satt ännu'}</strong>
          </article>
          <article className="mini-card">
            <span className="mini-label">Senast uppdaterad</span>
            <strong>{formatDateTimeLabel(displayedSpecialResults.updatedAt)}</strong>
          </article>
        </div>
      </section>

      <section className="panel">
        <div className="section-heading compact">
          <p className="eyebrow">Om poängvyn</p>
          <h2>Varför syns poäng även i Mina tips?</h2>
        </div>
        <div className="lock-warning">
          <ul>
            <li><strong>Mina tips</strong> visar vad du har lämnat in.</li>
            <li><strong>Resultat & poäng</strong> visar officiella utfall och hur de påverkar samma personliga poängdata.</li>
            <li>Poängen hämtas från samma källa, men visas i två olika sammanhang för snabbare uppföljning.</li>
          </ul>
        </div>
      </section>

      <ParticipantScorePanel
        eyebrow="Poäng"
        title="Din poängöversikt"
        participantScoreDetail={displayedParticipantScoreDetail}
        isLoading={showParticipantScoreLoading}
      />
    </div>
  )
}