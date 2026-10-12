import { openDB } from 'idb'
import { COLLECTIONS, DB_VERSION } from '@/data/db'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { clearAllData, getAll, initStore, put, setPrefs } from '@/data/store'
import { DAILY_POINT_CAP, MAX_ELIGIBLE_MINUTES, GROWTH_RULES, balance, eligibleMinutes, ownedIds, stageFor } from '@/domain/growth'
import { award, buy, syncRewards } from '@/services/rewards'
import { filterTrees, milestones, weeklyGrowth, whyGrew } from '@/features/forest/derive'
import type { LedgerEntry, StudySession, Tree } from '@/types'

const sess = (id: string, min: number, status: StudySession['status'] = 'completed', at = '2026-03-10T10:00:00.000Z'): Partial<StudySession> =>
  ({ id, type: 'focus', status, startedAt: at, endedAt: at, plannedSeconds: min * 60, actualFocusSeconds: min * 60, interruptionCount: 0 })
const tree = (day: string, minutes: number, species = 'oak'): Tree => ({ id: 't' + day + minutes + species, createdAt: '', updatedAt: '', sessionId: 's' + day, species, minutes, stage: stageFor(minutes, true), complete: true, plantedAt: day + 'T10:00:00Z', day, season: 'spring' })

// Pre-create the schema so these tests do not depend on the v1->v2 migration path.
beforeAll(async () => { const db = await openDB('studyflow-db', DB_VERSION, { upgrade(d) { for (const n of [...COLLECTIONS, 'kv']) if (!d.objectStoreNames.contains(n)) n === 'kv' ? d.createObjectStore(n) : d.createObjectStore(n, { keyPath: 'id' }) } }); db.close(); await initStore() })
beforeEach(async () => { await clearAllData(); await setPrefs({ timezone: 'UTC' }) })

describe('growth rules', () => {
  it('maps minutes to stages and caps stopped sessions at a seedling', () => {
    expect([4, 5, 15, 25, 40, 60, 200].map(m => stageFor(m, true))).toEqual([0, 1, 2, 3, 4, 5, 5])
    expect(stageFor(90, false)).toBe(2); expect(stageFor(10, false)).toBe(1)
  })
  it('caps eligible minutes per session', () => {
    expect(eligibleMinutes(sess('a', 30) as StudySession)).toBe(30)
    expect(eligibleMinutes(sess('b', 600) as StudySession)).toBe(MAX_ELIGIBLE_MINUTES)
    expect(GROWTH_RULES.some(r => r.includes(String(DAILY_POINT_CAP)))).toBe(true)
  })
})

describe('ledger and shop', () => {
  it('records the same award key only once', async () => {
    const e = { key: 'k1', kind: 'bonus' as const, points: 5, xp: 0, day: '2026-03-10' }
    expect(await award(e)).toBe(true); expect(await award(e)).toBe(false)
    expect(getAll<LedgerEntry>('rewards')).toHaveLength(1)
  })
  it('syncRewards is idempotent, plants trees, and ignores cancelled sessions', async () => {
    await put('sessions', sess('s1', 30)); await put('sessions', sess('s2', 45, 'cancelled')); await put('sessions', sess('s3', 2))
    await syncRewards(); await syncRewards()
    const trees = getAll<Tree>('trees'); expect(trees.map(t => t.sessionId)).toEqual(['s1']); expect(trees[0].stage).toBe(3)
    const led = getAll<LedgerEntry>('rewards'); expect(led.filter(l => l.key === 'session:s1')).toHaveLength(1); expect(led.some(l => l.refId === 's2')).toBe(false)
    expect(led.find(l => l.key === 'session:s1')?.points).toBe(15)
  })
  it('stopped sessions grow a small plant but earn no points', async () => {
    await put('sessions', sess('s4', 50, 'interrupted')); await syncRewards()
    expect(getAll<Tree>('trees')[0].stage).toBe(2); expect(balance(getAll<LedgerEntry>('rewards'))).toBe(0)
  })
  it('refuses purchases with too little balance or duplicates', async () => {
    expect(await buy('maple')).toBe(false)
    await award({ key: 'seed', kind: 'bonus', points: 100, xp: 0, day: '2026-03-10' })
    expect(await buy('maple')).toBe(true); expect(await buy('maple')).toBe(false)
    expect(balance(getAll<LedgerEntry>('rewards'))).toBe(85); expect(ownedIds(getAll<LedgerEntry>('rewards')).has('maple')).toBe(true)
    expect(await buy('nope')).toBe(false)
  })
})

describe('forest derivations', () => {
  const trees = [tree('2026-03-09', 25), tree('2026-03-10', 60, 'pine'), tree('2026-02-20', 5, 'birch')]
  it('filters by period and season', () => {
    expect(filterTrees(trees, 'week', 'all', '2026-03-11', 1)).toHaveLength(2)
    expect(filterTrees(trees, 'month', 'all', '2026-03-11', 1)).toHaveLength(2)
    expect(filterTrees(trees, 'all', 'winter', '2026-03-11', 1)).toHaveLength(0)
  })
  it('builds weekly rows including empty weeks', () => {
    const w = weeklyGrowth(trees, 1, '2026-03-11', 4); expect(w).toHaveLength(4)
    expect(w[3]).toMatchObject({ start: '2026-03-09', trees: 2, minutes: 85 }); expect(w[1].trees).toBe(0); expect(w[0].trees).toBe(1)
  })
  it('tracks milestones and explains growth', () => {
    const m = milestones(trees); expect(m.find(x => x.id === 'trees-1')?.done).toBe(true); expect(m.find(x => x.id === 'trees-10')?.done).toBe(false)
    expect(m.find(x => x.id === 'species')?.value).toBe(3)
    expect(whyGrew({ minutes: 50, stage: 2, complete: false })).toContain('capped at a seedling')
  })
})
