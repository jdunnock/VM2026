import { useEffect, useState } from 'react'
import { fetchAllTips as apiFetchAllTips, fetchCorrectnessData as apiFetchCorrectness } from '../api'
import type { AllTipsParticipant, CorrectnessData, PageId } from '../types'

/**
 * Manages all-tips page data: all participants' tips and correctness data.
 * Only loads when activePage is 'alltips'.
 */
export function useAllTipsData(activePage: PageId) {
  const [allTipsParticipants, setAllTipsParticipants] = useState<AllTipsParticipant[]>([])
  const [isAllTipsLoading, setIsAllTipsLoading] = useState(false)
  const [correctnessData, setCorrectnessData] = useState<CorrectnessData | null>(null)

  useEffect(() => {
    if (activePage !== 'alltips') return

    const loadAllTips = async () => {
      setIsAllTipsLoading(true)
      try {
        setAllTipsParticipants(await apiFetchAllTips())
      } catch {
        setAllTipsParticipants([])
      } finally {
        setIsAllTipsLoading(false)
      }
    }

    const loadCorrectness = async () => {
      try {
        setCorrectnessData(await apiFetchCorrectness())
      } catch {
        setCorrectnessData(null)
      }
    }

    loadAllTips()
    loadCorrectness()
  }, [activePage])

  return { allTipsParticipants, isAllTipsLoading, correctnessData }
}
