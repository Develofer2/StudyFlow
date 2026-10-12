import { describe, expect, it } from 'vitest'
import { ABSENT_MS, BUDDY_STATES, CELEBRATE_MS, REST_AFTER_MS, deriveBuddyState, type BuddyInput } from '@/domain/buddyState'
import { POOLS, pickMessage } from '@/domain/buddyMessages'
import { MAX_LEVEL, levelFor, milestonesFor, xpForLevel } from '@/domain/buddyGrowth'

const base: BuddyInput = { phase: 'idle', status: 'idle', elapsedMs: 0, remainingMs: 0, completion: null, goalReached: false, preparing: false, idleForMs: null, hour: 14 }
const st = (o: Partial<BuddyInput>) => deriveBuddyState({ ...base, ...o })

describe('buddy state machine', () => {
  it('idle by default and preparing when a plan is set', () => { expect(st({})).toBe('idle'); expect(st({ preparing: true })).toBe('preparing') })
  it('starting then focusing while a focus timer runs', () => {
    expect(st({ phase: 'focus', status: 'running', elapsedMs: 5000, remainingMs: 1e6 })).toBe('starting')
    expect(st({ phase: 'focus', status: 'running', elapsedMs: 60000, remainingMs: 1e6 })).toBe('focusing')
  })
  it('paused wins over everything', () => { expect(st({ phase: 'focus', status: 'paused', goalReached: true })).toBe('paused') })
  it('break, then returning as the break ends', () => {
    expect(st({ phase: 'short_break', status: 'running', elapsedMs: 10000, remainingMs: 200000 })).toBe('break')
    expect(st({ phase: 'long_break', status: 'running', remainingMs: 8000 })).toBe('returning')
  })
  it('completed or goal after a focus completion, then fades back', () => {
    expect(st({ completion: { finished: 'focus', sinceMs: 1000 } })).toBe('completed')
    expect(st({ completion: { finished: 'focus', sinceMs: 1000 }, goalReached: true })).toBe('goal')
    expect(st({ completion: { finished: 'focus', sinceMs: CELEBRATE_MS + 1 }, goalReached: true })).toBe('idle')
    expect(st({ completion: { finished: 'short_break', sinceMs: 1000 } })).toBe('returning')
  })
  it('resting at night or after a long gap, returning after an absence', () => {
    expect(st({ hour: 23 })).toBe('resting'); expect(st({ hour: 3 })).toBe('resting')
    expect(st({ idleForMs: REST_AFTER_MS })).toBe('resting'); expect(st({ idleForMs: REST_AFTER_MS - 1 })).toBe('idle')
    expect(st({ idleForMs: ABSENT_MS })).toBe('returning')
  })
  it('a running timer is never resting, even at night', () => { expect(st({ hour: 23, phase: 'focus', status: 'running', elapsedMs: 99999, remainingMs: 1e6 })).toBe('focusing') })
  it('is deterministic', () => { const i = { ...base, hour: 23 }; expect(deriveBuddyState(i)).toBe(deriveBuddyState({ ...i })) })
})

describe('buddy messages', () => {
  it('has a pool for every state and style, brief and varied', () => {
    for (const s of BUDDY_STATES) for (const style of ['cheerful', 'calm', 'playful', 'minimal'] as const) {
      const p = POOLS[s][style]; expect(p.length).toBeGreaterThanOrEqual(3); expect(new Set(p).size).toBe(p.length); for (const m of p) expect(m.length).toBeLessThanOrEqual(70)
    }
  })
  it('picks deterministically by seed and can vary across seeds', () => {
    expect(pickMessage('focusing', 'calm', 'a')).toBe(pickMessage('focusing', 'calm', 'a'))
    expect(new Set(Array.from({ length: 30 }, (_, i) => pickMessage('idle', 'cheerful', 's' + i))).size).toBeGreaterThan(1)
  })
  it('never guilts or pressures', () => {
    const bad = /\b(streak|lazy|waste|behind|should have|don't stop|keep going|no excuses|you must|failed?)\b/i
    for (const s of BUDDY_STATES) for (const style of Object.keys(POOLS[s]) as (keyof (typeof POOLS)['idle'])[]) for (const m of POOLS[s][style]) expect(m).not.toMatch(bad)
  })
})

describe('buddy growth', () => {
  it('level curve is monotonic with exact thresholds', () => {
    expect(levelFor(0).level).toBe(1); expect(levelFor(39).level).toBe(1); expect(levelFor(40).level).toBe(2); expect(levelFor(120).level).toBe(3)
    let prev = 0; for (let x = 0; x < 3000; x += 7) { const l = levelFor(x).level; expect(l).toBeGreaterThanOrEqual(prev); prev = l }
    expect(levelFor(1e9).level).toBe(MAX_LEVEL); expect(levelFor(1e9).next).toBeNull()
  })
  it('reports progress inside a level', () => { const l = levelFor(80); expect(l.floor).toBe(xpForLevel(2)); expect(l.toNext).toBe(40); expect(l.pct).toBeCloseTo(0.5) })
  it('treats negative xp as zero', () => { expect(levelFor(-5).xp).toBe(0) })
  it('milestones unlock by xp', () => {
    expect(milestonesFor(0).reachedCount).toBe(1); expect(milestonesFor(0).next?.xp).toBe(25)
    expect(milestonesFor(300).list.filter(m => m.reached).map(m => m.name)).toContain('Study pals'); expect(milestonesFor(1e6).next).toBeNull()
  })
})
