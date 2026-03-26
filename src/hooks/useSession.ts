import { useEffect, useState } from 'react'
import { ADMIN_SESSION_STORAGE_KEY, PARTICIPANT_STORAGE_KEY } from '../constants'
import type { AdminSession, ParticipantSession } from '../types'
import { tryParseJSON } from '../utils/parseJSON'

/**
 * Manages participant and admin session state with localStorage/sessionStorage persistence.
 * Handles initialization from storage and syncs updates back to storage.
 */
export function useSession() {
  const [participant, setParticipant] = useState<ParticipantSession | null>(null)
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  // Restore participant session from localStorage on mount
  useEffect(() => {
    const rawParticipant = localStorage.getItem(PARTICIPANT_STORAGE_KEY)
    if (!rawParticipant) {
      return
    }

    const parsed = tryParseJSON<ParticipantSession>(rawParticipant)
    if (!parsed.ok) {
      localStorage.removeItem(PARTICIPANT_STORAGE_KEY)
      return
    }

    if (parsed.value?.participantId && parsed.value?.name) {
      setParticipant(parsed.value)
      setIsLoggedIn(true)
    }
  }, [])

  // Restore admin session from sessionStorage on mount
  useEffect(() => {
    const rawAdminSession = sessionStorage.getItem(ADMIN_SESSION_STORAGE_KEY)
    if (!rawAdminSession) {
      return
    }

    const parsed = tryParseJSON<AdminSession>(rawAdminSession)
    if (!parsed.ok) {
      sessionStorage.removeItem(ADMIN_SESSION_STORAGE_KEY)
      return
    }

    if (parsed.value?.adminName && parsed.value?.adminCode) {
      setAdminSession(parsed.value)
    }
  }, [])

  // Persist participant session to localStorage whenever it changes
  useEffect(() => {
    if (!participant) {
      localStorage.removeItem(PARTICIPANT_STORAGE_KEY)
      return
    }

    localStorage.setItem(PARTICIPANT_STORAGE_KEY, JSON.stringify(participant))
  }, [participant])

  // Persist admin session to sessionStorage whenever it changes
  useEffect(() => {
    if (!adminSession) {
      sessionStorage.removeItem(ADMIN_SESSION_STORAGE_KEY)
      return
    }

    sessionStorage.setItem(ADMIN_SESSION_STORAGE_KEY, JSON.stringify(adminSession))
  }, [adminSession])

  return {
    participant,
    setParticipant,
    adminSession,
    setAdminSession,
    isLoggedIn,
    setIsLoggedIn,
  }
}
