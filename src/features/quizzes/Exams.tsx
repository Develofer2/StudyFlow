import { useState } from 'react'
import { CalendarClock, ChevronDown, Pencil, Plus, Sparkles, Square, Trash2 } from 'lucide-react'
import { Button, Card, Chip, ConfirmDialog, Dialog, EmptyState, Field, Input, Select, Textarea, useToast } from '@/components/ui'
import { put, remove, useCollection, usePrefs } from '@/data/store'
import { buildRevisionPlan } from '@/domain/revision'
import { dayKey, diffDays, uid } from '@/domain/time'
import type { Exam, Subject } from '@/types'
import AiPanel from '../ai/AiPanel'

const countdown = (n: number) => n < 0 ? `${-n} day${n === -1 ? '' : 's'} ago` : n === 0 ? 'Today' : n === 1 ? 'Tomorrow' : `In ${n} days`
const fmt = (k: string) => new Date(k + 'T00:00').toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })

export default function Exams() {
  const exams = useCollection<Exam>('exams')
  const { timezone } = usePrefs()
  const today = dayKey(new Date(), timezone)
  const [dlg, setDlg] = useState<Exam | 'new' | null>(null)
  const [del, setDel] = useState<Exam | null>(null)
  const toast = useToast()
  const sorted = [...exams].sort((a, b) => a.date.localeCompare(b.date))
  const upcoming = sorted.filter(e => e.date >= today), past = sorted.filter(e => e.date < today).reverse()
  const row = (e: Exam) => <ExamCard key={e.id} exam={e} today={today} onEdit={() => setDlg(e)} onDelete={() => setDel(e)} />
  return (
    <div className="space-y-4">
      <div className="flex justify-end"><Button variant="primary" onClick={() => setDlg('new')}><Plus size={18} />Add exam</Button></div>
      {exams.length === 0 ? <EmptyState icon={<CalendarClock />} title="No exams yet" body="Add an exam date and what it covers, and StudyFlow will spread your revision across the days left." action={<Button variant="primary" onClick={() => setDlg('new')}><Plus size={18} />Add your first exam</Button>} />
        : <>{upcoming.length ? <ul className="space-y-3">{upcoming.map(row)}</ul> : <p className="text-muted">No upcoming exams.</p>}
          {past.length > 0 && <details><summary className="min-h-11 cursor-pointer py-2 font-bold">Past exams ({past.length})</summary><ul className="mt-2 space-y-3">{past.map(row)}</ul></details>}</>}
      <Dialog open={!!dlg} onClose={() => setDlg(null)} title={dlg === 'new' ? 'Add exam' : 'Edit exam'}>{dlg && <ExamForm key={dlg === 'new' ? 'new' : dlg.id} exam={dlg === 'new' ? undefined : dlg} today={today} onClose={() => setDlg(null)} />}</Dialog>
      <ConfirmDialog open={!!del} onClose={() => setDel(null)} danger confirmLabel="Delete exam" title="Delete this exam?" body={`"${del?.name}" and its topic list will be removed.`} onConfirm={async () => { try { await remove('exams', del!.id); toast('Exam deleted.') } catch { toast('Could not delete the exam.', 'err') } }} />
    </div>
  )
}

function ExamForm({ exam, today, onClose }: { exam?: Exam; today: string; onClose: () => void }) {
  const toast = useToast()
  const subjects = useCollection<Subject>('subjects').filter(s => !s.archivedAt)
  const [name, setName] = useState(exam?.name ?? ''); const [date, setDate] = useState(exam?.date ?? '')
  const [subjectId, setSubject] = useState(exam?.subjectId ?? ''); const [priority, setPriority] = useState<Exam['priority']>(exam?.priority ?? 'medium')
  const [hours, setHours] = useState(exam?.hoursPerWeek ? String(exam.hoursPerWeek) : '')
  const [topics, setTopics] = useState((exam?.coverage ?? []).map(c => c.title).join('\n')); const [err, setErr] = useState<{ name?: string; date?: string }>({})
  const save = async () => {
    const e = { name: name.trim() ? undefined : 'Give the exam a name.', date: date ? undefined : 'Pick the exam date.' }
    if (e.name || e.date) return setErr(e)
    const old = exam?.coverage ?? []
    const coverage = topics.split('\n').map(t => t.trim()).filter(Boolean).map(t => { const o = old.find(c => c.title === t); return o ?? { id: uid(), title: t, done: false } })
    try { await put('exams', { ...(exam ? { id: exam.id } : {}), name: name.trim(), date, subjectId: subjectId || undefined, priority, coverage, hoursPerWeek: Number(hours) > 0 ? Number(hours) : undefined }); toast('Exam saved.'); onClose() }
    catch { toast('Could not save the exam.', 'err') }
  }
  return (
    <form className="space-y-4" onSubmit={e => { e.preventDefault(); save() }}>
      <Field label="Exam name" error={err.name}>{(id, d) => <Input id={id} aria-describedby={d} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Biology midterm" data-autofocus />}</Field>
      <Field label="Date" error={err.date}>{(id, d) => <Input id={id} aria-describedby={d} type="date" min={exam ? undefined : today} value={date} onChange={e => setDate(e.target.value)} />}</Field>
      <Field label="Topics it covers (one per line)">{id => <Textarea id={id} rows={4} value={topics} onChange={e => setTopics(e.target.value)} placeholder={'Cell structure\nGenetics'} />}</Field>
      <Field label="Hours per week you can study" hint="Needed to build a revision plan.">{id => <Input id={id} type="number" min={0.5} step={0.5} className="max-w-32" value={hours} onChange={e => setHours(e.target.value)} />}</Field>
      <details className="rounded-card border hairline px-3 py-2"><summary className="min-h-9 cursor-pointer py-1.5 font-bold">More options</summary><div className="space-y-4 pb-2 pt-2">
        <Field label="Subject">{id => <Select id={id} value={subjectId} onChange={e => setSubject(e.target.value)}><option value="">No subject</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</Select>}</Field>
        <Field label="Priority">{id => <Select id={id} value={priority} onChange={e => setPriority(e.target.value as Exam['priority'])}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></Select>}</Field></div></details>
      <div className="flex justify-end gap-2"><Button onClick={onClose}>Cancel</Button><Button variant="primary" type="submit">Save exam</Button></div>
    </form>
  )
}

function ExamCard({ exam, today, onEdit, onDelete }: { exam: Exam; today: string; onEdit: () => void; onDelete: () => void }) {
  const toast = useToast()
  const subject = useCollection<Subject>('subjects').find(s => s.id === exam.subjectId)
  const [hours, setHours] = useState(exam.hoursPerWeek ? String(exam.hoursPerWeek) : '')
  const [all, setAll] = useState(false); const [ai, setAi] = useState(false); const [topic, setTopic] = useState('')
  const n = diffDays(exam.date, today), done = exam.coverage.filter(c => c.done).length
  const plan = buildRevisionPlan(exam, today)
  const saveHours = async () => { const h = Number(hours); if ((h > 0 ? h : undefined) === exam.hoursPerWeek) return; try { await put('exams', { id: exam.id, hoursPerWeek: h > 0 ? h : undefined }) } catch { toast('Could not save.', 'err') } }
  const setCoverage = (coverage: Exam['coverage']) => put('exams', { id: exam.id, coverage }).catch(() => toast('Could not save.', 'err'))
  const planText = plan?.length ? `Exam: ${exam.name} on ${exam.date}. ${exam.hoursPerWeek} hours per week.\n` + plan.slice(0, 14).map(p => `${p.day}: ${p.minutes} min — ${p.topic}`).join('\n') : ''
  return (
    <li><Card className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div><h3 className="font-display text-xl font-semibold">{exam.name}</h3><p className="text-sm text-muted">{fmt(exam.date)}{subject && ` · ${subject.name}`}</p></div>
        <div className="flex items-center gap-1"><Chip className={n >= 0 && n <= 7 ? 'text-brand' : ''}><CalendarClock size={12} />{countdown(n)}</Chip><Chip>{exam.priority} priority</Chip>
          <Button variant="ghost" size="sm" aria-label={`Edit ${exam.name}`} onClick={onEdit}><Pencil size={16} /></Button><Button variant="ghost" size="sm" aria-label={`Delete ${exam.name}`} onClick={onDelete}><Trash2 size={16} /></Button></div>
      </div>
      {exam.coverage.length > 0 && <p className="tnum text-sm text-muted">{done} of {exam.coverage.length} topics revised</p>}
      <details className="group"><summary className="flex min-h-11 cursor-pointer list-none items-center gap-1 font-bold"><ChevronDown size={16} className="transition group-open:rotate-180" />Topics and revision plan</summary>
        <div className="space-y-5 pt-2">
          <div><h4 className="mb-1 text-sm font-bold">Coverage checklist</h4>
            <ul>{exam.coverage.map(c => <li key={c.id} className="flex items-center"><label className="flex min-h-11 flex-1 cursor-pointer items-center gap-2"><input type="checkbox" className="h-5 w-5 accent-[var(--primary)]" checked={c.done} onChange={() => setCoverage(exam.coverage.map(x => (x.id === c.id ? { ...x, done: !x.done } : x)))} /><span className={c.done ? 'text-muted line-through' : ''}>{c.title}</span></label>
              <Button variant="ghost" size="sm" aria-label={`Remove ${c.title}`} onClick={() => setCoverage(exam.coverage.filter(x => x.id !== c.id))}><Trash2 size={14} /></Button></li>)}</ul>
            <form className="mt-1 flex gap-2" onSubmit={e => { e.preventDefault(); if (topic.trim()) { setCoverage([...exam.coverage, { id: uid(), title: topic.trim(), done: false }]); setTopic('') } }}><Input aria-label="Add a topic" placeholder="Add a topic" value={topic} onChange={e => setTopic(e.target.value)} /><Button type="submit">Add</Button></form></div>
          <Field label="Hours per week you can study">{id => <Input id={id} type="number" min={0.5} step={0.5} className="max-w-32" value={hours} onChange={e => setHours(e.target.value)} onBlur={saveHours} onKeyDown={e => e.key === 'Enter' && saveHours()} />}</Field>
          <div><h4 className="mb-1 text-sm font-bold">Revision plan</h4>
            {plan === null ? <p className="text-[15px] text-muted">Tell us how many hours a week you can study (above) and we will plan your days.</p>
              : plan.length === 0 ? <p className="text-[15px] text-muted">This exam date has passed.</p>
              : <><ul className="divide-y divide-line/60 rounded-card border hairline">{(all ? plan : plan.slice(0, 7)).map(p => <li key={p.day} className="flex items-center gap-3 px-3 py-2.5 text-[15px]"><Square size={16} className="shrink-0 text-muted" aria-hidden /><span className="w-28 shrink-0 font-bold">{fmt(p.day)}</span><span className="tnum w-16 shrink-0 text-muted">{p.minutes} min</span><span className="min-w-0 [overflow-wrap:anywhere]">{p.topic}</span></li>)}</ul>
                <div className="mt-2 flex flex-wrap gap-2">{plan.length > 7 && <Button size="sm" onClick={() => setAll(a => !a)}>{all ? 'Show first week' : `Show all ${plan.length} days`}</Button>}<Button size="sm" onClick={() => setAi(true)}><Sparkles size={14} />Make it friendlier (AI)</Button></div></>}
            <p className="mt-2 text-xs text-muted">The plan spreads your weekly hours across the days left and cycles through topics you have not ticked off.</p></div>
        </div></details>
      <AiPanel open={ai} onClose={() => setAi(false)} actions={['plan']} initialText={planText} />
    </Card></li>
  )
}
