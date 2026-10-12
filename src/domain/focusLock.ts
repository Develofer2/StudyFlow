import type { HabitPrefs, TimerSnapshot } from '@/types'
export const isLocked = (h: Pick<HabitPrefs, 'focusLock'>, t: Pick<TimerSnapshot, 'phase' | 'status'>, unlockedFor?: string | null, sessionId?: string) =>
  h.focusLock && t.phase === 'focus' && t.status !== 'idle' && !(unlockedFor && unlockedFor === sessionId)
export const FOCUS_PAGES: { id: string; label: string }[] = [
  { id: 'tasks', label: 'Tasks' }, { id: 'subjects', label: 'Subjects' }, { id: 'notes', label: 'Notes' }, { id: 'flashcards', label: 'Flashcards' },
  { id: 'quizzes', label: 'Quizzes' }, { id: 'study', label: 'Study hub' }, { id: 'coach', label: 'Coach' }, { id: 'exam-rescue', label: 'Exam rescue' },
  { id: 'buddy', label: 'Buddy' }, { id: 'themes', label: 'Themes' }, { id: 'settings', label: 'Settings' }, { id: 'home', label: 'Home' },
  { id: 'progress', label: 'Progress' }, { id: 'analytics', label: 'Analytics' }, { id: 'achievements', label: 'Achievements' }, { id: 'forest', label: 'Forest' },
  { id: 'shop', label: 'Shop' }, { id: 'wallet', label: 'Wallet' }, { id: 'journey', label: 'Journey' }, { id: 'avatar', label: 'Avatar' },
]
export const canVisit = (locked: boolean, open: string[] | undefined, id: string) => !locked || id === 'focus' || id === 'guide' || !!open?.includes(id)
export const AWAY_MIN_MS = 5000
export function awayMessage(ms: number) {
  const s = Math.round(ms / 1000), m = Math.floor(s / 60)
  return `You were away for ${m ? `${m}m ${s % 60}s` : `${s}s`}. Welcome back, let us settle in again.`
}
