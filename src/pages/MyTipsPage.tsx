import { useState } from 'react'
import { fixtureCounts } from '../fixtures'
import type {
    AdminQuestion,
    ExtraAnswers,
    FixtureTip,
    GroupPlacement,
    KnockoutPredictionRound,
    LeaderboardEntry,
    MyTipsSectionTab,
    ParticipantScoreDetail,
    ParticipantSession,
} from '../types'
import { myTipsSectionTabs } from '../types'
import {
    formatExtraReason,
    formatGroupReason,
    formatPositionsMeta,
    formatRoundReason,
    formatTeamsMeta,
    getReasonTone,
} from '../utils'

export function MyTipsPage({
    fixtureTips,
    groupPlacements,
    knockoutPredictions,
    extraAnswers,
    publishedQuestions,
    participantScoreDetail,
    isParticipantScoreLoading,
    lastSavedLabel,
    phase,
    participant,
    leaderboard,
}: {
    fixtureTips: FixtureTip[]
    groupPlacements: GroupPlacement[]
    knockoutPredictions: KnockoutPredictionRound[]
    extraAnswers: ExtraAnswers
    publishedQuestions: AdminQuestion[]
    participantScoreDetail: ParticipantScoreDetail | null
    isParticipantScoreLoading: boolean
    lastSavedLabel: string
    phase: 'B' | 'C'
    participant: ParticipantSession | null
    leaderboard: LeaderboardEntry[]
}) {
    const [activeSection, setActiveSection] = useState<MyTipsSectionTab>('Gruppspel')

    const psd = participantScoreDetail
    const settledFixtureEntries = psd?.breakdown.filter((e) => e.reason !== 'unsettled') ?? []

    const settledGroupEntries = psd?.groupPlacementBreakdown.filter((e) => e.reason !== 'unsettled-group') ?? []
    const settledKnockoutEntries = psd?.knockoutBreakdown.filter((e) => e.reason !== 'unsettled-round') ?? []
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

    // Phase C stats
    const currentEntry = participant
        ? leaderboard.find((entry) => entry.participantId === participant.participantId) ?? null
        : null
    const displayedPositionLabel = psd?.positionLabel ?? currentEntry?.positionLabel ?? '-'
    const displayedTotalPoints = psd?.totalPoints ?? currentEntry?.totalPoints ?? 0
    const completedCount = settledFixtureEntries.length
    const remainingCount = fixtureCounts.total - completedCount

    return (
        <div className="page-stack">
            <section className="panel panel-sticky-head page-hero">
                <div>
                    <p className="eyebrow">{phase === 'C' ? 'Mina tips & resultat' : 'Mina tips'}</p>
                    <h1 className="section-title">{phase === 'C' ? 'Dina tips och matchresultat' : 'Dina inskickade tips'}</h1>
                    <p className="lead-text" style={{ margin: 0 }}>
                        {phase === 'C'
                            ? 'Följ dina tips mot officiella resultat och poäng.'
                            : 'Här ser du exakt vad du har skickat in.'}
                    </p>
                </div>
                {phase === 'B' && <span className="save-pill">{lastSavedLabel}</span>}
            </section>

            {phase === 'C' && !isParticipantScoreLoading && psd && (
                <section className="panel start-stats-row">
                    <article className="mini-card">
                        <span className="mini-label">Placering</span>
                        <strong>{displayedPositionLabel}</strong>
                        <span className="status-note">Totalpoäng: {displayedTotalPoints} p</span>
                    </article>
                    <article className="mini-card">
                        <span className="mini-label">Matcher</span>
                        <strong>{completedCount} / {fixtureCounts.total}</strong>
                        <span className="status-note">Återstående: {remainingCount}</span>
                    </article>
                    <article className="mini-card">
                        <span className="mini-label">Gruppspel</span>
                        <strong>{psd.fixturePoints} p</strong>
                        <span className="status-note">Avgjorda: {psd.settledMatches}</span>
                    </article>
                    <article className="mini-card">
                        <span className="mini-label">Grupplaceringar</span>
                        <strong>{psd.groupPlacementPoints} p</strong>
                        <span className="status-note">Avgjorda: {psd.settledGroups}</span>
                    </article>
                    <article className="mini-card">
                        <span className="mini-label">Slutspel</span>
                        <strong>{psd.knockoutPoints} p</strong>
                        <span className="status-note">Avgjorda: {psd.settledKnockoutRounds}</span>
                    </article>
                    <article className="mini-card">
                        <span className="mini-label">Extrafrågor</span>
                        <strong>{psd.extraQuestionPoints} p</strong>
                        <span className="status-note">Avgjorda: {psd.settledQuestions}</span>
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
                    {phase === 'B' ? (
                        <div className="table-wrap">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Match</th>
                                        <th>Datum/tid</th>
                                        <th>Resultat</th>
                                        <th>1/X/2</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {fixtureTips.map((row) => (
                                        <tr key={row.match}>
                                            <td data-label="Match">{row.match}</td>
                                            <td data-label="Datum/tid">{row.date}</td>
                                            <td data-label="Resultat">{row.homeScore === '' || row.awayScore === '' ? '—' : `${row.homeScore}-${row.awayScore}`}</td>
                                            <td data-label="1/X/2">{row.sign || '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : isParticipantScoreLoading ? (
                        <p className="status-note">Laddar poängdetaljer...</p>
                    ) : settledFixtureEntries.length === 0 ? (
                        <p className="status-note">Inga avgjorda gruppspelsmatcher ännu.</p>
                    ) : (
                        <>
                            <div className="fixture-breakdown-header">
                                <span className="fixture-col-match">Match</span>
                                <span className="fixture-col-cell">Resultat</span>
                                <span className="fixture-col-spacer" />
                                <span className="fixture-col-cell">Tips</span>
                                <span className="fixture-col-cell">1X2</span>
                                <span className="fixture-col-cell">Poäng</span>
                            </div>
                            <ul className="fixture-breakdown-list">
                                {settledFixtureEntries.map((entry) => {
                                    const actualResult = entry.result
                                        ? `${entry.result.homeScore}-${entry.result.awayScore}`
                                        : '—'
                                    const predictedResult = entry.predictedHomeScore !== null && entry.predictedAwayScore !== null
                                        ? `${entry.predictedHomeScore}-${entry.predictedAwayScore}`
                                        : '—'
                                    const scoreHit = entry.reason === 'exact-score'
                                    const signHit = entry.reason === 'exact-score' || entry.reason === 'correct-sign'

                                    return (
                                        <li className="fixture-breakdown-row" key={entry.matchId ?? entry.match}>
                                            <span className="fixture-col-match">{entry.match}</span>
                                            <span className="fixture-col-cell">{actualResult}</span>
                                            <span className="fixture-col-spacer" />
                                            <span className={`fixture-col-cell tip-indicator ${scoreHit ? 'hit' : 'miss'}`}>{predictedResult}</span>
                                            <span className={`fixture-col-cell tip-indicator ${signHit ? 'hit' : 'miss'}`}>{entry.predictedSign ?? '—'}</span>
                                            <span className={`fixture-col-cell ${entry.points > 0 ? 'points-badge' : 'points-badge zero'}`}>{entry.points} p</span>
                                        </li>
                                    )
                                })}
                            </ul>
                        </>
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
                    {phase === 'C' && settledGroupEntries.length > 0 && (
                        <ul className="score-breakdown-list" style={{ marginTop: '1rem' }}>
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
                </section>
            )}

            {activeSection === 'Slutspel' && (
                <section className="panel">
                    <ul>
                        {knockoutPredictions.map((round) => (
                            <li key={round.title}>{round.title}: {round.picks.join(', ')}</li>
                        ))}
                    </ul>
                    {phase === 'C' && settledKnockoutEntries.length > 0 && (
                        <ul className="score-breakdown-list" style={{ marginTop: '1rem' }}>
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
                </section>
            )}

            {activeSection === 'Extrafrågor' && (
                <section className="panel">
                    {extraQuestionItems.length > 0 ? (
                        <ul>
                            {extraQuestionItems.map((item) => (
                                <li key={item}>{item}</li>
                            ))}
                        </ul>
                    ) : (
                        <p>Inga extrafrågor besvarade ännu.</p>
                    )}
                    {phase === 'C' && settledExtraEntries.length > 0 && (
                        <ul className="score-breakdown-list" style={{ marginTop: '1rem' }}>
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
                </section>
            )}
        </div>
    )
}
