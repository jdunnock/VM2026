import { useEffect, useState } from 'react'
import { GLOBAL_DEADLINE_FALLBACK } from '../constants'
import type { PageId } from '../types'

/**
 * Manages global deadline configuration, phase visibility rules, and page normalization.
 * Handles global deadline fetching, phase-based page routing normalization,
 * and admin shortcut listener.
 */
export function usePhaseRouting() {
  const [globalDeadlineStr, setGlobalDeadlineStr] = useState(GLOBAL_DEADLINE_FALLBACK)
  const [activePage, setActivePage] = useState<PageId>('start')

  const isGlobalLockActive = Date.now() >= new Date(globalDeadlineStr).getTime()
  const globalDeadlineLabel = new Date(globalDeadlineStr).toLocaleString('sv-SE')
  const effectiveLifecyclePhase = isGlobalLockActive ? 'C' : 'B'
  const isTrackingPhaseActive = effectiveLifecyclePhase === 'C'

  // Fetch global deadline from /api/config on mount
  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => {
        if (typeof data?.globalDeadline === 'string' && data.globalDeadline) {
          setGlobalDeadlineStr(data.globalDeadline)
        }
      })
      .catch(() => {
        // silently fall back to GLOBAL_DEADLINE_FALLBACK
      })
  }, [])

  // Normalize page for phase visibility rules
  const normalizePageForPhase = (page: PageId): PageId => {
    if (isTrackingPhaseActive && page === 'tips') {
      return 'mine'
    }

    if (!isTrackingPhaseActive && page === 'results') {
      return 'tips'
    }

    return page
  }

  // Keep active page aligned with current lifecycle phase visibility rules
  useEffect(() => {
    const normalizedPage = normalizePageForPhase(activePage)
    if (normalizedPage !== activePage) {
      setActivePage(normalizedPage)
    }
  }, [isTrackingPhaseActive, activePage])

  // Admin shortcut listener (Alt+Shift+A)
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isAdminShortcutKey = event.code === 'KeyA' || event.key.toLowerCase() === 'a'
      if (event.altKey && event.shiftKey && isAdminShortcutKey) {
        setActivePage('admin')
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return {
    globalDeadlineStr,
    activePage,
    setActivePage,
    isGlobalLockActive,
    globalDeadlineLabel,
    effectiveLifecyclePhase,
    isTrackingPhaseActive,
    normalizePageForPhase,
  }
}
