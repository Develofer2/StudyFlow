import type { Achievement, Quiz, QuizAttempt, ReviewLog, StudySession, StudyTask, Tree } from '@/types'
import { countsAsFocus, isCompletedFocus } from './stats'
import { dayKey, type Range } from './time'

export type JourneyKind = 'session' | 'review' | 'quiz' | 'task' | 'achievement' | 'tree'
export interface JourneyEvent { id: string; kind: JourneyKind; at: string; day: string; title: string; detail?: string; subjectId?: string; minutes?: number }
export interface JourneyInput { sessions: StudySession[]; reviews: ReviewLog[]; attempts: QuizAttempt[]; tasks: StudyTask[]; achievements: Achievement[]; trees: Tree[]; quizzes?: Quiz[]; tz: string; badgeName?: (key: string) => string | undefined; speciesName?: (id: string) => string | undefined }
export interface JourneyFilter { range?: Partial<Range>; subjectId?: string; kinds?: JourneyKind[] }

/** Merges real records into one newest-first timeline. Flashcard reviews collapse to one entry per day; nothing is invented. */
export function buildJourney(i: JourneyInput): JourneyEvent[] {
  const out: JourneyEvent[] = [], tz = i.tz
  for (const s of i.sessions) if (countsAsFocus(s)) { const at = s.endedAt ?? s.startedAt, m = Math.round(s.actualFocusSeconds / 60)
    out.push({ id: 's:' + s.id, kind: 'session', at, day: dayKey(at, tz), title: `${m} min focus session`, detail: isCompletedFocus(s) ? s.intention : 'Stopped early', subjectId: s.subjectId, minutes: m }) }
  const days = new Map<string, { n: number; last: string }>()
  for (const r of i.reviews) { const d = dayKey(r.at, tz), e = days.get(d) ?? { n: 0, last: r.at }; e.n++; if (r.at > e.last) e.last = r.at; days.set(d, e) }
  for (const [d, e] of days) out.push({ id: 'r:' + d, kind: 'review', at: e.last, day: d, title: `Reviewed ${e.n} flashcard${e.n === 1 ? '' : 's'}` })
  const qs = new Map((i.quizzes ?? []).map(q => [q.id, q]))
  for (const a of i.attempts) if (a.completedAt) out.push({ id: 'q:' + a.id, kind: 'quiz', at: a.completedAt, day: dayKey(a.completedAt, tz), title: `Quiz: ${a.quizTitle}`, detail: `${a.score} / ${a.maxScore} points`, subjectId: qs.get(a.quizId)?.subjectId })
  for (const t of i.tasks) if (t.status === 'done' && t.completedAt) out.push({ id: 't:' + t.id, kind: 'task', at: t.completedAt, day: dayKey(t.completedAt, tz), title: `Finished: ${t.title}`, subjectId: t.subjectId })
  for (const a of i.achievements) out.push({ id: 'a:' + a.key, kind: 'achievement', at: a.earnedAt, day: dayKey(a.earnedAt, tz), title: `Badge: ${a.snapshot?.name ?? i.badgeName?.(a.key) ?? a.key}`, detail: a.snapshot?.condition })
  for (const t of i.trees) out.push({ id: 'tr:' + t.id, kind: 'tree', at: t.plantedAt, day: t.day, title: `Grew a ${i.speciesName?.(t.species) ?? t.species} tree`, detail: `${t.minutes} min of focus`, subjectId: t.subjectId, minutes: t.minutes })
  return out.sort((a, b) => b.at.localeCompare(a.at) || a.id.localeCompare(b.id))
}
export function filterJourney(events: JourneyEvent[], f: JourneyFilter): JourneyEvent[] {
  return events.filter(e => (!f.range?.from || e.day >= f.range.from) && (!f.range?.to || e.day <= f.range.to) && (!f.subjectId || e.subjectId === f.subjectId) && (!f.kinds || f.kinds.includes(e.kind)))
}
export function groupByDay(events: JourneyEvent[]): { day: string; events: JourneyEvent[] }[] {
  const m = new Map<string, JourneyEvent[]>(); for (const e of events) m.set(e.day, [...(m.get(e.day) ?? []), e])
  return [...m.entries()].map(([day, events]) => ({ day, events }))
}
export interface Reflection { sessions: number; minutes: number; topSubjectId: string | null; topSubjectMinutes: number; tasksDone: number; cardsReviewed: number; bestDay: string | null; bestDayMinutes: number; empty: boolean }
/** Counts only saved records inside the range; every field is a plain total, with no interpretation. */
export function weeklyReflection(i: Pick<JourneyInput, 'sessions' | 'reviews' | 'tasks' | 'tz'>, r: Range): Reflection {
  const ins = (iso?: string) => { if (!iso) return false; const d = dayKey(iso, i.tz); return d >= r.from && d <= r.to }
  const ss = i.sessions.filter(s => countsAsFocus(s) && ins(s.startedAt))
  const subj = new Map<string, number>(), days = new Map<string, number>()
  for (const s of ss) { subj.set(s.subjectId ?? '', (subj.get(s.subjectId ?? '') ?? 0) + s.actualFocusSeconds); const d = dayKey(s.startedAt, i.tz); days.set(d, (days.get(d) ?? 0) + s.actualFocusSeconds) }
  const top = [...subj.entries()].filter(([k]) => k).sort((a, b) => b[1] - a[1])[0], best = [...days.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]
  const r2: Reflection = { sessions: ss.filter(isCompletedFocus).length, minutes: Math.round(ss.reduce((a, s) => a + s.actualFocusSeconds, 0) / 60), topSubjectId: top?.[0] ?? null, topSubjectMinutes: top ? Math.round(top[1] / 60) : 0,
    tasksDone: i.tasks.filter(t => t.status === 'done' && ins(t.completedAt)).length, cardsReviewed: i.reviews.filter(x => ins(x.at)).length, bestDay: best?.[0] ?? null, bestDayMinutes: best ? Math.round(best[1] / 60) : 0, empty: false }
  r2.empty = !r2.minutes && !r2.tasksDone && !r2.cardsReviewed
  return r2
}
