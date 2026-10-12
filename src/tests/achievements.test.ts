import { openDB } from 'idb'
import { COLLECTIONS, DB_VERSION } from '@/data/db'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { clearAllData, getAll, initStore, put, setPrefs } from '@/data/store'
import { BADGES, BADGE_CATEGORIES, evaluateBadges, type BadgeCtx } from '@/domain/achievements'
import { buildJourney, filterJourney, groupByDay, weeklyReflection } from '@/domain/journey'
import { ALL_ITEMS } from '@/domain/catalog'
import { awardBadgeReward, earnBadge } from '@/services/achievementRewards'
import type { Achievement, LedgerEntry, StudySession, StudyTask } from '@/types'

const S = (id: string, day: string, min: number, subjectId?: string, status: StudySession['status'] = 'completed'): StudySession =>
  ({ id, type: 'focus', status, startedAt: day + 'T12:00:00.000Z', endedAt: day + 'T12:30:00.000Z', plannedSeconds: min * 60, actualFocusSeconds: min * 60, interruptionCount: 0, subjectId, createdAt: '', updatedAt: '' })
const ctx = (o: Partial<BadgeCtx> = {}): BadgeCtx => ({ sessions: [], tasks: [], cards: [], attempts: [], reviews: 0, streakLongest: 0, weeklyGoalMet: false, maxSubjectSeconds: 0, tz: 'UTC', ...o })
const by = (k: string) => BADGES.find(b => b.key === k)!

// Pre-create the schema so these tests do not depend on the v1->v2 migration path.
beforeAll(async () => { const db = await openDB('studyflow-db', DB_VERSION, { upgrade(d) { for (const n of [...COLLECTIONS, 'kv']) if (!d.objectStoreNames.contains(n)) n === 'kv' ? d.createObjectStore(n) : d.createObjectStore(n, { keyPath: 'id' }) } }); db.close(); await initStore() })
beforeEach(async () => { await clearAllData(); await setPrefs({ timezone: 'UTC' }) })

describe('badge catalog', () => {
  it('keeps the original 12 keys and adds many more with unique keys', () => {
    const orig = ['first-focus', 'five-sessions', 'deep-work', 'early-starter', 'consistency', 'seven-day', 'flashcard-explorer', 'recall-champion', 'task-finisher', 'exam-ready', 'weekly-goal', 'subject-specialist']
    expect(BADGES.slice(0, 12).map(b => b.key)).toEqual(orig); expect(BADGES.length).toBeGreaterThanOrEqual(40)
    expect(new Set(BADGES.map(b => b.key)).size).toBe(BADGES.length)
    expect(new Set(BADGES.map(b => b.category))).toEqual(new Set(BADE()))
  })
  it('every unlockBadge in the catalog points at a real badge, and item rewards exist', () => {
    for (const i of ALL_ITEMS) if (i.unlockBadge) expect(by(i.unlockBadge)).toBeTruthy()
    for (const b of BADGES) if (b.reward?.itemId) expect(ALL_ITEMS.some(i => i.id === b.reward!.itemId)).toBe(true)
  })
})
function BADE() { return BADGE_CATEGORIES }

describe('progress and evaluation', () => {
  it('reports value/target and agrees with test()', () => {
    const c = ctx({ sessions: [S('a', '2026-03-01', 30), S('b', '2026-03-02', 62)], tasks: [{ status: 'done' } as StudyTask] })
    expect(by('five-sessions').progress(c)).toEqual({ value: 2, target: 5 }); expect(by('hour-focus').progress(c)).toEqual({ value: 60, target: 60 })
    for (const b of BADGES) { const p = b.progress(c); expect(p.value >= p.target).toBe(b.test(c)) }
  })
  it('new optional ctx fields default to zero progress', () => {
    expect(by('forest-grove').progress(ctx())).toEqual({ value: 0, target: 25 })
    expect(by('forest-grove').progress(ctx({ trees: Array.from({ length: 25 }, () => ({}) as any) })).value).toBe(25)
  })
  it('evaluateBadges skips already earned ones', () => {
    const c = ctx({ sessions: [S('a', '2026-03-01', 30)] })
    expect(evaluateBadges(c, []).map(b => b.key)).toContain('first-focus'); expect(evaluateBadges(c, ['first-focus']).map(b => b.key)).not.toContain('first-focus')
  })
  it('welcome back needs a 7+ day gap and never penalises', () => {
    expect(by('welcome-back').test(ctx({ sessions: [S('a', '2026-03-01', 30), S('b', '2026-03-05', 30)] }))).toBe(false)
    expect(by('welcome-back').test(ctx({ sessions: [S('a', '2026-03-01', 30), S('b', '2026-03-12', 30)] }))).toBe(true)
  })
})

describe('badge rewards', () => {
  it('awards a badge reward once and records a snapshot', async () => {
    const b = by('first-task'); await earnBadge(b); await earnBadge(b); await awardBadgeReward(b)
    const led = getAll<LedgerEntry>('rewards'); expect(led.filter(l => l.key === 'ach:first-task')).toHaveLength(1); expect(led[0].points).toBe(b.reward!.points)
    const a = getAll<Achievement>('achievements'); expect(a).toHaveLength(1); expect(a[0]).toMatchObject({ id: 'badge-first-task', snapshot: { name: b.name } })
  })
  it('grants an owned item for item rewards', async () => {
    await awardBadgeReward(by('welcome-back'))
    expect(getAll<LedgerEntry>('rewards').some(l => l.kind === 'purchase' && l.refId === 'lantern')).toBe(true)
  })
  it('does not reward the original badges retroactively', async () => { await put('achievements', { id: 'badge-first-focus', key: 'first-focus', earnedAt: '2026-01-01T00:00:00Z' }); await awardBadgeReward(by('first-focus')); expect(getAll('rewards')).toHaveLength(0) })
})

describe('journey aggregation', () => {
  const input = () => ({
    sessions: [S('a', '2026-03-09', 30, 'math'), S('b', '2026-03-10', 60, 'math'), S('c', '2026-03-10', 20, 'bio'), S('x', '2026-03-10', 99, 'bio', 'cancelled')],
    reviews: [{ id: 'r1', cardId: 'c', rating: 'good', at: '2026-03-10T09:00:00Z' }, { id: 'r2', cardId: 'c', rating: 'good', at: '2026-03-10T09:05:00Z' }] as any,
    attempts: [{ id: 'q1', quizId: 'z', quizTitle: 'Cells', completedAt: '2026-03-11T08:00:00Z', score: 4, maxScore: 5 }] as any,
    tasks: [{ id: 't1', title: 'Essay', status: 'done', completedAt: '2026-03-11T10:00:00Z', subjectId: 'bio' }, { id: 't2', title: 'Open', status: 'todo' }] as any,
    achievements: [{ id: 'badge-first-focus', key: 'first-focus', earnedAt: '2026-03-09T13:00:00Z', snapshot: { name: 'Old name', condition: 'x' } }] as any, trees: [], tz: 'UTC',
  })
  it('merges real records newest first and ignores cancelled sessions', () => {
    const ev = buildJourney(input()); expect(ev.map(e => e.kind).sort()).toEqual(['achievement', 'quiz', 'review', 'session', 'session', 'session', 'task'])
    expect(ev[0].kind).toBe('task'); expect(ev.find(e => e.kind === 'review')?.title).toBe('Reviewed 2 flashcards'); expect(ev.find(e => e.kind === 'achievement')?.title).toBe('Badge: Old name')
  })
  it('filters by range and subject, groups by day', () => {
    const ev = buildJourney(input())
    expect(filterJourney(ev, { range: { from: '2026-03-10', to: '2026-03-10' } }).every(e => e.day === '2026-03-10')).toBe(true)
    expect(filterJourney(ev, { subjectId: 'bio' }).map(e => e.kind).sort()).toEqual(['session', 'task'])
    expect(groupByDay(ev).map(g => g.day)).toEqual(['2026-03-11', '2026-03-10', '2026-03-09'])
  })
  it('reflection counts only saved records', () => {
    const i = input(), r = weeklyReflection(i, { from: '2026-03-09', to: '2026-03-15' })
    expect(r).toMatchObject({ sessions: 3, minutes: 110, topSubjectId: 'math', topSubjectMinutes: 90, tasksDone: 1, cardsReviewed: 2, bestDay: '2026-03-10', bestDayMinutes: 80, empty: false })
    expect(weeklyReflection(i, { from: '2026-04-01', to: '2026-04-07' })).toMatchObject({ empty: true, topSubjectId: null, bestDay: null })
  })
})
