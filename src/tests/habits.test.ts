import { describe, expect, it } from 'vitest'
import { habitStreak, habitSummary, personalBests, returnMessage, weeklySessions } from '@/domain/habits'
import { streaks } from '@/domain/stats'
import type { StudySession } from '@/types'

const MIN = 20 * 60
const m = (...days: string[]) => new Map(days.map(d => [d, MIN]))
const base = { minSeconds: MIN, studyDays: [0, 1, 2, 3, 4, 5, 6], restDays: [] as string[], graceDaysPerWeek: 0, weekStartsOn: 1 as const }
const sess = (startedAt: string, secs = MIN): StudySession => ({ id: startedAt, createdAt: '', updatedAt: '', type: 'focus', status: 'completed', startedAt, plannedSeconds: secs, actualFocusSeconds: secs, interruptionCount: 0 })
// 2025-03-10 is a Monday
describe('habitStreak', () => {
  it('plain consecutive days', () => expect(habitStreak(m('2025-03-10', '2025-03-11', '2025-03-12'), { ...base, today: '2025-03-12' }).current).toBe(3))
  it('planned rest day is neutral', () => {
    const a = { ...base, today: '2025-03-12' }
    expect(habitStreak(m('2025-03-10', '2025-03-12'), a).current).toBe(1)
    expect(habitStreak(m('2025-03-10', '2025-03-12'), { ...a, restDays: ['2025-03-11'] }).current).toBe(2)
  })
  it('non-study weekdays are neutral', () => {
    const o = { ...base, studyDays: [1, 2, 3, 4, 5], today: '2025-03-17' }
    expect(habitStreak(m('2025-03-14', '2025-03-17'), o).current).toBe(2)
  })
  it('grace day covers one miss per week only', () => {
    const o = { ...base, graceDaysPerWeek: 1, today: '2025-03-13' }
    expect(habitStreak(m('2025-03-10', '2025-03-12', '2025-03-13'), o)).toMatchObject({ current: 3, graceUsedThisWeek: 1, graceLeftThisWeek: 0 })
    expect(habitStreak(m('2025-03-10', '2025-03-13'), o).current).toBe(1) // two misses, one grace
  })
  it("today in progress never breaks", () => expect(habitStreak(m('2025-03-10', '2025-03-11'), { ...base, today: '2025-03-12' }).current).toBe(2))
  it('long gap breaks current but keeps longest', () => expect(habitStreak(m('2025-03-01', '2025-03-02', '2025-03-03'), { ...base, today: '2025-03-12' })).toMatchObject({ current: 0, longest: 3 }))
  it('empty is zero', () => expect(habitStreak(new Map(), { ...base, today: '2025-03-12' }).current).toBe(0))
  it('legacy streaks() still works', () => expect(streaks(m('2025-03-10', '2025-03-11'), MIN, '2025-03-11', false).current).toBe(2))
})
describe('timezone and DST', () => {
  const h = { minDailyMinutes: 20, studyDays: [0, 1, 2, 3, 4, 5, 6], restDays: [], weeklySessionsTarget: 5, graceDaysPerWeek: 0, breakActivities: true, focusLock: false, focusOpen: [], tabWarning: 'off' as const }
  it('spring forward: late-evening sessions land on the local day', () => {
    // Mar 8 23:30 EST, Mar 9 23:30 EDT, Mar 10 noon EDT
    const s = [sess('2025-03-09T04:30:00Z'), sess('2025-03-10T03:30:00Z'), sess('2025-03-10T16:00:00Z')]
    expect(habitSummary(s, h, 'America/New_York', 1, new Date('2025-03-10T18:00:00Z')).streak.current).toBe(3)
    expect(habitSummary(s, h, 'UTC', 1, new Date('2025-03-10T18:00:00Z')).streak.current).toBe(2)
  })
  it('fall back keeps consecutive days consecutive', () => {
    const s = [sess('2025-11-02T03:30:00Z'), sess('2025-11-03T04:30:00Z'), sess('2025-11-03T20:00:00Z')]
    expect(habitSummary(s, h, 'America/New_York', 1, new Date('2025-11-03T21:00:00Z')).streak.current).toBe(3)
  })
  it('rest days are read in the configured timezone', () => {
    const s = [sess('2025-03-10T16:00:00Z'), sess('2025-03-12T16:00:00Z')]
    const r = habitSummary(s, { ...h, restDays: ['2025-03-11'] }, 'Pacific/Auckland', 1, new Date('2025-03-13T00:00:00Z'))
    expect(r.today).toBe('2025-03-13'); expect(r.streak.longest).toBeGreaterThanOrEqual(1)
  })
})
describe('bests, weekly, messages', () => {
  it('personal bests', () => {
    const b = personalBests(new Map([['2025-03-10', 3600], ['2025-03-11', 1800], ['2025-03-18', 600]]), 1)
    expect(b.bestDay).toEqual({ day: '2025-03-10', minutes: 60 }); expect(b.bestWeek).toEqual({ weekStart: '2025-03-10', minutes: 90 })
  })
  it('weekly sessions count completed focus in the week', () => expect(weeklySessions([sess('2025-03-10T10:00:00Z'), sess('2025-03-17T10:00:00Z')], '2025-03-12', 'UTC', 1)).toBe(1))
  it('return messages are warm and never blame', () => {
    for (const d of [0, 1, 2, 5, 20, 400]) { const t = returnMessage(d).toLowerCase(); expect(t.length).toBeGreaterThan(10); expect(t).not.toMatch(/fail|miss|lost|lazy|broke|behind/) }
  })
})
