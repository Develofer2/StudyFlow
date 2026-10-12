import { useMemo, useState } from 'react'
import { Award, BookOpen, CheckCircle2, EyeOff, Layers, Route, Sprout, Timer } from 'lucide-react'
import type { Achievement, Quiz, QuizAttempt, ReviewLog, StudySession, StudyTask, Subject, Tree } from '@/types'
import { setPrefs, useCollection, usePrefs } from '@/data/store'
import { Button, Card, EmptyState, PageHeader, Segmented, Select, cx } from '@/components/ui'
import { BADGES } from '@/domain/achievements'
import { itemById } from '@/domain/catalog'
import { buildJourney, filterJourney, groupByDay, weeklyReflection, type JourneyKind } from '@/domain/journey'
import { addDays, dayKey, fmtDuration, startOfWeek } from '@/domain/time'

const ICON: Record<JourneyKind, typeof Timer> = { session: Timer, review: Layers, quiz: BookOpen, task: CheckCircle2, achievement: Award, tree: Sprout }
const KIND_NAME: Record<JourneyKind, string> = { session: 'Focus session', review: 'Flashcards', quiz: 'Quiz', task: 'Task', achievement: 'Badge', tree: 'Tree' }
type Span = '7' | '30' | '90' | 'all'
const fmtDay = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })
const PAGE = 30

export default function Journey() {
  const p = usePrefs(), tz = p.timezone
  const sessions = useCollection<StudySession>('sessions'), reviews = useCollection<ReviewLog>('reviews'), attempts = useCollection<QuizAttempt>('attempts'), tasks = useCollection<StudyTask>('tasks')
  const achievements = useCollection<Achievement>('achievements'), trees = useCollection<Tree>('trees'), quizzes = useCollection<Quiz>('quizzes'), subjects = useCollection<Subject>('subjects')
  const [span, setSpan] = useState<Span>('30'), [subjectId, setSubject] = useState(''), [week, setWeek] = useState<'this' | 'last'>('this'), [pages, setPages] = useState(1)
  const today = dayKey(new Date(), tz), name = (id?: string | null) => subjects.find(s => s.id === id)?.name ?? 'No subject'
  const all = useMemo(() => buildJourney({ sessions, reviews, attempts, tasks, achievements, trees, quizzes, tz, badgeName: k => BADGES.find(b => b.key === k)?.name, speciesName: id => itemById(id)?.name }), [sessions, reviews, attempts, tasks, achievements, trees, quizzes, tz])
  const events = useMemo(() => filterJourney(all, { range: span === 'all' ? {} : { from: addDays(today, -(Number(span) - 1)), to: today }, subjectId: subjectId || undefined }), [all, span, subjectId, today])
  const groups = useMemo(() => groupByDay(events), [events])
  const ws = addDays(startOfWeek(today, p.weekStartsOn), week === 'this' ? 0 : -7), range = { from: ws, to: addDays(ws, 6) }
  const ref = useMemo(() => weeklyReflection({ sessions, reviews, tasks, tz }, range), [sessions, reviews, tasks, tz, ws])
  const setVisible = (visible: boolean) => void setPrefs(x => ({ ...x, journey: { ...x.journey, visible } }))
  const head = <PageHeader title="My Journey" sub="A timeline of what you have actually done, built only from your saved records." action={p.journey.visible && <Button onClick={() => setVisible(false)}><EyeOff size={18} />Hide journey</Button>} />

  if (!p.journey.visible) return <div className="space-y-5">{head}<EmptyState icon={<EyeOff />} title="Your journey is hidden" body="Nothing is shown or removed. Your records are still saved, and you can show the timeline again whenever you like." action={<Button variant="primary" onClick={() => setVisible(true)}>Show my journey</Button>} /></div>

  return <div className="space-y-6">{head}
    <Card className="space-y-3" aria-labelledby="refl"><div className="flex flex-wrap items-center justify-between gap-2"><h2 id="refl" className="flex items-center gap-2 font-display text-xl font-semibold"><Route size={20} className="text-brand" />Weekly reflection</h2>
      <Segmented label="Week" value={week} onChange={setWeek} options={[{ value: 'this', label: 'This week' }, { value: 'last', label: 'Last week' }]} /></div>
      <p className="text-sm text-muted">Totals for {fmtDay(range.from)} to {fmtDay(range.to)}, counted from your saved sessions, tasks and flashcard reviews. Nothing is estimated or compared.</p>
      {ref.empty ? <p className="text-[15px]">No study records in this week. That is fine; rest is part of learning.</p> : <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">{[
        ['Focus sessions finished', String(ref.sessions)], ['Focus time', fmtDuration(ref.minutes * 60)], ['Most-studied subject', ref.topSubjectId ? `${name(ref.topSubjectId)} (${fmtDuration(ref.topSubjectMinutes * 60)})` : 'No subject recorded'],
        ['Tasks finished', String(ref.tasksDone)], ['Flashcards reviewed', String(ref.cardsReviewed)], ['Longest day', ref.bestDay ? `${fmtDay(ref.bestDay)} (${fmtDuration(ref.bestDayMinutes * 60)})` : 'None']].map(([k, v]) => <div key={k} className="rounded-card bg-surface2 p-3"><dt className="text-xs font-bold text-muted">{k}</dt><dd className="mt-0.5 font-semibold">{v}</dd></div>)}</dl>}</Card>

    <div className="flex flex-wrap items-end gap-3"><Segmented label="Date range" value={span} onChange={v => { setSpan(v); setPages(1) }} options={[{ value: '7', label: '7 days' }, { value: '30', label: '30 days' }, { value: '90', label: '90 days' }, { value: 'all', label: 'All time' }]} />
      <div className="w-full sm:w-56"><label className="sr-only" htmlFor="jsub">Subject</label><Select id="jsub" value={subjectId} onChange={e => { setSubject(e.target.value); setPages(1) }}><option value="">All subjects</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></div></div>
    {subjectId && <p className="text-sm text-muted">Flashcard review days and badges are not tied to a subject, so they are left out while a subject is selected.</p>}

    {!groups.length ? <EmptyState icon={<Route />} title="Nothing here yet" body={all.length ? 'No records match this date range and subject.' : 'Your focus sessions, reviews, quizzes, finished tasks and badges will appear here as you go.'} /> :
      <ol aria-label="Timeline" className="relative space-y-5 border-l-2 hairline pl-5">{groups.slice(0, PAGE * pages).map(g => <li key={g.day} className="relative"><span aria-hidden className="absolute -left-[27px] top-1.5 h-3 w-3 rounded-full bg-brand" />
        <h3 className="mb-2 font-display text-lg font-semibold">{fmtDay(g.day)}</h3>
        <ul className="space-y-2">{g.events.map(e => { const I = ICON[e.kind]; return <li key={e.id} className="flex items-start gap-3 rounded-card border hairline bg-surface p-3"><span className={cx('grid h-9 w-9 shrink-0 place-items-center rounded-full', e.kind === 'achievement' ? 'bg-brand text-brand-fg' : 'bg-surface2 text-brand')}><I size={18} aria-hidden /></span>
          <div className="min-w-0"><p className="break-words font-semibold"><span className="sr-only">{KIND_NAME[e.kind]}: </span>{e.title}</p>{(e.detail || e.subjectId) && <p className="break-words text-sm text-muted">{[e.subjectId ? name(e.subjectId) : '', e.detail].filter(Boolean).join(' · ')}</p>}</div></li> })}</ul></li>)}</ol>}
    {groups.length > PAGE * pages && <div className="text-center"><Button onClick={() => setPages(n => n + 1)}>Show earlier days</Button></div>}
  </div>
}
