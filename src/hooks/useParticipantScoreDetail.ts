import { useEffect, useState, useCallback } from 'react'
import { fetchParticipantScore as apiFetchScore } from '../api'
import type { PageId, ParticipantScoreDetail, ParticipantSession } from '../types'

/**
 * Manages participant score detail state.
 * Loads when participant exists and active page is 'mine'.
 * Exposes a reload function for use after tips save/clear.
 */
export function useParticipantScoreDetail(participant: ParticipantSession | null, activePage: PageId) {
  const [participantScoreDetail, setParticipantScoreDetail] = useState<ParticipantScoreDetail | null>(null)
  const [isParticipantScoreLoading, setIsParticipantScoreLoading] = useState(false)

  const loadParticipantScore = useCallback(async (participantId: number) => {
    setIsParticipantScoreLoading(true)
    try {
      setParticipantScoreDetail(await apiFetchScore(participantId))
    } catch {
      setParticipantScoreDetail(null)
    } finally {
      setIsParticipantScoreLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!participant) {
      setParticipantScoreDetail(null)
      return
    }
    if (activePage !== 'mine') return
    loadParticipantScore(participant.participantId)
  }, [participant, activePage, loadParticipantScore])

  return { participantScoreDetail, isParticipantScoreLoading, loadParticipantScore }
}
