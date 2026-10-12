import { useEffect, useState } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import { Button, Dialog, Field, Input, Select, Textarea, useToast } from '@/components/ui'
import { put, remove } from '@/data/store'
import { uid } from '@/domain/time'
import type { StudyTask, Subject, TaskPriority } from '@/types'
import { PRIORITY, dueDay, dueTime } from './parts'

export interface Draft { id?: string; title: string; description: string; subjectId: string; date: string; time: string; priority: TaskPriority; est: string; tags: string; subtasks: StudyTask['subtasks']; status: StudyTask['status'] }
export const newDraft = (o: Partial<Draft> = {}): Draft => ({ title: '', description: '', subjectId: '', date: '', time: '', priority: 'medium', est: '', tags: '', subtasks: [], status: 'todo', ...o })
export const draftOf = (t: StudyTask): Draft => ({ id: t.id, title: t.title, description: t.description ?? '', subjectId: t.subjectId ?? '', date: dueDay(t) ?? '', time: dueTime(t), priority: t.priority, est: t.estimatedMinutes ? String(t.estimatedMinutes) : '', tags: t.tags.join(', '), subtasks: t.subtasks, status: t.status })

export default function TaskDialog({ draft, subjects, onClose, existing }: { draft: Draft | null; subjects: Subject[]; onClose: () => void; existing?: StudyTask }) {
  const toast = useToast(); const [d, setD] = useState<Draft>(newDraft()); const [errs, setErrs] = useState<Record<string, string>>({}); const [sub, setSub] = useState(''); const [sure, setSure] = useState(false)
  useEffect(() => { if (draft) { setD(draft); setErrs({}); setSub(''); setSure(false) } }, [draft])
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD(x => ({ ...x, [k]: v }))
  const addSub = () => { const t = sub.trim(); if (!t) return; set('subtasks', [...d.subtasks, { id: uid(), title: t, completed: false }]); setSub('') }
  const save = async () => {
    const e: Record<string, string> = {}
    if (!d.title.trim()) e.title = 'A task needs a title.'
    const est = d.est.trim() ? Number(d.est) : undefined
    if (est !== undefined && (!Number.isInteger(est) || est < 1 || est > 1440)) e.est = 'Use a whole number of minutes, 1 to 1440.'
    setErrs(e); if (Object.keys(e).length) return
    const subtasks = sub.trim() ? [...d.subtasks, { id: uid(), title: sub.trim(), completed: false }] : d.subtasks
    const base = existing ?? {}
    try {
      await put<Partial<StudyTask>>('tasks', { ...base, id: d.id, title: d.title.trim(), description: d.description.trim() || undefined, subjectId: d.subjectId || undefined, dueAt: d.date ? (d.time ? `${d.date}T${d.time}` : d.date) : undefined,
        priority: d.priority, status: d.status, estimatedMinutes: est, tags: [...new Set(d.tags.split(',').map(x => x.trim().replace(/^#/, '')).filter(Boolean))], subtasks })
      toast(d.id ? 'Task updated.' : 'Task added.'); onClose()
    } catch { toast('Could not save the task.', 'err') }
  }
  const del = async () => { if (!d.id) return; try { await remove('tasks', d.id); toast('Task deleted.'); onClose() } catch { toast('Could not delete the task.', 'err') } }
  return (
    <Dialog open={!!draft} onClose={onClose} title={d.id ? 'Edit task' : 'New task'} wide>
      <form className="space-y-4" onSubmit={e => { e.preventDefault(); void save() }}>
        <Field label="Title" error={errs.title}>{(id, x) => <Input id={id} aria-describedby={x} maxLength={140} value={d.title} onChange={e => set('title', e.target.value)} />}</Field>
        <Field label="Description (optional)">{id => <Textarea id={id} rows={3} value={d.description} onChange={e => set('description', e.target.value)} />}</Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Subject">{id => <Select id={id} value={d.subjectId} onChange={e => set('subjectId', e.target.value)}><option value="">No subject</option>{subjects.filter(s => !s.archivedAt || s.id === d.subjectId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</Select>}</Field>
          <Field label="Priority">{id => <Select id={id} value={d.priority} onChange={e => set('priority', e.target.value as TaskPriority)}>{(Object.keys(PRIORITY) as TaskPriority[]).map(p => <option key={p} value={p}>{PRIORITY[p].label}</option>)}</Select>}</Field>
          <Field label="Due date">{id => <Input id={id} type="date" value={d.date} onChange={e => setD(x => ({ ...x, date: e.target.value, time: e.target.value ? x.time : '' }))} />}</Field>
          <Field label="Due time (optional)">{id => <Input id={id} type="time" disabled={!d.date} value={d.time} onChange={e => set('time', e.target.value)} />}</Field>
          <Field label="Estimate (minutes)" error={errs.est}>{(id, x) => <Input id={id} aria-describedby={x} inputMode="numeric" value={d.est} onChange={e => set('est', e.target.value)} placeholder="e.g. 45" />}</Field>
          <Field label="Tags" hint="Separate with commas">{(id, x) => <Input id={id} aria-describedby={x} value={d.tags} onChange={e => set('tags', e.target.value)} placeholder="reading, lab" />}</Field></div>
        <fieldset className="space-y-2"><legend className="text-sm font-bold">Steps</legend>
          <ul className="space-y-1">{d.subtasks.map(s => <li key={s.id} className="flex items-center gap-2">
            <label className="flex min-h-11 flex-1 items-center gap-3"><input type="checkbox" className="h-5 w-5 accent-[var(--primary)]" checked={s.completed} onChange={() => set('subtasks', d.subtasks.map(x => x.id === s.id ? { ...x, completed: !x.completed } : x))} /><span className={s.completed ? 'text-muted line-through' : ''}>{s.title}</span></label>
            <Button size="sm" variant="ghost" className="min-h-11 min-w-11" aria-label={`Remove step "${s.title}"`} onClick={() => set('subtasks', d.subtasks.filter(x => x.id !== s.id))}><X size={16} /></Button></li>)}</ul>
          <div className="flex gap-2"><Input aria-label="New step" value={sub} onChange={e => setSub(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSub() } }} placeholder="Add a step" /><Button aria-label="Add step" onClick={addSub}><Plus size={18} /></Button></div></fieldset>
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          {d.id ? (sure ? <Button variant="danger" onClick={del}><Trash2 size={16} />Yes, delete</Button> : <Button variant="ghost" onClick={() => setSure(true)}><Trash2 size={16} />Delete</Button>) : <span />}
          <div className="flex gap-2"><Button onClick={onClose}>Cancel</Button><Button variant="primary" type="submit">Save task</Button></div></div>
      </form>
    </Dialog>)
}
