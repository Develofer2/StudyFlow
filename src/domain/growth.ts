import type { LedgerEntry, StudySession, Tree } from '@/types'
import { ALL_ITEMS, SPECIES } from './catalog'
import { dayKey } from './time'

/** Growth rules (shown to the student in the UI via GROWTH_RULES). */
export const MIN_TREE_MINUTES = 5          // shorter sessions plant nothing
export const MAX_ELIGIBLE_MINUTES = 120    // caps what one session can earn, so a forgotten timer is harmless
export const DAILY_POINT_CAP = 400
export const STAGE_NAMES = ['Seed', 'Sprout', 'Seedling', 'Young plant', 'Mature tree', 'Decorated tree'] as const
export const GROWTH_RULES = [
  'Only active focus time counts. Paused time and breaks do not.',
  `A session shorter than ${MIN_TREE_MINUTES} minutes plants nothing.`,
  'Minutes: 5 = sprout, 15 = seedling, 25 = young plant, 40 = mature tree, 60+ = decorated tree.',
  'A stopped session still grows a small plant, but only up to a seedling and it earns no points. Cancelled sessions earn nothing.',
  `One session counts for at most ${MAX_ELIGIBLE_MINUTES} minutes, and at most ${DAILY_POINT_CAP} points can be earned per day.`,
  'Rest days never harm your forest. Trees never die.',
]
export const eligibleMinutes = (s: StudySession) => Math.min(MAX_ELIGIBLE_MINUTES, Math.floor(s.actualFocusSeconds / 60))
export function stageFor(minutes: number, complete: boolean): Tree['stage'] {
  if (minutes < MIN_TREE_MINUTES) return 0
  const st = minutes >= 60 ? 5 : minutes >= 40 ? 4 : minutes >= 25 ? 3 : minutes >= 15 ? 2 : 1
  return (complete ? st : Math.min(st, 2)) as Tree['stage']
}
export const seasonOf = (day: string): Tree['season'] => { const m = Number(day.slice(5, 7)); return m >= 3 && m <= 5 ? 'spring' : m >= 6 && m <= 8 ? 'summer' : m >= 9 && m <= 11 ? 'autumn' : 'winter' }
export const sessionPoints = (s: StudySession) => (s.type === 'focus' && s.status === 'completed' ? Math.round(eligibleMinutes(s) / 2) : 0)
export const sessionXp = (s: StudySession) => (s.type === 'focus' && s.status === 'completed' ? eligibleMinutes(s) : 0)

/** Species are picked deterministically from what the student owns, so reloads never reshuffle a tree. */
export function pickSpecies(sessionId: string, owned: Set<string>, featured?: string): string {
  if (featured && owned.has(featured)) return featured
  const pool = SPECIES.filter(s => s.cost === 0 || owned.has(s.id))
  let h = 0; for (const c of sessionId) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return pool[h % pool.length].id
}
export const ownedIds = (ledger: LedgerEntry[]) => new Set([...ALL_ITEMS.filter(i => i.cost === 0).map(i => i.id), ...ledger.filter(l => l.kind === 'purchase' && l.refId).map(l => l.refId!)])
export const balance = (ledger: LedgerEntry[]) => ledger.reduce((a, l) => a + l.points, 0)
export const totalXp = (ledger: LedgerEntry[]) => ledger.reduce((a, l) => a + l.xp, 0)
export const dayOf = (iso: string, tz: string) => dayKey(iso, tz)
