import type { HabitPrefs, StudySession } from '@/types'
import { addDays, dayKey, daysBetween, diffDays, startOfWeek, weekdayOf } from './time'
import { focusByDay, isCompletedFocus } from './stats'

export interface StreakOpts { minSeconds: number; studyDays: number[]; restDays: string[]; graceDaysPerWeek: number; weekStartsOn: 0 | 1; today: string }
export interface StreakResult { current: number; longest: number; graceUsedThisWeek: number; graceLeftThisWeek: number }

/**
 * Habit streak over day keys (already in the user's timezone).
 *  - A day counts when focus >= minimum.
 *  - Rest days and non-study weekdays are neutral: they neither break nor add (unless you studied, then they count).
 *  - A missed study day uses one of the week's grace days if any remain (neutral), otherwise it breaks the streak.
 *  - Today is never a miss while it is still in progress.
 */
export function habitStreak(byDay: Map<string, number>, o: StreakOpts): StreakResult {
  const met = [...byDay].filter(([k, v]) => v >= o.minSeconds && v > 0 && k <= o.today).map(([k]) => k).sort()
  const week = startOfWeek(o.today, o.weekStartsOn)
  if (!met.length) return { current: 0, longest: 0, graceUsedThisWeek: 0, graceLeftThisWeek: o.graceDaysPerWeek }
  const rest = new Set(o.restDays), study = new Set(o.studyDays), used = new Map<string, number>()
  let run = 0, longest = 0
  for (const k of daysBetween(met[0], o.today)) {
    if ((byDay.get(k) ?? 0) >= o.minSeconds && (byDay.get(k) ?? 0) > 0) { run++; longest = Math.max(longest, run); continue }
    if (rest.has(k) || !study.has(weekdayOf(k)) || k === o.today) continue
    const w = startOfWeek(k, o.weekStartsOn), u = used.get(w) ?? 0
    if (u < o.graceDaysPerWeek) used.set(w, u + 1); else run = 0
  }
  const gu = used.get(week) ?? 0
  return { current: run, longest, graceUsedThisWeek: gu, graceLeftThisWeek: Math.max(0, o.graceDaysPerWeek - gu) }
}

export function personalBests(byDay: Map<string, number>, weekStartsOn: 0 | 1, sessions: StudySession[] = [], tz = 'UTC') {
  let bestDay: { day: string; minutes: number } | null = null
  const weeks = new Map<string, number>()
  for (const [k, v] of byDay) {
    if (v <= 0) continue
    if (!bestDay || v / 60 > bestDay.minutes) bestDay = { day: k, minutes: Math.round(v / 60) }
    const w = startOfWeek(k, weekStartsOn); weeks.set(w, (weeks.get(w) ?? 0) + v)
  }
  let bestWeek: { weekStart: string; minutes: number } | null = null
  for (const [w, v] of weeks) if (!bestWeek || v / 60 > bestWeek.minutes) bestWeek = { weekStart: w, minutes: Math.round(v / 60) }
  const perWeek = new Map<string, number>()
  for (const s of sessions) if (isCompletedFocus(s)) { const w = startOfWeek(dayKey(s.startedAt, tz), weekStartsOn); perWeek.set(w, (perWeek.get(w) ?? 0) + 1) }
  return { bestDay, bestWeek, bestWeekSessions: Math.max(0, ...perWeek.values()) }
}

export function weeklySessions(sessions: StudySession[], today: string, tz: string, weekStartsOn: 0 | 1) {
  const from = startOfWeek(today, weekStartsOn), to = addDays(from, 6)
  return sessions.filter(s => { if (!isCompletedFocus(s)) return false; const k = dayKey(s.startedAt, tz); return k >= from && k <= to }).length
}

/** Everything the UI needs, computed in the configured timezone. */
export function habitSummary(sessions: StudySession[], h: HabitPrefs, tz: string, weekStartsOn: 0 | 1, now: Date | number = Date.now()) {
  const today = dayKey(now, tz), byDay = focusByDay(sessions, tz)
  const streak = habitStreak(byDay, { minSeconds: h.minDailyMinutes * 60, studyDays: h.studyDays, restDays: h.restDays, graceDaysPerWeek: h.graceDaysPerWeek, weekStartsOn, today })
  const last = [...byDay.keys()].filter(k => k <= today && (byDay.get(k) ?? 0) > 0).sort().pop()
  return { today, streak, bests: personalBests(byDay, weekStartsOn, sessions, tz), weekSessions: weeklySessions(sessions, today, tz, weekStartsOn), todayMinutes: Math.round((byDay.get(today) ?? 0) / 60), daysAway: last ? diffDays(today, last) : null }
}

/** Warm, never blaming. */
export function returnMessage(daysAway: number): string {
  if (daysAway <= 1) return 'Good to see you. Ready whenever you are.'
  if (daysAway <= 3) return 'Welcome back. A short session is a lovely way to ease in.'
  if (daysAway <= 14) return 'Welcome back! Breaks are part of learning. Start small, even 10 minutes counts.'
  return 'It is good to see you again. Your notes and cards are right where you left them, so pick whatever feels easiest.'
}
