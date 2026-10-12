import { describe, expect, it } from 'vitest'
import { activeFocusMs, idleTimer, isExpired, nextPhase, pause, remainingMs, resume, startPhase, validatePreset } from '@/domain/timer'
import { review, isDue, isMastered, newCardState } from '@/domain/srs'
import { grade, scoreQuiz, validateQuestion } from '@/domain/quiz'
import { countsAsFocus, focusByDay, streaks } from '@/domain/stats'
import { addDays, dayKey, diffDays, startOfWeek } from '@/domain/time'
import { generateCards } from '@/domain/cardgen'
import { BUILT_IN_PRESETS } from '@/data/defaults'
import { THEMES, contrast, tokensFor } from '@/domain/themes'
import { buildRevisionPlan } from '@/domain/revision'
import type { QuizQuestion, StudySession } from '@/types'

const preset = BUILT_IN_PRESETS[0]
const sess = (o: Partial<StudySession>): StudySession => ({ id: Math.random() + '', createdAt: '', updatedAt: '', type: 'focus', status: 'completed', startedAt: '2025-03-10T10:00:00Z', plannedSeconds: 1500, actualFocusSeconds: 1500, interruptionCount: 0, ...o })

describe('timer', () => {
  it('counts down from a deadline and expires', () => {
    const s = startPhase(idleTimer(), 'focus', preset, 1000, 'a')
    expect(remainingMs(s, 1000 + 60000)).toBe(preset.workMinutes * 60000 - 60000)
    expect(isExpired(s, 1000 + preset.workMinutes * 60000)).toBe(true)
  })
  it('excludes paused time from focus time', () => {
    const T = 1_700_000_000_000
    let s = startPhase(idleTimer(), 'focus', preset, T, 'a')
    s = pause(s, T + 60000); expect(activeFocusMs(s, T + 999999)).toBe(60000)
    s = resume(s, T + 500000); expect(activeFocusMs(s, T + 530000)).toBe(90000)
    expect(s.interruptions).toBe(1)
  })
  it('breaks never accrue focus time', () => { expect(activeFocusMs(startPhase(idleTimer(), 'short_break', preset, 0, 'b'), 100000)).toBe(0) })
  it('picks long break after N focus sessions', () => {
    expect(nextPhase('focus', preset.sessionsBeforeLongBreak, preset)).toBe('long_break'); expect(nextPhase('focus', 1, preset)).toBe('short_break'); expect(nextPhase('short_break', 1, preset)).toBe('focus')
  })
  it('validates presets', () => {
    expect(validatePreset({ ...preset, workMinutes: 0 }).workMinutes).toBeTruthy()
    expect(validatePreset({ ...preset, workMinutes: 2.5 }).workMinutes).toBeTruthy()
    expect(validatePreset({ ...preset, name: ' ' }).name).toBeTruthy()
    expect(Object.keys(validatePreset(preset))).toHaveLength(0)
  })
})

describe('srs', () => {
  const now = new Date('2025-03-10T10:00:00Z')
  it('again resets and schedules 10 minutes out', () => {
    const r = review({ ...newCardState(), repetitions: 3, intervalDays: 10 }, 'again', now)
    expect(r.repetitions).toBe(0); expect(r.lapseCount).toBe(1); expect(new Date(r.dueAt).getTime() - now.getTime()).toBe(600000)
  })
  it('good grows intervals 1d, 3d', () => {
    const a = review(newCardState(), 'good', now); expect(a.intervalDays).toBe(1)
    expect(review(a, 'good', now).intervalDays).toBe(3)
  })
  it('clamps ease and interval', () => {
    let c: any = newCardState(); for (let i = 0; i < 20; i++) c = { ...c, ...review(c, 'again', now) }
    expect(c.easeFactor).toBe(1.3)
    let d: any = { ...newCardState(), repetitions: 5, intervalDays: 300, easeFactor: 3 }; d = { ...d, ...review(d, 'easy', now) }
    expect(d.intervalDays).toBe(365); expect(d.easeFactor).toBe(3)
  })
  it('new cards are due; mastery needs long interval', () => {
    expect(isDue({}, now)).toBe(true); expect(isMastered({ intervalDays: 30, repetitions: 4 })).toBe(true); expect(isMastered({ intervalDays: 3, repetitions: 4 })).toBe(false)
  })
})

describe('quiz', () => {
  const mc: QuizQuestion = { id: '1', type: 'multiple_choice', prompt: 'Q', options: ['a', 'b'], correctOptionIndex: 1, points: 2, topicTags: [] }
  const sa: QuizQuestion = { id: '2', type: 'short_answer', prompt: 'Capital of France?', acceptedAnswers: ['Paris'], points: 1, topicTags: [] }
  it('grades mc and normalised short answers', () => { expect(grade(mc, '1')).toBe(true); expect(grade(mc, '0')).toBe(false); expect(grade(sa, '  paris! ')).toBe(true); expect(grade(sa, 'Lyon')).toBe(false) })
  it('questions without a key are ungraded, not wrong', () => { const bad = { ...mc, correctOptionIndex: undefined }; expect(validateQuestion(bad)).toBeTruthy(); expect(grade(bad, '0')).toBeNull() })
  it('scores', () => { const r = scoreQuiz([mc, sa], { '1': '1', '2': 'x' }); expect(r.score).toBe(2); expect(r.maxScore).toBe(3) })
})

describe('stats & time', () => {
  it('focus policy: completed+interrupted count, cancelled does not, breaks do not', () => {
    expect(countsAsFocus(sess({}))).toBe(true); expect(countsAsFocus(sess({ status: 'interrupted', actualFocusSeconds: 300 }))).toBe(true)
    expect(countsAsFocus(sess({ status: 'cancelled' }))).toBe(false); expect(countsAsFocus(sess({ type: 'short_break' }))).toBe(false)
  })
  it('buckets by day in the user timezone', () => {
    const s = sess({ startedAt: '2025-03-10T23:30:00Z' })
    expect(focusByDay([s], 'UTC').get('2025-03-10')).toBe(1500); expect(focusByDay([s], 'Asia/Tokyo').get('2025-03-11')).toBe(1500)
  })
  it('week boundaries and date math', () => {
    expect(startOfWeek('2025-03-12', 1)).toBe('2025-03-10'); expect(startOfWeek('2025-03-12', 0)).toBe('2025-03-09')
    expect(addDays('2025-02-28', 1)).toBe('2025-03-01'); expect(diffDays('2025-03-10', '2025-03-01')).toBe(9); expect(dayKey('2025-03-10T00:00:00Z', 'UTC')).toBe('2025-03-10')
  })
  it('streaks with and without grace day, and empty data', () => {
    const m = new Map([['2025-03-07', 60], ['2025-03-08', 60], ['2025-03-10', 60]])
    expect(streaks(m, 60, '2025-03-10', false)).toEqual({ current: 1, longest: 2 }); expect(streaks(m, 60, '2025-03-10', true)).toEqual({ current: 3, longest: 3 })
    expect(streaks(new Map(), 60, '2025-03-10', false)).toEqual({ current: 0, longest: 0 })
    expect(streaks(m, 60, '2025-03-14', false).current).toBe(0)
  })
})

describe('generators & themes', () => {
  it('rule-based cards from definitions, none from filler', () => {
    const d = generateCards('Photosynthesis is the process by which plants convert light into energy.\nMitosis: division of a cell into two identical cells')
    expect(d.length).toBeGreaterThanOrEqual(2); expect(generateCards('hello there how are you')).toHaveLength(0)
  })
  it('revision plan needs hours', () => {
    const e = { id: 'e', createdAt: '', updatedAt: '', name: 'Bio', date: '2025-03-20', priority: 'high' as const, coverage: [{ id: '1', title: 'Cells', done: false }] }
    expect(buildRevisionPlan(e, '2025-03-10')).toBeNull(); expect(buildRevisionPlan({ ...e, hoursPerWeek: 5 }, '2025-03-10')?.length).toBeGreaterThan(0)
  })
  it('there are 18 themes and every body text pair is at least WCAG AA in both modes', () => {
    expect(THEMES).toHaveLength(18)
    for (const t of THEMES) for (const m of ['light', 'dark'] as const) { const k = tokensFor(t, m); expect(contrast(k.text, k.bg), `${t.id}/${m}`).toBeGreaterThanOrEqual(4.5); expect(contrast(k.primaryFg, k.primary), `${t.id}/${m} primary`).toBeGreaterThanOrEqual(4.5) }
  })
})
