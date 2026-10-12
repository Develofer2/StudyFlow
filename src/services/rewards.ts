import { useEffect } from 'react'
import type { LedgerEntry, QuizAttempt, ReviewLog, StudySession, StudyTask, Tree } from '@/types'
import { getAll, getPrefs, put, useCollection, usePrefs } from '@/data/store'
import { DAILY_POINT_CAP, ownedIds, pickSpecies, seasonOf, sessionPoints, sessionXp, stageFor, eligibleMinutes } from '@/domain/growth'
import { itemById } from '@/domain/catalog'
import { dayKey } from '@/domain/time'

const ledgerHas = (key: string) => getAll<LedgerEntry>('rewards').some(l => l.key === key)
const dayPoints = (day: string) => getAll<LedgerEntry>('rewards').filter(l => l.day === day && l.points > 0 && l.kind !== 'achievement').reduce((a, l) => a + l.points, 0)

/** Idempotent: the same key is recorded once, ever. Returns true when a new entry was written. */
export async function award(e: Omit<LedgerEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> {
  if (ledgerHas(e.key)) return false
  await put('rewards', { ...e, id: 'led:' + e.key })
  return true
}
/** Spend points. Fails (false) when the balance is too low or the item is already owned. */
export async function buy(itemId: string): Promise<boolean> {
  const it = itemById(itemId); if (!it) return false
  const ledger = getAll<LedgerEntry>('rewards')
  if (ownedIds(ledger).has(itemId)) return false
  const bal = ledger.reduce((a, l) => a + l.points, 0)
  if (bal < it.cost) return false
  return award({ key: 'buy:' + itemId, kind: 'purchase', points: -it.cost, xp: 0, refId: itemId, note: it.name, day: dayKey(Date.now(), getPrefs().timezone) })
}
/** Derives rewards and trees from persisted records. Safe to run any number of times. */
export async function syncRewards() {
  const tz = getPrefs().timezone
  const sessions = getAll<StudySession>('sessions').filter(s => s.type === 'focus')
  const trees = new Set(getAll<Tree>('trees').map(t => t.sessionId))
  const owned = ownedIds(getAll<LedgerEntry>('rewards'))
  for (const s of sessions.sort((a, b) => a.startedAt.localeCompare(b.startedAt))) {
    if (s.status === 'cancelled') continue
    const day = dayKey(s.endedAt ?? s.startedAt, tz), minutes = eligibleMinutes(s), complete = s.status === 'completed'
    const stage = stageFor(minutes, complete)
    if (stage > 0 && !trees.has(s.id)) { trees.add(s.id); await put('trees', { id: 'tree:' + s.id, sessionId: s.id, species: pickSpecies(s.id, owned, getPrefs().forest.featured), minutes, stage, complete, plantedAt: s.endedAt ?? s.startedAt, day, subjectId: s.subjectId, season: seasonOf(day) }) }
    const pts = sessionPoints(s)
    if (pts > 0 && !ledgerHas('session:' + s.id)) await award({ key: 'session:' + s.id, kind: 'session', points: Math.max(0, Math.min(pts, DAILY_POINT_CAP - dayPoints(day))), xp: sessionXp(s), refId: s.id, day })
  }
  for (const t of getAll<StudyTask>('tasks')) if (t.status === 'done') await award({ key: 'task:' + t.id, kind: 'task', points: 10, xp: 10, refId: t.id, day: dayKey(t.completedAt ?? t.updatedAt, tz) })
  for (const a of getAll<QuizAttempt>('attempts')) if (a.completedAt) await award({ key: 'quiz:' + a.id, kind: 'quiz', points: 15, xp: 15, refId: a.id, day: dayKey(a.completedAt, tz) })
  const byDay = new Map<string, number>(); for (const r of getAll<ReviewLog>('reviews')) { const d = dayKey(r.at, tz); byDay.set(d, (byDay.get(d) ?? 0) + 1) }
  for (const [d, n] of byDay) if (n >= 5) await award({ key: 'review:' + d, kind: 'review', points: Math.min(30, Math.floor(n / 5) * 4), xp: Math.min(n, 40), day: d })
}
export function useRewardSync() {
  const s = useCollection('sessions'), t = useCollection('tasks'), a = useCollection('attempts'), r = useCollection('reviews'); const p = usePrefs()
  useEffect(() => { void syncRewards() }, [s, t, a, r, p.timezone])
}
