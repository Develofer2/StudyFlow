/**
 * Spaced repetition: a simplified SM-2 variant (not a validated research algorithm).
 *  again -> relearn in 10 min, lapse+1, ease -0.20      hard -> interval x1.2, ease -0.15
 *  good  -> 1d, 3d, then interval x ease                 easy -> 4d, then interval x ease x1.3, ease +0.15
 * Ease is clamped to [1.3, 3.0] and interval to [0, 365] days. Any card can be reviewed at any time.
 */
import type { Flashcard } from '@/types'
export type Rating = 'again' | 'hard' | 'good' | 'easy'
export const EASE_MIN = 1.3, EASE_MAX = 3.0, MAX_INTERVAL = 365
export const newCardState = () => ({ repetitions: 0, intervalDays: 0, easeFactor: 2.5, lapseCount: 0 })
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

export function review(card: Pick<Flashcard, 'repetitions' | 'intervalDays' | 'easeFactor' | 'lapseCount'>, rating: Rating, now: Date) {
  let { repetitions, intervalDays, easeFactor, lapseCount } = card
  let dueMs: number
  if (rating === 'again') { repetitions = 0; lapseCount++; easeFactor -= 0.2; intervalDays = 0; dueMs = now.getTime() + 10 * 60000 }
  else {
    if (rating === 'hard') { intervalDays = Math.max(1, Math.round(Math.max(1, intervalDays) * 1.2)); easeFactor -= 0.15 }
    else if (rating === 'good') intervalDays = repetitions === 0 ? 1 : repetitions === 1 ? 3 : Math.round(intervalDays * easeFactor)
    else { intervalDays = repetitions === 0 ? 4 : Math.round(intervalDays * easeFactor * 1.3); easeFactor += 0.15 }
    repetitions++
    intervalDays = clamp(intervalDays, 1, MAX_INTERVAL)
    dueMs = now.getTime() + intervalDays * 86400000
  }
  easeFactor = Math.round(clamp(easeFactor, EASE_MIN, EASE_MAX) * 100) / 100
  return { repetitions, intervalDays, easeFactor, lapseCount, lastReviewedAt: now.toISOString(), dueAt: new Date(dueMs).toISOString() }
}
export const isDue = (c: Pick<Flashcard, 'dueAt'>, now: Date) => !c.dueAt || new Date(c.dueAt) <= now
export const isMastered = (c: Pick<Flashcard, 'intervalDays' | 'repetitions'>) => c.intervalDays >= 21 && c.repetitions >= 3
