import { categoryItems, summaryCards } from '../constants'
import type {
  AdminQuestion,
  ExtraAnswers,
  FixtureTip,
  GroupPlacement,
  KnockoutPredictionRound,
  LeaderboardEntry,
  ParticipantSession,
  SpecialPredictions,
} from '../types'

type StartPageProps = {
  participant: ParticipantSession | null
  leaderboard: LeaderboardEntry[]
  tipsSaveMessage: string
  phase: 'B' | 'C'
  fixtureTips: FixtureTip[]
  groupPlacements: GroupPlacement[]
  knockoutPredictions: KnockoutPredictionRound[]
  specialPredictions: SpecialPredictions
  extraAnswers: ExtraAnswers
  publishedQuestions: AdminQuestion[]
}

export function StartPage({
  participant,
  leaderboard,
  tipsSaveMessage,
  phase,
  fixtureTips,
  groupPlacements,
  knockoutPredictions,
  specialPredictions,
  extraAnswers,
  publishedQuestions,
}: StartPageProps) {
  const currentEntry = participant
    ? leaderboard.find((entry) => entry.participantId === participant.participantId) ?? null
    : null
  const topEntries = leaderboard.slice(0, 5)
  const isTrackingPhase = phase === 'C'

  const filledFixtures = fixtureTips.filter((t) => t.sign !== '').length
  const totalFixtures = fixtureTips.length
  const filledGroups = groupPlacements.filter((g) => g.picks.every((p) => p.trim() !== '')).length
  const totalGroups = groupPlacements.length
  const filledKnockout = knockoutPredictions.reduce((acc, r) => acc + r.picks.filter((p) => p.trim() !== '').length, 0)
  const totalKnockout = knockoutPredictions.reduce((acc, r) => acc + r.picks.length, 0)
  const filledSpecial = (specialPredictions.winner.trim() ? 1 : 0) + (specialPredictions.topScorer.trim() ? 1 : 0)
  const totalSpecial = 2
  const filledExtra = publishedQuestions.filter((q) => extraAnswers[String(q.id)]?.trim()).length
  const totalExtra = publishedQuestions.length
  const totalFilled = filledFixtures + filledGroups + filledKnockout + filledSpecial + filledExtra
  const grandTotal = totalFixtures + totalGroups + totalKnockout + totalSpecial + totalExtra
  const overallPct = grandTotal > 0 ? Math.round((totalFilled / grandTotal) * 100) : 0
  const progressItems = [
    { label: 'Gruppspel', filled: filledFixtures, total: totalFixtures },
    { label: 'Gruppplaceringar', filled: filledGroups, total: totalGroups },
    { label: 'Slutspel', filled: filledKnockout, total: totalKnockout },
    { label: 'Special', filled: filledSpecial, total: totalSpecial },
    { label: 'Extrafrågor', filled: filledExtra, total: totalExtra },
  ]

  const renderLeaderboard = () => {
    if (topEntries.length === 0) {
      return <p className="status-note">Ingen poängställning ännu.</p>
    }

    return (
      <ul className="updates-list">
        {topEntries.map((entry) => (
          <li key={entry.participantId}>
            <strong>{entry.positionLabel}</strong> {entry.name} - {entry.totalPoints} p
          </li>
        ))}
      </ul>
    )
  }

  return (
    <div className="page-stack">
      <section className="panel panel-split start-overview">
        <div>
          <div className="section-heading compact">
            <p className="eyebrow">Start</p>
            <h1>{isTrackingPhase ? 'Följ VM 2026' : 'Lägg dina tips för VM 2026'}</h1>
          </div>
          <p className="lead-text">
            {isTrackingPhase
              ? 'Turneringen är igång. Följ topplistan och din aktuella placering här.'
              : 'Allt du behöver finns samlat här: lämna tips, följ dina framsteg och håll koll på vad som låser härnäst.'}
          </p>
        </div>
        <div className="start-stats">
          <div className="start-stat">
            <span>Din placering</span>
            <strong>{currentEntry ? currentEntry.positionLabel : '-'}</strong>
          </div>
          <div className="start-stat">
            <span>Dina poäng</span>
            <strong>{currentEntry ? `${currentEntry.totalPoints} p` : '0 p'}</strong>
          </div>
          <div className="start-stat">
            <span>Status</span>
            <strong>{participant ? (isTrackingPhase ? 'Turnering pågår' : tipsSaveMessage) : 'Inte inloggad'}</strong>
          </div>
        </div>
      </section>

      {!isTrackingPhase ? (
        <>
          <section className="summary-grid">
            {summaryCards.map((card) => (
              <article className="summary-card" key={card.title}>
                <h2>{card.title}</h2>
                <p>{card.detail}</p>
              </article>
            ))}
          </section>

          <section className="panel">
            <div className="section-heading">
              <p className="eyebrow">Kategorier</p>
              <h2>Det här kan du tippa</h2>
            </div>
            <div className="category-grid">
              {categoryItems.map((item) => (
                <div className="category-chip" key={item.label}>
                  <span className="chip-count">{item.count}</span>
                  {item.label}
                </div>
              ))}
            </div>
          </section>

          <section className="panel panel-split">
            <div>
              <div className="section-heading">
                <p className="eyebrow">Framsteg</p>
                <h2>Du har fyllt i: {overallPct}%</h2>
                <p className="tips-total">{totalFilled} av {grandTotal} tips inskickade</p>
              </div>
              <div className="progress-list">
                {progressItems.map((item) => {
                  const pct = item.total > 0 ? Math.round((item.filled / item.total) * 100) : 0
                  return (
                    <div className="progress-row" key={item.label}>
                      <div className="progress-label">
                        <span>{item.label}</span>
                        <strong>{pct}%</strong>
                      </div>
                      <div className="progress-track">
                        <div className="progress-fill" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="updates-card">
              <div className="section-heading compact">
                <p className="eyebrow">Topplista</p>
                <h2>Aktuell ställning</h2>
              </div>
              {renderLeaderboard()}
            </div>
          </section>
        </>
      ) : (
        <section className="panel">
          <div className="section-heading compact">
            <p className="eyebrow">Topplista</p>
            <h2>Aktuell ställning</h2>
            <p className="status-note">Prediktioner är låsta. Startsidan visar nu bara turneringsläge och poängstatus.</p>
          </div>
          {renderLeaderboard()}
        </section>
      )}
    </div>
  )
}