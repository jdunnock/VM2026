import type { Dispatch, SetStateAction } from 'react'
import { getKnockoutListId, getRoundKnockoutTeams, normalizeKnockoutPickLabel } from '../../utils'
import type { GroupPlacement, KnockoutPredictionRound } from '../../types'

type KnockoutRoundsCardProps = {
  knockoutPredictions: KnockoutPredictionRound[]
  groupPlacements: GroupPlacement[]
  activeKnockoutField: { roundTitle: string; index: number } | null
  setActiveKnockoutField: Dispatch<SetStateAction<{ roundTitle: string; index: number } | null>>
  onChangeKnockoutPrediction: (roundTitle: string, index: number, value: string) => void
  isSaving: boolean
  isGlobalLockActive: boolean
  isTouchDevice: boolean
  enableKnockoutTypeahead: boolean
}

function getInlineKnockoutSuggestions(options: string[]): string[] {
  return Array.from(
    new Set(options.map((option) => normalizeKnockoutPickLabel(option)).filter((option) => option.length > 0)),
  )
}

export function KnockoutRoundsCard({
  knockoutPredictions,
  groupPlacements,
  activeKnockoutField,
  setActiveKnockoutField,
  onChangeKnockoutPrediction,
  isSaving,
  isGlobalLockActive,
  isTouchDevice,
  enableKnockoutTypeahead,
}: KnockoutRoundsCardProps) {
  return (
    <section className="panel">
      <div className="section-heading compact">
        <p className="eyebrow">Slutspel</p>
        <h2>Runda för runda</h2>
      </div>
      <div className="knockout-grid">
        {knockoutPredictions.map((round, roundIndex) => {
          const roundOptions = getRoundKnockoutTeams(knockoutPredictions, groupPlacements, roundIndex)
          const activeRoundOptions = [...roundOptions]

          round.picks.forEach((pick) => {
            const normalized = normalizeKnockoutPickLabel(pick)
            if (normalized && !activeRoundOptions.includes(normalized)) {
              activeRoundOptions.push(normalized)
            }
          })

          return (
            <article className="round-card" key={round.title}>
              <h3>{round.title}</h3>
              {enableKnockoutTypeahead ? (
                <datalist id={getKnockoutListId(round.title)}>
                  {activeRoundOptions.map((option) => (
                    <option key={`${round.title}-${option}`} value={option} />
                  ))}
                </datalist>
              ) : null}
              <ul>
                {round.picks.map((pick, index) => (
                  <li className="knockout-pick-item" key={`${round.title}-${index}`}>
                    <input
                      className="special-input"
                      type="text"
                      list={enableKnockoutTypeahead ? getKnockoutListId(round.title) : undefined}
                      value={pick}
                      disabled={isSaving || isGlobalLockActive}
                      onFocus={() => {
                        if (isTouchDevice) {
                          setActiveKnockoutField({ roundTitle: round.title, index })
                        }
                      }}
                      onBlur={() => {
                        if (isTouchDevice) {
                          setTimeout(() => {
                            setActiveKnockoutField((current) => {
                              if (current?.roundTitle === round.title && current.index === index) {
                                return null
                              }

                              return current
                            })
                          }, 120)
                        }
                      }}
                      onChange={(e) => {
                        onChangeKnockoutPrediction(round.title, index, e.target.value)

                        if (isTouchDevice) {
                          setActiveKnockoutField({ roundTitle: round.title, index })
                        }
                      }}
                    />
                    {isTouchDevice && activeKnockoutField?.roundTitle === round.title && activeKnockoutField.index === index ? (
                      <div className="knockout-suggestions" role="listbox" aria-label={`${round.title} förslag`}>
                        {getInlineKnockoutSuggestions(activeRoundOptions).map((option) => (
                          <button
                            className="knockout-suggestion-button"
                            key={`${round.title}-${index}-${option}`}
                            type="button"
                            onMouseDown={(event) => {
                              event.preventDefault()
                              onChangeKnockoutPrediction(round.title, index, option)
                              setActiveKnockoutField(null)
                            }}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            </article>
          )
        })}
      </div>
    </section>
  )
}
