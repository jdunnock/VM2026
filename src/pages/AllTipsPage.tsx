import { Fragment, useState } from 'react'
import type { AdminQuestion, AllTipsParticipant, CorrectnessData, ExtraAnswers, FixtureTip, GroupPlacement, KnockoutPredictionRound, MatchResult, ParticipantSession } from '../types'
import { allGroupCodes, groupStageFixtureTemplates } from '../fixtures'
import { knockoutPredictionTemplates } from '../constants'
import { deriveSignFromScore } from '../utils'

type AllTipsSectionTab = 'Gruppspel' | 'Grupplaceringar' | 'Slutspel' | 'Extrafrågor'

const sectionTabs: AllTipsSectionTab[] = ['Gruppspel', 'Grupplaceringar', 'Slutspel', 'Extrafrågor']

function getSign(homeScore: number | '', awayScore: number | ''): '' | '1' | 'X' | '2' {
    return deriveSignFromScore(homeScore, awayScore)
}

function findTipForFixture(tips: FixtureTip[] | undefined, fixtureId: string): FixtureTip | undefined {
    if (!tips) return undefined
    return tips.find((t) => t.fixtureId === fixtureId)
}

function findResult(results: MatchResult[], fixtureId: string): MatchResult | undefined {
    return results.find((r) => r.matchId === fixtureId)
}

function findGroupPlacements(placements: GroupPlacement[] | undefined, groupName: string): string[] {
    if (!placements) return []
    const entry = placements.find((g) => g.group === groupName)
    return entry?.picks ?? []
}

function findKnockoutPicks(predictions: KnockoutPredictionRound[] | undefined, roundTitle: string): string[] {
    if (!predictions) return []
    const entry = predictions.find((r) => r.title === roundTitle)
    return entry?.picks ?? []
}

export function AllTipsPage({
    participant,
    allTipsParticipants,
    isLoading,
    results,
    publishedQuestions,
    correctnessData,
}: {
    participant: ParticipantSession | null
    allTipsParticipants: AllTipsParticipant[]
    isLoading: boolean
    results: MatchResult[]
    publishedQuestions: AdminQuestion[]
    correctnessData: CorrectnessData | null
}) {
    const [activeSection, setActiveSection] = useState<AllTipsSectionTab>('Gruppspel')

    const fixtures = groupStageFixtureTemplates

    return (
        <div className="page-stack">
            <section className="panel panel-sticky-head page-hero">
                <div>
                    <p className="eyebrow">Alla tips</p>
                    <h1 className="section-title">Alla deltagares tips</h1>
                    <p className="lead-text" style={{ margin: 0 }}>Jämför alla deltagares tips sida vid sida.</p>
                </div>
            </section>

            <section className="tab-row" aria-label="Sektioner">
                {sectionTabs.map((tab) => (
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

            {isLoading && (
                <section className="panel">
                    <p className="muted-text" style={{ textAlign: 'center', padding: '2rem 0' }}>Laddar alla tips…</p>
                </section>
            )}

            {!isLoading && activeSection === 'Gruppspel' && (
                <section className="panel alltips-table-wrap">
                    <div className="alltips-scroll">
                        <table className="alltips-table">
                            <thead>
                                <tr>
                                    <th className="alltips-col-match">Match</th>
                                    <th className="alltips-col-result">Resultat</th>
                                    {allTipsParticipants.map((p) => (
                                        <th
                                            key={p.participantId}
                                            className={
                                                p.participantId === participant?.participantId
                                                    ? 'alltips-col-participant alltips-own-col'
                                                    : 'alltips-col-participant'
                                            }
                                        >
                                            {p.name}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {allGroupCodes.map((code) => {
                                    const groupFixtures = fixtures
                                        .filter((f) => f.group === code)
                                        .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''))
                                    if (groupFixtures.length === 0) return null
                                    return (
                                        <Fragment key={code}>
                                            <tr className="alltips-group-header-row">
                                                <td className="alltips-col-match">Grupp {code}</td>
                                                <td className="alltips-col-result"></td>
                                                {allTipsParticipants.map((p) => (
                                                    <td key={p.participantId} className="alltips-group-header-empty"></td>
                                                ))}
                                            </tr>
                                            {groupFixtures.map((fixture) => {
                                                const result = findResult(results, fixture.id)
                                                const isSettled = result?.resultStatus === 'completed'
                                                const actualSign = isSettled && result
                                                    ? getSign(result.homeScore ?? '', result.awayScore ?? '')
                                                    : ''
                                                const resultLabel = isSettled && result
                                                    ? `${result.homeScore}-${result.awayScore}`
                                                    : '—'

                                                return (
                                                    <tr key={fixture.id}>
                                                        <td className="alltips-col-match">{fixture.match}</td>
                                                        <td className="alltips-col-result">{resultLabel}</td>
                                                        {allTipsParticipants.map((p) => {
                                                            const fixtureTips = p.tips?.fixtureTips
                                                            const tip = findTipForFixture(fixtureTips as FixtureTip[] | undefined, fixture.id)
                                                            const hasTip = tip && tip.homeScore !== '' && tip.awayScore !== ''
                                                            const tipLabel = hasTip ? `${tip.homeScore}-${tip.awayScore}` : '—'
                                                            const tipSign = hasTip ? getSign(tip.homeScore, tip.awayScore) : ''

                                                            let cellClass = 'alltips-col-participant'
                                                            if (p.participantId === participant?.participantId) {
                                                                cellClass += ' alltips-own-col'
                                                            }
                                                            if (isSettled && hasTip) {
                                                                const scoreHit = tip.homeScore === result!.homeScore && tip.awayScore === result!.awayScore
                                                                const signHit = tipSign === actualSign
                                                                cellClass += scoreHit ? ' alltips-hit-exact' : signHit ? ' alltips-hit-sign' : ' alltips-miss'
                                                            }

                                                            return (
                                                                <td key={p.participantId} className={cellClass}>
                                                                    {tipLabel}
                                                                </td>
                                                            )
                                                        })}
                                                    </tr>
                                                )
                                            })}
                                        </Fragment>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}
            {!isLoading && activeSection === 'Slutspel' && (
                <section className="panel alltips-table-wrap">
                    <div className="alltips-scroll">
                        <table className="alltips-table alltips-group-table">
                            <thead>
                                <tr>
                                    <th className="alltips-col-match">Omgång</th>
                                    <th className="alltips-col-result">Kvalificerade lag</th>
                                    {allTipsParticipants.map((p) => (
                                        <th
                                            key={p.participantId}
                                            className={
                                                p.participantId === participant?.participantId
                                                    ? 'alltips-col-participant alltips-own-col'
                                                    : 'alltips-col-participant'
                                            }
                                        >
                                            {p.name}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {knockoutPredictionTemplates.map((round) => {
                                    const roundLookup = correctnessData?.knockoutRounds[round.title]
                                    const isSettled = roundLookup?.settled === true
                                    const actualTeams = roundLookup?.actualTeams ?? []
                                    const actualTeamKeys = new Set(actualTeams.map((t) => t.toLowerCase()))

                                    return (
                                        <tr key={round.title}>
                                            <td className="alltips-col-match">{round.title}</td>
                                            <td className="alltips-col-result">
                                                {isSettled ? (
                                                    <div className="alltips-group-picks">
                                                        {actualTeams.map((team, i) => (
                                                            <span key={i}>{team}</span>
                                                        ))}
                                                    </div>
                                                ) : '—'}
                                            </td>
                                            {allTipsParticipants.map((p) => {
                                                const picks = findKnockoutPicks(
                                                    p.tips?.knockoutPredictions as KnockoutPredictionRound[] | undefined,
                                                    round.title,
                                                )
                                                const hasPicks = picks.length > 0 && picks.some((t) => t !== '')
                                                const isOwn = p.participantId === participant?.participantId

                                                return (
                                                    <td key={p.participantId} className={isOwn ? 'alltips-col-participant alltips-own-col' : 'alltips-col-participant'}>
                                                        {hasPicks ? (
                                                            <div className="alltips-group-picks">
                                                                {picks.filter((t) => t !== '').map((team, i) => {
                                                                    let spanClass = ''
                                                                    if (isSettled) {
                                                                        const hit = actualTeamKeys.has(team.toLowerCase())
                                                                        spanClass = hit ? 'alltips-hit-exact' : 'alltips-miss'
                                                                    }
                                                                    return (
                                                                        <span key={i} className={spanClass}>{team}</span>
                                                                    )
                                                                })}
                                                            </div>
                                                        ) : '—'}
                                                    </td>
                                                )
                                            })}
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}
            {!isLoading && activeSection === 'Grupplaceringar' && (
                <section className="panel alltips-table-wrap">
                    <div className="alltips-scroll">
                        <table className="alltips-table alltips-group-table">
                            <thead>
                                <tr>
                                    <th className="alltips-col-match">Grupp</th>
                                    <th className="alltips-col-result">Slutställning</th>
                                    {allTipsParticipants.map((p) => (
                                        <th
                                            key={p.participantId}
                                            className={
                                                p.participantId === participant?.participantId
                                                    ? 'alltips-col-participant alltips-own-col'
                                                    : 'alltips-col-participant'
                                            }
                                        >
                                            {p.name}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {allGroupCodes.map((code) => {
                                    const groupName = `Grupp ${code}`
                                    const standing = correctnessData?.groupStandings[code]
                                    const isSettled = standing?.settled === true
                                    const actualPicks = standing?.actualPicks ?? []

                                    return (
                                        <tr key={code}>
                                            <td className="alltips-col-match">{groupName}</td>
                                            <td className="alltips-col-result">
                                                {isSettled ? (
                                                    <div className="alltips-group-picks">
                                                        {actualPicks.map((team, i) => (
                                                            <span key={i}>{i + 1}. {team}</span>
                                                        ))}
                                                    </div>
                                                ) : '—'}
                                            </td>
                                            {allTipsParticipants.map((p) => {
                                                const picks = findGroupPlacements(
                                                    p.tips?.groupPlacements as GroupPlacement[] | undefined,
                                                    groupName,
                                                )
                                                const hasPicks = picks.length > 0 && picks.some((t) => t !== '')
                                                const isOwn = p.participantId === participant?.participantId

                                                return (
                                                    <td key={p.participantId} className={isOwn ? 'alltips-col-participant alltips-own-col' : 'alltips-col-participant'}>
                                                        {hasPicks ? (
                                                            <div className="alltips-group-picks">
                                                                {picks.map((team, i) => {
                                                                    let spanClass = ''
                                                                    if (isSettled && team) {
                                                                        const hit = actualPicks[i] && team.toLowerCase() === actualPicks[i].toLowerCase()
                                                                        spanClass = hit ? 'alltips-hit-exact' : 'alltips-miss'
                                                                    }
                                                                    return (
                                                                        <span key={i} className={spanClass}>{i + 1}. {team || '—'}</span>
                                                                    )
                                                                })}
                                                            </div>
                                                        ) : '—'}
                                                    </td>
                                                )
                                            })}
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}
            {!isLoading && activeSection === 'Extrafrågor' && (
                <section className="panel alltips-table-wrap">
                    <div className="alltips-scroll">
                        <table className="alltips-table alltips-group-table alltips-extra-table">
                            <thead>
                                <tr>
                                    <th className="alltips-col-match">Fråga</th>
                                    <th className="alltips-col-result">Rätt svar</th>
                                    {allTipsParticipants.map((p) => (
                                        <th
                                            key={p.participantId}
                                            className={
                                                p.participantId === participant?.participantId
                                                    ? 'alltips-col-participant alltips-own-col'
                                                    : 'alltips-col-participant'
                                            }
                                        >
                                            {p.name}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {publishedQuestions.map((question) => {
                                    const questionCorrectness = correctnessData?.extraAnswers[String(question.id)]
                                    const isSettled = questionCorrectness?.settled === true
                                    const correctAnswer = questionCorrectness?.correctAnswer ?? null

                                    return (
                                        <tr key={question.id}>
                                            <td className="alltips-col-match">{question.questionText}</td>
                                            <td className="alltips-col-result">
                                                {isSettled && correctAnswer ? correctAnswer : '—'}
                                            </td>
                                            {allTipsParticipants.map((p) => {
                                                const answers = p.tips?.extraAnswers as ExtraAnswers | undefined
                                                const answer = answers?.[String(question.id)] || ''
                                                const isOwn = p.participantId === participant?.participantId

                                                let cellClass = isOwn ? 'alltips-col-participant alltips-own-col' : 'alltips-col-participant'
                                                if (isSettled && answer && correctAnswer) {
                                                    const acceptedAnswers = questionCorrectness?.acceptedAnswers ?? []
                                                    const answerLower = answer.trim().toLowerCase()
                                                    const hit = answerLower === correctAnswer.trim().toLowerCase() ||
                                                        acceptedAnswers.some((a: string) => a.trim().toLowerCase() === answerLower)
                                                    cellClass += hit ? ' alltips-hit-exact' : ' alltips-miss'
                                                }

                                                return (
                                                    <td key={p.participantId} className={cellClass}>
                                                        {answer || '—'}
                                                    </td>
                                                )
                                            })}
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}
        </div>
    )
}
