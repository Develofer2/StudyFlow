import type { Exam, Flashcard, StudySession, StudyTask } from '@/types'
import { isDue } from './srs'
import { countsAsFocus } from './stats'
import { diffDays } from './time'

export interface Recommendation { id: string; title: string; reason: string; trigger: string; action: 'focus' | 'flashcards' | 'tasks' | 'exams' | 'subjects'; actionLabel: string; params?: Record<string, string> }
export interface RecInput { today: string; tz: string; tasks: StudyTask[]; cards: Flashcard[]; exams: Exam[]; sessions: StudySession[]; todaySeconds: number; goalMinutes: number; weekSeconds: number; weeklyGoalMinutes?: number; dayOfWeekIndex: number; dismissed: Record<string, string> }

/** Rules run in priority order; first match not dismissed wins. Every result states the data behind it. */
export function recommend(i: RecInput): Recommendation {
  const dk = (iso: string) => iso.slice(0, 10)
  const list: Recommendation[] = []
  const overdue = i.tasks.filter(t => t.status !== 'done' && !t.archivedAt && t.dueAt && dk(t.dueAt) < i.today)
  const soon = i.tasks.filter(t => t.status !== 'done' && !t.archivedAt && t.dueAt && diffDays(dk(t.dueAt), i.today) >= 0 && diffDays(dk(t.dueAt), i.today) <= 2)
  const exam = i.exams.filter(e => diffDays(e.date, i.today) >= 0 && diffDays(e.date, i.today) <= 7).sort((a, b) => a.date.localeCompare(b.date))[0]
  const due = i.cards.filter(c => isDue(c, new Date()))
  if (exam) list.push({ id: 'exam-' + exam.id, title: `Prepare for ${exam.name}`, reason: `${diffDays(exam.date, i.today) === 0 ? 'It is today' : `It is in ${diffDays(exam.date, i.today)} day(s)`}. A focused session now keeps revision spread out.`, trigger: `Exam on ${exam.date} is within 7 days`, action: 'exams', actionLabel: 'Open exam plan' })
  if (soon.length) list.push({ id: 'soon-' + soon[0].id, title: `Work on “${soon[0].title}”`, reason: 'It is due within two days, so a short session today will take pressure off.', trigger: `${soon.length} task(s) due within 2 days`, action: 'focus', actionLabel: 'Start a focus session', params: { taskId: soon[0].id } })
  if (overdue.length) list.push({ id: 'overdue', title: 'Pick one catch-up task', reason: 'Start with the smallest one. There is no penalty for being behind.', trigger: `${overdue.length} task(s) past their due date`, action: 'tasks', actionLabel: 'See tasks' })
  if (due.length >= 5) list.push({ id: 'cards', title: `Review ${Math.min(due.length, 15)} due flashcards`, reason: 'Short, regular reviews beat long cramming sessions.', trigger: `${due.length} cards are due`, action: 'flashcards', actionLabel: 'Review cards' })
  if (!i.sessions.some(countsAsFocus)) list.push({ id: 'first', title: 'Try a first 15-minute session', reason: 'A short first session is an easy way to start.', trigger: 'No focus sessions recorded yet', action: 'focus', actionLabel: 'Start 15 minutes' })
  else if (i.todaySeconds < i.goalMinutes * 60) {
    const left = Math.max(5, Math.ceil(i.goalMinutes - i.todaySeconds / 60))
    list.push({ id: 'daily', title: `${Math.min(left, 25)} more minutes reaches today's goal`, reason: `You have studied ${Math.round(i.todaySeconds / 60)} of ${i.goalMinutes} minutes today.`, trigger: 'Daily goal not reached', action: 'focus', actionLabel: 'Start a session' })
  }
  if (i.weeklyGoalMinutes && i.dayOfWeekIndex >= 3 && i.weekSeconds / 60 < i.weeklyGoalMinutes * 0.4) list.push({ id: 'weekly', title: 'Weekly goal is behind pace', reason: `About ${Math.ceil((i.weeklyGoalMinutes - i.weekSeconds / 60) / Math.max(1, 7 - i.dayOfWeekIndex))} min/day for the rest of the week gets you there.`, trigger: 'Under 40% of weekly goal at mid-week', action: 'focus', actionLabel: 'Start a session' })
  const fresh = list.filter(r => !i.dismissed[r.id] || i.dismissed[r.id] < new Date().toISOString())
  return fresh[0] ?? { id: 'rest', title: 'You are on track', reason: 'Nothing is urgent. Review a deck or take a proper break.', trigger: 'No rule matched', action: 'flashcards', actionLabel: 'Browse flashcards' }
}
