import { useEffect, useState } from 'react'
import { fetchPublicResults as apiFetchResults, fetchPublishedQuestions as apiFetchQuestions, fetchSimulationStatus as apiFetchSimulationStatus } from '../api'
import type { AdminQuestion, MatchResult, PageId, SimulationStatus } from '../types'

/**
 * Manages public data: match results and published questions.
 * Results load when activePage is 'mine' or 'alltips'.
 * Published questions reload on every page change.
 */
export function usePublicData(activePage: PageId) {
  const [results, setResults] = useState<MatchResult[]>([])
  const [publishedQuestions, setPublishedQuestions] = useState<AdminQuestion[]>([])
  const [simulationStatus, setSimulationStatus] = useState<SimulationStatus>({ command: null, displayCommand: null, updatedAt: null })

  // Load results when relevant pages are active
  useEffect(() => {
    if (activePage !== 'mine' && activePage !== 'alltips') return

    const load = async () => {
      try {
        setResults(await apiFetchResults())
      } catch {
        setResults([])
      }
    }
    load()
  }, [activePage])

  // Load published questions on page change
  useEffect(() => {
    const load = async () => {
      try {
        setPublishedQuestions(await apiFetchQuestions())
      } catch {
        setPublishedQuestions([])
      }

      try {
        setSimulationStatus(await apiFetchSimulationStatus())
      } catch {
        setSimulationStatus({ command: null, displayCommand: null, updatedAt: null })
      }
    }
    load()
  }, [activePage])

  return { results, publishedQuestions, simulationStatus }
}
