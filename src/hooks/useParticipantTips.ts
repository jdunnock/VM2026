import { useEffect, useState } from 'react'
import { defaultSpecialPredictions, groupPlacementTemplates, knockoutPredictionTemplates } from '../constants'
import type {
  ExtraAnswers,
  FixtureTip,
  GroupPlacement,
  KnockoutPredictionRound,
  ParticipantSession,
  SpecialPredictions,
} from '../types'
import { createDefaultFixtureTips, deriveSignFromScore, normalizePersistedTipsState } from '../utils'

/**
 * Manages participant tips state: fixture tips, group placements, knockout predictions, special predictions, extra answers.
 * Handles loading from /api/tips, mutations via handlers, and save/clear operations.
 * Syncs state with localStorage and manages save/clear messaging.
 */
export function useParticipantTips(participant: ParticipantSession | null, isGlobalLockActive: boolean, globalDeadlineLabel: string) {
  const [fixtureTips, setFixtureTips] = useState<FixtureTip[]>(createDefaultFixtureTips())
  const [groupPlacements, setGroupPlacements] = useState<GroupPlacement[]>(groupPlacementTemplates)
  const [knockoutPredictions, setKnockoutPredictions] = useState<KnockoutPredictionRound[]>(knockoutPredictionTemplates)
  const [specialPredictions, setSpecialPredictions] = useState<SpecialPredictions>(defaultSpecialPredictions)
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
      setSpecialPredictions(defaultSpecialPredictions)
      setExtraAnswers({})
      setLastSavedFixtureTips([])
      setHasUnsavedChanges(false)
      setTipsSaveMessage('Inte sparad ännu')
      setMyTipsSavedLabel('Senast uppdaterad: inte sparad')
      return
    }

    const loadTips = async () => {
      try {
        const response = await fetch(`/api/tips/${participant.participantId}`)
        if (!response.ok) {
          setTipsSaveMessage('Kunde inte hämta sparade tips')
          return
        }

        const payload = await response.json()
        const normalizedState = normalizePersistedTipsState(payload.tips)
        setFixtureTips(normalizedState.fixtureTips)
        setGroupPlacements(normalizedState.groupPlacements)
        setKnockoutPredictions(normalizedState.knockoutPredictions)
        setSpecialPredictions(normalizedState.specialPredictions)
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
      } catch {
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

          if (_source === 'wheel-score') {
            if (key === 'homeScore' && nextTip.awayScore === '') {
              nextTip.awayScore = 0
            }

            if (key === 'awayScore' && nextTip.homeScore === '') {
              nextTip.homeScore = 0
            }
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

  const onChangeSpecialPrediction = (key: keyof SpecialPredictions, value: string) => {
    if (isGlobalLockActive) {
      return
    }

    setHasUnsavedChanges(true)
    setSpecialPredictions((current) => ({
      ...current,
      [key]: value,
    }))
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

  const onSaveTips = async (onLoadLeaderboard?: () => Promise<void>, onLoadScore?: (pid: number) => Promise<void>) => {
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
      const response = await fetch(`/api/tips/${participant.participantId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tips: {
            fixtureTips,
            groupPlacements,
            knockoutPredictions,
            specialPredictions,
            extraAnswers,
          },
        }),
      })

      const payload = await response.json()
      if (!response.ok) {
        setTipsSaveMessage(payload.error ?? 'Kunde inte spara tips')
        return
      }

      const normalizedState = normalizePersistedTipsState(payload.tips)
      setFixtureTips(normalizedState.fixtureTips)
      setLastSavedFixtureTips(normalizedState.fixtureTips)
      setGroupPlacements(normalizedState.groupPlacements)
      setKnockoutPredictions(normalizedState.knockoutPredictions)
      setSpecialPredictions(normalizedState.specialPredictions)
      setExtraAnswers(normalizedState.extraAnswers)
      const formatted = payload.updatedAt ? new Date(payload.updatedAt).toLocaleString('sv-SE') : new Date().toLocaleString('sv-SE')
      setHasUnsavedChanges(false)
      setTipsSaveMessage(`Sparad: ${formatted}`)
      setMyTipsSavedLabel(`Senast uppdaterad: ${formatted}`)

      if (onLoadLeaderboard) {
        await onLoadLeaderboard()
      }

      if (onLoadScore) {
        await onLoadScore(participant.participantId)
      }
    } catch {
      setTipsSaveMessage('Kunde inte spara tips')
    } finally {
      setIsTipsSaving(false)
    }
  }

  const onClearTips = async (onLoadLeaderboard?: () => Promise<void>, onLoadScore?: (pid: number) => Promise<void>) => {
    if (!participant) {
      return
    }

    if (isGlobalLockActive) {
      setTipsSaveMessage(`Tips är låsta sedan ${globalDeadlineLabel}`)
      return
    }

    setIsTipsSaving(true)

    try {
      const response = await fetch(`/api/tips/${participant.participantId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        setTipsSaveMessage('Kunde inte rensa tips')
        return
      }

      setFixtureTips(createDefaultFixtureTips())
      setGroupPlacements(groupPlacementTemplates)
      setKnockoutPredictions(knockoutPredictionTemplates)
      setSpecialPredictions(defaultSpecialPredictions)
      setExtraAnswers({})
      setLastSavedFixtureTips([])
      setHasUnsavedChanges(false)
      setTipsSaveMessage('Sparade tips rensade')
      setMyTipsSavedLabel('Senast uppdaterad: inte sparad')

      if (onLoadLeaderboard) {
        await onLoadLeaderboard()
      }

      if (onLoadScore) {
        await onLoadScore(participant.participantId)
      }
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
    specialPredictions,
    extraAnswers,
    isTipsSaving,
    tipsSaveMessage,
    myTipsSavedLabel,
    onChangeTip,
    onSetScorePreset,
    onChangeGroupPlacement,
    onChangeKnockoutPrediction,
    onChangeSpecialPrediction,
    onChangeExtraAnswer,
    onSaveTips,
    onClearTips,
  }
}
