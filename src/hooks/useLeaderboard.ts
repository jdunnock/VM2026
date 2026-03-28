import { useEffect, useState, useCallback } from 'react'
import { fetchLeaderboard as apiFetchLeaderboard } from '../api'
import type { LeaderboardEntry, ParticipantSession } from '../types'

/**
 * Manages leaderboard state. Loads on mount and when participant changes.
 * Exposes a reload function for use after tips save/clear.
 */
export function useLeaderboard(participant: ParticipantSession | null) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])

  const loadLeaderboard = useCallback(async () => {
    try {
      setLeaderboard(await apiFetchLeaderboard())
    } catch {
      setLeaderboard([])
    }
  }, [])

  useEffect(() => {
    loadLeaderboard()
  }, [participant, loadLeaderboard])

  return { leaderboard, loadLeaderboard }
}
