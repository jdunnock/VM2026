import { useEffect, useState } from 'react'
import { groupPlacementTemplates, knockoutPredictionTemplates } from '../constants'
import { fetchTips, saveTips, deleteTips, ApiError } from '../api'
import type {
  ExtraAnswers,
  FixtureTip,
  GroupPlacement,
  KnockoutPredictionRound,
  ParticipantSession,
} from '../types'
import { createDefaultFixtureTips, deriveSignFromScore, normalizeKnockoutPickLabel, normalizePersistedTipsState } from '../utils'

/**
 * Manages participant tips state: fixture tips, group placements, knockout predictions, extra answers.
 * Handles loading from API, mutations via handlers, and save/clear operations.
 */
export function useParticipantTips(participant: ParticipantSession | null, isGlobalLockActive: boolean, globalDeadlineLabel: string, onSessionInvalid?: () => void) {
  const [fixtureTips, setFixtureTips] = useState<FixtureTip[]>(createDefaultFixtureTips())
  const [groupPlacements, setGroupPlacements] = useState<GroupPlacement[]>(groupPlacementTemplates)
  const [knockoutPredictions, setKnockoutPredictions] = useState<KnockoutPredictionRound[]>(knockoutPredictionTemplates)
  const [extraAnswers, setExtraAnswers] = useState<ExtraAnswers>({})
  const [isTipsSaving, setIsTipsSaving] = useState(false)
  const [tipsSaveMessage, setTipsSaveMessage] = useState('Inte sparad ännu')
  const [myTipsSavedLabel, setMyTipsSavedLabel] = useState('Senast uppdaterad: inte sparad')
  const [lastSavedFixtureTips, setLastSavedFixtureTips] = useState<FixtureTip[]>([])
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Load tips from API when participant changes
  useEffect(() => {
    if (!participant) {
      setFixtureTips(createDefaultFixtureTips())
      setGroupPlacements(groupPlacementTemplates)
      setKnockoutPredictions(knockoutPredictionTemplates)
      setExtraAnswers({})
      setLastSavedFixtureTips([])
      setHasUnsavedChanges(false)
      setTipsSaveMessage('Inte sparad ännu')
      setMyTipsSavedLabel('Senast uppdaterad: inte sparad')
      return
    }

    const loadTips = async () => {
      try {
        const payload = await fetchTips(participant.participantId)
        const normalizedState = normalizePersistedTipsState(payload.tips)
        setFixtureTips(normalizedState.fixtureTips)
        setGroupPlacements(normalizedState.groupPlacements)
        setKnockoutPredictions(normalizedState.knockoutPredictions)
        setExtraAnswers(normalizedState.extraAnswers)

        setHasUnsavedChanges(false)
        if (payload.updatedAt) {
          setLastSavedFixtureTips(normalizedState.fixtureTips)
          const formatted = new Date(payload.updatedAt).toLocaleString('sv-SE')
          setTipsSaveMessage(`Sparad: ${formatted}`)
          setMyTipsSavedLabel(`Senast uppdaterad: ${formatted}`)
        } else {
          setTipsSaveMessage('Inte sparad ännu')
          setMyTipsSavedLabel('Senast uppdaterad: inte sparad')
        }
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          onSessionInvalid?.()
          return
        }
        setTipsSaveMessage('Kunde inte hämta sparade tips')
      }
    }

    loadTips()
  }, [participant])

  const onChangeTip = (
    match: string,
    key: 'homeScore' | 'awayScore' | 'sign',
    value: number | '' | '1' | 'X' | '2',
    _source: 'quick-score' | 'quick-sign' | 'fallback-score' | 'wheel-score' = 'quick-score',
  ) => {
    if (isGlobalLockActive) {
      return
    }

    setHasUnsavedChanges(true)
    setFixtureTips((current) =>
      current.map((tip) => {
        if (tip.match !== match || tip.status === 'Låst') {
          return tip
        }

        if (key === 'homeScore' || key === 'awayScore') {
          const scoreValue = typeof value === 'number' || value === '' ? value : tip[key]

          const nextTip: FixtureTip = {
            ...tip,
            [key]: scoreValue,
          }

          return {
            ...nextTip,
            sign: deriveSignFromScore(nextTip.homeScore, nextTip.awayScore),
          }
        }

        const signValue: FixtureTip['sign'] = value === '1' || value === 'X' || value === '2' ? value : ''

        return {
          ...tip,
          sign: signValue,
        }
      }),
    )
  }

  const onSetScorePreset = (match: string, home: number, away: number, _source: 'quick-score' | 'fallback-score' = 'quick-score') => {
    if (isGlobalLockActive) {
      return
    }

    setHasUnsavedChanges(true)
    setFixtureTips((current) =>
      current.map((tip) => {
        if (tip.match !== match || tip.status === 'Låst') {
          return tip
        }

        return {
          ...tip,
          homeScore: home,
          awayScore: away,
          sign: deriveSignFromScore(home, away),
        }
      }),
    )
  }

  const onChangeGroupPlacement = (group: string, index: number, value: string) => {
    if (isGlobalLockActive) {
      return
    }

    setHasUnsavedChanges(true)
    setGroupPlacements((current) =>
      current.map((item) => {
        if (item.group !== group) {
          return item
        }

        const nextPicks = [...item.picks]
        const previousValue = nextPicks[index]

        if (!value) {
          nextPicks[index] = ''

          return {
            ...item,
            picks: nextPicks,
          }
        }

        const existingIndex = nextPicks.findIndex((pick, pickIndex) => pickIndex !== index && pick === value)

        if (existingIndex >= 0) {
          nextPicks[existingIndex] = previousValue
        }

        nextPicks[index] = value

        return {
          ...item,
          picks: nextPicks,
        }
      }),
    )
  }

  const onChangeKnockoutPrediction = (roundTitle: string, index: number, value: string) => {
    if (isGlobalLockActive) {
      return
    }

    setHasUnsavedChanges(true)
    setKnockoutPredictions((current) =>
      current.map((round) => {
        if (round.title !== roundTitle) {
          return round
        }

        return {
          ...round,
          picks: round.picks.map((pick, pickIndex) => (pickIndex === index ? value : pick)),
        }
      }),
    )
  }

  const onToggleKnockoutPrediction = (roundTitle: string, teamName: string) => {
    if (isGlobalLockActive) {
      return
    }

    const normalizedTeamName = normalizeKnockoutPickLabel(teamName)
    if (!normalizedTeamName) {
      return
    }

    setHasUnsavedChanges(true)
    setKnockoutPredictions((current) =>
      current.map((round) => {
        if (round.title !== roundTitle) {
          return round
        }

        const selectedTeams = round.picks
          .map((pick) => normalizeKnockoutPickLabel(pick))
          .filter((pick) => pick.length > 0)

        const alreadySelected = selectedTeams.includes(normalizedTeamName)
        const nextSelectedTeams = selectedTeams.filter((pick) => pick !== normalizedTeamName)

        if (!alreadySelected && nextSelectedTeams.length < round.picks.length) {
          nextSelectedTeams.push(normalizedTeamName)
        }

        return {
          ...round,
          picks: [...nextSelectedTeams, ...Array.from({ length: round.picks.length - nextSelectedTeams.length }, () => '')],
        }
      }),
    )
  }

  const onChangeExtraAnswer = (questionId: number, answer: string) => {
    if (isGlobalLockActive) {
      return
    }

    setHasUnsavedChanges(true)
    setExtraAnswers((current) => {
      const next = { ...current }
      if (!answer) {
        delete next[String(questionId)]
        return next
      }

      next[String(questionId)] = answer
      return next
    })
  }

  const onSaveTips = async (onAfterSave?: () => Promise<void>) => {
    if (!participant) {
      return
    }

    if (isGlobalLockActive) {
      setTipsSaveMessage(`Tips är låsta sedan ${globalDeadlineLabel}`)
      return
    }

    setIsTipsSaving(true)
    setTipsSaveMessage('Sparar...')

    try {
      const payload = await saveTips(participant.participantId, {
        fixtureTips,
        groupPlacements,
        knockoutPredictions,
        extraAnswers,
      })

      const normalizedState = normalizePersistedTipsState(payload.tips)
      setFixtureTips(normalizedState.fixtureTips)
      setLastSavedFixtureTips(normalizedState.fixtureTips)
      setGroupPlacements(normalizedState.groupPlacements)
      setKnockoutPredictions(normalizedState.knockoutPredictions)
      setExtraAnswers(normalizedState.extraAnswers)
      const formatted = payload.updatedAt ? new Date(payload.updatedAt).toLocaleString('sv-SE') : new Date().toLocaleString('sv-SE')
      setHasUnsavedChanges(false)
      setTipsSaveMessage(`Sparad: ${formatted}`)
      setMyTipsSavedLabel(`Senast uppdaterad: ${formatted}`)

      await onAfterSave?.()
    } catch (err) {
      setTipsSaveMessage(err instanceof ApiError ? err.message : 'Kunde inte spara tips')
    } finally {
      setIsTipsSaving(false)
    }
  }

  const onClearTips = async (onAfterClear?: () => Promise<void>) => {
    if (!participant) {
      return
    }

    if (isGlobalLockActive) {
      setTipsSaveMessage(`Tips är låsta sedan ${globalDeadlineLabel}`)
      return
    }

    setIsTipsSaving(true)

    try {
      await deleteTips(participant.participantId)

      setFixtureTips(createDefaultFixtureTips())
      setGroupPlacements(groupPlacementTemplates)
      setKnockoutPredictions(knockoutPredictionTemplates)
      setExtraAnswers({})
      setLastSavedFixtureTips([])
      setHasUnsavedChanges(false)
      setTipsSaveMessage('Sparade tips rensade')
      setMyTipsSavedLabel('Senast uppdaterad: inte sparad')

      await onAfterClear?.()
    } catch {
      setTipsSaveMessage('Kunde inte rensa tips')
    } finally {
      setIsTipsSaving(false)
    }
  }

  return {
    fixtureTips,
    lastSavedFixtureTips,
    hasUnsavedChanges,
    groupPlacements,
    knockoutPredictions,
    extraAnswers,
    isTipsSaving,
    tipsSaveMessage,
    myTipsSavedLabel,
    onChangeTip,
    onSetScorePreset,
    onChangeGroupPlacement,
    onChangeKnockoutPrediction,
    onToggleKnockoutPrediction,
    onChangeExtraAnswer,
    onSaveTips,
    onClearTips,
  }
}
