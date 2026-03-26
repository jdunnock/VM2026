import { getAvailableGroupTeams, QUICK_SCORE_GROUPS } from '../../constants'
import type { FixtureTip, GroupPlacement } from '../../types'

const GROUP_CODES = 'ABCDEFGHIJKL'.split('')

type GroupsFixturesCardProps = {
  fixtureTips: FixtureTip[]
  savedFixtureTips: FixtureTip[]
  groupPlacements: GroupPlacement[]
  expandedManualEditor: Record<string, boolean>
  toggleManualEditor: (match: string) => void
  onChangeTip: (
    match: string,
    key: 'homeScore' | 'awayScore' | 'sign',
    value: number | '' | '1' | 'X' | '2',
    source?: 'quick-score' | 'quick-sign' | 'fallback-score' | 'wheel-score',
  ) => void
  onSetScorePreset: (match: string, home: number, away: number, source?: 'quick-score' | 'fallback-score') => void
  onChangeGroupPlacement: (group: string, index: number, value: string) => void
  isSaving: boolean
  isGlobalLockActive: boolean
}

export function GroupsFixturesCard({
  fixtureTips,
  savedFixtureTips,
  groupPlacements,
  expandedManualEditor,
  toggleManualEditor,
  onChangeTip,
  onSetScorePreset,
  onChangeGroupPlacement,
  isSaving,
  isGlobalLockActive,
}: GroupsFixturesCardProps) {
  const groupedFixtureTips = GROUP_CODES.map((groupCode) => ({
    groupCode,
    matches: fixtureTips.filter((tip) => tip.group === groupCode),
    placement: groupPlacements.find((item) => item.group === `Grupp ${groupCode}`),
  }))

  return (
    <section className="panel">
      <div className="section-heading compact">
        <p className="eyebrow">Gruppspel</p>
        <h2>Gruppkort med matcher och placeringar</h2>
      </div>
      <div className="grouped-fixtures-grid">
        {groupedFixtureTips.map(({ groupCode, matches, placement }) => (
          <article className="group-card grouped-group-card" key={groupCode}>
            <div className="grouped-card-heading">
              <h3>Grupp {groupCode}</h3>
            </div>

            <div className="grouped-match-list">
              {matches.map((row) => {
                const isLocked = isGlobalLockActive || row.status === 'Låst'
                const savedMatch = savedFixtureTips.find((tip) => tip.match === row.match && tip.date === row.date)
                const isSavedComplete =
                  savedMatch !== undefined &&
                  row.homeScore !== '' &&
                  row.awayScore !== '' &&
                  row.sign !== '' &&
                  savedMatch.homeScore === row.homeScore &&
                  savedMatch.awayScore === row.awayScore &&
                  savedMatch.sign === row.sign

                return (
                  <div className={isSavedComplete ? 'grouped-match-row completed' : 'grouped-match-row'} key={`${row.match}-${row.date}`}>
                    <div className="grouped-row-head">
                      <strong>{row.match}</strong>
                      <span>{row.date}</span>
                    </div>

                    <div className="quick-score-wrap">
                      {QUICK_SCORE_GROUPS.map((group) => (
                        <div className="quick-score-group" key={`${row.match}-${group.key}`}>
                          <span className="quick-score-group-label">{group.label}</span>
                          <div className="quick-score-grid" role="group" aria-label={`${group.label} ${row.match}`}>
                            {group.presets.map((preset) => {
                              const active = row.homeScore === preset.home && row.awayScore === preset.away
                              return (
                                <button
                                  key={`${row.match}-${group.key}-${preset.home}-${preset.away}`}
                                  type="button"
                                  className={active ? 'quick-score-button active' : 'quick-score-button'}
                                  disabled={isLocked || isSaving}
                                  onClick={() => onSetScorePreset(row.match, preset.home, preset.away, 'quick-score')}
                                >
                                  {preset.home}-{preset.away}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      ))}

                      <div className="mobile-spinner-row" role="group" aria-label={`Mobil spinner ${row.match}`}>
                        <label className="spinner-field">
                          <span className="spinner-label">Hemma</span>
                          <select
                            className="wheel-select"
                            value={row.homeScore === '' ? 0 : row.homeScore}
                            disabled={isLocked || isSaving}
                            onChange={(e) => onChangeTip(row.match, 'homeScore', Number(e.target.value), 'wheel-score')}
                          >
                            {Array.from({ length: 11 }, (_, index) => (
                              <option key={`${row.match}-home-wheel-${index}`} value={index}>
                                {index}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="spinner-field">
                          <span className="spinner-label">Borta</span>
                          <select
                            className="wheel-select"
                            value={row.awayScore === '' ? 0 : row.awayScore}
                            disabled={isLocked || isSaving}
                            onChange={(e) => onChangeTip(row.match, 'awayScore', Number(e.target.value), 'wheel-score')}
                          >
                            {Array.from({ length: 11 }, (_, index) => (
                              <option key={`${row.match}-away-wheel-${index}`} value={index}>
                                {index}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>

                      <button
                        type="button"
                        className="ghost-button quick-more-button"
                        disabled={isLocked || isSaving}
                        onClick={() => toggleManualEditor(row.match)}
                      >
                        {expandedManualEditor[row.match] ? 'Stäng +More' : '+More'}
                      </button>

                      {expandedManualEditor[row.match] && (
                        <div className="score-editor">
                          <input
                            className="tip-input"
                            type="number"
                            min={0}
                            value={row.homeScore}
                            disabled={isLocked || isSaving}
                            onChange={(e) => onChangeTip(row.match, 'homeScore', e.target.value === '' ? '' : Number(e.target.value), 'fallback-score')}
                          />
                          <span>-</span>
                          <input
                            className="tip-input"
                            type="number"
                            min={0}
                            value={row.awayScore}
                            disabled={isLocked || isSaving}
                            onChange={(e) => onChangeTip(row.match, 'awayScore', e.target.value === '' ? '' : Number(e.target.value), 'fallback-score')}
                          />
                        </div>
                      )}
                    </div>

                    <div className="grouped-row-bottom">
                      <div className="sign-segment" role="group" aria-label={`Utfall ${row.match}`}>
                        {(['1', 'X', '2'] as const).map((signOption) => (
                          <button
                            key={`${row.match}-${signOption}`}
                            type="button"
                            className={row.sign === signOption ? 'segment-button active' : 'segment-button'}
                            disabled={isLocked || isSaving}
                            onClick={() => onChangeTip(row.match, 'sign', signOption, 'quick-sign')}
                          >
                            {signOption}
                          </button>
                        ))}
                      </div>
                      <span className={row.status === 'Låst' ? 'status-badge locked' : 'status-badge'}>{row.status}</span>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="grouped-placements">
              <div className="grouped-placements-head">
                <p className="mini-label">Placeringar</p>
                <strong>Välj topp 4 i gruppen</strong>
              </div>
              {placement ? (
                <ol>
                  {placement.picks.map((pick, index) => (
                    <li key={`${placement.group}-${index}`}>
                      <select
                        className="group-pick-input"
                        value={pick}
                        disabled={isSaving || isGlobalLockActive}
                        aria-label={`${placement.group} placering ${index + 1}`}
                        onChange={(e) => onChangeGroupPlacement(placement.group, index, e.target.value)}
                      >
                        <option value="">Välj lag</option>
                        {getAvailableGroupTeams(placement, index).map((team) => (
                          <option key={`${placement.group}-${index}-${team}`} value={team}>
                            {team}
                          </option>
                        ))}
                      </select>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="status-note">Placeringar saknas för grupp {groupCode}.</p>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
