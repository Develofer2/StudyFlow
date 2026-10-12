import type { FocusPreset, SessionType, TimerSnapshot } from '@/types'

export const MAX_SEGMENT_MS = 6 * 3600 * 1000 // clock-jump guard: no single segment counts more than 6h
export const idleTimer = (): TimerSnapshot => ({ phase: 'idle', status: 'idle', plannedMs: 0, accumulatedFocusMs: 0, completedFocusSessions: 0, interruptions: 0 })

export function validatePreset(p: Pick<FocusPreset, 'name' | 'workMinutes' | 'shortBreakMinutes' | 'longBreakMinutes' | 'sessionsBeforeLongBreak'>) {
  const e: Record<string, string> = {}
  if (!p.name.trim()) e.name = 'Give the preset a name.'
  const chk = (k: string, v: number, lo: number, hi: number, label: string) => {
    if (!Number.isFinite(v) || !Number.isInteger(v)) e[k] = `${label} must be a whole number.`
    else if (v < lo || v > hi) e[k] = `${label} must be between ${lo} and ${hi}.`
  }
  chk('workMinutes', p.workMinutes, 1, 180, 'Focus length')
  chk('shortBreakMinutes', p.shortBreakMinutes, 1, 60, 'Short break')
  chk('longBreakMinutes', p.longBreakMinutes, 1, 90, 'Long break')
  chk('sessionsBeforeLongBreak', p.sessionsBeforeLongBreak, 2, 12, 'Sessions before long break')
  return e
}

export const phaseMs = (preset: FocusPreset, phase: SessionType) =>
  (phase === 'focus' ? preset.workMinutes : phase === 'short_break' ? preset.shortBreakMinutes : preset.longBreakMinutes) * 60000

export function startPhase(prev: TimerSnapshot, phase: SessionType, preset: FocusPreset, now: number, sessionId: string): TimerSnapshot {
  const plannedMs = phaseMs(preset, phase)
  return { ...prev, phase, status: 'running', presetId: preset.id, plannedMs, startedAt: now, segmentStart: now, endsAt: now + plannedMs,
    pausedRemainingMs: undefined, accumulatedFocusMs: 0, interruptions: 0, sessionId }
}
export const remainingMs = (s: TimerSnapshot, now: number) =>
  s.status === 'running' && s.endsAt ? Math.max(0, s.endsAt - now) : s.status === 'paused' ? s.pausedRemainingMs ?? 0 : s.plannedMs

/** Active focus time so far. Paused time and break phases never count. */
export function activeFocusMs(s: TimerSnapshot, now: number) {
  if (s.phase !== 'focus') return 0
  let ms = s.accumulatedFocusMs
  if (s.status === 'running' && s.segmentStart) ms += Math.min(Math.max(0, Math.min(now, s.endsAt ?? now) - s.segmentStart), MAX_SEGMENT_MS)
  return Math.min(ms, s.plannedMs)
}
export function pause(s: TimerSnapshot, now: number): TimerSnapshot {
  if (s.status !== 'running') return s
  const rem = remainingMs(s, now)
  return { ...s, accumulatedFocusMs: s.phase === 'focus' ? activeFocusMs(s, now) : 0, status: 'paused', pausedRemainingMs: rem, endsAt: undefined, segmentStart: undefined, interruptions: s.interruptions + 1 }
}
export function resume(s: TimerSnapshot, now: number): TimerSnapshot {
  if (s.status !== 'paused') return s
  return { ...s, status: 'running', endsAt: now + (s.pausedRemainingMs ?? 0), segmentStart: now, pausedRemainingMs: undefined }
}
export const isExpired = (s: TimerSnapshot, now: number) => s.status === 'running' && !!s.endsAt && now >= s.endsAt

/** Which phase follows a finished one. */
export function nextPhase(finished: SessionType, completedFocusAfter: number, preset: FocusPreset): SessionType {
  if (finished !== 'focus') return 'focus'
  return completedFocusAfter % preset.sessionsBeforeLongBreak === 0 ? 'long_break' : 'short_break'
}
