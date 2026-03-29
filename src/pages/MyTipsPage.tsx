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
                <section className="panel tab-content">
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
                <section className="tab-content">
                    {phase === 'C' && isParticipantScoreLoading ? (
                        <p className="empty-state">Laddar poängdetaljer...</p>
                    ) : (
                        <div className="placement-grid">
                            {groupPlacements.map((group) => {
                                const breakdown = phase === 'C'
                                    ? psd?.groupPlacementBreakdown.find((e) => e.group === group.group) ?? null
                                    : null
                                const isSettled = breakdown && breakdown.reason !== 'unsettled-group'
                                return (
                                    <article className="placement-card" key={group.group}>
                                        <div className="placement-card-header">
                                            <h3>{group.group}</h3>
                                            {isSettled && (
                                                <div className="score-breakdown-badges">
                                                    <span className={breakdown.points > 0 ? 'points-badge' : 'points-badge zero'}>{breakdown.points} p</span>
                                                    <span className={`reason-badge ${getReasonTone(breakdown.reason)}`}>{formatGroupReason(breakdown.reason, breakdown.matchedPositions)}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="placement-rows">
                                            {group.picks.map((team, idx) => {
                                                const actualTeam = isSettled && breakdown.actualPicks ? breakdown.actualPicks[idx] ?? null : null
                                                const isHit = isSettled && breakdown.matchedPositions.includes(idx + 1)
                                                return (
                                                    <div className="placement-row" key={idx}>
                                                        <span className="placement-pos">{idx + 1}.</span>
                                                        <span className={`placement-pick ${isSettled ? (isHit ? 'hit' : 'miss') : ''}`}>{team}</span>
                                                        {isSettled && (
                                                            <span className="placement-actual">{actualTeam ?? '—'}</span>
                                                        )}
                                                        {isSettled && (
                                                            <span className={`placement-icon ${isHit ? 'hit' : 'miss'}`}>{isHit ? '✓' : '✗'}</span>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </article>
                                )
                            })}
                        </div>
                    )}
                    {phase === 'C' && !isParticipantScoreLoading && groupPlacements.length > 0 && settledGroupEntries.length === 0 && (
                        <p className="empty-state">Inga avgjorda grupplaceringar ännu.</p>
                    )}
                </section>
            )}

            {activeSection === 'Slutspel' && (
                <section className="tab-content">
                    {phase === 'C' && isParticipantScoreLoading ? (
                        <p className="empty-state">Laddar poängdetaljer...</p>
                    ) : (
                        <div className="stacked-cards">
                            {knockoutPredictions.map((round) => {
                                const breakdown = phase === 'C'
                                    ? psd?.knockoutBreakdown.find((e) => e.round === round.title) ?? null
                                    : null
                                const isSettled = breakdown && breakdown.reason !== 'unsettled-round'
                                return (
                                    <article className="knockout-result-card" key={round.title}>
                                        <div className="placement-card-header">
                                            <h3>{round.title}</h3>
                                            {isSettled && (
                                                <div className="score-breakdown-badges">
                                                    <span className={breakdown.points > 0 ? 'points-badge' : 'points-badge zero'}>{breakdown.points} p</span>
                                                    <span className={`reason-badge ${getReasonTone(breakdown.reason)}`}>{formatRoundReason(breakdown.reason, breakdown.matchedTeams)}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="team-chips">
                                            {round.picks.map((team) => {
                                                const isHit = isSettled && breakdown.matchedTeams.includes(team)
                                                const isMiss = isSettled && !breakdown.matchedTeams.includes(team)
                                                return (
                                                    <span
                                                        key={team}
                                                        className={`team-chip ${isHit ? 'hit' : isMiss ? 'miss' : ''}`}
                                                    >
                                                        {team}
                                                    </span>
                                                )
                                            })}
                                        </div>
                                        {isSettled && formatTeamsMeta(breakdown.matchedTeams) && (
                                            <span className="score-breakdown-meta">{formatTeamsMeta(breakdown.matchedTeams)}</span>
                                        )}
                                    </article>
                                )
                            })}
                        </div>
                    )}
                    {phase === 'C' && !isParticipantScoreLoading && knockoutPredictions.length > 0 && settledKnockoutEntries.length === 0 && (
                        <p className="empty-state">Inga avgjorda slutspelsomgångar ännu.</p>
                    )}
                </section>
            )}

            {activeSection === 'Extrafrågor' && (
                <section className="tab-content">
                    {phase === 'C' && isParticipantScoreLoading ? (
                        <p className="empty-state">Laddar poängdetaljer...</p>
                    ) : publishedQuestions.length === 0 ? (
                        <p className="empty-state">Inga extrafrågor publicerade ännu.</p>
                    ) : (
                        <div className="stacked-cards">
                            {publishedQuestions.map((question) => {
                                const chosen = extraAnswers[String(question.id)] ?? null
                                const breakdown = phase === 'C'
                                    ? psd?.extraBreakdown.find((e) => e.questionId === question.id) ?? null
                                    : null
                                const isSettled = breakdown?.settled ?? false
                                return (
                                    <article className="question-card" key={question.id}>
                                        <div className="placement-card-header">
                                            <h3>{question.questionText}</h3>
                                            {isSettled && breakdown && (
                                                <div className="score-breakdown-badges">
                                                    <span className={breakdown.points > 0 ? 'points-badge' : 'points-badge zero'}>{breakdown.points} p</span>
                                                    <span className={`reason-badge ${getReasonTone(breakdown.reason)}`}>{formatExtraReason(breakdown.reason)}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="question-answers">
                                            <div className="question-answer-item">
                                                <span className="question-answer-label">Ditt svar</span>
                                                <span className={`question-answer-value ${isSettled ? (breakdown!.reason === 'correct' ? 'hit' : 'miss') : ''}`}>
                                                    {chosen ?? <em className="muted-text">Ej besvarad</em>}
                                                </span>
                                            </div>
                                            {isSettled && breakdown && (
                                                <div className="question-answer-item">
                                                    <span className="question-answer-label">Rätt svar</span>
                                                    <span className="question-answer-value facit">{breakdown.correctAnswer ?? '—'}</span>
                                                </div>
                                            )}
                                        </div>
                                    </article>
                                )
                            })}
                        </div>
                    )}
                </section>
            )}
        </div>
    )
}
