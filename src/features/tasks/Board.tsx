import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui'
import type { StudyTask, TaskStatus } from '@/types'
import { TaskRow, sortTasks, type Ctx } from './parts'

const COLS: { id: TaskStatus; label: string }[] = [{ id: 'todo', label: 'To do' }, { id: 'in_progress', label: 'In progress' }, { id: 'done', label: 'Done' }]

export default function Board({ tasks, c, onMove }: { tasks: StudyTask[]; c: Ctx; onMove: (t: StudyTask, to: TaskStatus) => void }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {COLS.map((col, i) => { const list = tasks.filter(t => t.status === col.id).sort(col.id === 'done' ? (a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? '') : sortTasks)
        return <section key={col.id} aria-label={col.label} className="min-w-0 space-y-2 rounded-card bg-surface2/60 p-2.5"
          onDragOver={e => e.preventDefault()} onDrop={e => { const t = tasks.find(x => x.id === e.dataTransfer.getData('text/plain')); if (t && t.status !== col.id) onMove(t, col.id) }}>
          <h3 className="flex items-center justify-between px-1 font-display text-lg font-semibold">{col.label}<span className="font-mono text-sm text-muted tnum">{list.length}</span></h3>
          {list.length ? <ul className="space-y-2">{list.slice(0, col.id === 'done' ? 20 : undefined).map(t => <div key={t.id} draggable onDragStart={e => e.dataTransfer.setData('text/plain', t.id)}>
            <TaskRow t={t} c={c} extra={<>{i > 0 && <Button size="sm" onClick={() => onMove(t, COLS[i - 1].id)} aria-label={`Move "${t.title}" to ${COLS[i - 1].label}`}><ArrowLeft size={14} />{COLS[i - 1].label}</Button>}
              {i < 2 && <Button size="sm" onClick={() => onMove(t, COLS[i + 1].id)} aria-label={`Move "${t.title}" to ${COLS[i + 1].label}`}>{COLS[i + 1].label}<ArrowRight size={14} /></Button>}</>} /></div>)}</ul>
            : <p className="px-1 py-4 text-center text-sm text-muted">Nothing here yet.</p>}</section> })}
    </div>)
}
