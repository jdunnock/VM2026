import { useEffect, useState, useMemo } from 'react'

type KnockoutAdvancement = {
  id: number
  round: string
  teamName: string
  confirmedAt: string | null
  source: string
}

const ROUNDS = [
  { name: 'Sextondelsfinal', expectedTeams: 32 },
  { name: 'Åttondelsfinal', expectedTeams: 16 },
  { name: 'Kvartsfinal', expectedTeams: 8 },
  { name: 'Semifinal', expectedTeams: 4 },
  { name: 'Final', expectedTeams: 2 },
] as const

type AdminSlutspelTabProps = {
  getAdminHeaders: () => Record<string, string> | null
}

export function AdminSlutspelTab({ getAdminHeaders }: AdminSlutspelTabProps) {
  const [advancements, setAdvancements] = useState<KnockoutAdvancement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [teamInput, setTeamInput] = useState<Record<string, string>>({})
  const [savingRound, setSavingRound] = useState<string | null>(null)

  const loadAdvancements = async () => {
    const headers = getAdminHeaders()
    if (!headers) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/knockout-advancement', { headers })
      const payload = await response.json()
      if (response.ok) {
        setAdvancements(Array.isArray(payload.advancements) ? payload.advancements : [])
      }
    } catch {
      setMessage('Kunde inte hämta slutspelsdata.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAdvancements()
  }, [])

  const advancementsByRound = useMemo(() => {
    const map = new Map<string, KnockoutAdvancement[]>()
    for (const a of advancements) {
      if (!map.has(a.round)) map.set(a.round, [])
      map.get(a.round)!.push(a)
    }
    return map
  }, [advancements])

  const addTeam = async (round: string) => {
    const headers = getAdminHeaders()
    if (!headers) return

    const name = (teamInput[round] ?? '').trim()
    if (!name) {
      setMessage('Ange ett lagnamn.')
      return
    }

    setSavingRound(round)
    setMessage('')

    try {
      const response = await fetch('/api/admin/knockout-advancement', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ round, teamName: name }),
      })

      if (!response.ok) {
        const payload = await response.json()
        setMessage(payload.error ?? 'Kunde inte lägga till lag.')
        return
      }

      setTeamInput((prev) => ({ ...prev, [round]: '' }))
      setMessage(`${name} tillagd i ${round}.`)
      await loadAdvancements()
    } catch {
      setMessage('Kunde inte lägga till lag.')
    } finally {
      setSavingRound(null)
    }
  }

  const removeTeam = async (round: string, teamName: string) => {
    const headers = getAdminHeaders()
    if (!headers) return

    setSavingRound(round)
    setMessage('')

    try {
      const response = await fetch('/api/admin/knockout-advancement', {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ round, teamName }),
      })

      if (!response.ok) {
        const payload = await response.json()
        setMessage(payload.error ?? 'Kunde inte ta bort lag.')
        return
      }

      setMessage(`${teamName} borttagen från ${round}.`)
      await loadAdvancements()
    } catch {
      setMessage('Kunde inte ta bort lag.')
    } finally {
      setSavingRound(null)
    }
  }

  if (isLoading) {
    return (
      <section className="panel">
        <p>Laddar slutspelsdata...</p>
      </section>
    )
  }

  return (
    <>
      <section className="panel">
        <div className="section-heading compact">
          <p className="eyebrow">Slutspel</p>
          <h2>Avancemang per runda</h2>
        </div>
        <p className="lead-text">
          Markera vilka lag som avancerat till varje slutspelsrunda. Poängen beräknas automatiskt.
        </p>
        {message ? <p className="save-pill">{message}</p> : null}
      </section>

      {ROUNDS.map(({ name: round, expectedTeams }) => {
        const teams = advancementsByRound.get(round) ?? []
        const isFull = teams.length >= expectedTeams
        const isSaving = savingRound === round

        return (
          <section key={round} className={`panel slutspel-round-card ${isFull ? 'slutspel-settled' : ''}`}>
            <div className="matchday-card-header">
              <div>
                <strong>{round}</strong>
                <span className="score-breakdown-meta">
                  {teams.length}/{expectedTeams} lag
                </span>
              </div>
              {isFull && (
                <span className="result-status-pill completed">Komplett</span>
              )}
            </div>

            {teams.length > 0 && (
              <div className="slutspel-team-list">
                {teams.map((t) => (
                  <div key={t.teamName} className="slutspel-team-chip">
                    <span>{t.teamName}</span>
                    <button
                      className="slutspel-remove-btn"
                      type="button"
                      title={`Ta bort ${t.teamName}`}
                      disabled={isSaving}
                      onClick={() => removeTeam(round, t.teamName)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {!isFull && (
              <div className="slutspel-add-row">
                <input
                  className="special-input"
                  type="text"
                  placeholder="Lagnamn"
                  value={teamInput[round] ?? ''}
                  onChange={(e) => setTeamInput((prev) => ({ ...prev, [round]: e.target.value }))}
                  disabled={isSaving}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addTeam(round)
                    }
                  }}
                />
                <button
                  className="primary-button"
                  type="button"
                  disabled={isSaving || !(teamInput[round] ?? '').trim()}
                  onClick={() => addTeam(round)}
                >
                  {isSaving ? '...' : 'Lägg till'}
                </button>
              </div>
            )}
          </section>
        )
      })}
    </>
  )
}
