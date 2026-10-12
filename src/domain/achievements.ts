import type { Achievement, Flashcard, QuizAttempt, StudySession, StudyTask, Tree } from '@/types'
import { countsAsFocus, focusByDay, isCompletedFocus } from './stats'
import { itemById } from './catalog'
import { dayKey, diffDays, startOfWeek } from './time'

/** New fields are optional so older callers keep working; badges that need them simply show 0 progress until supplied. */
export interface BadgeCtx {
  sessions: StudySession[]; tasks: StudyTask[]; cards: Flashcard[]; attempts: QuizAttempt[]; reviews: number; streakLongest: number; weeklyGoalMet: boolean; maxSubjectSeconds: number; tz: string
  trees?: Tree[]; buddyXp?: number; weekStartsOn?: 0 | 1; weeklyGoalMinutes?: number
}
export type BadgeCategory = 'First steps' | 'Focus mastery' | 'Consistency' | 'Subject learning' | 'Flashcard mastery' | 'Quiz improvement' | 'Task completion' | 'Forest growth' | 'Buddy progression' | 'Personal bests' | 'Weekly goals' | 'Welcome back'
export const BADGE_CATEGORIES: BadgeCategory[] = ['First steps', 'Focus mastery', 'Consistency', 'Subject learning', 'Flashcard mastery', 'Quiz improvement', 'Task completion', 'Forest growth', 'Buddy progression', 'Personal bests', 'Weekly goals', 'Welcome back']
export type BadgeTier = 'bronze' | 'silver' | 'gold'
export interface BadgeReward { points?: number; itemId?: string }
export interface BadgeDef { key: string; name: string; condition: string; xp: number; category: BadgeCategory; tier?: BadgeTier; reward?: BadgeReward; test: (c: BadgeCtx) => boolean; progress: (c: BadgeCtx) => { value: number; target: number } }
const hour = (iso: string, tz: string) => Number(new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', hour12: false }).format(new Date(iso))) % 24

interface Derived { done: StudySession[]; totalSec: number; byDay: Map<string, number>; maxDaySec: number; maxSessionSec: number; subjects: number; weeks: { sec: number; sessions: number; days: number }[]; goalWeeks: number; comeback: boolean; comebackStreak: boolean; tasksDone: number; onTime: number; improver: boolean; perfect: boolean }
const cache = new WeakMap<BadgeCtx, Derived>()
function derive(c: BadgeCtx): Derived {
  const hit = cache.get(c); if (hit) return hit
  const done = c.sessions.filter(isCompletedFocus), focus = c.sessions.filter(countsAsFocus), byDay = focusByDay(c.sessions, c.tz), ws = c.weekStartsOn ?? 1
  const weeks = new Map<string, { sec: number; sessions: number; days: Set<string> }>()
  for (const s of focus) { const d = dayKey(s.startedAt, c.tz), k = startOfWeek(d, ws), w = weeks.get(k) ?? { sec: 0, sessions: 0, days: new Set() }; w.sec += s.actualFocusSeconds; w.sessions += isCompletedFocus(s) ? 1 : 0; w.days.add(d); weeks.set(k, w) }
  const wl = [...weeks.values()].map(w => ({ sec: w.sec, sessions: w.sessions, days: w.days.size }))
  const days = [...byDay.keys()].sort()
  let comeback = false, comebackStreak = false
  for (let i = 1; i < days.length; i++) if (diffDays(days[i], days[i - 1]) >= 8) { comeback = true; if (days.filter(d => diffDays(d, days[i]) >= 0 && diffDays(d, days[i]) <= 6).length >= 3) comebackStreak = true }
  const byQuiz = new Map<string, QuizAttempt[]>(); for (const a of c.attempts) if (a.maxScore > 0) byQuiz.set(a.quizId, [...(byQuiz.get(a.quizId) ?? []), a])
  const pct = (a: QuizAttempt) => a.score / a.maxScore
  const improver = [...byQuiz.values()].some(l => { const s = [...l].sort((x, y) => (x.completedAt ?? x.startedAt).localeCompare(y.completedAt ?? y.startedAt)); return s.slice(1).some(a => pct(a) > pct(s[0])) })
  const td = c.tasks.filter(t => t.status === 'done')
  const d: Derived = { done, totalSec: focus.reduce((a, s) => a + s.actualFocusSeconds, 0), byDay, maxDaySec: Math.max(0, ...byDay.values()), maxSessionSec: Math.max(0, ...focus.map(s => s.actualFocusSeconds)),
    subjects: new Set(focus.filter(s => s.subjectId).map(s => s.subjectId)).size, weeks: wl,
    goalWeeks: c.weeklyGoalMinutes ? wl.filter(w => w.sec >= c.weeklyGoalMinutes! * 60).length : 0, comeback, comebackStreak, tasksDone: td.length,
    onTime: td.filter(t => t.dueAt && t.completedAt && t.completedAt <= t.dueAt).length, improver, perfect: c.attempts.some(a => a.answers.length >= 5 && a.maxScore > 0 && a.score >= a.maxScore) }
  cache.set(c, d); return d
}
const P = (value: number, target: number) => ({ value: Math.min(value, target), target })
const bool = (v: boolean) => P(v ? 1 : 0, 1)
type Spec = Omit<BadgeDef, 'test'> & { test?: BadgeDef['test'] }
const B = (s: Spec): BadgeDef => ({ ...s, test: s.test ?? (c => { const p = s.progress(c); return p.value >= p.target }) })
const lvl = (xp = 0) => levelFromXp(xp).level
const T = { bronze: 15, silver: 30, gold: 60 }
const R = (tier: BadgeTier, itemId?: string): BadgeReward => ({ points: T[tier], itemId })

// The first 12 are the original badges: keys, ids, names, conditions and tests are unchanged.
export const BADGES: BadgeDef[] = [
  B({ key: 'first-focus', name: 'First Focus', condition: 'Complete one focus session', xp: 20, category: 'First steps', tier: 'bronze', progress: c => P(derive(c).done.length, 1), test: c => c.sessions.some(isCompletedFocus) }),
  B({ key: 'five-sessions', name: 'Five Sessions', condition: 'Complete 5 focus sessions', xp: 40, category: 'Focus mastery', tier: 'bronze', progress: c => P(derive(c).done.length, 5), test: c => c.sessions.filter(isCompletedFocus).length >= 5 }),
  B({ key: 'deep-work', name: 'Deep Work', condition: 'Complete a focus session of 45+ minutes', xp: 60, category: 'Focus mastery', tier: 'silver', progress: c => P(Math.floor(derive(c).done.reduce((m, s) => Math.max(m, s.actualFocusSeconds), 0) / 60), 45), test: c => c.sessions.some(s => isCompletedFocus(s) && s.actualFocusSeconds >= 2700) }),
  B({ key: 'early-starter', name: 'Early Starter', condition: 'Complete a focus session that starts before 9am', xp: 30, category: 'Personal bests', tier: 'bronze', progress: c => bool(c.sessions.some(s => isCompletedFocus(s) && hour(s.startedAt, c.tz) < 9)), test: c => c.sessions.some(s => isCompletedFocus(s) && hour(s.startedAt, c.tz) < 9) }),
  B({ key: 'consistency', name: 'Consistency Builder', condition: 'Reach a 3-day streak', xp: 50, category: 'Consistency', tier: 'bronze', progress: c => P(c.streakLongest, 3), test: c => c.streakLongest >= 3 }),
  B({ key: 'seven-day', name: 'Seven-Day Streak', condition: 'Reach a 7-day streak', xp: 100, category: 'Consistency', tier: 'silver', progress: c => P(c.streakLongest, 7), test: c => c.streakLongest >= 7 }),
  B({ key: 'flashcard-explorer', name: 'Flashcard Explorer', condition: 'Review 25 flashcards', xp: 40, category: 'Flashcard mastery', tier: 'bronze', progress: c => P(c.reviews, 25), test: c => c.reviews >= 25 }),
  B({ key: 'recall-champion', name: 'Recall Champion', condition: 'Have 10 mastered cards (21+ day interval)', xp: 80, category: 'Flashcard mastery', tier: 'silver', progress: c => P(c.cards.filter(x => x.intervalDays >= 21).length, 10), test: c => c.cards.filter(x => x.intervalDays >= 21).length >= 10 }),
  B({ key: 'task-finisher', name: 'Task Finisher', condition: 'Complete 10 tasks', xp: 50, category: 'Task completion', tier: 'bronze', progress: c => P(derive(c).tasksDone, 10), test: c => c.tasks.filter(t => t.status === 'done').length >= 10 }),
  B({ key: 'exam-ready', name: 'Exam Ready', condition: 'Score 80%+ on a quiz of 5+ questions', xp: 60, category: 'Quiz improvement', tier: 'silver', progress: c => bool(c.attempts.some(a => a.answers.length >= 5 && a.maxScore > 0 && a.score / a.maxScore >= 0.8)), test: c => c.attempts.some(a => a.answers.length >= 5 && a.maxScore > 0 && a.score / a.maxScore >= 0.8) }),
  B({ key: 'weekly-goal', name: 'Weekly Goal Achieved', condition: 'Meet your weekly study goal', xp: 80, category: 'Weekly goals', tier: 'silver', progress: c => bool(c.weeklyGoalMet), test: c => c.weeklyGoalMet }),
  B({ key: 'subject-specialist', name: 'Subject Specialist', condition: 'Study one subject for 10 hours', xp: 100, category: 'Subject learning', tier: 'gold', progress: c => P(Math.floor(c.maxSubjectSeconds / 60), 600), test: c => c.maxSubjectSeconds >= 36000 }),

  // First steps
  B({ key: 'first-task', name: 'Task Done', condition: 'Complete your first task', xp: 15, category: 'First steps', tier: 'bronze', reward: R('bronze'), progress: c => P(derive(c).tasksDone, 1) }),
  B({ key: 'first-review', name: 'First Recall', condition: 'Review your first flashcard', xp: 15, category: 'First steps', tier: 'bronze', reward: R('bronze'), progress: c => P(c.reviews, 1) }),
  B({ key: 'first-quiz', name: 'Quiz Starter', condition: 'Complete your first quiz', xp: 15, category: 'First steps', tier: 'bronze', reward: R('bronze'), progress: c => P(c.attempts.length, 1) }),
  B({ key: 'first-tree', name: 'First Seed', condition: 'Grow your first tree with a focus session', xp: 15, category: 'First steps', tier: 'bronze', reward: R('bronze'), progress: c => P(c.trees?.length ?? 0, 1) }),
  // Focus mastery
  B({ key: 'hour-focus', name: 'Full Hour', condition: 'Complete a focus session of 60+ minutes', xp: 70, category: 'Focus mastery', tier: 'silver', reward: R('silver'), progress: c => P(Math.floor(derive(c).done.reduce((m, s) => Math.max(m, s.actualFocusSeconds), 0) / 60), 60) }),
  B({ key: 'sessions-25', name: 'Twenty-Five Sessions', condition: 'Complete 25 focus sessions', xp: 60, category: 'Focus mastery', tier: 'silver', reward: R('silver'), progress: c => P(derive(c).done.length, 25) }),
  B({ key: 'sessions-100', name: 'Hundred Sessions', condition: 'Complete 100 focus sessions', xp: 150, category: 'Focus mastery', tier: 'gold', reward: R('gold'), progress: c => P(derive(c).done.length, 100) }),
  B({ key: 'hours-10', name: 'Ten Hours', condition: 'Focus for 10 hours in total', xp: 70, category: 'Focus mastery', tier: 'silver', reward: R('silver'), progress: c => P(Math.floor(derive(c).totalSec / 60), 600) }),
  B({ key: 'hours-50', name: 'Fifty Hours', condition: 'Focus for 50 hours in total', xp: 200, category: 'Focus mastery', tier: 'gold', reward: R('gold'), progress: c => P(Math.floor(derive(c).totalSec / 60), 3000) }),
  // Consistency
  B({ key: 'streak-14', name: 'Fortnight Rhythm', condition: 'Reach a 14-day streak', xp: 150, category: 'Consistency', tier: 'silver', reward: R('silver'), progress: c => P(c.streakLongest, 14) }),
  B({ key: 'streak-30', name: 'Month of Momentum', condition: 'Reach a 30-day streak', xp: 300, category: 'Consistency', tier: 'gold', reward: R('gold'), progress: c => P(c.streakLongest, 30) }),
  B({ key: 'five-days-week', name: 'Five-Day Week', condition: 'Study on 5 different days in one week', xp: 70, category: 'Consistency', tier: 'silver', reward: R('silver'), progress: c => P(Math.max(0, ...derive(c).weeks.map(w => w.days)), 5) }),
  // Subject learning
  B({ key: 'subject-explorer', name: 'Subject Explorer', condition: 'Focus on 3 different subjects', xp: 40, category: 'Subject learning', tier: 'bronze', reward: R('bronze', 'bench'), progress: c => P(derive(c).subjects, 3) }),
  B({ key: 'subject-five-hours', name: 'Subject Deep Dive', condition: 'Study one subject for 5 hours', xp: 60, category: 'Subject learning', tier: 'silver', reward: R('silver'), progress: c => P(Math.floor(c.maxSubjectSeconds / 60), 300) }),
  B({ key: 'subject-fifty-hours', name: 'Subject Mastery', condition: 'Study one subject for 50 hours', xp: 250, category: 'Subject learning', tier: 'gold', reward: R('gold'), progress: c => P(Math.floor(c.maxSubjectSeconds / 60), 3000) }),
  // Flashcard mastery
  B({ key: 'reviews-100', name: 'Hundred Reviews', condition: 'Review 100 flashcards', xp: 60, category: 'Flashcard mastery', tier: 'silver', reward: R('silver'), progress: c => P(c.reviews, 100) }),
  B({ key: 'reviews-500', name: 'Memory Marathon', condition: 'Review 500 flashcards', xp: 160, category: 'Flashcard mastery', tier: 'gold', reward: R('gold'), progress: c => P(c.reviews, 500) }),
  B({ key: 'mastered-30', name: 'Deep Memory', condition: 'Have 30 mastered cards (21+ day interval)', xp: 150, category: 'Flashcard mastery', tier: 'gold', reward: R('gold'), progress: c => P(c.cards.filter(x => x.intervalDays >= 21).length, 30) }),
  B({ key: 'deck-builder', name: 'Deck Builder', condition: 'Create 50 flashcards', xp: 50, category: 'Flashcard mastery', tier: 'bronze', reward: R('bronze'), progress: c => P(c.cards.length, 50) }),
  // Quiz improvement
  B({ key: 'quiz-three', name: 'Practice Habit', condition: 'Complete 3 quizzes', xp: 40, category: 'Quiz improvement', tier: 'bronze', reward: R('bronze'), progress: c => P(c.attempts.length, 3) }),
  B({ key: 'quiz-improver', name: 'Getting Better', condition: 'Beat your first score when you retake a quiz', xp: 70, category: 'Quiz improvement', tier: 'silver', reward: R('silver'), progress: c => bool(derive(c).improver) }),
  B({ key: 'quiz-perfect', name: 'Full Marks', condition: 'Score 100% on a quiz of 5+ questions', xp: 90, category: 'Quiz improvement', tier: 'gold', reward: R('gold', 'fx-stars'), progress: c => bool(derive(c).perfect) }),
  // Task completion
  B({ key: 'tasks-25', name: 'Twenty-Five Tasks', condition: 'Complete 25 tasks', xp: 90, category: 'Task completion', tier: 'silver', reward: R('silver'), progress: c => P(derive(c).tasksDone, 25) }),
  B({ key: 'tasks-50', name: 'Fifty Tasks', condition: 'Complete 50 tasks', xp: 180, category: 'Task completion', tier: 'gold', reward: R('gold'), progress: c => P(derive(c).tasksDone, 50) }),
  B({ key: 'on-time', name: 'Right on Time', condition: 'Finish 5 tasks on or before their due date', xp: 60, category: 'Task completion', tier: 'silver', reward: R('silver'), progress: c => P(derive(c).onTime, 5) }),
  // Forest growth
  B({ key: 'forest-sapling', name: 'Little Wood', condition: 'Grow 10 trees', xp: 50, category: 'Forest growth', tier: 'bronze', reward: R('bronze'), progress: c => P(c.trees?.length ?? 0, 10) }),
  B({ key: 'forest-grove', name: 'Grove Keeper', condition: 'Grow 25 trees', xp: 90, category: 'Forest growth', tier: 'silver', reward: R('silver'), progress: c => P(c.trees?.length ?? 0, 25) }),
  B({ key: 'forest-hundred', name: 'Whole Forest', condition: 'Grow 100 trees', xp: 300, category: 'Forest growth', tier: 'gold', reward: R('gold'), progress: c => P(c.trees?.length ?? 0, 100) }),
  B({ key: 'forest-decorated', name: 'Full Canopy', condition: 'Grow a decorated tree (60+ minute session)', xp: 80, category: 'Forest growth', tier: 'silver', reward: R('silver'), progress: c => bool((c.trees ?? []).some(t => t.stage === 5)) }),
  // Buddy progression
  B({ key: 'buddy-3', name: 'Buddy Level 3', condition: 'Help your buddy reach level 3', xp: 30, category: 'Buddy progression', tier: 'bronze', reward: R('bronze'), progress: c => P(lvl(c.buddyXp), 3) }),
  B({ key: 'buddy-5', name: 'Buddy Level 5', condition: 'Help your buddy reach level 5', xp: 70, category: 'Buddy progression', tier: 'silver', reward: R('silver'), progress: c => P(lvl(c.buddyXp), 5) }),
  B({ key: 'buddy-10', name: 'Buddy Level 10', condition: 'Help your buddy reach level 10', xp: 200, category: 'Buddy progression', tier: 'gold', reward: R('gold'), progress: c => P(lvl(c.buddyXp), 10) }),
  // Personal bests
  B({ key: 'best-day-2h', name: 'Two-Hour Day', condition: 'Focus for 2 hours in a single day', xp: 60, category: 'Personal bests', tier: 'silver', reward: R('silver'), progress: c => P(Math.floor(derive(c).maxDaySec / 60), 120) }),
  B({ key: 'best-session-90', name: 'Long Haul', condition: 'Focus for 90 minutes in one session', xp: 90, category: 'Personal bests', tier: 'gold', reward: R('gold'), progress: c => P(Math.floor(derive(c).maxSessionSec / 60), 90) }),
  B({ key: 'best-week-10h', name: 'Ten-Hour Week', condition: 'Focus for 10 hours in one week', xp: 100, category: 'Personal bests', tier: 'gold', reward: R('gold'), progress: c => P(Math.floor(Math.max(0, ...derive(c).weeks.map(w => w.sec)) / 60), 600) }),
  // Weekly goals
  B({ key: 'weekly-sessions-5', name: 'Five-Session Week', condition: 'Complete 5 focus sessions in one week', xp: 50, category: 'Weekly goals', tier: 'bronze', reward: R('bronze'), progress: c => P(Math.max(0, ...derive(c).weeks.map(w => w.sessions)), 5) }),
  B({ key: 'weekly-goal-4', name: 'Four Goal Weeks', condition: 'Meet your weekly goal in 4 different weeks', xp: 160, category: 'Weekly goals', tier: 'gold', reward: R('gold'), progress: c => P(derive(c).goalWeeks, 4) }),
  // Welcome back: never a penalty, only a warm hello
  B({ key: 'welcome-back', name: 'Welcome Back', condition: 'Complete a focus session after 7 or more days away', xp: 40, category: 'Welcome back', tier: 'bronze', reward: R('bronze', 'lantern'), progress: c => bool(derive(c).comeback) }),
  B({ key: 'steady-return', name: 'Steady Return', condition: 'After a break of 7+ days, study on 3 days within a week', xp: 70, category: 'Welcome back', tier: 'silver', reward: R('silver'), progress: c => bool(derive(c).comebackStreak) }),
]
/** Pure: badges whose condition now holds and that are not yet earned. `earned` is a list of keys or stored records. */
export function evaluateBadges(ctx: BadgeCtx, earned: (string | Pick<Achievement, 'key'>)[]): BadgeDef[] {
  const have = new Set(earned.map(e => (typeof e === 'string' ? e : e.key)))
  return BADGES.filter(b => !have.has(b.key) && b.test(ctx))
}
export const badgeSnapshot = (b: BadgeDef) => ({ name: b.name, condition: b.condition, category: b.category, tier: b.tier })
export const rewardLabel = (r?: BadgeReward) => !r ? '' : [r.points ? `+${r.points} points` : '', r.itemId ? (itemById(r.itemId)?.name ?? 'an item') : ''].filter(Boolean).join(' and ')
export const levelFromXp = (xp: number) => { let level = 1, need = 100, rest = xp; while (rest >= need) { rest -= need; level++; need = Math.round(need * 1.25) } return { level, into: rest, need } }
/** XP is derived from persisted records, so restarting timers or re-clicking cannot inflate it. */
export function computeXp(c: BadgeCtx, earnedKeys: string[]) {
  return c.sessions.filter(isCompletedFocus).reduce((a, s) => a + Math.min(30, Math.round(s.actualFocusSeconds / 60)), 0)
    + c.tasks.filter(t => t.status === 'done').length * 10 + Math.min(c.reviews, 500) * 1
    + c.attempts.length * 15 + BADGES.filter(b => earnedKeys.includes(b.key)).reduce((a, b) => a + b.xp, 0)
}
