import type { FocusPreset, SessionType, StudySession, TimerSnapshot } from '@/types'
import { getAll, getPrefs, getTimer, put, setTimer } from '@/data/store'
import { BUILT_IN_PRESETS } from '@/data/defaults'
import { activeFocusMs, idleTimer, isExpired, nextPhase, pause as pauseS, phaseMs, resume as resumeS, startPhase } from '@/domain/timer'
import { nowIso, uid } from '@/domain/time'
import { chime, notify } from './platform'

/**
 * Timer runtime. Deadlines (timestamps) are the source of truth; the 500ms interval and the visibility handler only *check* them.
 * If the device sleeps or the tab is suspended, remaining time is recalculated on return; a focus phase that ended meanwhile is
 * recorded once (session id guard) with its planned duration. We cannot run while the browser is fully closed.
 */
export interface Completion { id: string; finished: SessionType; next: SessionType; sessionId: string; focusSeconds: number }
let completion: Completion | null = null
const subs = new Set<() => void>()
export const subscribeCompletion = (l: () => void) => { subs.add(l); return () => { subs.delete(l) } }
export const getCompletion = () => completion
export const dismissCompletion = () => { completion = null; subs.forEach(l => l()) }
const done = new Set<string>()

export const getPreset = (id?: string): FocusPreset => getAll<FocusPreset>('presets').find(p => p.id === (id ?? getPrefs().activePresetId)) ?? getAll<FocusPreset>('presets')[0] ?? BUILT_IN_PRESETS[0]

async function record(s: TimerSnapshot, status: StudySession['status'], now: number): Promise<StudySession | null> {
  if (!s.sessionId || s.phase === 'idle') return null
  const focus = s.phase === 'focus' ? Math.round(activeFocusMs(s, now) / 1000) : 0
  if (status !== 'completed' && s.phase === 'focus' && focus < 5) return null
  return put<Partial<StudySession>>('sessions', { id: s.sessionId, type: s.phase, status, subjectId: s.subjectId, taskId: s.taskId, intention: s.intention,
    startedAt: new Date(s.startedAt ?? now).toISOString(), endedAt: new Date(now).toISOString(), plannedSeconds: Math.round(s.plannedMs / 1000), actualFocusSeconds: focus, interruptionCount: s.interruptions }) as Promise<StudySession>
}

export function start(phase: SessionType = 'focus', opts: { subjectId?: string; taskId?: string; intention?: string; presetId?: string } = {}) {
  const cur = getTimer(); const preset = getPreset(opts.presetId ?? cur.presetId)
  const base = { ...(cur.status === 'idle' ? cur : idleTimer()), subjectId: opts.subjectId ?? cur.subjectId, taskId: opts.taskId ?? cur.taskId, intention: opts.intention ?? cur.intention }
  return setTimer(startPhase({ ...base, completedFocusSessions: cur.completedFocusSessions }, phase, preset, Date.now(), uid()))
}
export const pause = () => setTimer(pauseS(getTimer(), Date.now()))
export const resume = () => setTimer(resumeS(getTimer(), Date.now()))
export async function finish(status: 'interrupted' | 'cancelled' | 'skip' = 'interrupted') {
  const s = getTimer(); const now = Date.now()
  if (s.status === 'idle') return
  if (s.phase === 'focus') await record(s, status === 'cancelled' ? 'cancelled' : 'interrupted', now)
  else await record(s, status === 'cancelled' ? 'cancelled' : 'completed', now)
  if (status === 'skip') { const preset = getPreset(s.presetId); const n = nextPhase(s.phase as SessionType, s.completedFocusSessions, preset); return setTimer({ ...idleTimer(), presetId: s.presetId, subjectId: s.subjectId, taskId: s.taskId, completedFocusSessions: s.completedFocusSessions, phase: 'idle', plannedMs: phaseMs(preset, n) }).then(() => start(n)) }
  return setTimer({ ...idleTimer(), presetId: s.presetId, subjectId: s.subjectId, taskId: s.taskId, completedFocusSessions: s.completedFocusSessions })
}
export const reset = () => finish('cancelled')

async function complete() {
  const s = getTimer(); const id = s.sessionId
  if (!id || done.has(id) || s.status !== 'running') return
  done.add(id)
  const now = s.endsAt ?? Date.now()
  const rec = await record(s, 'completed', now)
  const preset = getPreset(s.presetId)
  const finished = s.phase as SessionType
  const completedFocus = s.completedFocusSessions + (finished === 'focus' ? 1 : 0)
  const next = nextPhase(finished, completedFocus, preset)
  const idle = { ...idleTimer(), presetId: s.presetId, subjectId: s.subjectId, taskId: s.taskId, intention: s.intention, completedFocusSessions: finished === 'long_break' ? 0 : completedFocus }
  await setTimer(idle)
  completion = { id: uid(), finished, next, sessionId: id, focusSeconds: rec?.actualFocusSeconds ?? 0 }
  subs.forEach(l => l())
  if (preset.soundEnabled) chime()
  notify(finished === 'focus' ? 'Focus session complete' : 'Break is over', finished === 'focus' ? `Nice work. Time for a ${next === 'long_break' ? 'long' : 'short'} break.` : 'Ready when you are.')
  const auto = finished === 'focus' ? preset.autoStartBreaks : preset.autoStartWork
  if (auto) { await start(next); dismissCompletion() }
}
export const tick = () => { const s = getTimer(); if (isExpired(s, Date.now())) void complete() }
let started = false
export function initTimerRuntime() {
  if (started) return; started = true
  setInterval(tick, 500)
  document.addEventListener('visibilitychange', () => { if (!document.hidden) tick() })
  addEventListener('focus', tick); tick()
}
