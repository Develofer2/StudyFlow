import { it, expect } from 'vitest'
import { awayMessage, canVisit, isLocked } from '@/domain/focusLock'
import { pickQuote, QUOTE_POOLS } from '@/domain/buddyQuotes'

it('locks only during an active focus phase', () => {
  const on = { focusLock: true }
  expect(isLocked(on, { phase: 'focus', status: 'running' })).toBe(true)
  expect(isLocked(on, { phase: 'focus', status: 'paused' })).toBe(true)
  expect(isLocked(on, { phase: 'short_break', status: 'running' })).toBe(false)
  expect(isLocked(on, { phase: 'idle', status: 'idle' })).toBe(false)
  expect(isLocked({ focusLock: false }, { phase: 'focus', status: 'running' })).toBe(false)
  expect(isLocked(on, { phase: 'focus', status: 'running' }, 's1', 's1')).toBe(false)
  expect(isLocked(on, { phase: 'focus', status: 'running' }, 's1', 's2')).toBe(true)
})
it('allowlist lets chosen pages through while locked', () => {
  expect(canVisit(true, ['notes'], 'notes')).toBe(true)
  expect(canVisit(true, ['notes'], 'shop')).toBe(false)
  expect(canVisit(true, [], 'focus')).toBe(true)
  expect(canVisit(false, [], 'shop')).toBe(true)
})
it('formats away time', () => {
  expect(awayMessage(20000)).toContain('20s')
  expect(awayMessage(80000)).toContain('1m 20s')
})
it('quotes are deterministic and non-empty for every style', () => {
  for (const s of Object.keys(QUOTE_POOLS) as (keyof typeof QUOTE_POOLS)[]) {
    expect(pickQuote(s, 'a|1')).toBe(pickQuote(s, 'a|1'))
    for (const q of QUOTE_POOLS[s]) { expect(q.length).toBeGreaterThan(5); expect(q.length).toBeLessThan(90) }
  }
})
