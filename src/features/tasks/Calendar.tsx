import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button, Segmented, cx } from '@/components/ui'
import { addDays, daysBetween, startOfMonth, startOfWeek } from '@/domain/time'
import type { StudyTask } from '@/types'
import { QuickAdd, TaskRow, dueDay, fmtDay, isOverdue, sortTasks, type Ctx } from './parts'

export default function CalendarView({ tasks, c, weekStartsOn, onAdd }: { tasks: StudyTask[]; c: Ctx; weekStartsOn: 0 | 1; onAdd: (title: string, day: string) => void }) {
  const [sel, setSel] = useState(c.now.day); const [mode, setMode] = useState<'month' | 'week'>('month')
  const byDay = new Map<string, StudyTask[]>(); for (const t of tasks) { const d = dueDay(t); if (d) byDay.set(d, [...(byDay.get(d) ?? []), t]) }
  const first = startOfMonth(sel), gridFrom = startOfWeek(first, weekStartsOn), nextMonth = addDays(first, 31).slice(0, 8) + '01'
  const days = daysBetween(gridFrom, addDays(startOfWeek(addDays(nextMonth, -1), weekStartsOn), 6)); const wk = startOfWeek(sel, weekStartsOn)
  const shift = (n: number) => setSel(mode === 'month' ? (n > 0 ? nextMonth : addDays(first, -1).slice(0, 8) + '01') : addDays(sel, n * 7))
  const heads = daysBetween(startOfWeek(c.now.day, weekStartsOn), addDays(startOfWeek(c.now.day, weekStartsOn), 6))
  const dayList = (k: string) => (byDay.get(k) ?? []).sort(sortTasks)
  const title = mode === 'month' ? fmtDay(first, { month: 'long', year: 'numeric' }) : `${fmtDay(wk, { month: 'short', day: 'numeric' })} to ${fmtDay(addDays(wk, 6), { month: 'short', day: 'numeric' })}`
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1"><Button variant="ghost" aria-label={`Previous ${mode}`} onClick={() => shift(-1)}><ChevronLeft size={20} /></Button>
          <h2 className="min-w-40 text-center font-display text-xl font-semibold" aria-live="polite">{title}</h2><Button variant="ghost" aria-label={`Next ${mode}`} onClick={() => shift(1)}><ChevronRight size={20} /></Button></div>
        <div className="flex gap-2"><Button size="sm" onClick={() => setSel(c.now.day)}>Today</Button><Segmented label="Calendar layout" value={mode} onChange={setMode} options={[{ value: 'month', label: 'Month' }, { value: 'week', label: 'Week' }]} /></div></div>
      {mode === 'month' ? <>
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-muted">{heads.map(h => <div key={h}>{fmtDay(h, { weekday: 'short' })}</div>)}</div>
        <div className="grid grid-cols-7 gap-1">{days.map(k => { const l = byDay.get(k) ?? [], inM = k.slice(0, 7) === first.slice(0, 7), over = l.some(t => isOverdue(t, c.now))
          return <button key={k} aria-pressed={k === sel} aria-label={`${fmtDay(k, { weekday: 'long', month: 'long', day: 'numeric' })}, ${l.length} task${l.length === 1 ? '' : 's'}${over ? ', some overdue' : ''}`} onClick={() => setSel(k)}
            className={cx('flex min-h-12 flex-col items-center justify-start gap-0.5 rounded-[calc(var(--radius)*.5)] border p-1 text-sm font-bold sm:min-h-16', k === sel ? 'border-brand bg-brand text-brand-fg' : 'hairline bg-surface hover:bg-surface2', !inM && k !== sel && 'text-muted opacity-60', k === c.now.day && k !== sel && 'ring-2 ring-brand')}>
            <span className="tnum">{Number(k.slice(8))}</span>{l.length > 0 && <span className={cx('rounded-full px-1.5 text-[11px] font-mono tnum', k === sel ? 'bg-brand-fg text-brand' : over ? 'bg-bad text-bg' : 'bg-surface2 text-ink')}>{over ? '! ' : ''}{l.length}</span>}</button> })}</div>
        <section aria-label={`Tasks on ${fmtDay(sel)}`} className="space-y-3"><h3 className="font-display text-lg font-semibold">{fmtDay(sel, { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
          <QuickAdd onAdd={t => onAdd(t, sel)} placeholder="Add a task for this day" />
          {dayList(sel).length ? <ul className="space-y-2">{dayList(sel).map(t => <TaskRow key={t.id} t={t} c={c} />)}</ul> : <p className="text-sm text-muted">Nothing planned. Enjoy the breathing room or add a task.</p>}</section>
      </> : <div className="space-y-4">{daysBetween(wk, addDays(wk, 6)).map(k => <section key={k} aria-label={fmtDay(k)} className="space-y-2">
        <h3 className={cx('font-display text-lg font-semibold', k === c.now.day && 'text-brand')}>{fmtDay(k, { weekday: 'long', month: 'short', day: 'numeric' })}{k === c.now.day && ' (today)'}</h3>
        {dayList(k).length ? <ul className="space-y-2">{dayList(k).map(t => <TaskRow key={t.id} t={t} c={c} />)}</ul> : <p className="text-sm text-muted">Free day.</p>}</section>)}
        <section className="space-y-2"><h3 className="font-display text-lg font-semibold">Add to {fmtDay(sel)}</h3><QuickAdd onAdd={t => onAdd(t, sel)} placeholder="Add a task for the selected day" />
          <div className="flex flex-wrap gap-1.5">{daysBetween(wk, addDays(wk, 6)).map(k => <Button key={k} size="sm" variant={k === sel ? 'primary' : 'soft'} aria-pressed={k === sel} onClick={() => setSel(k)}>{fmtDay(k, { weekday: 'short', day: 'numeric' })}</Button>)}</div></section></div>}
    </div>)
}
