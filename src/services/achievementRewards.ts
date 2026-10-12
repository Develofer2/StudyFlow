import type { Achievement } from '@/types'
import { getAll, getPrefs, put } from '@/data/store'
import { badgeSnapshot, rewardLabel, type BadgeDef } from '@/domain/achievements'
import { itemById } from '@/domain/catalog'
import { dayKey } from '@/domain/time'
import { award } from './rewards'

/** Grants the badge's reward once ('ach:'+key is idempotent). Item rewards become owned via a zero-cost purchase entry. */
export async function awardBadgeReward(b: BadgeDef): Promise<void> {
  const day = dayKey(Date.now(), getPrefs().timezone), r = b.reward; if (!r) return
  if (r.points) await award({ key: 'ach:' + b.key, kind: 'achievement', points: r.points, xp: 0, refId: b.key, note: b.name, day })
  if (r.itemId && itemById(r.itemId) && !itemById(r.itemId)!.unlockBadge) await award({ key: 'ach-item:' + b.key, kind: 'purchase', points: 0, xp: 0, refId: r.itemId, note: `${itemById(r.itemId)!.name} (badge reward)`, day })
}
/** Records a newly earned badge (id 'badge-'+key, with a definition snapshot) and grants its reward. */
export async function earnBadge(b: BadgeDef): Promise<void> {
  if (!getAll<Achievement>('achievements').some(a => a.key === b.key)) await put('achievements', { id: 'badge-' + b.key, key: b.key, earnedAt: new Date().toISOString(), snapshot: badgeSnapshot(b), reward: rewardLabel(b.reward) || undefined })
  await awardBadgeReward(b)
}
