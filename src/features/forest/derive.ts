import type { Tree } from '@/types'
import { SPECIES } from '@/domain/catalog'
import { MAX_ELIGIBLE_MINUTES, MIN_TREE_MINUTES, STAGE_NAMES } from '@/domain/growth'
import { addDays, startOfMonth, startOfWeek } from '@/domain/time'

export type Period = 'week' | 'month' | 'all'
export type SeasonFilter = Tree['season'] | 'all'
export function filterTrees(trees: Tree[], period: Period, season: SeasonFilter, today: string, weekStartsOn: 0 | 1): Tree[] {
  const from = period === 'week' ? startOfWeek(today, weekStartsOn) : period === 'month' ? startOfMonth(today) : ''
  return trees.filter(t => t.day >= from && (season === 'all' || t.season === season))
}
/** Newest `weeks` calendar weeks (oldest first), including empty ones, so the timeline never hides rest weeks. */
export function weeklyGrowth(trees: Tree[], weekStartsOn: 0 | 1, today: string, weeks = 8) {
  const cur = startOfWeek(today, weekStartsOn), rows = Array.from({ length: weeks }, (_, i) => ({ start: addDays(cur, -7 * (weeks - 1 - i)), trees: 0, minutes: 0 }))
  for (const t of trees) { const r = rows.find(x => x.start === startOfWeek(t.day, weekStartsOn)); if (r) { r.trees++; r.minutes += t.minutes } }
  return rows
}
export function milestones(trees: Tree[]) {
  const n = trees.length, grown = new Set(trees.map(t => t.species)).size
  return [...[1, 10, 25, 50, 100].map(t => ({ id: 'trees-' + t, label: t === 1 ? 'Plant your first seed' : `Grow ${t} trees`, value: Math.min(n, t), target: t })), { id: 'species', label: 'Grow every species', value: Math.min(grown, SPECIES.length), target: SPECIES.length }]
    .map(m => ({ ...m, done: m.value >= m.target }))
}
const NEXT = [MIN_TREE_MINUTES, 15, 25, 40, 60]
export function whyGrew(t: Pick<Tree, 'minutes' | 'stage' | 'complete'>): string {
  const base = `${t.minutes} focus minute${t.minutes === 1 ? '' : 's'} reached the "${STAGE_NAMES[t.stage]}" stage.`
  if (!t.complete && t.stage <= 2) return base + ' The session was stopped early, so growth is capped at a seedling.'
  if (t.stage < 5) return base + ` ${NEXT[t.stage] - t.minutes > 0 && t.complete ? `${NEXT[t.stage] - t.minutes} more minutes would have grown it further.` : ''}`.trimEnd()
  return base + (t.minutes >= MAX_ELIGIBLE_MINUTES ? ` A single session counts for at most ${MAX_ELIGIBLE_MINUTES} minutes.` : ' 60 minutes or more grows a fully decorated tree.')
}
