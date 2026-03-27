import { useState } from 'react'
import type { AllTipsParticipant, FixtureTip, MatchResult, ParticipantSession } from '../types'
import { groupStageFixtureTemplates } from '../fixtures'
import { deriveSignFromScore } from '../utils'

type AllTipsSectionTab = 'Gruppspel'

const sectionTabs: AllTipsSectionTab[] = ['Gruppspel']

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

export function AllTipsPage({
    participant,
    allTipsParticipants,
    isLoading,
    results,
}: {
    participant: ParticipantSession | null
    allTipsParticipants: AllTipsParticipant[]
    isLoading: boolean
    results: MatchResult[]
}) {
    const [activeSection, setActiveSection] = useState<AllTipsSectionTab>('Gruppspel')

    const fixtures = groupStageFixtureTemplates

    return (
        <div className="page-stack">
            <section className="panel panel-sticky-head page-hero">
                <div>
                    <p className="eyebrow">Alla tips</p>
                    <h1 className="section-title">Alla deltagares tips</h1>
                    <p className="lead-text" style={{ margin: 0 }}>Jämför alla deltagares förutsägelser sida vid sida.</p>
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
                                {fixtures.map((fixture) => {
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
                            </tbody>
                        </table>
                    </div>
                </section>
            )}
        </div>
    )
}
