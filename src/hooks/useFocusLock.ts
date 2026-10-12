import { useEffect, useSyncExternalStore } from 'react'
import { go, useRoute } from '@/app/router'
import { usePrefs, useTimerSnapshot } from '@/data/store'
import { AWAY_MIN_MS, awayMessage, canVisit, isLocked } from '@/domain/focusLock'
import * as timer from '@/services/timerService'

let unlocked: string | null = null
const subs = new Set<() => void>()
export const unlockSession = (id?: string) => { unlocked = id ?? null; subs.forEach(l => l()) }
const sub = (l: () => void) => { subs.add(l); return () => { subs.delete(l) } }

export function useFocusLock() {
  const { habits } = usePrefs(), t = useTimerSnapshot(), un = useSyncExternalStore(sub, () => unlocked)
  return { locked: isLocked(habits, t, un, t.sessionId), sessionId: t.sessionId }
}

/** Keeps the student on Focus while locked, asks before reload/close, and handles leaving the browser tab. */
export function useFocusGuards(toast: (m: string, k?: 'info' | 'err') => void) {
  const { locked } = useFocusLock(), { path } = useRoute(), { habits } = usePrefs(), t = useTimerSnapshot()
  useEffect(() => { if (!canVisit(locked, habits.focusOpen, path)) { toast('That page is closed during focus. Pause or stop to open it.', 'info'); go('focus') } }, [locked, path, habits.focusOpen])
  useEffect(() => {
    if (!locked) return
    const f = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = '' }
    addEventListener('beforeunload', f); return () => removeEventListener('beforeunload', f)
  }, [locked])
  const watching = habits.tabWarning !== 'off' && t.phase === 'focus' && t.status === 'running'
  useEffect(() => {
    if (!watching) return
    let left = 0, title = ''
    const f = () => {
      if (document.hidden) {
        left = Date.now(); title = document.title; document.title = 'Come back to focus · StudyFlow'
        if (habits.tabWarning === 'pause') void timer.pause()
      } else if (left) {
        const away = Date.now() - left; left = 0; if (title) document.title = title
        if (away >= AWAY_MIN_MS) toast(habits.tabWarning === 'pause' ? `${awayMessage(away)} The timer is paused, press Resume when ready.` : awayMessage(away), 'info')
      }
    }
    document.addEventListener('visibilitychange', f); return () => document.removeEventListener('visibilitychange', f)
  }, [watching, habits.tabWarning, toast])
}
