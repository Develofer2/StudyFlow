import { describe, expect, it } from 'vitest'
import type { LedgerEntry } from '@/types'
import { walletSummary } from '@/domain/wallet'

const e = (key: string, points: number, day: string, kind: LedgerEntry['kind'] = 'session'): LedgerEntry => ({ id: key, key, kind, points, xp: 0, day, createdAt: day + 'T10:00:00Z', updatedAt: day + 'T10:00:00Z' } as LedgerEntry)

describe('wallet', () => {
  const l = [e('a', 20, '2026-03-09'), e('b', 15, '2026-03-10', 'task'), e('c', -10, '2026-03-10', 'purchase'), e('d', 30, '2026-03-11'), e('z', 0, '2026-03-11', 'purchase')]
  const w = walletSummary(l, '2026-03-11')
  it('totals earned, spent and balance', () => { expect(w.earned).toBe(65); expect(w.spent).toBe(10); expect(w.balance).toBe(55) })
  it('windows and averages', () => { expect(w.today).toBe(30); expect(w.week).toBe(65); expect(w.activeDays).toBe(3); expect(w.avgPerActiveDay).toBe(22); expect(w.bestDay).toEqual({ day: '2026-03-11', earned: 30 }) })
  it('series is zero filled and statement is newest first with running balance', () => {
    expect(w.series).toHaveLength(14); expect(w.series.at(-1)).toEqual({ day: '2026-03-11', earned: 30, spent: 0 }); expect(w.series[0].earned).toBe(0)
    expect(w.statement[0].balance).toBe(55); expect(w.statement.at(-1)?.balance).toBe(20); expect(w.statement).toHaveLength(4)
  })
  it('breaks down by source', () => { expect(w.bySource[0]).toEqual({ kind: 'session', points: 50 }) })
})
