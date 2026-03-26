import { useEffect, useMemo, useState } from 'react'
import type { AdminFixtureTemplate, MatchResult, MatchResultStage } from '../types'

function matchesResultQuery(values: Array<string | null | undefined>, query: string) {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) {
    return true
  }

  return values.some((value) => String(value ?? '').toLowerCase().includes(normalizedQuery))
}

export function useFixtureFilter(fixtures: AdminFixtureTemplate[], results: MatchResult[]) {
  const [resultFilterStage, setResultFilterStage] = useState<'all' | MatchResultStage>('group')
  const [resultSearchQuery, setResultSearchQuery] = useState('')
  const [selectedMatchId, setSelectedMatchId] = useState(fixtures[0]?.matchId ?? '')

  const filteredFixtures = useMemo(
    () =>
      fixtures.filter((fixture) => {
        if (resultFilterStage !== 'all' && fixture.stage !== resultFilterStage) {
          return false
        }

        return matchesResultQuery(
          [fixture.matchId, fixture.homeTeam, fixture.awayTeam, fixture.groupCode ?? '', fixture.round ?? ''],
          resultSearchQuery,
        )
      }),
    [fixtures, resultFilterStage, resultSearchQuery],
  )

  const filteredSavedResults = useMemo(
    () =>
      results.filter((entry) => {
        if (resultFilterStage !== 'all' && entry.stage !== resultFilterStage) {
          return false
        }

        return matchesResultQuery(
          [entry.matchId, entry.homeTeam, entry.awayTeam, entry.groupCode ?? '', entry.round ?? ''],
          resultSearchQuery,
        )
      }),
    [results, resultFilterStage, resultSearchQuery],
  )

  useEffect(() => {
    if (filteredFixtures.length === 0) {
      setSelectedMatchId('')
      return
    }

    if (!filteredFixtures.some((fixture) => fixture.matchId === selectedMatchId)) {
      setSelectedMatchId(filteredFixtures[0].matchId)
    }
  }, [filteredFixtures, selectedMatchId])

  const selectedFixture = useMemo(
    () => fixtures.find((fixture) => fixture.matchId === selectedMatchId) ?? null,
    [fixtures, selectedMatchId],
  )

  return {
    resultFilterStage,
    setResultFilterStage,
    resultSearchQuery,
    setResultSearchQuery,
    selectedMatchId,
    setSelectedMatchId,
    filteredFixtures,
    filteredSavedResults,
    selectedFixture,
  }
}
