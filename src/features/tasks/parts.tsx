import { useState } from 'react'
import { ArrowDown, ArrowUp, Circle, CheckCircle2, Clock, Flame, Minus, Pencil, Play, Plus, TriangleAlert, type LucideIcon } from 'lucide-react'
import { Button, Chip, Input, cx } from '@/components/ui'
import { go } from '@/app/router'
import type { StudyTask, Subject, TaskPriority } from '@/types'

export const PRIORITY: Record<TaskPriority, { label: string; icon: LucideIcon; rank: number }> = { low: { label: 'Low', icon: ArrowDown, rank: 3 }, medium: { label: 'Medium', icon: Minus, rank: 2 }, high: { label: 'High', icon: ArrowUp, rank: 1 }, urgent: { label: 'Urgent', icon: Flame, rank: 0 } }
export const dueDay = (t: StudyTask) => t.dueAt?.slice(0, 10)
export const dueTime = (t: StudyTask) => (t.dueAt && t.dueAt.length > 10 ? t.dueAt.slice(11, 16) : '')
export function nowLocal(tz: string) {
  const f = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date())
  const g = (t: string) => f.find(p => p.type === t)!.value
  return { day: `${g('year')}-${g('month')}-${g('day')}`, time: `${g('hour')}:${g('minute')}` }
}
export const isOverdue = (t: StudyTask, now: { day: string; time: string }) => t.status !== 'done' && !!t.dueAt && (dueDay(t)! < now.day || (dueDay(t) === now.day && !!dueTime(t) && dueTime(t) < now.time))
export const fmtDay = (k: string, o: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' }) => new Date(k + 'T00:00:00').toLocaleDateString(undefined, o)
export const sortTasks = (a: StudyTask, b: StudyTask) => (a.dueAt ?? '9').localeCompare(b.dueAt ?? '9') || PRIORITY[a.priority].rank - PRIORITY[b.priority].rank || a.title.localeCompare(b.title)

export interface Ctx { subjects: Subject[]; actual: Map<string, number>; now: { day: string; time: string }; onToggle: (t: StudyTask) => void; onEdit: (t: StudyTask) => void }

export function TaskRow({ t, c, extra }: { t: StudyTask; c: Ctx; extra?: React.ReactNode }) {
  const s = c.subjects.find(x => x.id === t.subjectId); const P = PRIORITY[t.priority]; const done = t.status === 'done'; const over = isOverdue(t, c.now)
  const act = Math.round((c.actual.get(t.id) ?? 0) / 60); const subDone = t.subtasks.filter(x => x.completed).length
  return (
    <li className="rounded-card border hairline bg-surface p-3">
      <div className="flex items-start gap-2">
        <button aria-label={done ? `Mark "${t.title}" as not done` : `Complete "${t.title}"`} aria-pressed={done} onClick={() => c.onToggle(t)} className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-brand hover:bg-surface2">
          {done ? <CheckCircle2 size={24} /> : <Circle size={24} />}</button>
        <div className="min-w-0 flex-1 py-1.5">
          <button onClick={() => c.onEdit(t)} className={cx('block w-full text-left font-bold leading-snug', done && 'text-muted line-through')}>{t.title}</button>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {over && <Chip className="border-bad text-bad"><TriangleAlert size={12} />Overdue</Chip>}
            {t.dueAt && <Chip className={over ? 'text-bad' : ''}><Clock size={12} />{fmtDay(dueDay(t)!)}{dueTime(t) && ` ${dueTime(t)}`}</Chip>}
            <Chip><P.icon size={12} />{P.label}</Chip>
            {s && <Chip><span className="h-2 w-2 rounded-full" style={{ background: s.color }} />{s.name}</Chip>}
            {(t.estimatedMinutes || act > 0) && <Chip className="font-mono tnum">{act} / {t.estimatedMinutes ?? '?'} min</Chip>}
            {t.subtasks.length > 0 && <Chip>{subDone}/{t.subtasks.length} steps</Chip>}
            {t.tags.map(g => <Chip key={g}>#{g}</Chip>)}</div>
          {extra && <div className="mt-2 flex flex-wrap gap-1.5">{extra}</div>}</div>
        <div className="flex shrink-0">
          {!done && <Button size="sm" variant="ghost" className="min-h-11 min-w-11" aria-label={`Start focus on "${t.title}"`} onClick={() => go('focus', { task: t.id })}><Play size={18} /></Button>}
          <Button size="sm" variant="ghost" className="min-h-11 min-w-11" aria-label={`Edit "${t.title}"`} onClick={() => c.onEdit(t)}><Pencil size={16} /></Button></div>
      </div>
    </li>)
}

export function QuickAdd({ onAdd, placeholder = 'Add a task and press Enter' }: { onAdd: (title: string) => void; placeholder?: string }) {
  const [v, setV] = useState('')
  const go = () => { const t = v.trim(); if (!t) return; onAdd(t); setV('') }
  return <form className="flex gap-2" onSubmit={e => { e.preventDefault(); go() }}><Input aria-label="New task title" value={v} maxLength={140} onChange={e => setV(e.target.value)} placeholder={placeholder} enterKeyHint="done" />
    <Button variant="primary" type="submit" aria-label="Add task"><Plus size={18} /><span className="hidden sm:inline">Add</span></Button></form>
}
