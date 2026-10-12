import type { Exam, ExamTopic, PlanItem } from '@/types'
import { addDays, diffDays, uid } from './time'
import { topicCards, topicQuizAnswers, type MasteryData } from './mastery'

export const PLAN_RULES = [
  'Days to exam: study days run from today to two days before the exam. The day before is kept light (review only, about 40% of your daily time). Exam day is left free.',
  'Time per topic starts from your effort estimate, scaled by confidence: 1 = full effort, 5 = about 30%.',
  'Extra time is added for overdue flashcards in linked decks (about 1 minute each, max 30) and wrong answers in the latest attempt of linked quizzes (3 minutes each, max 30).',
  'Topics you marked done are not scheduled. Minutes already done on a topic are subtracted.',
  'Work is spread evenly over the days left and never above your daily time. Topics with lower confidence, more overdue cards or more wrong answers go first and are interleaved.',
  'If the effort does not fit your time, every topic is scaled down equally and the plan tells you how much of your estimate it covers.',
]
export interface TopicSignal { dueCards: number; totalCards: number; wrongAnswers: number }
export interface PlanInput { exam: Exam; today: string; data: Pick<MasteryData, 'cards' | 'quizzes' | 'attempts'>; now?: Date }
export type PlanResult = { status: 'needs-info'; missing: string[]; items: PlanItem[] } | { status: 'past'; missing: string[]; items: PlanItem[] }
  | { status: 'ok'; missing: string[]; items: PlanItem[]; coveragePct: number; daysLeft: number }

const CONF_FACTOR = [0, 1, 0.85, 0.7, 0.5, 0.3]
const r5 = (n: number) => Math.round(n / 5) * 5

export function topicSignal(t: ExamTopic, all: ExamTopic[], d: PlanInput['data'], now: Date): TopicSignal {
  const cs = topicCards(t, d.cards)
  const dueCards = cs.filter(c => c.dueAt && new Date(c.dueAt).getTime() <= now.getTime()).length
  const ans = topicQuizAnswers(t, all, d), latest = new Map<string, { id: string; at: string }>()
  for (const a of ans) { const c = latest.get(a.quizId); if (!c || a.at > c.at) latest.set(a.quizId, { id: a.attemptId, at: a.at }) }
  const wrongAnswers = ans.filter(a => !a.correct && latest.get(a.quizId)?.id === a.attemptId).length
  return { dueCards, totalCards: cs.length, wrongAnswers }
}
const need = (t: ExamTopic, s: TopicSignal) => Math.round(t.effortHours * 60 * CONF_FACTOR[t.confidence]) + Math.min(30, s.dueCards) + Math.min(30, s.wrongAnswers * 3)
const priority = (t: ExamTopic, s: TopicSignal) => (6 - t.confidence) + Math.min(3, s.dueCards / 5) + Math.min(3, s.wrongAnswers / 3)

/** Human reason for an item, computed from current data (PlanItem has no stored reason). */
export function explainItem(item: PlanItem, exam: Exam, d: PlanInput['data'], today: string, now = new Date()): string {
  if (item.manual) return 'Added by you.'
  const t = exam.topics?.find(x => x.id === item.topicId)
  if (!t) return 'Part of your plan.'
  const s = topicSignal(t, exam.topics!, d, now), bits = [`${diffDays(exam.date, item.day)} day(s) before the exam`, `confidence ${t.confidence}/5`]
  if (s.dueCards) bits.push(`${s.dueCards} overdue card(s)`)
  if (s.wrongAnswers) bits.push(`${s.wrongAnswers} wrong quiz answer(s)`)
  if (diffDays(exam.date, item.day) === 1) bits.push('light review day')
  return bits.join(', ') + '.'
}

export function missingInfo(exam: Partial<Exam>): string[] {
  const m: string[] = []
  if (!exam.date) m.push('exam date')
  if (!exam.topics?.some(t => !t.done)) m.push('at least one topic that is not done')
  if (!exam.availableMinutesPerDay || exam.availableMinutesPerDay < 10) m.push('minutes available per day (10 or more)')
  return m
}
/** Items kept when regenerating: done and manual ones. */
export const keptItems = (plan: PlanItem[] = []) => plan.filter(p => p.done || p.manual)

export function generatePlan({ exam, today, data, now = new Date() }: PlanInput): PlanResult {
  const kept = keptItems(exam.plan), missing = missingInfo(exam)
  if (missing.length) return { status: 'needs-info', missing, items: kept }
  const daysLeft = diffDays(exam.date, today)
  if (daysLeft < 1) return { status: 'past', missing: [], items: kept }
  const avail = exam.availableMinutesPerDay!, topics = exam.topics!.filter(t => !t.done)
  const lastStudy = addDays(exam.date, -2), lightDay = addDays(exam.date, -1)
  const days: string[] = []
  for (let k = today; diffDays(k, lastStudy) <= 0; k = addDays(k, 1)) days.push(k)
  if (days.length > 90) days.splice(0, days.length - 90)
  const used = new Map<string, number>(); for (const p of kept) used.set(p.day, (used.get(p.day) ?? 0) + p.minutes)
  const sig = new Map(topics.map(t => [t.id, topicSignal(t, exam.topics!, data, now)]))
  const rem = new Map<string, number>()
  for (const t of topics) { const done = kept.filter(p => p.topicId === t.id && p.done).reduce((a, p) => a + p.minutes, 0); rem.set(t.id, Math.max(0, need(t, sig.get(t.id)!) - done)) }
  const demand = [...rem.values()].reduce((a, b) => a + b, 0)
  const lightCap = Math.round(avail * 0.4)
  const cap = days.reduce((a, k) => a + Math.max(0, avail - (used.get(k) ?? 0)), 0)
  const scale = demand > cap && demand > 0 ? cap / demand : 1
  if (scale < 1) for (const [id, v] of rem) rem.set(id, v * scale)
  const items: PlanItem[] = [], order = [...topics].sort((a, b) => priority(b, sig.get(b.id)!) - priority(a, sig.get(a.id)!))
  const remainingDemand = () => [...rem.values()].reduce((a, b) => a + b, 0)
  days.forEach((day, i) => {
    const free = Math.max(0, avail - (used.get(day) ?? 0)), left = days.length - i
    let budget = Math.min(free, Math.max(0, r5(Math.ceil(remainingDemand() / left / 5) * 5)))
    const today_: string[] = []
    while (budget >= 10) {
      const pool = order.filter(t => (rem.get(t.id) ?? 0) >= 5)
      if (!pool.length) break
      const pick = pool.filter(t => !today_.includes(t.id))[0] ?? pool[0]
      let m = Math.min(45, r5(rem.get(pick.id)!), budget); if (m < 10) m = Math.min(10, budget)
      if (budget - m < 10) m = budget
      items.push({ id: uid(), day, topicId: pick.id, title: pick.title, minutes: m, done: false }); today_.push(pick.id)
      rem.set(pick.id, Math.max(0, rem.get(pick.id)! - m)); budget -= m
    }
  })
  {
    let budget = Math.max(0, lightCap - (used.get(lightDay) ?? 0))
    for (const t of order) { if (budget < 10) break; const m = Math.min(25, budget); items.push({ id: uid(), day: lightDay, topicId: t.id, title: `Light review: ${t.title}`, minutes: m, done: false }); budget -= m }
  }
  const total = topics.reduce((a, t) => a + need(t, sig.get(t.id)!), 0)
  const coveragePct = total ? Math.round(100 * (total - demand * (1 - scale)) / total) : 100
  return { status: 'ok', missing: [], items: [...kept, ...items].sort((a, b) => a.day.localeCompare(b.day)), coveragePct, daysLeft }
}
