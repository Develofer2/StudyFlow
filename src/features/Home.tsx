import { useMemo, useState } from 'react'
import { BellOff, CalendarClock, Check, CheckCircle2, CircleDashed, CircleHelp, Clock, Flame, Layers, Play, Sparkles, Timer, Trash2 } from 'lucide-react'
import type { Exam, FocusPreset, Flashcard, StudyTask, Subject } from '@/types'
import { useCollection, usePrefs, put, setPrefs } from '@/data/store'
import { Button, Card, ConfirmDialog, Chip, ProgressRing, useToast, cx } from '@/components/ui'
import { go } from '@/app/router'
import { useStats } from '@/hooks/useStats'
import { recommend } from '@/domain/recommend'
import { isDue } from '@/domain/srs'
import { addDays, diffDays, fmtDuration } from '@/domain/time'
import * as timer from '@/services/timerService'
import { loadDemo, removeDemo, toggleTask } from '@/services/app'

const ROUTE: Record<string, string> = { exams: 'quizzes' }
const QUICK: FocusPreset = { id: 'preset-quick10', name: 'Quick 10', workMinutes: 10, shortBreakMinutes: 2, longBreakMinutes: 10, sessionsBeforeLongBreak: 4, autoStartBreaks: false, autoStartWork: false, soundEnabled: true } as FocusPreset

function greeting() { const h = new Date().getHours(); return h < 5 ? 'Still up' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening' }

export default function Home() {
  const p = usePrefs(); const toast = useToast(); const st = useStats()
  const subjects = useCollection<Subject>('subjects'), exams = useCollection<Exam>('exams'), cards = useCollection<Flashcard>('cards')
  const tasks = st.tasks as StudyTask[]
  const [confirmDemo, setConfirmDemo] = useState(false), [busy, setBusy] = useState(false)

  const open = useMemo(() => tasks.filter(t => !t.archivedAt && t.status !== 'done'), [tasks])
  const todays = useMemo(() => {
    const doneToday = tasks.filter(t => !t.archivedAt && t.status === 'done' && t.completedAt && t.completedAt.slice(0, 10) === st.today)
    const rel = open.filter(t => t.dueAt && t.dueAt.slice(0, 10) <= addDays(st.today, 1)).sort((a, b) => (a.dueAt ?? '').localeCompare(b.dueAt ?? ''))
    return [...rel.slice(0, 5), ...doneToday.slice(0, 3)]
  }, [tasks, open, st.today])
  const dueCards = useMemo(() => cards.filter(c => isDue(c, new Date())).length, [cards])
  const nextExam = useMemo(() => exams.filter(e => diffDays(e.date, st.today) >= 0).sort((a, b) => a.date.localeCompare(b.date))[0], [exams, st.today])
  const hasDemo = [subjects, tasks, cards, exams].some(l => l.some(r => r.isDemo))
  const isNew = !subjects.length && !st.sessions.length && !tasks.length
  const goalSec = p.dailyGoalMinutes * 60

  const rec = useMemo(() => recommend({ today: st.today, tz: p.timezone, tasks, cards, exams, sessions: st.sessions, todaySeconds: st.todaySeconds, goalMinutes: p.dailyGoalMinutes, weekSeconds: st.weekSeconds, weeklyGoalMinutes: p.weeklyGoalMinutes, dayOfWeekIndex: (new Date().getDay() + 6) % 7, dismissed: p.dismissedRecs }),
    [st.today, st.sessions, st.todaySeconds, st.weekSeconds, tasks, cards, exams, p.timezone, p.dailyGoalMinutes, p.weeklyGoalMinutes, p.dismissedRecs])

  const hide = (days: number, msg: string) => { void setPrefs({ dismissedRecs: { ...p.dismissedRecs, [rec.id]: new Date(Date.now() + days * 864e5).toISOString() } }); toast(msg, 'info') }
  const startFocus = async (quick?: boolean) => {
    try {
      if (quick) await put('presets', QUICK, true)
      await timer.start('focus', { presetId: quick ? QUICK.id : 'preset-classic' }); go('focus')
    } catch { toast("Couldn't start the timer. Please try again.", 'err') }
  }
  const demo = async (fn: () => Promise<void>, ok: string) => { setBusy(true); try { await fn(); toast(ok) } catch { toast('Something went wrong. Nothing was lost.', 'err') } finally { setBusy(false) } }
  const check = async (t: StudyTask) => { try { await toggleTask(t) } catch { toast("Couldn't update the task.", 'err') } }
  const subj = (id?: string) => subjects.find(s => s.id === id)

  const steps = [
    { done: subjects.length > 0, label: 'Add a subject', to: 'subjects' },
    { done: tasks.length > 0, label: 'Write down one task', to: 'tasks' },
    { done: st.sessions.length > 0, label: 'Do a first focus session', to: 'focus' },
  ]

  return <div className="mx-auto max-w-5xl space-y-5 pb-8">
    <header className="anim-rise">
      <p className="text-sm font-bold text-muted">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
      <h1 className="font-display text-[clamp(1.9rem,6vw,3rem)] font-semibold leading-tight">{greeting()}{p.displayName ? `, ${p.displayName}` : ''}</h1>
      <p className="mt-1 text-[15px] text-muted">{isNew ? "Let's set up a calm place to study." : 'One small session is a good start.'}</p>
      <button onClick={() => go('guide')} className="mt-2 inline-flex min-h-9 items-center gap-1.5 text-sm font-bold text-brand underline underline-offset-2"><CircleHelp size={16} aria-hidden />{isNew ? 'New here? Read how StudyFlow works' : 'How does this all work?'}</button>
    </header>

    <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
      <Card className="anim-rise flex flex-col gap-4">
        <div className="flex items-center gap-5">
          <ProgressRing value={goalSec ? st.todaySeconds / goalSec : 0} size={104} label="Today's progress toward your daily goal">
            <span className="tnum font-display text-xl font-semibold">{Math.round(st.todaySeconds / 60)}<span className="text-xs font-sans text-muted"> min</span></span>
          </ProgressRing>
          <div className="min-w-0">
            <h2 className="font-display text-xl font-semibold">Today</h2>
            <p className="text-[15px] text-muted tnum">{st.todaySeconds >= goalSec ? `Goal reached: ${fmtDuration(st.todaySeconds)} of focus. Lovely.` : `${fmtDuration(st.todaySeconds)} of ${p.dailyGoalMinutes} min goal`}</p>
            {p.gamification && st.current > 0 && <p className="mt-1 flex items-center gap-1.5 text-sm font-bold"><Flame size={16} className="text-brand" aria-hidden />{st.current}-day streak. Nice rhythm.</p>}
            {p.gamification && st.current === 0 && st.longest > 0 && <p className="mt-1 text-sm text-muted">Today is a fresh start whenever you are ready.</p>}
          </div>
        </div>
        <Button variant="primary" size="lg" className="w-full" onClick={() => startFocus()}><Play size={20} aria-hidden />Start a 25-minute focus</Button>
        <Button variant="ghost" className="w-full" onClick={() => startFocus(true)}><Timer size={18} aria-hidden />I only have 10 minutes</Button>
      </Card>

      <Card className="anim-rise space-y-3" aria-labelledby="rec-h">
        <div className="flex items-center gap-2 text-sm font-bold text-brand"><Sparkles size={16} aria-hidden /><span id="rec-h">Suggested for you</span></div>
        <h2 className="font-display text-xl font-semibold leading-snug">{rec.title}</h2>
        <p className="text-[15px] text-muted">{rec.reason}</p>
        <p className="text-xs text-muted">Why: {rec.trigger}</p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Button variant="primary" onClick={() => go(ROUTE[rec.action] ?? rec.action, rec.params)}>{rec.actionLabel}</Button>
          {rec.id !== 'rest' && <>
            <Button onClick={() => hide(1, 'Okay, we will suggest something else for a day.')}><Clock size={16} aria-hidden />Later</Button>
            <Button variant="ghost" onClick={() => hide(7, 'Hidden for a week.')}><BellOff size={16} aria-hidden />Not useful</Button></>}
        </div>
      </Card>
    </div>

    {isNew && <Card className="anim-rise space-y-4">
      <div><h2 className="font-display text-xl font-semibold">Three easy first steps</h2><p className="text-[15px] text-muted">Skip any of them. You can always come back.</p></div>
      <ol className="space-y-2">{steps.map((s, i) => <li key={s.to}><button onClick={() => go(s.to)} className="flex min-h-11 w-full items-center gap-3 rounded-card border hairline bg-bg px-3 text-left hover:bg-surface2">
        {s.done ? <CheckCircle2 size={20} className="text-ok" aria-label="Done" /> : <CircleDashed size={20} className="text-muted" aria-label="Not done yet" />}
        <span className="font-bold">{i + 1}. {s.label}</span></button></li>)}</ol>
      <div className="flex flex-col gap-2 border-t hairline pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">Want to look around first? Sample subject, tasks, flashcards and a note, all marked as demo.</p>
        <Button disabled={busy} onClick={() => demo(loadDemo, 'Demo workspace loaded. You can remove it any time.')}>Load a demo workspace</Button>
      </div>
    </Card>}

    <div className="grid gap-5 md:grid-cols-2">
      <Card className="anim-rise space-y-3" aria-labelledby="tasks-h">
        <div className="flex items-center justify-between"><h2 id="tasks-h" className="font-display text-xl font-semibold">Today&apos;s tasks</h2><Button size="sm" variant="ghost" onClick={() => go('tasks')}>All tasks</Button></div>
        {todays.length === 0 ? <p className="text-[15px] text-muted">{open.length ? `Nothing due today. ${open.length} open task${open.length > 1 ? 's' : ''} waiting when you are ready.` : 'No tasks yet. Add one small thing you could finish today.'}</p> :
          <ul className="space-y-1">{todays.map(t => { const s = subj(t.subjectId), done = t.status === 'done'; return <li key={t.id} className="flex items-center gap-2">
            <button role="checkbox" aria-checked={done} aria-label={`${done ? 'Mark not done' : 'Mark done'}: ${t.title}`} onClick={() => check(t)} className="grid h-11 w-11 shrink-0 place-items-center"><span className={cx('grid h-6 w-6 place-items-center rounded-md border-2', done ? 'border-brand bg-brand text-brand-fg' : 'border-muted')}>{done && <Check size={14} aria-hidden />}</span></button>
            <span className="min-w-0 flex-1"><span className={cx('block truncate text-[15px] font-semibold', done && 'text-muted line-through')}>{t.title}</span>
              <span className="flex items-center gap-1.5 text-xs text-muted">{s && <><span className="h-2 w-2 rounded-full" style={{ background: s.color }} aria-hidden />{s.name}</>}{t.dueAt && !done && <span>{t.dueAt.slice(0, 10) < st.today ? 'Overdue' : t.dueAt.slice(0, 10) === st.today ? 'Due today' : 'Due tomorrow'}</span>}</span></span></li> })}</ul>}
      </Card>

      <div className="space-y-5">
        <Card className="anim-rise flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-surface2 text-brand"><Layers size={20} aria-hidden /></span>
          <div className="min-w-0 flex-1"><h2 className="font-bold">Flashcards</h2><p className="text-sm text-muted tnum">{dueCards ? `${dueCards} card${dueCards > 1 ? 's' : ''} due for review` : cards.length ? 'All caught up' : 'No cards yet'}</p></div>
          {dueCards > 0 && <Button size="sm" onClick={() => go('flashcards')}>Review</Button>}
        </Card>
        <Card className="anim-rise flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-surface2 text-brand"><CalendarClock size={20} aria-hidden /></span>
          <div className="min-w-0 flex-1"><h2 className="font-bold">Next exam</h2>
            <p className="truncate text-sm text-muted tnum">{nextExam ? `${nextExam.name}: ${diffDays(nextExam.date, st.today) === 0 ? 'today' : `in ${diffDays(nextExam.date, st.today)} day${diffDays(nextExam.date, st.today) > 1 ? 's' : ''}`}` : 'No upcoming exams'}</p></div>
          <Button size="sm" variant="ghost" onClick={() => go('quizzes')}>{nextExam ? 'Plan' : 'Add'}</Button>
        </Card>
      </div>
    </div>

    <footer className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
      <p>Saved on this device. Cloud sync isn&apos;t set up.</p>
      {hasDemo && <div className="flex items-center gap-2"><Chip>Demo data in use</Chip><Button size="sm" variant="ghost" disabled={busy} onClick={() => setConfirmDemo(true)}><Trash2 size={14} aria-hidden />Remove demo</Button></div>}
    </footer>
    <ConfirmDialog open={confirmDemo} onClose={() => setConfirmDemo(false)} title="Remove the demo workspace?" confirmLabel="Remove demo" danger
      body="Only the sample items marked as demo are deleted. Anything you created yourself stays." onConfirm={() => demo(removeDemo, 'Demo workspace removed.')} />
  </div>
}
