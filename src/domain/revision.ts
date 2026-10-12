import type { Exam } from '@/types'
import { addDays, diffDays } from './time'
export interface PlanDay { day: string; minutes: number; topic: string }
/** Transparent plan: spreads weekly hours evenly across days left, cycling unfinished coverage topics (higher priority = more minutes). Returns null if hours are unset. */
export function buildRevisionPlan(exam: Exam, today: string): PlanDay[] | null {
  if (!exam.hoursPerWeek) return null
  const left = diffDays(exam.date, today)
  if (left < 0) return []
  const topics = exam.coverage.filter(c => !c.done).map(c => c.title)
  const weight = exam.priority === 'high' ? 1.25 : exam.priority === 'low' ? 0.85 : 1
  const perDay = Math.max(10, Math.round(((exam.hoursPerWeek * 60) / 7) * weight / 5) * 5)
  const out: PlanDay[] = []
  for (let i = 0; i < Math.min(left, 60); i++) out.push({ day: addDays(today, i), minutes: perDay, topic: topics.length ? topics[i % topics.length] : 'General review and practice questions' })
  return out
}
