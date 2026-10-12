import { useEffect, useMemo } from 'react'
import type { Achievement, LedgerEntry, Tree } from '@/types'
import { getAll, useCollection, usePrefs } from '@/data/store'
import { useStats } from '@/hooks/useStats'
import { evaluateBadges, type BadgeCtx } from '@/domain/achievements'
import { totalXp } from '@/domain/growth'
import { earnBadge } from '@/services/achievementRewards'

/** Full badge context (includes trees, buddy XP and weekly goal). */
export function useBadgeCtx(): BadgeCtx {
  const s = useStats(), p = usePrefs(), trees = useCollection<Tree>('trees'), ledger = useCollection<LedgerEntry>('rewards')
  return useMemo(() => ({ sessions: s.sessions, tasks: s.tasks, cards: s.cards, attempts: s.attempts, reviews: s.reviews, streakLongest: s.longest, weeklyGoalMet: s.weeklyGoalMet, maxSubjectSeconds: s.maxSubjectSeconds, tz: p.timezone,
    trees, buddyXp: totalXp(ledger), weekStartsOn: p.weekStartsOn, weeklyGoalMinutes: p.weeklyGoalMinutes }), [s, p.timezone, p.weekStartsOn, p.weeklyGoalMinutes, trees, ledger])
}
/** Drop-in replacement for Shell's useBadgeAwarding: awards new badges and their rewards, idempotently. */
export function useBadgeEngine() {
  const ctx = useBadgeCtx(), earned = useCollection<Achievement>('achievements')
  useEffect(() => { for (const b of evaluateBadges(ctx, getAll<Achievement>('achievements'))) void earnBadge(b) }, [ctx, earned.length])
}
