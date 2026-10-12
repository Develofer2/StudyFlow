import type { Exam, Quiz, QuizAttempt, StudySession, StudyTask } from '@/types'
import { buildRevisionPlan } from '@/domain/revision'
import { addDays, diffDays } from '@/domain/time'
import { countsAsFocus, totalFocusSeconds } from '@/domain/stats'

/** Pure, rule-based helpers used when no AI is available (and as the base text for AI tools). */
export interface Mistake { key: string; quizTitle: string; prompt: string; options?: string[]; yours: string; correct: string; explanation?: string }
const optText = (q: { options?: string[] }, a: string) => (q.options && /^\d+$/.test(a) ? q.options[Number(a)] ?? a : a)
export function recentMistakes(attempts: QuizAttempt[], quizzes: Quiz[], limit = 20): Mistake[] {
  const out: Mistake[] = []
  for (const at of [...attempts].sort((a, b) => (b.completedAt ?? b.startedAt).localeCompare(a.completedAt ?? a.startedAt)).slice(0, 15)) {
    const quiz = quizzes.find(q => q.id === at.quizId)
    for (const an of at.answers) {
      if (an.correct) continue
      const q = quiz?.questions.find(x => x.id === an.questionId); if (!q) continue
      const correct = q.type === 'short_answer' ? q.acceptedAnswers?.[0] : q.options?.[q.correctOptionIndex ?? -1]
      if (!correct) continue
      out.push({ key: `${at.id}:${q.id}`, quizTitle: at.quizTitle, prompt: q.prompt, options: q.type === 'multiple_choice' ? q.options : undefined, yours: an.answer ? optText(q, an.answer) : '(no answer)', correct, explanation: q.explanation })
      if (out.length >= limit) return out
    }
  }
  return out
}
export const mistakeText = (m: Mistake) => [`Question: ${m.prompt}`, m.options ? `Options: ${m.options.join(' | ')}` : '', `Student answer: ${m.yours}`, `Correct answer: ${m.correct}`].filter(Boolean).join('\n')

export function planText(exam: Exam, today: string, days = 14): { text: string; rows: string[] } | null {
  const plan = buildRevisionPlan(exam, today)
  if (!plan) return null
  const rows = plan.slice(0, days).map(d => `${d.day}: ${d.minutes} min - ${d.topic}`)
  return { rows, text: `Exam: ${exam.name}\nDate: ${exam.date} (${diffDays(exam.date, today)} days left)\nRevision plan:\n${rows.join('\n')}` }
}

export interface Snapshot { today: string; todayMin: number; goalMin: number; overdue: number; dueSoon: number; examName?: string; examDays?: number; weekMin: number }
export function snapshotText(s: Snapshot) {
  return [`Studied today: ${s.todayMin} min (daily goal ${s.goalMin} min)`, `Studied last 7 days: ${s.weekMin} min`, `Tasks overdue: ${s.overdue}`, `Tasks due within 2 days: ${s.dueSoon}`, s.examName ? `Next exam in ${s.examDays} days` : 'No exam in the next 14 days'].join('\n')
}
export function snapshot(i: { today: string; sessions: StudySession[]; tasks: StudyTask[]; exams: Exam[]; goalMin: number; tz: string }): Snapshot {
  const day = (iso: string) => iso.slice(0, 10)
  const open = i.tasks.filter(t => t.status !== 'done' && !t.archivedAt && t.dueAt)
  const exam = i.exams.filter(e => diffDays(e.date, i.today) >= 0 && diffDays(e.date, i.today) <= 14).sort((a, b) => a.date.localeCompare(b.date))[0]
  const inDay = (from: string, to: string) => i.sessions.filter(s => countsAsFocus(s) && s.startedAt.slice(0, 10) >= from && s.startedAt.slice(0, 10) <= to)
  return { today: i.today, goalMin: i.goalMin, todayMin: Math.round(totalFocusSeconds(inDay(i.today, i.today)) / 60), weekMin: Math.round(totalFocusSeconds(inDay(addDays(i.today, -6), i.today)) / 60),
    overdue: open.filter(t => day(t.dueAt!) < i.today).length, dueSoon: open.filter(t => diffDays(day(t.dueAt!), i.today) >= 0 && diffDays(day(t.dueAt!), i.today) <= 2).length, examName: exam?.name, examDays: exam ? diffDays(exam.date, i.today) : undefined }
}
/** Rule-based focus suggestion; every line states the data behind it. */
export function localFocus(s: Snapshot): { title: string; reason: string } {
  if (s.examName && (s.examDays ?? 99) <= 7) return { title: `25 minutes on ${s.examName}`, reason: `The exam is in ${s.examDays} day(s). A focused block now keeps revision spread out.` }
  if (s.dueSoon) return { title: '25 minutes on the task due soonest', reason: `${s.dueSoon} task(s) are due within 2 days.` }
  if (s.overdue) return { title: '15 minutes on the smallest overdue task', reason: `${s.overdue} task(s) are past their date. Start small; there is no penalty for being behind.` }
  if (s.todayMin < s.goalMin) { const left = Math.max(5, s.goalMin - s.todayMin); return { title: `${Math.min(25, left)} minutes of focus`, reason: `You have done ${s.todayMin} of ${s.goalMin} minutes today.` } }
  return { title: 'A short review or a proper break', reason: `You reached today's goal (${s.todayMin} of ${s.goalMin} minutes) and nothing is urgent.` }
}

export type StatKey = 'minutes' | 'sessions' | 'activeDays' | 'goal' | 'tasks' | 'change' | 'bestDay'
export const STAT_LABEL: Record<StatKey, string> = { minutes: 'Focus minutes', sessions: 'Completed sessions', activeDays: 'Days studied', goal: 'Share of your goal', tasks: 'Tasks completed', change: 'Change vs the week before', bestDay: 'Best day' }
export interface Week { totalSeconds: number; completedSessions: number; activeDays: number; goalPct: number | null; tasks: { completed: number }; changePct: number | null; bestDay: string | null }
export function statLines(w: Week, keys: StatKey[]): string[] {
  const v: Record<StatKey, string | null> = { minutes: `Focus minutes this week: ${Math.round(w.totalSeconds / 60)}`, sessions: `Completed sessions: ${w.completedSessions}`, activeDays: `Days studied (of 7): ${w.activeDays}`,
    goal: w.goalPct == null ? null : `Share of weekly goal: ${w.goalPct}%`, tasks: `Tasks completed: ${w.tasks.completed}`, change: w.changePct == null ? null : `Change vs previous week: ${w.changePct > 0 ? '+' : ''}${w.changePct}%`, bestDay: w.bestDay ? `Best day: ${w.bestDay}` : null }
  return keys.map(k => v[k]).filter((x): x is string => !!x)
}
/** Local reflection from the selected stats only. */
export function localReflection(w: Week, keys: StatKey[]): string {
  const out: string[] = []
  if (keys.includes('minutes')) out.push(w.totalSeconds > 0 ? `You focused for ${Math.round(w.totalSeconds / 60)} minutes this week.` : 'No focus time was recorded this week. A single 15-minute session is an easy restart.')
  if (keys.includes('activeDays') && w.activeDays) out.push(`You studied on ${w.activeDays} of 7 days.`)
  if (keys.includes('sessions') && w.completedSessions) out.push(`${w.completedSessions} session(s) were completed.`)
  if (keys.includes('tasks') && w.tasks.completed) out.push(`You finished ${w.tasks.completed} task(s).`)
  if (keys.includes('change') && w.changePct != null) out.push(w.changePct >= 0 ? `That is ${w.changePct}% more than the week before.` : `That is ${Math.abs(w.changePct)}% less than the week before, which is normal after a busy stretch.`)
  if (keys.includes('goal') && w.goalPct != null) out.push(w.goalPct >= 100 ? 'You reached your weekly goal.' : `You reached ${w.goalPct}% of your weekly goal.`)
  if (keys.includes('bestDay') && w.bestDay) out.push(`Your strongest day was ${w.bestDay}.`)
  out.push(w.activeDays >= 4 ? 'Suggestion: keep the same rhythm next week.' : 'Suggestion: pick two fixed study slots next week and protect them.')
  return out.join(' ')
}
/** Rule-based split of an assignment description into draft tasks (bullets, numbers or sentences). */
export function splitAssignment(text: string, max = 10): { title: string; minutes: number }[] {
  const lines = text.split(/\n+/).map(l => l.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').trim()).filter(l => l.length >= 4)
  const parts = lines.length > 1 ? lines : text.split(/(?<=[.!?;])\s+/).map(s => s.trim()).filter(s => s.length >= 4)
  return parts.slice(0, max).map(t => ({ title: t.replace(/[.;]+$/, '').slice(0, 120), minutes: 30 }))
}
