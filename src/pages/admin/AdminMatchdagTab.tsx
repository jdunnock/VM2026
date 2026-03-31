import { useState, useMemo } from 'react'
import type { MatchResult, MatchResultStatus } from '../../types'

type MatchDayGroup = {
  dateLabel: string
  dateKey: string
  matches: MatchResult[]
  completedCount: number
}

type AdminMatchdagTabProps = {
  results: MatchResult[]
  isResultsLoading: boolean
  getAdminHeaders: () => Record<string, string> | null
  onResultSaved: () => void
}

function parseDateKey(kickoffAt: string): string {
  // kickoffAt format: "2026-06-11 19:00" or ISO
  return kickoffAt.slice(0, 10)
}

function formatDateLabel(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number)
  const months = [
    'januari', 'februari', 'mars', 'april', 'maj', 'juni',
    'juli', 'augusti', 'september', 'oktober', 'november', 'december',
  ]
  return `${day} ${months[month - 1]} ${year}`
}

export function AdminMatchdagTab({
  results,
  isResultsLoading,
  getAdminHeaders,
  onResultSaved,
}: AdminMatchdagTabProps) {
  const [savingMatchId, setSavingMatchId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [editScores, setEditScores] = useState<Record<string, { home: string; away: string }>>({})

  const groupResults = useMemo(
    () => results.filter((r) => r.stage === 'group'),
    [results],
  )

  const matchDays = useMemo(() => {
    const dayMap = new Map<string, MatchResult[]>()
    for (const match of groupResults) {
      const key = parseDateKey(match.kickoffAt)
      if (!dayMap.has(key)) dayMap.set(key, [])
      dayMap.get(key)!.push(match)
    }

    const days: MatchDayGroup[] = []
    for (const [dateKey, matches] of [...dayMap.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
      days.push({
        dateKey,
        dateLabel: formatDateLabel(dateKey),
        matches: matches.sort((a, b) => a.kickoffAt.localeCompare(b.kickoffAt)),
        completedCount: matches.filter((m) => m.resultStatus === 'completed').length,
      })
    }
    return days
  }, [groupResults])

  const [selectedDayIndex, setSelectedDayIndex] = useState(0)
  const currentDay = matchDays[selectedDayIndex] ?? null

  const getScoreInput = (matchId: string, match: MatchResult) => {
    if (editScores[matchId]) return editScores[matchId]
    return {
      home: match.homeScore !== null ? String(match.homeScore) : '',
      away: match.awayScore !== null ? String(match.awayScore) : '',
    }
  }

  const setScore = (matchId: string, field: 'home' | 'away', value: string) => {
    const match = groupResults.find((r) => r.matchId === matchId)
    if (!match) return
    const current = getScoreInput(matchId, match)
    setEditScores((prev) => ({
      ...prev,
      [matchId]: { ...current, [field]: value },
    }))
  }

  const saveMatch = async (match: MatchResult) => {
    const headers = getAdminHeaders()
    if (!headers) {
      setMessage('Admin-inloggning krävs.')
      return
    }

    const scores = getScoreInput(match.matchId, match)
    const homeScore = scores.home.trim()
    const awayScore = scores.away.trim()

    if (homeScore === '' || awayScore === '') {
      setMessage('Fyll i båda målen.')
      return
    }

    const homeNum = Number(homeScore)
    const awayNum = Number(awayScore)
    if (!Number.isInteger(homeNum) || !Number.isInteger(awayNum) || homeNum < 0 || awayNum < 0) {
      setMessage('Ogiltiga målvärden.')
      return
    }

    setSavingMatchId(match.matchId)
    setMessage('Sparar...')

    try {
      const response = await fetch(`/api/admin/results/${match.matchId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          stage: match.stage,
          round: match.round ?? '',
          groupCode: match.groupCode ?? '',
          homeTeam: match.homeTeam,
          awayTeam: match.awayTeam,
          kickoffAt: match.kickoffAt,
          homeScore: homeNum,
          awayScore: awayNum,
          resultStatus: 'completed' as MatchResultStatus,
          settledAt: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        const payload = await response.json()
        setMessage(payload.error ?? 'Kunde inte spara.')
        return
      }

      setMessage(`${match.homeTeam} - ${match.awayTeam}: ${homeNum}-${awayNum} sparat.`)
      setEditScores((prev) => {
        const next = { ...prev }
        delete next[match.matchId]
        return next
      })
      onResultSaved()
    } catch {
      setMessage('Kunde inte spara matchresultat.')
    } finally {
      setSavingMatchId(null)
    }
  }

  if (isResultsLoading) {
    return (
      <section className="panel">
        <p>Laddar matcher...</p>
      </section>
    )
  }

  if (matchDays.length === 0) {
    return (
      <section className="panel">
        <div className="section-heading compact">
          <p className="eyebrow">Matchdag</p>
          <h2>Gruppspelsresultat</h2>
        </div>
        <div className="lock-warning">
          <p>Inga matcher ännu — turneringen börjar 11 juni 2026.</p>
        </div>
      </section>
    )
  }

  return (
    <>
      <section className="panel">
        <div className="section-heading compact">
          <p className="eyebrow">Matchdag</p>
          <h2>Gruppspelsresultat</h2>
        </div>

        <div className="matchday-nav">
          <button
            className="ghost-button"
            type="button"
            disabled={selectedDayIndex <= 0}
            onClick={() => setSelectedDayIndex((i) => Math.max(0, i - 1))}
          >
            ←
          </button>
          <span className="matchday-label">
            {currentDay?.dateLabel ?? '—'}
          </span>
          <button
            className="ghost-button"
            type="button"
            disabled={selectedDayIndex >= matchDays.length - 1}
            onClick={() => setSelectedDayIndex((i) => Math.min(matchDays.length - 1, i + 1))}
          >
            →
          </button>
        </div>

        {currentDay && (
          <p className="status-note">
            {currentDay.completedCount}/{currentDay.matches.length} avgjorda
          </p>
        )}

        {message ? <p className="save-pill">{message}</p> : null}
      </section>

      {currentDay?.matches.map((match) => {
        const scores = getScoreInput(match.matchId, match)
        const isCompleted = match.resultStatus === 'completed'
        const isSaving = savingMatchId === match.matchId

        return (
          <section key={match.matchId} className={`panel matchday-card ${isCompleted ? 'matchday-completed' : ''}`}>
            <div className="matchday-card-header">
              <div>
                <strong>{match.homeTeam} - {match.awayTeam}</strong>
                <span className="score-breakdown-meta">
                  {match.matchId} · Grupp {match.groupCode} · {match.kickoffAt.slice(11, 16)}
                </span>
              </div>
              {isCompleted && (
                <span className="result-status-pill completed">Avgjord</span>
              )}
            </div>

            <div className="matchday-score-row">
              <label className="matchday-score-label">
                <span>{match.homeTeam}</span>
                <input
                  className="special-input matchday-score-input"
                  type="number"
                  min={0}
                  max={99}
                  value={scores.home}
                  onChange={(e) => setScore(match.matchId, 'home', e.target.value)}
                  disabled={isSaving}
                />
              </label>
              <span className="matchday-dash">–</span>
              <label className="matchday-score-label">
                <span>{match.awayTeam}</span>
                <input
                  className="special-input matchday-score-input"
                  type="number"
                  min={0}
                  max={99}
                  value={scores.away}
                  onChange={(e) => setScore(match.matchId, 'away', e.target.value)}
                  disabled={isSaving}
                />
              </label>
            </div>

            <button
              className="primary-button"
              type="button"
              disabled={isSaving}
              onClick={() => saveMatch(match)}
            >
              {isSaving ? 'Sparar...' : isCompleted ? 'Uppdatera resultat' : 'Spara resultat'}
            </button>
          </section>
        )
      })}
    </>
  )
}
