import type { SessionType } from '@/types'

export type BuddyState = 'idle' | 'preparing' | 'starting' | 'focusing' | 'break' | 'completed' | 'goal' | 'paused' | 'resting' | 'returning'
export const BUDDY_STATES: BuddyState[] = ['idle', 'preparing', 'starting', 'focusing', 'break', 'completed', 'goal', 'paused', 'resting', 'returning']
export const STARTING_MS = 20_000
export const RETURNING_MS = 15_000
export const CELEBRATE_MS = 60_000
export const REST_AFTER_MS = 3 * 3600_000
export const ABSENT_MS = 48 * 3600_000
export const isNight = (hour: number) => hour >= 22 || hour < 6

export interface BuddyInput {
  phase: 'idle' | SessionType; status: 'idle' | 'running' | 'paused'
  elapsedMs: number; remainingMs: number
  completion?: { finished: SessionType; sinceMs: number } | null
  goalReached: boolean; preparing: boolean
  /** ms since the last finished session, null when there is none */
  idleForMs: number | null; hour: number
}

/** Pure and deterministic: the same snapshot always gives the same state. */
export function deriveBuddyState(i: BuddyInput): BuddyState {
  if (i.status === 'paused') return 'paused'
  if (i.status === 'running') {
    if (i.phase === 'focus') return i.elapsedMs < STARTING_MS ? 'starting' : 'focusing'
    return i.remainingMs <= RETURNING_MS ? 'returning' : 'break'
  }
  const c = i.completion
  if (c && c.sinceMs < CELEBRATE_MS) return c.finished === 'focus' ? (i.goalReached ? 'goal' : 'completed') : 'returning'
  if (i.preparing) return 'preparing'
  if (i.idleForMs !== null && i.idleForMs >= ABSENT_MS) return 'returning'
  if (isNight(i.hour) || (i.idleForMs !== null && i.idleForMs >= REST_AFTER_MS)) return 'resting'
  return 'idle'
}

export const STATE_LABEL: Record<BuddyState, string> = {
  idle: 'Waiting with you', preparing: 'Getting ready', starting: 'Settling in', focusing: 'Studying beside you', break: 'On a break', completed: 'Happy with that session',
  goal: 'Celebrating your daily goal', paused: 'Paused', resting: 'Resting', returning: 'Welcome back',
}
