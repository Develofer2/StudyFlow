import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { BarChart3, Download, FileText, Printer, Timer } from 'lucide-react'
import type { Deck, Flashcard, QuizAttempt, Quiz, StudySession, StudyTask, Subject } from '@/types'
import { useCollection, usePrefs } from '@/data/store'
import { Button, Card, EmptyState, Field, Input, PageHeader, Segmented, Select, useToast } from '@/components/ui'
import { addDays, dayKey, daysBetween, diffDays, fmtDuration, previousRange, startOfMonth, startOfWeek, type Range } from '@/domain/time'
import { bySubject, countsAsFocus, daySeries, inRange, productiveHours, sessionsIn, taskStats, totalFocusSeconds, weeklyReport } from '@/domain/stats'
import { isDue, isMastered } from '@/domain/srs'
import { download, toCsv } from '@/services/dataio'
import { go, useRoute } from '@/app/router'
import { ChartCard, DataTable, NoData, Stat, fmtDay, tick, tickInterval, tipStyle, useWide } from './analytics/parts'

type RangeKey = '7d' | '30d' | 'week' | 'month' | 'custom'
const MAX_DAYS = 366

function Heatmap({ byDay, today, weekStartsOn, goalMin, wide }: { byDay: Map<string, number>; today: string; weekStartsOn: 0 | 1; goalMin: number; wide: boolean }) {
  const W = wide ? 26 : 16
  const start = startOfWeek(addDays(today, -7 * (W - 1)), weekStartsOn)
  const weeks = Array.from({ length: W }, (_, w) => Array.from({ length: 7 }, (_, d) => addDays(start, w * 7 + d)))
  const lvl = (sec: number) => { if (sec <= 0) return 0; const r = sec / (goalMin * 60); return r < 0.25 ? 1 : r < 0.5 ? 2 : r < 1 ? 3 : 4 }
  const fill = (l: number) => l === 0 ? 'var(--surface-2)' : `color-mix(in srgb, var(--primary) ${[0, 28, 50, 75, 100][l]}%, var(--surface-2))`
  const labels = weekStartsOn === 1 ? ['Mon', '', 'Wed', '', 'Fri', '', 'Sun'] : ['Sun', '', 'Tue', '', 'Thu', '', 'Sat']
  const active = weeks.flat().filter(d => (byDay.get(d) ?? 0) > 0)
  return <>
    <div className="overflow-x-auto pb-1"><div className="flex w-max gap-1.5">
      <div className="grid grid-rows-7 gap-[3px] pr-1 text-[10px] font-bold text-muted" aria-hidden>{labels.map((l, i) => <span key={i} className="flex h-4 items-center sm:h-[18px]">{l}</span>)}</div>
      <div className="flex gap-[3px]" role="img" aria-label={`Study consistency over the last ${W} weeks. ${active.length} active days. A table with the exact numbers follows.`}>
        {weeks.map((wk, i) => <div key={i} className="grid grid-rows-7 gap-[3px]">{wk.map(d => {
          const sec = byDay.get(d) ?? 0, future = d > today
          return <span key={d} title={future ? '' : `${fmtDay(d)}: ${fmtDuration(sec)}`} className={`h-4 w-4 rounded-[4px] sm:h-[18px] sm:w-[18px] ${future ? 'opacity-0' : ''} ${d === today ? 'outline outline-2 -outline-offset-1 outline-[var(--text)]' : ''}`} style={{ background: fill(lvl(sec)) }} />
        })}</div>)}</div></div></div>
    <div className="mt-2 flex items-center gap-1.5 text-xs text-muted" aria-hidden>Less{[0, 1, 2, 3, 4].map(l => <span key={l} className="h-3.5 w-3.5 rounded-[4px]" style={{ background: fill(l) }} />)}More
      <span className="ml-2">Darkest = daily goal ({goalMin} min) reached. Today is outlined.</span></div>
    <DataTable caption="Study minutes per active day" head={['Day', 'Focus time']} rows={active.reverse().map(d => [fmtDay(d), fmtDuration(byDay.get(d) ?? 0)])} />
  </>
}

export default function Analytics() {
  const p = usePrefs(), tz = p.timezone, toast = useToast(), wide = useWide(), route = useRoute()
  const sessions = useCollection<StudySession>('sessions'), tasks = useCollection<StudyTask>('tasks'), cards = useCollection<Flashcard>('cards')
  const attempts = useCollection<QuizAttempt>('attempts'), subjects = useCollection<Subject>('subjects'), decks = useCollection<Deck>('decks'), quizzes = useCollection<Quiz>('quizzes')
  const [key, setKey] = useState<RangeKey>('7d'); const [subj, setSubj] = useState('')
  const today = dayKey(new Date(), tz)
  const [cFrom, setCFrom] = useState(addDays(today, -13)), [cTo, setCTo] = useState(today)

  const customErr = key === 'custom' ? (!cFrom || !cTo ? 'Pick both dates.' : cFrom > cTo ? 'The start date must be before the end date.' : diffDays(cTo, cFrom) >= MAX_DAYS ? `Choose a range of at most ${MAX_DAYS} days.` : '') : ''
  const range: Range = useMemo(() => {
    if (key === '7d') return { from: addDays(today, -6), to: today }
    if (key === '30d') return { from: addDays(today, -29), to: today }
    if (key === 'week') return { from: startOfWeek(today, p.weekStartsOn), to: today }
    if (key === 'month') return { from: startOfMonth(today), to: today }
    return customErr ? { from: addDays(today, -6), to: today } : { from: cFrom, to: cTo }
  }, [key, today, p.weekStartsOn, cFrom, cTo, customErr])
  const prevR = previousRange(range), nDays = diffDays(range.to, range.from) + 1

  const subjName = (id?: string) => subjects.find(s => s.id === id)?.name ?? 'No subject'
  const subjColor = (id?: string) => subjects.find(s => s.id === id)?.color ?? 'var(--muted)'
  const m = useMemo(() => {
    const sOk = (id?: string) => !subj || (subj === '__none' ? !id : id === subj)
    const ss = sessions.filter(s => sOk(s.subjectId)), tt = tasks.filter(t => sOk(t.subjectId))
    const deckIds = new Set(decks.filter(d => sOk(d.subjectId)).map(d => d.id)), cc = cards.filter(c => deckIds.has(c.deckId))
    const quizIds = new Set(quizzes.filter(q => sOk(q.subjectId)).map(q => q.id)), aa = attempts.filter(a => quizIds.has(a.quizId) || (!subj && !quizzes.some(q => q.id === a.quizId)))
    return { ss, tt, cc, aa }
  }, [sessions, tasks, cards, attempts, decks, quizzes, subj])

  const cur = useMemo(() => sessionsIn(m.ss, range, tz), [m.ss, range, tz])
  const daily = useMemo(() => daySeries(m.ss, range, tz), [m.ss, range, tz])
  const prevDaily = useMemo(() => daySeries(m.ss, prevR, tz), [m.ss, prevR.from, prevR.to, tz]) // eslint-disable-line react-hooks/exhaustive-deps
  const hasPrev = m.ss.some(s => countsAsFocus(s) && dayKey(s.startedAt, tz) <= prevR.to)
  const total = totalFocusSeconds(cur), prevTotal = totalFocusSeconds(sessionsIn(m.ss, prevR, tz))
  const byDayAll = useMemo(() => { const mp = new Map<string, number>(); for (const s of m.ss) if (countsAsFocus(s)) { const k = dayKey(s.startedAt, tz); mp.set(k, (mp.get(k) ?? 0) + s.actualFocusSeconds) } return mp }, [m.ss, tz])
  const split = bySubject(cur).map(x => ({ ...x, name: subjName(x.subjectId), minutes: Math.round(x.seconds / 60), color: subjColor(x.subjectId) }))
  const ts = taskStats(m.tt, range, tz)
  const taskDaily = useMemo(() => daysBetween(range.from, range.to).map(day => ({ day, label: fmtDay(day), done: m.tt.filter(t => t.completedAt && dayKey(t.completedAt, tz) === day).length })), [m.tt, range, tz])
  const now = new Date()
  const fc = [{ name: 'New', value: m.cc.filter(c => !c.lastReviewedAt && c.repetitions === 0).length, fill: 'var(--muted)' }, { name: 'Learning', value: m.cc.filter(c => (c.lastReviewedAt || c.repetitions > 0) && !isMastered(c)).length, fill: 'var(--warning)' }, { name: 'Mastered', value: m.cc.filter(isMastered).length, fill: 'var(--success)' }]
  const dueNow = m.cc.filter(c => isDue(c, now)).length
  const quiz = m.aa.filter(a => a.maxScore > 0 && inRange(a.completedAt ?? a.startedAt, range, tz)).sort((a, b) => (a.completedAt ?? a.startedAt).localeCompare(b.completedAt ?? b.startedAt))
    .map((a, i) => ({ i: i + 1, label: fmtDay(dayKey(a.completedAt ?? a.startedAt, tz)), title: a.quizTitle, pct: Math.round((a.score / a.maxScore) * 100) }))
  const hours = productiveHours(cur, tz).map((s, h) => ({ h, label: `${String(h).padStart(2, '0')}:00`, minutes: Math.round(s / 60) }))
  const peak = hours.reduce((a, b) => (b.minutes > a.minutes ? b : a), hours[0])
  const goalMin = nDays === 7 ? (p.weeklyGoalMinutes ?? p.dailyGoalMinutes * 7) : p.dailyGoalMinutes * nDays
  const report = weeklyReport(m.ss, m.tt, range, tz, goalMin)
  const trend = daily.map((d, i) => ({ i, label: fmtDay(d.day), prevLabel: fmtDay(prevDaily[i].day), current: d.minutes, previous: prevDaily[i].minutes }))
  const ti = tickInterval(daily.length, wide)
  const everything = !sessions.length && !tasks.length && !cards.length && !attempts.length
  const delta = hasPrev && prevTotal > 0 ? Math.round(((total - prevTotal) / prevTotal) * 100) : null

  const reportRows = () => daily.map(d => ({ date: d.day, focusMinutes: d.minutes }))
  const exportJson = () => { download(`studyflow-report-${range.from}_${range.to}.json`, JSON.stringify({ range, subject: subj ? (subj === '__none' ? 'No subject' : subjName(subj)) : 'All', totalFocusMinutes: Math.round(total / 60), completedSessions: report.completedSessions, activeDays: report.activeDays, changePctVsPrevious: report.changePct, tasks: report.tasks, goalPct: report.goalPct, daily: reportRows(), subjects: split.map(s => ({ subject: s.name, minutes: s.minutes })) }, null, 2)); toast('Report exported as JSON') }
  const exportCsv = () => { const c = toCsv(reportRows()); if (!c) return toast('Nothing to export in this range', 'info'); download(`studyflow-report-${range.from}_${range.to}.csv`, c, 'text/csv'); toast('Report exported as CSV') }

  const embedded = route.path !== 'analytics'
  const filters = <div className="no-print mb-5 flex flex-wrap items-end gap-3">
    <Segmented<RangeKey> label="Date range" value={key} onChange={setKey} options={[{ value: '7d', label: '7 days' }, { value: '30d', label: '30 days' }, { value: 'week', label: 'This week' }, { value: 'month', label: 'This month' }, { value: 'custom', label: 'Custom' }]} />
    <div className="w-full sm:w-52"><Field label="Subject">{id => <Select id={id} value={subj} onChange={e => setSubj(e.target.value)}><option value="">All subjects</option><option value="__none">No subject</option>{subjects.filter(s => !s.archivedAt || s.id === subj).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</Select>}</Field></div>
    {key === 'custom' && <div className="flex w-full flex-wrap gap-3"><div className="w-40"><Field label="From" error={customErr || undefined}>{id => <Input id={id} type="date" value={cFrom} max={cTo} onChange={e => setCFrom(e.target.value)} />}</Field></div>
      <div className="w-40"><Field label="To">{id => <Input id={id} type="date" value={cTo} min={cFrom} max={today} onChange={e => setCTo(e.target.value)} />}</Field></div></div>}
  </div>

  return <div className="space-y-5">
    {embedded ? null : <PageHeader title="Analytics" sub="Your study time, tasks, cards and quizzes at a glance. Everything is computed on this device." />}
    {everything ? <EmptyState icon={<BarChart3 />} title="Nothing to chart yet" body="Finish a focus session, tick off a task or review a flashcard and your charts will appear here." action={<Button variant="primary" onClick={() => go('focus')}><Timer size={18} />Start a focus session</Button>} /> : <>
      {filters}
      <p className="text-sm text-muted"><strong className="text-ink">How focus time is counted:</strong> completed and stopped-early sessions count; cancelled sessions don&apos;t. Breaks are never counted. Showing {fmtDay(range.from)} to {fmtDay(range.to)} ({nDays} day{nDays === 1 ? '' : 's'}).</p>

      <Card aria-label="Report" className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-display text-xl font-semibold">Report: {fmtDay(range.from)} to {fmtDay(range.to)}</h2>
          <p className="text-sm text-muted">{subj ? (subj === '__none' ? 'No subject' : subjName(subj)) : 'All subjects'}</p></div>
          <div className="no-print flex flex-wrap gap-2"><Button size="sm" onClick={() => window.print()}><Printer size={16} />Print</Button><Button size="sm" onClick={exportJson}><Download size={16} />JSON</Button><Button size="sm" onClick={exportCsv}><FileText size={16} />CSV</Button></div></div>
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          <Stat label="Focus time" value={fmtDuration(total)} sub={report.goalPct !== null ? `${report.goalPct}% of ${fmtDuration(goalMin * 60)} goal` : undefined} />
          <Stat label="Sessions finished" value={report.completedSessions} sub={`${report.activeDays} active day${report.activeDays === 1 ? '' : 's'}`} />
          <Stat label="Vs previous period" value={delta === null ? '—' : `${delta > 0 ? '+' : ''}${delta}%`} sub={delta === null ? 'No previous data to compare' : `${fmtDuration(prevTotal)} before`} />
          <Stat label="Tasks done" value={report.tasks.completed} sub={report.tasks.rate === null ? 'None due in range' : `${Math.round(report.tasks.rate * 100)}% of due tasks`} />
        </div>
        <p className="text-sm text-muted">{report.bestDay ? `Best day: ${fmtDay(report.bestDay)}. ` : 'No focus time logged in this range. '}{report.topSubjectId !== null && report.topSubjectId !== undefined ? `Most time: ${subjName(report.topSubjectId || undefined)}.` : ''}</p>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard title="Daily focus" sub="Minutes per day">
          {total === 0 ? <NoData text="No focus time in this range yet." /> : <div role="img" aria-label={`Daily focus minutes, total ${fmtDuration(total)}`} className="h-56"><ResponsiveContainer width="100%" height="100%"><BarChart data={daily.map(d => ({ ...d, label: fmtDay(d.day) }))} margin={{ left: -16, right: 4, top: 4 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.6} /><XAxis dataKey="label" tick={tick} interval={ti} tickLine={false} axisLine={false} /><YAxis tick={tick} width={44} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip {...tipStyle} formatter={v => [`${v} min`, 'Focus']} /><Bar dataKey="minutes" name="Focus" fill="var(--primary)" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>}
          <DataTable caption="Daily focus minutes" head={['Day', 'Minutes']} rows={daily.map(d => [fmtDay(d.day), d.minutes])} />
        </ChartCard>

        <ChartCard title="Trend vs previous period" sub={hasPrev ? `Compared with ${fmtDay(prevR.from)} to ${fmtDay(prevR.to)}` : undefined}>
          {total === 0 && !hasPrev ? <NoData text="No focus time yet, so there is nothing to compare." /> : <>
            {!hasPrev && <p className="mb-2 rounded-lg bg-surface2 px-3 py-2 text-sm text-muted">No previous data: you had no focus sessions before this period, so only the current period is shown.</p>}
            <div role="img" aria-label="Line chart of daily focus minutes, this period against the previous period" className="h-56"><ResponsiveContainer width="100%" height="100%"><LineChart data={trend} margin={{ left: -16, right: 8, top: 4 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.6} /><XAxis dataKey="label" tick={tick} interval={ti} tickLine={false} axisLine={false} /><YAxis tick={tick} width={44} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip {...tipStyle} formatter={v => [`${v} min`]} /><Legend wrapperStyle={{ fontSize: 12, color: 'var(--muted)' }} />
              <Line dataKey="current" name="This period" stroke="var(--primary)" strokeWidth={2.5} dot={false} />
              {hasPrev && <Line dataKey="previous" name="Previous period" stroke="var(--muted)" strokeWidth={2} strokeDasharray="5 4" dot={false} />}</LineChart></ResponsiveContainer></div></>}
          <DataTable caption="Focus minutes, this and previous period" head={hasPrev ? ['Day', 'This period', 'Previous'] : ['Day', 'This period']} rows={trend.map(t => hasPrev ? [t.label, t.current, t.previous] : [t.label, t.current])} />
        </ChartCard>

        <ChartCard title="Time by subject" sub="Minutes in this range">
          {!split.length ? <NoData text="No subject time in this range." /> : <div role="img" aria-label="Bar chart of focus minutes by subject" style={{ height: Math.max(140, split.length * 44 + 20) }}><ResponsiveContainer width="100%" height="100%"><BarChart data={split} layout="vertical" margin={{ left: 0, right: 16 }}>
            <XAxis type="number" tick={tick} tickLine={false} axisLine={false} /><YAxis type="category" dataKey="name" tick={tick} width={wide ? 110 : 80} tickLine={false} axisLine={false} />
            <Tooltip {...tipStyle} formatter={v => [`${v} min`, 'Focus']} /><Bar dataKey="minutes" radius={[0, 4, 4, 0]}>{split.map((s, i) => <Cell key={i} fill={s.color} />)}</Bar></BarChart></ResponsiveContainer></div>}
          <DataTable caption="Focus time by subject" head={['Subject', 'Time', 'Share']} rows={split.map(s => [s.name, fmtDuration(s.seconds), `${Math.round((s.seconds / (total || 1)) * 100)}%`])} />
        </ChartCard>

        <ChartCard title="Task completion" sub={ts.dueCount ? `${ts.completed} completed, ${ts.dueCount} due in range` : `${ts.completed} completed in range`}>
          {!ts.completed ? <NoData text="No tasks completed in this range." /> : <div role="img" aria-label="Bar chart of tasks completed per day" className="h-48"><ResponsiveContainer width="100%" height="100%"><BarChart data={taskDaily} margin={{ left: -16, right: 4, top: 4 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.6} /><XAxis dataKey="label" tick={tick} interval={tickInterval(taskDaily.length, wide)} tickLine={false} axisLine={false} /><YAxis tick={tick} width={44} allowDecimals={false} tickLine={false} axisLine={false} />
            <Tooltip {...tipStyle} formatter={v => [v, 'Tasks done']} /><Bar dataKey="done" fill="var(--success)" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>}
          <p className="mt-2 text-sm text-muted">{ts.rate === null ? 'No tasks had a due date in this range.' : `${Math.round(ts.rate * 100)}% of tasks due in this range are done.`}</p>
          <DataTable caption="Tasks completed per day" head={['Day', 'Completed']} rows={taskDaily.map(t => [t.label, t.done])} />
        </ChartCard>

        <ChartCard title="Flashcard progress" sub={`${dueNow} due now. Current state, not limited to the date range.`}>
          {!m.cc.length ? <NoData text="No flashcards yet." /> : <div role="img" aria-label={`Flashcards: ${fc.map(f => `${f.value} ${f.name}`).join(', ')}`} className="h-48"><ResponsiveContainer width="100%" height="100%"><BarChart data={fc} margin={{ left: -16, right: 4, top: 4 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.6} /><XAxis dataKey="name" tick={tick} tickLine={false} axisLine={false} /><YAxis tick={tick} width={44} allowDecimals={false} tickLine={false} axisLine={false} />
            <Tooltip {...tipStyle} formatter={v => [v, 'Cards']} /><Bar dataKey="value" radius={[4, 4, 0, 0]}>{fc.map((f, i) => <Cell key={i} fill={f.fill} />)}</Bar></BarChart></ResponsiveContainer></div>}
          <DataTable caption="Flashcards by learning state" head={['State', 'Cards']} rows={[...fc.map(f => [f.name, f.value]), ['Due now (overlaps the above)', dueNow]]} />
        </ChartCard>

        <ChartCard title="Quiz scores" sub="Percent correct per attempt in this range">
          {!quiz.length ? <NoData text="No quiz attempts in this range." /> : <div role="img" aria-label="Line chart of quiz scores over time" className="h-48"><ResponsiveContainer width="100%" height="100%"><LineChart data={quiz} margin={{ left: -16, right: 8, top: 4 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.6} /><XAxis dataKey="label" tick={tick} interval={tickInterval(quiz.length, wide)} tickLine={false} axisLine={false} /><YAxis domain={[0, 100]} unit="%" tick={tick} width={44} tickLine={false} axisLine={false} />
            <Tooltip {...tipStyle} formatter={v => [`${v}%`, 'Score']} /><Line dataKey="pct" stroke="var(--primary)" strokeWidth={2.5} dot={{ r: 3, fill: 'var(--primary)' }} /></LineChart></ResponsiveContainer></div>}
          <DataTable caption="Quiz scores" head={['Date', 'Quiz', 'Score']} rows={quiz.map(q => [q.label, q.title, `${q.pct}%`])} />
        </ChartCard>

        <ChartCard title="Most productive hours" sub={peak.minutes > 0 ? `Your focus peaks around ${peak.label}` : 'Minutes by hour of day'}>
          {total === 0 ? <NoData text="Focus sessions will show when you work best." /> : <div role="img" aria-label={`Focus minutes by hour of day, peak at ${peak.label}`} className="h-48"><ResponsiveContainer width="100%" height="100%"><BarChart data={hours} margin={{ left: -16, right: 4, top: 4 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.6} /><XAxis dataKey="h" tick={tick} interval={wide ? 2 : 5} tickFormatter={h => `${h}h`} tickLine={false} axisLine={false} /><YAxis tick={tick} width={44} allowDecimals={false} tickLine={false} axisLine={false} />
            <Tooltip {...tipStyle} labelFormatter={h => `${String(h).padStart(2, '0')}:00`} formatter={v => [`${v} min`, 'Focus']} /><Bar dataKey="minutes" fill="var(--primary)" radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainer></div>}
          <DataTable caption="Focus minutes by hour" head={['Hour', 'Minutes']} rows={hours.filter(h => h.minutes > 0).map(h => [h.label, h.minutes])} />
        </ChartCard>

        <div className="lg:col-span-2"><ChartCard title="Consistency" sub={`Each square is a day. Not limited to the date range.`}>
          <Heatmap byDay={byDayAll} today={today} weekStartsOn={p.weekStartsOn} goalMin={p.dailyGoalMinutes} wide={wide} /></ChartCard></div>
      </div></>}
  </div>
}
