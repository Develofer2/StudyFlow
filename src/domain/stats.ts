import type { StudySession, StudyTask } from '@/types'
import { addDays, dayKey, daysBetween, diffDays, previousRange, type Range } from './time'

/** Focus time policy: only `focus` sessions; completed AND interrupted sessions contribute their ACTUAL active seconds; cancelled sessions contribute nothing. */
export const countsAsFocus = (s: StudySession) => s.type === 'focus' && (s.status === 'completed' || s.status === 'interrupted') && s.actualFocusSeconds > 0
export const isCompletedFocus = (s: StudySession) => s.type === 'focus' && s.status === 'completed'

export function focusByDay(sessions: StudySession[], tz: string): Map<string, number> {
  const m = new Map<string, number>()
  for (const s of sessions) if (countsAsFocus(s)) { const k = dayKey(s.startedAt, tz); m.set(k, (m.get(k) ?? 0) + s.actualFocusSeconds) }
  return m
}
export function daySeries(sessions: StudySession[], range: Range, tz: string) {
  const m = focusByDay(sessions, tz)
  return daysBetween(range.from, range.to).map(day => ({ day, seconds: m.get(day) ?? 0, minutes: Math.round((m.get(day) ?? 0) / 60) }))
}
export const inRange = (iso: string | undefined, r: Range, tz: string) => !!iso && dayKey(iso, tz) >= r.from && dayKey(iso, tz) <= r.to
export function sessionsIn(sessions: StudySession[], r: Range, tz: string) { return sessions.filter(s => inRange(s.startedAt, r, tz)) }
export const totalFocusSeconds = (sessions: StudySession[]) => sessions.filter(countsAsFocus).reduce((a, s) => a + s.actualFocusSeconds, 0)

export function bySubject(sessions: StudySession[]) {
  const m = new Map<string, number>()
  for (const s of sessions) if (countsAsFocus(s)) m.set(s.subjectId ?? '', (m.get(s.subjectId ?? '') ?? 0) + s.actualFocusSeconds)
  return [...m.entries()].map(([subjectId, seconds]) => ({ subjectId, seconds })).sort((a, b) => b.seconds - a.seconds)
}

export function streaks(byDay: Map<string, number>, goalSeconds: number, today: string, grace: boolean) {
  const days = [...byDay.entries()].filter(([k, v]) => v >= goalSeconds && k <= today).map(([k]) => k).sort()
  if (!days.length) return { current: 0, longest: 0 }
  const maxGap = grace ? 2 : 1
  let longest = 1, run = 1
  for (let i = 1; i < days.length; i++) { run = diffDays(days[i], days[i - 1]) <= maxGap ? run + 1 : 1; longest = Math.max(longest, run) }
  let current = 1
  const last = days[days.length - 1]
  if (diffDays(today, last) > maxGap) return { current: 0, longest }
  for (let i = days.length - 1; i > 0; i--) { if (diffDays(days[i], days[i - 1]) <= maxGap) current++; else break }
  return { current, longest }
}

export function taskStats(tasks: StudyTask[], r: Range, tz: string) {
  const completed = tasks.filter(t => t.completedAt && inRange(t.completedAt, r, tz)).length
  const due = tasks.filter(t => t.dueAt && inRange(t.dueAt, r, tz))
  const dueDone = due.filter(t => t.status === 'done').length
  return { completed, dueCount: due.length, rate: due.length ? dueDone / due.length : null }
}

export function weeklyReport(sessions: StudySession[], tasks: StudyTask[], range: Range, tz: string, goalMinutes: number | undefined) {
  const cur = sessionsIn(sessions, range, tz)
  const prevR = previousRange(range)
  const hasPrevData = sessions.some(s => countsAsFocus(s) && dayKey(s.startedAt, tz) <= prevR.to)
  const prev = sessionsIn(sessions, prevR, tz)
  const total = totalFocusSeconds(cur), prevTotal = totalFocusSeconds(prev)
  const series = daySeries(sessions, range, tz)
  const best = series.reduce((a, b) => (b.seconds > a.seconds ? b : a), series[0])
  const subj = bySubject(cur)[0]
  return {
    range, totalSeconds: total, completedSessions: cur.filter(isCompletedFocus).length,
    changePct: hasPrevData && prevTotal > 0 ? Math.round(((total - prevTotal) / prevTotal) * 100) : null,
    bestDay: best && best.seconds > 0 ? best.day : null, topSubjectId: subj?.subjectId ?? null,
    tasks: taskStats(tasks, range, tz),
    goalPct: goalMinutes ? Math.min(100, Math.round((total / 60 / goalMinutes) * 100)) : null,
    activeDays: series.filter(d => d.seconds > 0).length,
  }
}
export function productiveHours(sessions: StudySession[], tz: string) {
  const h = new Array(24).fill(0)
  for (const s of sessions) if (countsAsFocus(s)) {
    const hr = Number(new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', hour12: false }).format(new Date(s.startedAt))) % 24
    h[hr] += s.actualFocusSeconds
  }
  return h
}
export { addDays }
