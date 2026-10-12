import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { usePrefs, useTimerSnapshot } from '@/data/store'
import { buddyDefaultName } from '@/domain/catalog'
import { CELEBRATE_MS, deriveBuddyState, type BuddyState } from '@/domain/buddyState'
import { pickMessage } from '@/domain/buddyMessages'
import { QUOTE_EVERY_MS, pickQuote } from '@/domain/buddyQuotes'
import { remainingMs } from '@/domain/timer'
import { useStats } from '@/hooks/useStats'
import { getCompletion, subscribeCompletion } from '@/services/timerService'

/** Live buddy state from the real timer, completion events, today's goal and recent activity. Ticks fast only while something is moving. */
export function useBuddy({ preparing = false }: { preparing?: boolean } = {}) {
  const snap = useTimerSnapshot(), prefs = usePrefs(), stats = useStats(), b = prefs.buddy2
  const completion = useSyncExternalStore(subscribeCompletion, getCompletion)
  const [seen, setSeen] = useState<{ id: string; at: number } | null>(null)
  const [now, setNow] = useState(Date.now())
  useEffect(() => { if (completion && seen?.id !== completion.id) setSeen({ id: completion.id, at: Date.now() }) }, [completion, seen?.id])
  const fast = snap.status !== 'idle' || (!!seen && now - seen.at < CELEBRATE_MS + 1000)
  useEffect(() => { setNow(Date.now()); const id = setInterval(() => setNow(Date.now()), fast ? 1000 : 30000); return () => clearInterval(id) }, [fast])
  const lastEnd = useMemo(() => stats.sessions.reduce((a, s) => (s.status !== 'cancelled' && s.endedAt ? Math.max(a, Date.parse(s.endedAt)) : a), 0), [stats.sessions])
  const rem = snap.status === 'idle' ? 0 : remainingMs(snap, now)
  const goalReached = stats.todaySeconds >= prefs.dailyGoalMinutes * 60
  const state: BuddyState = deriveBuddyState({
    phase: snap.phase, status: snap.status, elapsedMs: snap.status === 'idle' ? 0 : snap.plannedMs - rem, remainingMs: rem,
    completion: completion && seen?.id === completion.id ? { finished: completion.finished, sinceMs: now - seen.at } : null,
    goalReached, preparing, idleForMs: lastEnd ? now - lastEnd : null, hour: new Date(now).getHours(),
  })
  const elapsedBucket = snap.status === 'idle' ? 0 : Math.floor((snap.plannedMs - rem) / 360000)
  const seed = `${stats.today}|${completion?.id ?? ''}|${elapsedBucket}|${new Date(now).getHours()}`
  const quoteSlot = snap.status === 'idle' ? 0 : Math.floor((snap.plannedMs - rem) / QUOTE_EVERY_MS)
  const isQuote = state === 'focusing' && quoteSlot >= 1
  const message = isQuote ? pickQuote(b.style, `${snap.sessionId ?? ''}|${quoteSlot}`) : pickMessage(state, b.style, seed)
  return { state, message, isQuote, kind: b.kind, name: b.names[b.kind]?.trim() || buddyDefaultName(b.kind), prefs: b, snap, minutesToday: Math.round(stats.todaySeconds / 60), goalReached, remainingMs: rem }
}
