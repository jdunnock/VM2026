import type { Dispatch, SetStateAction } from 'react'
import type {
    AdminFixtureTemplate,
    MatchResult,
    MatchResultStage,
    MatchResultStatus,
    SpecialResultsState,
    AdminWorkspaceTab,
    AdminResultDraft,
} from '../../types'
import { formatMatchResultStatusLabel } from '../../utils'

type AdminResultsTabProps = {
    resultsMessage: string
    isResultSaving: boolean
    isResultsLoading: boolean
    resultFilterStage: 'all' | MatchResultStage
    setResultFilterStage: Dispatch<SetStateAction<'all' | MatchResultStage>>
    resultSearchQuery: string
    setResultSearchQuery: Dispatch<SetStateAction<string>>
    selectedMatchId: string
    setSelectedMatchId: Dispatch<SetStateAction<string>>
    filteredFixtures: AdminFixtureTemplate[]
    selectedFixture: AdminFixtureTemplate | null
    resultDraft: AdminResultDraft
    setResultDraft: Dispatch<SetStateAction<AdminResultDraft>>
    saveMatchResult: () => void
    resetResultDraft: () => void
    specialResults: SpecialResultsState
    setSpecialResults: Dispatch<SetStateAction<SpecialResultsState>>
    saveSpecialResults: () => void
    filteredSavedResults: MatchResult[]
    setActiveAdminTab: Dispatch<SetStateAction<AdminWorkspaceTab>>
}

export function AdminResultsTab({
    resultsMessage,
    isResultSaving,
    isResultsLoading,
    resultFilterStage,
    setResultFilterStage,
    resultSearchQuery,
    setResultSearchQuery,
    selectedMatchId,
    setSelectedMatchId,
    filteredFixtures,
    selectedFixture,
    resultDraft,
    setResultDraft,
    saveMatchResult,
    resetResultDraft,
    specialResults,
    setSpecialResults,
    saveSpecialResults,
    filteredSavedResults,
    setActiveAdminTab,
}: AdminResultsTabProps) {
    return (
        <>
            <section className="panel">
                <div className="section-heading compact">
                    <p className="eyebrow">Rollfördelning</p>
                    <h2>Admin redigerar, deltagare läser</h2>
                </div>
                <div className="lock-warning">
                    <ul>
                        <li>Här i Admin uppdaterar du officiella matchresultat och specialutfall.</li>
                        <li>Deltagare ser dessa utfall i <strong>Resultat & poäng</strong> som read-only.</li>
                        <li>Samma utfallsdata används i båda vyerna, men endast Admin kan göra ändringar.</li>
                    </ul>
                </div>

                {resultsMessage ? <p className="save-pill">{resultsMessage}</p> : null}
                <div className="admin-results-grid">
                    <article className="mini-card">
                        <span className="mini-label">Matchresultat</span>
                        <h2>Redigera match</h2>
                        <div className="admin-filter-grid">
                            <label>
                                Visa
                                <select
                                    className="special-input"
                                    value={resultFilterStage}
                                    onChange={(e) => setResultFilterStage(e.target.value as 'all' | MatchResultStage)}
                                >
                                    <option value="group">Gruppspel</option>
                                    <option value="knockout">Slutspel</option>
                                    <option value="all">Alla matcher</option>
                                </select>
                            </label>
                            <label>
                                Sök match
                                <input
                                    className="special-input"
                                    type="text"
                                    value={resultSearchQuery}
                                    onChange={(e) => setResultSearchQuery(e.target.value)}
                                    placeholder="Lag, grupp eller match-id"
                                />
                            </label>
                        </div>

                        <label>
                            Match
                            <select
                                className="special-input"
                                value={selectedMatchId}
                                onChange={(e) => setSelectedMatchId(e.target.value)}
                                disabled={filteredFixtures.length === 0}
                            >
                                {filteredFixtures.map((fixture) => (
                                    <option key={fixture.matchId} value={fixture.matchId}>
                                        {fixture.matchId} · {fixture.homeTeam} - {fixture.awayTeam}
                                    </option>
                                ))}
                            </select>
                        </label>

                        {selectedFixture ? (
                            <>
                                <div className="result-fixture-summary">
                                    <strong>{selectedFixture.homeTeam} - {selectedFixture.awayTeam}</strong>
                                    <span>{selectedFixture.kickoffAt}</span>
                                </div>

                                <div className="inline-stats">
                                    <span className="status-note">{selectedFixture.matchId}</span>
                                    {selectedFixture.groupCode ? <span className="status-note">Grupp {selectedFixture.groupCode}</span> : null}
                                    {selectedFixture.round ? <span className="status-note">{selectedFixture.round}</span> : null}
                                </div>

                                <div className="admin-filter-grid compact">
                                    <label>
                                        Status
                                        <select
                                            className="special-input"
                                            value={resultDraft.resultStatus}
                                            onChange={(e) => setResultDraft((current) => ({ ...current, resultStatus: e.target.value as MatchResultStatus }))}
                                        >
                                            <option value="planned">Planerad</option>
                                            <option value="live">Live</option>
                                            <option value="completed">Slut</option>
                                        </select>
                                    </label>
                                    <label>
                                        Avgjord tid
                                        <input
                                            className="special-input"
                                            type="datetime-local"
                                            value={resultDraft.settledAt}
                                            onChange={(e) => setResultDraft((current) => ({ ...current, settledAt: e.target.value }))}
                                        />
                                    </label>
                                </div>

                                <div className="admin-score-grid">
                                    <label>
                                        {selectedFixture.homeTeam}
                                        <input
                                            className="special-input"
                                            type="number"
                                            min={0}
                                            max={99}
                                            value={resultDraft.homeScore}
                                            onChange={(e) => setResultDraft((current) => ({ ...current, homeScore: e.target.value }))}
                                            placeholder=""
                                        />
                                    </label>
                                    <label>
                                        {selectedFixture.awayTeam}
                                        <input
                                            className="special-input"
                                            type="number"
                                            min={0}
                                            max={99}
                                            value={resultDraft.awayScore}
                                            onChange={(e) => setResultDraft((current) => ({ ...current, awayScore: e.target.value }))}
                                            placeholder=""
                                        />
                                    </label>
                                </div>

                                <div className="stacked-actions">
                                    <button className="primary-button" type="button" disabled={isResultSaving} onClick={saveMatchResult}>
                                        {isResultSaving ? 'Sparar...' : 'Spara matchresultat'}
                                    </button>
                                    <button className="ghost-button" type="button" disabled={isResultSaving} onClick={resetResultDraft}>
                                        Återställ match
                                    </button>
                                </div>
                            </>
                        ) : (
                            <p>Ingen match matchar ditt filter ännu.</p>
                        )}
                    </article>

                    <article className="mini-card emphasis">
                        <span className="mini-label">Special</span>
                        <h2>Slututfall</h2>
                        <div className="stacked-actions">
                            <label>
                                Slutsegrare
                                <input
                                    className="special-input"
                                    type="text"
                                    value={specialResults.winner}
                                    onChange={(e) => setSpecialResults((current) => ({ ...current, winner: e.target.value }))}
                                />
                            </label>
                            <label>
                                Skytteligavinnare
                                <input
                                    className="special-input"
                                    type="text"
                                    value={specialResults.topScorer}
                                    onChange={(e) => setSpecialResults((current) => ({ ...current, topScorer: e.target.value }))}
                                />
                            </label>
                        </div>
                        {specialResults.updatedAt ? (
                            <p className="status-note">Senast uppdaterad: {new Date(specialResults.updatedAt).toLocaleString('sv-SE')}</p>
                        ) : null}
                        <div className="stacked-actions">
                            <button className="primary-button" type="button" disabled={isResultSaving} onClick={saveSpecialResults}>
                                {isResultSaving ? 'Sparar...' : 'Spara specialresultat'}
                            </button>
                        </div>
                    </article>
                </div>
            </section>

            <section className="panel">
                <div className="section-heading compact">
                    <p className="eyebrow">Sparade resultat</p>
                    <h2>Översikt</h2>
                </div>
                <div className="table-wrap">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Match</th>
                                <th>Status</th>
                                <th>Resultat</th>
                                <th>Avgjord</th>
                                <th>Åtgärd</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isResultsLoading ? (
                                <tr>
                                    <td colSpan={5}>Laddar adminresultat...</td>
                                </tr>
                            ) : filteredSavedResults.length === 0 ? (
                                <tr>
                                    <td colSpan={5}>Inga sparade resultat för aktuellt filter.</td>
                                </tr>
                            ) : (
                                filteredSavedResults.map((entry) => (
                                    <tr key={entry.matchId}>
                                        <td data-label="Match">
                                            <strong>{entry.homeTeam} - {entry.awayTeam}</strong>
                                            <div className="score-breakdown-meta">
                                                {entry.matchId}
                                                {entry.groupCode ? ` · Grupp ${entry.groupCode}` : ''}
                                                {entry.round ? ` · ${entry.round}` : ''}
                                            </div>
                                        </td>
                                        <td data-label="Status">
                                            <span className={`status-badge admin-result-badge ${entry.resultStatus}`}>
                                                {formatMatchResultStatusLabel(entry.resultStatus)}
                                            </span>
                                        </td>
                                        <td data-label="Resultat">
                                            <span className="admin-scoreline">
                                                {entry.homeScore === null || entry.awayScore === null ? 'Ej satt' : `${entry.homeScore}-${entry.awayScore}`}
                                            </span>
                                        </td>
                                        <td data-label="Avgjord">{entry.settledAt ? new Date(entry.settledAt).toLocaleString('sv-SE') : '-'}</td>
                                        <td data-label="Åtgärd">
                                            <button
                                                className="ghost-button"
                                                type="button"
                                                onClick={() => {
                                                    setSelectedMatchId(entry.matchId)
                                                    setActiveAdminTab('results')
                                                }}
                                            >
                                                Redigera
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </>
    )
}
