import { describe, expect, it } from 'vitest'
import { generatePlan, missingInfo, explainItem } from '@/domain/examPlan'
import { topicMastery, masteryMap } from '@/domain/mastery'
import { diffDays } from '@/domain/time'
import type { Exam, ExamTopic, Flashcard, Quiz, QuizAttempt } from '@/types'

const today = '2025-03-10', now = new Date('2025-03-10T12:00:00Z')
const topic = (id: string, confidence: 1 | 2 | 3 | 4 | 5, effortHours = 2, extra: Partial<ExamTopic> = {}): ExamTopic => ({ id, title: id, confidence, effortHours, done: false, ...extra })
const exam = (o: Partial<Exam> = {}): Exam => ({ id: 'e', createdAt: '', updatedAt: '', name: 'Bio', date: '2025-03-20', priority: 'medium', coverage: [], availableMinutesPerDay: 60, topics: [topic('a', 1), topic('b', 5)], plan: [], ...o })
const none = { cards: [], quizzes: [], attempts: [] }
const mins = (items: { topicId?: string; minutes: number }[], id: string) => items.filter(i => i.topicId === id).reduce((a, i) => a + i.minutes, 0)
const card = (i: number, o: Partial<Flashcard> = {}): Flashcard => ({ id: 'c' + i, createdAt: '', updatedAt: '', deckId: 'd1', front: '', back: '', tags: [], favorite: false, repetitions: 4, intervalDays: 30, easeFactor: 2.5, lapseCount: 0, lastReviewedAt: '2025-03-01T00:00:00Z', ...o })

describe('plan generation', () => {
  it('asks for missing info instead of inventing a plan', () => {
    expect(missingInfo({})).toHaveLength(3)
    const r = generatePlan({ exam: exam({ date: '' as any, topics: [], availableMinutesPerDay: undefined }), today, data: none, now })
    expect(r.status).toBe('needs-info'); expect(r.items).toEqual([])
    expect(generatePlan({ exam: exam({ topics: [topic('a', 1, 1, { done: true })] }), today, data: none, now }).status).toBe('needs-info')
  })
  it('exam today or past is not planned', () => expect(generatePlan({ exam: exam({ date: today }), today, data: none, now }).status).toBe('past'))
  it('respects daily budget, leaves exam day free and last day light', () => {
    const r = generatePlan({ exam: exam(), today, data: none, now }); if (r.status !== 'ok') throw 0
    const by = new Map<string, number>(); for (const i of r.items) by.set(i.day, (by.get(i.day) ?? 0) + i.minutes)
    for (const [d, m] of by) { expect(m).toBeLessThanOrEqual(60); expect(d < '2025-03-20').toBe(true); expect(d >= today).toBe(true) }
    expect(by.get('2025-03-19')).toBeLessThanOrEqual(24)
    expect(r.items.filter(i => i.day === '2025-03-19').every(i => i.title.startsWith('Light review'))).toBe(true)
    expect(mins(r.items, 'a')).toBeGreaterThan(mins(r.items, 'b'))
  })
  it('overdue cards and wrong quiz answers add time', () => {
    const e = exam({ topics: [topic('a', 3, 2, { deckIds: ['d1'] }), topic('b', 3, 2)] })
    const cards = Array.from({ length: 20 }, (_, i) => card(i, { dueAt: '2025-03-01T00:00:00Z' }))
    const r = generatePlan({ exam: e, today, data: { ...none, cards }, now }); if (r.status !== 'ok') throw 0
    expect(mins(r.items, 'a')).toBeGreaterThan(mins(r.items, 'b'))
    expect(explainItem(r.items.find(i => i.topicId === 'a')!, e, { ...none, cards }, today, now)).toMatch(/20 overdue/)
  })
  it('scales down and reports coverage when time is short', () => {
    const r = generatePlan({ exam: exam({ date: '2025-03-13', topics: [topic('a', 1, 10)], availableMinutesPerDay: 30 }), today, data: none, now }); if (r.status !== 'ok') throw 0
    expect(r.coveragePct).toBeLessThan(100); expect(mins(r.items, 'a')).toBeLessThanOrEqual(30 * 3 + 12)
  })
  it('regenerating keeps manual and done items and subtracts done minutes', () => {
    const plan = [{ id: 'm', day: '2025-03-12', title: 'Past paper', minutes: 30, done: false, manual: true }, { id: 'd', day: '2025-03-10', topicId: 'a', title: 'a', minutes: 120, done: true }, { id: 'x', day: '2025-03-11', topicId: 'a', title: 'a', minutes: 30, done: false }]
    const r = generatePlan({ exam: exam({ plan }), today, data: none, now })
    expect(r.items.map(i => i.id)).toEqual(expect.arrayContaining(['m', 'd'])); expect(r.items.find(i => i.id === 'x')).toBeUndefined()
    expect(diffDays('2025-03-20', today)).toBe(10)
    if (r.status === 'ok') expect(mins(r.items.filter(i => !i.done && !i.title.startsWith('Light')), 'a')).toBe(0) // 120 min effort already done
  })
  it('keeps kept items even when info is missing', () => {
    const plan = [{ id: 'm', day: '2025-03-12', title: 'x', minutes: 30, done: false, manual: true }]
    expect(generatePlan({ exam: exam({ plan, availableMinutesPerDay: undefined }), today, data: none, now }).items).toEqual(plan)
  })
})

describe('mastery', () => {
  const t = topic('Cells', 3, 2, { deckIds: ['d1'], quizIds: ['q1'] })
  const quiz: Quiz = { id: 'q1', createdAt: '', updatedAt: '', title: 'Q', questions: Array.from({ length: 6 }, (_, i) => ({ id: 'k' + i, type: 'true_false' as const, prompt: i < 5 ? `About cells ${i}` : 'Other', points: 1, topicTags: [] })) }
  const attempt = (correct: boolean[]): QuizAttempt => ({ id: 'a1', createdAt: '', updatedAt: '', quizId: 'q1', quizTitle: 'Q', startedAt: '2025-03-05T00:00:00Z', score: 0, maxScore: 0, answers: correct.map((c, i) => ({ questionId: 'k' + i, answer: '', correct: c })) })
  it('small samples say not enough data', () => {
    const m = topicMastery(t, [t], { cards: [card(1), card(2)], reviews: [], quizzes: [quiz], attempts: [] })
    expect(m.level).toBe('not-enough-data'); expect(m.cards.pct).toBe(100); expect(m.sample).toBe(2)
  })
  it('minutes alone never means mastered', () => {
    const m = topicMastery(t, [t], { cards: [], reviews: [], quizzes: [], attempts: [] }, [{ id: 'p', day: today, topicId: 'Cells', title: 'x', minutes: 600, done: true }])
    expect(m.minutesStudied).toBe(600); expect(m.level).toBe('not-enough-data')
  })
  it('demonstrated cards and quiz accuracy by prompt match', () => {
    const cards = Array.from({ length: 10 }, (_, i) => card(i))
    const m = topicMastery(t, [t], { cards, reviews: [], quizzes: [quiz], attempts: [attempt([true, true, true, true, false, false])] })
    expect(m.quiz).toMatchObject({ answered: 5, correct: 4, pct: 80 }) // 'Other' question excluded
    expect(m.level).toBe('strong')
  })
  it('struggling cards and weak quiz are needs-work', () => {
    const cards = Array.from({ length: 10 }, (_, i) => card(i, { intervalDays: 1, repetitions: 1, lapseCount: 2 }))
    const m = masteryMap([t], { cards, reviews: [], quizzes: [], attempts: [] })[0]
    expect(m.level).toBe('needs-work'); expect(m.cards.lapses).toBe(20)
  })
})
