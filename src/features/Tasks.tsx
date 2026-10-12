import { useMemo, useState } from 'react'
import { CalendarCheck, CheckCheck, Plus } from 'lucide-react'
import { Button, Card, EmptyState, PageHeader, Segmented, Select, useToast } from '@/components/ui'
import { put, useCollection, usePrefs } from '@/data/store'
import { toggleTask } from '@/services/app'
import { countsAsFocus } from '@/domain/stats'
import type { StudySession, StudyTask, Subject, TaskPriority, TaskStatus } from '@/types'
import { PRIORITY, QuickAdd, TaskRow, dueDay, isOverdue, nowLocal, sortTasks, type Ctx } from './tasks/parts'
import TaskDialog, { draftOf, newDraft, type Draft } from './tasks/TaskDialog'
import Board from './tasks/Board'
import CalendarView from './tasks/Calendar'

type View = 'today' | 'upcoming' | 'board' | 'calendar' | 'done'

export default function Tasks() {
  const toast = useToast(); const prefs = usePrefs()
  const all = useCollection<StudyTask>('tasks'), subjects = useCollection<Subject>('subjects'), sessions = useCollection<StudySession>('sessions')
  const [view, setView] = useState<View>('today'); const [fs, setFs] = useState(''); const [fp, setFp] = useState(''); const [draft, setDraft] = useState<Draft | null>(null); const [editing, setEditing] = useState<StudyTask | undefined>()
  const now = nowLocal(prefs.timezone)
  const actual = useMemo(() => { const m = new Map<string, number>(); for (const s of sessions) if (s.taskId && countsAsFocus(s)) m.set(s.taskId, (m.get(s.taskId) ?? 0) + s.actualFocusSeconds); return m }, [sessions])

  const tasks = all.filter(t => !t.archivedAt && (!fs || (fs === 'none' ? !t.subjectId : t.subjectId === fs)) && (!fp || t.priority === fp))
  const open = tasks.filter(t => t.status !== 'done')
  const today = open.filter(t => t.dueAt && dueDay(t)! <= now.day).sort(sortTasks)
  const upcoming = open.filter(t => !t.dueAt || dueDay(t)! > now.day).sort(sortTasks)
  const done = tasks.filter(t => t.status === 'done').sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))

  const attempt = async (fn: () => Promise<unknown>, ok?: string) => { try { await fn(); if (ok) toast(ok) } catch { toast('Something went wrong. Please try again.', 'err') } }
  const c: Ctx = { subjects, actual, now, onToggle: t => attempt(() => toggleTask(t), t.status === 'done' ? 'Moved back to your list.' : 'Nice, task done.'), onEdit: t => { setEditing(t); setDraft(draftOf(t)) } }
  const move = (t: StudyTask, to: TaskStatus) => attempt(() => to === 'done' ? toggleTask(t) : put('tasks', { ...t, status: to, completedAt: undefined }), 'Task moved.')
  const quick = (title: string, day?: string) => attempt(() => put<Partial<StudyTask>>('tasks', { title, priority: 'medium', status: 'todo', tags: [], subtasks: [], subjectId: fs && fs !== 'none' ? fs : undefined, dueAt: day ?? (view === 'today' ? now.day : undefined) }), 'Task added.')
  const openNew = (o?: Partial<Draft>) => { setEditing(undefined); setDraft(newDraft({ subjectId: fs && fs !== 'none' ? fs : '', ...o })) }

  const list = (l: StudyTask[], empty: { title: string; body: string }) => l.length
    ? <ul className="space-y-2">{l.map(t => <TaskRow key={t.id} t={t} c={c} />)}</ul>
    : <EmptyState icon={<CalendarCheck size={24} />} title={empty.title} body={empty.body} action={view !== 'done' ? <Button variant="primary" onClick={() => openNew({ date: view === 'today' ? now.day : '' })}><Plus size={18} />Add a task</Button> : undefined} />
  const overdueN = open.filter(t => isOverdue(t, now)).length

  return (
    <div>
      <PageHeader title="Tasks & Planner" sub={overdueN ? `${overdueN} overdue. Start with the oldest and the rest will feel lighter.` : 'Plan the next small step, then focus on it.'} action={<Button variant="primary" onClick={() => openNew()}><Plus size={18} />New task</Button>} />
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Segmented<View> label="Task view" value={view} onChange={setView} options={[{ value: 'today', label: `Today${today.length ? ` (${today.length})` : ''}` }, { value: 'upcoming', label: 'Upcoming' }, { value: 'board', label: 'Board' }, { value: 'calendar', label: 'Calendar' }, { value: 'done', label: 'Done' }]} />
          <div className="flex gap-2">
            <Select aria-label="Filter by subject" className="!w-auto" value={fs} onChange={e => setFs(e.target.value)}><option value="">All subjects</option><option value="none">No subject</option>{subjects.filter(s => !s.archivedAt).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</Select>
            <Select aria-label="Filter by priority" className="!w-auto" value={fp} onChange={e => setFp(e.target.value)}><option value="">Any priority</option>{(Object.keys(PRIORITY) as TaskPriority[]).map(p => <option key={p} value={p}>{PRIORITY[p].label}</option>)}</Select></div></div>
        {view !== 'calendar' && view !== 'done' && <Card className="!p-3"><QuickAdd onAdd={t => quick(t)} placeholder={view === 'today' ? 'Add a task for today and press Enter' : 'Add a task and press Enter'} /><button className="mt-2 min-h-11 text-sm font-bold text-brand underline" onClick={() => openNew({ date: view === 'today' ? now.day : '' })}>More details</button></Card>}
        {view === 'today' && list(today, { title: 'Nothing due today', body: 'Your day is clear. Add a task or check what is coming up.' })}
        {view === 'upcoming' && list(upcoming, { title: 'No upcoming tasks', body: 'Add something with a due date and it will show up here.' })}
        {view === 'board' && <Board tasks={tasks} c={c} onMove={move} />}
        {view === 'calendar' && <CalendarView tasks={tasks} c={c} weekStartsOn={prefs.weekStartsOn} onAdd={(t, d) => quick(t, d)} />}
        {view === 'done' && (done.length ? list(done, { title: '', body: '' }) : <EmptyState icon={<CheckCheck size={24} />} title="Nothing finished yet" body="Completed tasks collect here so you can look back on your progress." />)}
      </div>
      <TaskDialog draft={draft} subjects={subjects} existing={editing} onClose={() => setDraft(null)} />
    </div>)
}
