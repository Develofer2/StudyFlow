import { useMemo } from 'react'
import type { Flashcard, QuizAttempt, ReviewLog, StudySession, StudyTask } from '@/types'
import { useCollection, usePrefs } from '@/data/store'
import { addDays, dayKey, startOfWeek } from '@/domain/time'
import { bySubject, focusByDay, streaks, totalFocusSeconds } from '@/domain/stats'

export function useStats() {
  const sessions = useCollection<StudySession>('sessions'), tasks = useCollection<StudyTask>('tasks'), cards = useCollection<Flashcard>('cards')
  const attempts = useCollection<QuizAttempt>('attempts'), reviews = useCollection<ReviewLog>('reviews'); const p = usePrefs()
  return useMemo(() => {
    const today = dayKey(new Date(), p.timezone)
    const byDay = focusByDay(sessions, p.timezone)
    const st = streaks(byDay, p.dailyGoalMinutes * 60, today, p.graceDay)
    const weekStart = startOfWeek(today, p.weekStartsOn)
    let weekSeconds = 0; for (let d = weekStart; d <= addDays(weekStart, 6); d = addDays(d, 1)) weekSeconds += byDay.get(d) ?? 0
    const subj = bySubject(sessions)
    return { today, byDay, todaySeconds: byDay.get(today) ?? 0, weekStart, weekSeconds, ...st, totalSeconds: totalFocusSeconds(sessions), sessions, tasks, cards, attempts, reviews: reviews.length,
      weeklyGoalMet: !!p.weeklyGoalMinutes && weekSeconds >= p.weeklyGoalMinutes * 60, maxSubjectSeconds: subj.filter(s => s.subjectId)[0]?.seconds ?? 0 }
  }, [sessions, tasks, cards, attempts, reviews, p.timezone, p.dailyGoalMinutes, p.graceDay, p.weekStartsOn, p.weeklyGoalMinutes])
}
