import { categoryItems, summaryCards } from '../constants'
import type {
    AdminQuestion,
    ExtraAnswers,
    FixtureTip,
    GroupPlacement,
    KnockoutPredictionRound,
    LeaderboardEntry,
    ParticipantSession,
    SimulationStatus,
} from '../types'

type StartPageProps = {
    participant: ParticipantSession | null
    leaderboard: LeaderboardEntry[]
    tipsSaveMessage: string
    phase: 'B' | 'C'
    fixtureTips: FixtureTip[]
    groupPlacements: GroupPlacement[]
    knockoutPredictions: KnockoutPredictionRound[]
    extraAnswers: ExtraAnswers
    publishedQuestions: AdminQuestion[]
    simulationStatus: SimulationStatus
}

function getMedalEmoji(rank: number): string {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return ''
}

export function StartPage({
    participant,
    leaderboard,
    tipsSaveMessage,
    phase,
    fixtureTips,
    groupPlacements,
    knockoutPredictions,
    extraAnswers,
    publishedQuestions,
    simulationStatus,
}: StartPageProps) {
    const currentEntry = participant
        ? leaderboard.find((entry) => entry.participantId === participant.participantId) ?? null
        : null
    const isTrackingPhase = phase === 'C'

    const filledFixtures = fixtureTips.filter((t) => t.sign !== '').length
    const totalFixtures = fixtureTips.length
    const filledGroups = groupPlacements.filter((g) => g.picks.every((p) => p.trim() !== '')).length
    const totalGroups = groupPlacements.length
    const filledKnockout = knockoutPredictions.reduce((acc, r) => acc + r.picks.filter((p) => p.trim() !== '').length, 0)
    const totalKnockout = knockoutPredictions.reduce((acc, r) => acc + r.picks.length, 0)
    const filledExtra = publishedQuestions.filter((q) => extraAnswers[String(q.id)]?.trim()).length
    const totalExtra = publishedQuestions.length
    const totalFilled = filledFixtures + filledGroups + filledKnockout + filledExtra
    const grandTotal = totalFixtures + totalGroups + totalKnockout + totalExtra
    const overallPct = grandTotal > 0 ? Math.round((totalFilled / grandTotal) * 100) : 0
    const progressItems = [
        { label: 'Gruppspel', filled: filledFixtures, total: totalFixtures },
        { label: 'Grupplaceringar', filled: filledGroups, total: totalGroups },
        { label: 'Slutspel', filled: filledKnockout, total: totalKnockout },
        { label: 'Extrafrågor', filled: filledExtra, total: totalExtra },
    ]

    const leader = leaderboard.length > 0 ? leaderboard[0] : null
    const simulationStatusLabel = simulationStatus.updatedAt
        ? new Date(simulationStatus.updatedAt).toLocaleString('sv-SE')
        : null

    return (
        <div className="page-stack">
            {/* Header */}
            <section className="panel panel-sticky-head page-hero">
                <div>
                    <p className="eyebrow">Start</p>
                    <h1 className="section-title">{isTrackingPhase ? 'VM 2026' : 'Lägg dina tips för VM 2026'}</h1>
                    <p className="lead-text" style={{ margin: 0 }}>
                        {isTrackingPhase
                            ? 'Turneringen är igång — följ topplistan och se hur dina tips håller måttet.'
                            : 'Allt du behöver finns samlat här: lämna tips, följ dina framsteg och håll koll på vad som låser härnäst.'}
                    </p>
                </div>
                <span className="save-pill">{participant ? (isTrackingPhase ? 'Turnering pågår' : tipsSaveMessage) : 'Inte inloggad'}</span>
            </section>

            <section className="panel">
                <div className="section-heading compact">
                    <p className="eyebrow">QA-status</p>
                    <h2>Senast körda testscript</h2>
                </div>
                {simulationStatus.displayCommand ? (
                    <>
                        <p className="lead-text" style={{ marginBottom: 8 }}>{simulationStatus.displayCommand}</p>
                        <p className="status-note" style={{ margin: 0 }}>
                            {simulationStatusLabel ? `Körd: ${simulationStatusLabel}` : 'Körtid saknas'}
                        </p>
                    </>
                ) : (
                    <p className="status-note">Inget lifecycle-testscript har loggats ännu.</p>
                )}
            </section>

            {/* Phase C: Tournament dashboard */}
            {isTrackingPhase && (
                <>
                    {/* Personal highlight card */}
                    {currentEntry && (
                        <section className="lb-highlight">
                            <div className="lb-highlight-cell">
                                <span className="lb-highlight-pos">{currentEntry.positionLabel}</span>
                                <span className="lb-highlight-label">Din placering</span>
                            </div>
                            <div className="lb-highlight-cell">
                                <span className="lb-highlight-value">{currentEntry.totalPoints}</span>
                                <span className="lb-highlight-label">poäng</span>
                            </div>
                            <div className="lb-highlight-cell">
                                <span className="lb-highlight-value">{currentEntry.settledMatches}</span>
                                <span className="lb-highlight-label">avgjorda matcher</span>
                            </div>
                        </section>
                    )}

                    {/* Leaderboard */}
                    <section className="panel lb-panel">
                        <div className="section-heading compact">
                            <p className="eyebrow">Topplista</p>
                            <h2>Aktuell ställning</h2>
                        </div>

                        {leaderboard.length === 0 ? (
                            <p className="status-note">Ingen poängställning ännu.</p>
                        ) : (
                            <>
                                {/* Leader spotlight */}
                                {leader && (
                                    <div className="lb-leader-spot">
                                        <span className="lb-leader-medal">🥇</span>
                                        <div className="lb-leader-info">
                                            <span className="lb-leader-name">{leader.name}</span>
                                            <span className="lb-leader-pts">{leader.totalPoints} poäng</span>
                                        </div>
                                    </div>
                                )}

                                {/* Full ranking table */}
                                <div className="lb-table-wrap">
                                    <table className="lb-table">
                                        <thead>
                                            <tr>
                                                <th className="lb-th-rank">#</th>
                                                <th className="lb-th-name">Namn</th>
                                                <th className="lb-th-pts">Poäng</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {leaderboard.map((entry) => {
                                                const isMe = entry.participantId === participant?.participantId
                                                const medal = getMedalEmoji(entry.rank)
                                                return (
                                                    <tr
                                                        key={entry.participantId}
                                                        className={isMe ? 'lb-row lb-row-me' : 'lb-row'}
                                                    >
                                                        <td className={medal ? 'lb-medal' : 'lb-rank'}>
                                                            {medal || entry.positionLabel}
                                                        </td>
                                                        <td className="lb-name">
                                                            {entry.name}
                                                            {isMe && <span className="lb-you-badge">Du</span>}
                                                        </td>
                                                        <td className="lb-pts">{entry.totalPoints}</td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </section>
                </>
            )}

            {/* Phase B: Prediction entry workflow (unchanged) */}
            {!isTrackingPhase && (
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

                    <section className="panel">
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
                    </section>
                </>
            )}
        </div>
    )
}