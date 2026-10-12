import type { LedgerEntry } from '@/types'

export const KIND_NAME: Record<LedgerEntry['kind'], string> = { session: 'Focus sessions', task: 'Finished tasks', review: 'Flashcard reviews', quiz: 'Quizzes', goal: 'Daily goals', achievement: 'Achievements', purchase: 'Shopping', bonus: 'Bonuses' }
export const entryTitle = (l: LedgerEntry) => l.kind === 'purchase' ? `Bought ${l.note ?? l.refId ?? 'an item'}` : l.kind === 'achievement' ? `Badge: ${l.note ?? l.refId ?? ''}` : KIND_NAME[l.kind]

export interface Statement { entry: LedgerEntry; balance: number }
export interface DayFlow { day: string; earned: number; spent: number }
export interface WalletSummary {
  balance: number; earned: number; spent: number
  today: number; week: number; month: number
  avgPerActiveDay: number; activeDays: number; bestDay: { day: string; earned: number } | null
  bySource: { kind: LedgerEntry['kind']; points: number }[]
  series: DayFlow[]; statement: Statement[]
}

const shiftDay = (key: string, n: number) => { const d = new Date(key + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10) }

/** Pure money-style view of the rewards ledger. Zero-point entries (free unlocks) are ignored. */
export function walletSummary(ledger: LedgerEntry[], today: string, days = 14): WalletSummary {
  const rows = ledger.filter(l => l.points !== 0).sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.key.localeCompare(b.key))
  let bal = 0
  const statement = rows.map(entry => ({ entry, balance: (bal += entry.points) })).reverse()
  const earnedBy = new Map<string, number>(), spentBy = new Map<string, number>(), src = new Map<LedgerEntry['kind'], number>()
  let earned = 0, spent = 0
  for (const l of rows) {
    if (l.points > 0) { earned += l.points; earnedBy.set(l.day, (earnedBy.get(l.day) ?? 0) + l.points); src.set(l.kind, (src.get(l.kind) ?? 0) + l.points) }
    else { spent -= l.points; spentBy.set(l.day, (spentBy.get(l.day) ?? 0) - l.points) }
  }
  const sum = (from: string) => [...earnedBy].filter(([d]) => d >= from && d <= today).reduce((a, [, n]) => a + n, 0)
  const series: DayFlow[] = Array.from({ length: days }, (_, i) => { const day = shiftDay(today, i - days + 1); return { day, earned: earnedBy.get(day) ?? 0, spent: spentBy.get(day) ?? 0 } })
  let best: WalletSummary['bestDay'] = null
  for (const [day, n] of earnedBy) if (!best || n > best.earned) best = { day, earned: n }
  return {
    balance: bal, earned, spent, today: earnedBy.get(today) ?? 0, week: sum(shiftDay(today, -6)), month: sum(shiftDay(today, -29)),
    activeDays: earnedBy.size, avgPerActiveDay: earnedBy.size ? Math.round(earned / earnedBy.size) : 0, bestDay: best,
    bySource: [...src].map(([kind, points]) => ({ kind, points })).sort((a, b) => b.points - a.points), series, statement,
  }
}
