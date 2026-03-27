import { useState, type ReactNode } from 'react'
import { fixtureCounts } from '../fixtures'
import type {
    LeaderboardEntry,
    MatchResult,
    MatchResultStage,
    MyTipsSectionTab,
    ParticipantScoreDetail,
    ParticipantSession,
    SpecialResultsState,
} from '../types'
import { myTipsSectionTabs } from '../types'
import {
    formatExtraReason,
    formatGroupReason,
    formatPositionsMeta,
    formatSpecialReason,
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
                            <span className="mini-label">Grupplaceringar</span>
                            <strong>{participantScoreDetail.groupPlacementPoints} p</strong>
                            <span className="status-note">Avgjorda grupper: {participantScoreDetail.settledGroups}</span>
                        </article>
                        <article className="mini-card">
                            <span className="mini-label">Slutspel</span>
                            <strong>{participantScoreDetail.knockoutPoints} p</strong>
                            <span className="status-note">Avgjorda rundor: {participantScoreDetail.settledKnockoutRounds}</span>
                        </article>
                        <article className="mini-card">
                            <span className="mini-label">Extrafrågor</span>
                            <strong>{participantScoreDetail.specialPoints + participantScoreDetail.extraQuestionPoints} p</strong>
                            <span className="status-note">Avgjorda: {participantScoreDetail.settledSpecialPredictions + participantScoreDetail.settledQuestions}</span>
                        </article>
                    </div>

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
    const [activeSection, setActiveSection] = useState<MyTipsSectionTab>('Gruppspel')
    const displayedResults = results
    const displayedParticipantScoreDetail = participantScoreDetail
    const showResultsLoading = isResultsLoading
    const showParticipantScoreLoading = isParticipantScoreLoading

    const currentEntry = participant
        ? leaderboard.find((entry) => entry.participantId === participant.participantId) ?? null
        : null
    const displayedPositionLabel = displayedParticipantScoreDetail?.positionLabel ?? currentEntry?.positionLabel ?? '-'
    const displayedTotalPoints =
        displayedParticipantScoreDetail?.totalPoints ?? currentEntry?.totalPoints ?? 0

    const completedCount = displayedResults.filter((entry) => entry.resultStatus === 'completed').length
    const remainingCount = fixtureCounts.total - completedCount

    // Filter results by active section stage
    const sectionStage: MatchResultStage | null = activeSection === 'Gruppspel' ? 'group' : activeSection === 'Slutspel' ? 'knockout' : null
    const filteredResults = sectionStage
        ? displayedResults.filter((entry) => entry.stage === sectionStage)
        : []

    // Build lookup: matchId → breakdown entry (for tip display in result cards)
    const breakdownByMatchId = new Map(
        (displayedParticipantScoreDetail?.breakdown ?? []).map((e) => [e.matchId, e])
    )

    // Breakdown entries for sections
    const psd = displayedParticipantScoreDetail
    const settledFixtureEntries = psd?.breakdown.filter((e) => e.reason !== 'unsettled') ?? []
    const settledGroupEntries = psd?.groupPlacementBreakdown.filter((e) => e.reason !== 'unsettled-group') ?? []
    const settledKnockoutEntries = psd?.knockoutBreakdown.filter((e) => e.reason !== 'unsettled-round') ?? []
    const settledSpecialEntries = psd?.specialBreakdown.filter((e) => e.settled) ?? []
    const settledExtraEntries = psd?.extraBreakdown.filter((e) => e.settled) ?? []

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

            {showParticipantScoreLoading ? (
                <p className="status-note">Laddar poängdetaljer...</p>
            ) : psd ? (
                <div className="stats-grid">
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
                        <strong>{psd.specialPoints + psd.extraQuestionPoints} p</strong>
                        <span className="status-note">Avgjorda: {psd.settledSpecialPredictions + psd.settledQuestions}</span>
                    </article>
                </div>
            ) : null}

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
                    {showParticipantScoreLoading ? (
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

            {activeSection === 'Slutspel' && (
                <section className="panel results-panel">
                    <div className="section-heading compact">
                        <p className="eyebrow">{activeSection === 'Gruppspel' ? 'Gruppspel' : 'Slutspel'}</p>
                        <h2>Officiella resultat</h2>
                    </div>

                    {showResultsLoading ? (
                        <p className="status-note">Laddar officiella resultat...</p>
                    ) : filteredResults.length === 0 ? (
                        <p className="status-note">Inga matcher ännu.</p>
                    ) : (
                        <div className="results-grid">
                            {filteredResults.map((entry) => {
                                const scoreline =
                                    entry.homeScore === null || entry.awayScore === null ? 'Ej avgjord ännu' : `${entry.homeScore}-${entry.awayScore}`
                                const bk = participant ? breakdownByMatchId.get(entry.matchId) : undefined
                                const settled = bk && bk.reason !== 'unsettled'
                                const actualSign = entry.homeScore !== null && entry.awayScore !== null
                                    ? entry.homeScore > entry.awayScore ? '1' : entry.homeScore < entry.awayScore ? '2' : 'X'
                                    : null

                                return (
                                    <article className="result-card" key={entry.matchId}>
                                        <div className="result-card-header">
                                            <div>
                                                <span className="mini-label">{entry.stage === 'group' ? entry.groupCode ? `Grupp ${entry.groupCode}` : 'Gruppspel' : entry.round ?? 'Slutspel'}</span>
                                                <strong>{entry.homeTeam} - {entry.awayTeam}</strong>
                                            </div>
                                        </div>

                                        <div className="result-scoreline-row">
                                            <span className="result-scoreline">{scoreline}</span>
                                        </div>

                                        {participant && settled && bk && (
                                            <div className="result-card-tip">
                                                <span>Ditt tips:</span>
                                                <span className={`tip-indicator ${bk.reason === 'exact-score' ? 'hit' : 'miss'}`}>
                                                    {bk.predictedHomeScore !== null && bk.predictedAwayScore !== null
                                                        ? `${bk.predictedHomeScore}-${bk.predictedAwayScore}`
                                                        : '—'}
                                                </span>
                                                {actualSign && (
                                                    <span className={`tip-indicator ${bk.reason === 'exact-score' || bk.reason === 'correct-sign' ? 'hit' : 'miss'}`}>
                                                        {bk.predictedSign ?? '—'}
                                                    </span>
                                                )}
                                                <span className={bk.points > 0 ? 'points-badge' : 'points-badge zero'}>{bk.points} p</span>
                                            </div>
                                        )}
                                    </article>
                                )
                            })}
                        </div>
                    )}
                </section>
            )}

            {activeSection === 'Grupplaceringar' && (
                <section className="panel">
                    <div className="section-heading compact">
                        <p className="eyebrow">Grupplaceringar</p>
                        <h2>Avgjorda grupplaceringar</h2>
                    </div>
                    {showParticipantScoreLoading ? (
                        <p className="status-note">Laddar poängdetaljer...</p>
                    ) : settledGroupEntries.length === 0 ? (
                        <p className="status-note">Inga avgjorda grupplaceringar ännu.</p>
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
                </section>
            )}

            {activeSection === 'Extrafrågor' && (
                <section className="panel">
                    {showParticipantScoreLoading ? (
                        <p className="status-note">Laddar poängdetaljer...</p>
                    ) : (settledSpecialEntries.length === 0 && settledExtraEntries.length === 0) ? (
                        <p className="status-note">Inga avgjorda extrafrågor ännu.</p>
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
                </section>
            )}

        </div>
    )
}