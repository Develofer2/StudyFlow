import { useMemo, useState } from 'react'
import { Archive, ArchiveRestore, BookOpen, Brain, Calculator, Check, FlaskConical, Globe, Landmark, Languages, Leaf, Library, Music, Palette, Pencil, Plus, Timer, Trash2, X, type LucideIcon } from 'lucide-react'
import { Button, Card, Chip, ConfirmDialog, Dialog, EmptyState, Field, Input, PageHeader, Select, cx, useToast } from '@/components/ui'
import { put, useCollection, usePrefs } from '@/data/store'
import { archiveSubject, deleteSubject } from '@/services/app'
import { addDays, dayKey, fmtDuration, startOfWeek } from '@/domain/time'
import { countsAsFocus } from '@/domain/stats'
import { go } from '@/app/router'
import type { Deck, Flashcard, StudySession, StudyTask, Subject } from '@/types'

export const SUBJECT_ICONS: Record<string, LucideIcon> = { book: BookOpen, leaf: Leaf, flask: FlaskConical, calc: Calculator, globe: Globe, lang: Languages, music: Music, art: Palette, brain: Brain, history: Landmark, library: Library }
export const SubjectIcon = ({ name, ...p }: { name: string; size?: number; className?: string }) => { const I = SUBJECT_ICONS[name] ?? BookOpen; return <I {...p} /> }
// All swatches reach >= 4.5:1 against white text, so the icon tile stays legible in any theme.
const COLORS = ['#a3402a', '#9a3b5c', '#7a45a0', '#4a56a8', '#1f6a8f', '#14706b', '#2f7a42', '#6b6f1c', '#8a5a14', '#575f6b']
const empty = { name: '', color: COLORS[5], icon: 'book', term: '', exams: [] as string[], newExam: '' }
type Form = typeof empty & { id?: string }

export default function Subjects() {
  const toast = useToast(); const prefs = usePrefs()
  const subjects = useCollection<Subject>('subjects'), tasks = useCollection<StudyTask>('tasks'), sessions = useCollection<StudySession>('sessions'), cards = useCollection<Flashcard>('cards'), decks = useCollection<Deck>('decks')
  const [form, setForm] = useState<Form | null>(null); const [err, setErr] = useState('')
  const [del, setDel] = useState<Subject | null>(null); const [moveTo, setMoveTo] = useState('')

  const stats = useMemo(() => {
    const today = dayKey(new Date(), prefs.timezone), from = startOfWeek(today, prefs.weekStartsOn), to = addDays(from, 6), nowIso = new Date().toISOString()
    const m = new Map<string, { week: number; open: number; due: number }>(); const g = (id: string) => { let x = m.get(id); if (!x) m.set(id, x = { week: 0, open: 0, due: 0 }); return x }
    for (const s of sessions) if (s.subjectId && countsAsFocus(s)) { const d = dayKey(s.startedAt, prefs.timezone); if (d >= from && d <= to) g(s.subjectId).week += s.actualFocusSeconds }
    for (const t of tasks) if (t.subjectId && t.status !== 'done' && !t.archivedAt) g(t.subjectId).open++
    const deckSubject = new Map(decks.map(d => [d.id, d.subjectId]))
    for (const c of cards) { const sid = deckSubject.get(c.deckId); if (sid && (!c.dueAt || c.dueAt <= nowIso)) g(sid).due++ }
    return m
  }, [sessions, tasks, cards, decks, prefs.timezone, prefs.weekStartsOn])

  const active = subjects.filter(s => !s.archivedAt).sort((a, b) => a.name.localeCompare(b.name)), archived = subjects.filter(s => s.archivedAt)
  const openNew = () => { setErr(''); setForm({ ...empty }) }
  const edit = (s: Subject) => { setErr(''); setForm({ id: s.id, name: s.name, color: s.color, icon: s.icon, term: s.academicTerm ?? '', exams: s.examDates, newExam: '' }) }
  const save = async () => {
    if (!form) return
    const name = form.name.trim(); if (!name) return setErr('Give your subject a name.')
    if (subjects.some(s => s.id !== form.id && s.name.toLowerCase() === name.toLowerCase())) return setErr('You already have a subject with that name.')
    const exams = [...new Set([...form.exams, ...(form.newExam ? [form.newExam] : [])])].sort()
    try { await put<Partial<Subject>>('subjects', { id: form.id, name, color: form.color, icon: form.icon, academicTerm: form.term.trim() || undefined, examDates: exams }); toast(form.id ? 'Subject updated.' : 'Subject created.'); setForm(null) }
    catch { toast('Could not save the subject.', 'err') }
  }
  const toggleArchive = async (s: Subject) => { try { await archiveSubject(s); toast(s.archivedAt ? 'Subject restored.' : 'Subject archived. Its content is kept.') } catch { toast('Something went wrong.', 'err') } }
  const linked = (s: Subject | null) => !s ? 0 : tasks.filter(t => t.subjectId === s.id).length + decks.filter(d => d.subjectId === s.id).length + sessions.filter(x => x.subjectId === s.id).length

  const card = (s: Subject) => { const st = stats.get(s.id) ?? { week: 0, open: 0, due: 0 }; return (
    <Card as="li" key={s.id} className={cx('flex flex-col gap-3', s.archivedAt && 'opacity-80')}>
      <div className="flex items-start gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[calc(var(--radius)*.7)] text-white" style={{ background: s.color }}><SubjectIcon name={s.icon} size={24} /></span>
        <div className="min-w-0 flex-1"><h3 className="truncate font-display text-xl font-semibold">{s.name}</h3>
          <p className="truncate text-sm text-muted">{[s.academicTerm, s.examDates.length ? `${s.examDates.length} exam${s.examDates.length > 1 ? 's' : ''}` : ''].filter(Boolean).join(' · ') || 'No term set'}</p></div></div>
      <dl className="grid grid-cols-3 gap-2 text-center">
        {[['This week', fmtDuration(st.week)], ['Open tasks', String(st.open)], ['Cards due', String(st.due)]].map(([k, v]) => <div key={k} className="rounded-[calc(var(--radius)*.6)] bg-surface2 px-1 py-2"><dd className="font-mono text-lg font-semibold tnum">{v}</dd><dt className="text-xs text-muted">{k}</dt></div>)}</dl>
      <div className="mt-auto flex flex-wrap gap-1.5">
        {!s.archivedAt && <Button size="sm" variant="primary" onClick={() => go('focus', { subject: s.id })}><Timer size={16} />Focus</Button>}
        <Button size="sm" onClick={() => edit(s)} aria-label={`Edit ${s.name}`}><Pencil size={16} />Edit</Button>
        <Button size="sm" variant="ghost" onClick={() => toggleArchive(s)} aria-label={`${s.archivedAt ? 'Restore' : 'Archive'} ${s.name}`}>{s.archivedAt ? <ArchiveRestore size={16} /> : <Archive size={16} />}{s.archivedAt ? 'Restore' : 'Archive'}</Button>
        <Button size="sm" variant="ghost" onClick={() => { setMoveTo(''); setDel(s) }} aria-label={`Delete ${s.name}`}><Trash2 size={16} /></Button></div>
    </Card>) }

  return (
    <div>
      <PageHeader title="My Subjects" sub="Group your tasks, notes and focus time by course." action={<Button variant="primary" onClick={openNew}><Plus size={18} />New subject</Button>} />
      {!subjects.length ? <EmptyState icon={<Library size={24} />} title="Add your first subject" body="Subjects keep everything for one course together, so you can see where your time goes." action={<Button variant="primary" onClick={openNew}><Plus size={18} />New subject</Button>} />
        : <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{active.map(card)}</ul>}
      {!!subjects.length && !active.length && <p className="text-muted">All your subjects are archived.</p>}
      {archived.length > 0 && <details className="mt-8"><summary className="min-h-11 cursor-pointer py-2 font-bold">Archived ({archived.length})</summary><ul className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{archived.map(card)}</ul></details>}

      <Dialog open={!!form} onClose={() => setForm(null)} title={form?.id ? 'Edit subject' : 'New subject'}>{form && <form className="space-y-4" onSubmit={e => { e.preventDefault(); void save() }}>
        <Field label="Name" error={err || undefined}>{(id, d) => <Input id={id} aria-describedby={d} aria-invalid={!!err} maxLength={60} value={form.name} onChange={e => { setErr(''); setForm({ ...form, name: e.target.value }) }} placeholder="e.g. Organic Chemistry" />}</Field>
        <fieldset><legend className="mb-1.5 text-sm font-bold">Colour</legend><div className="flex flex-wrap gap-2">{COLORS.map((c, i) => <button type="button" key={c} aria-label={`Colour ${i + 1}`} aria-pressed={form.color === c} onClick={() => setForm({ ...form, color: c })} className={cx('grid h-11 w-11 place-items-center rounded-full text-white ring-offset-2 ring-offset-surface', form.color === c && 'ring-2 ring-ink')} style={{ background: c }}>{form.color === c && <Check size={20} />}</button>)}</div></fieldset>
        <fieldset><legend className="mb-1.5 text-sm font-bold">Icon</legend><div className="flex flex-wrap gap-2">{Object.keys(SUBJECT_ICONS).map(k => <button type="button" key={k} aria-label={k} aria-pressed={form.icon === k} onClick={() => setForm({ ...form, icon: k })} className={cx('grid h-11 w-11 place-items-center rounded-[calc(var(--radius)*.6)] border hairline', form.icon === k ? 'bg-brand text-brand-fg' : 'bg-surface2')}><SubjectIcon name={k} size={20} /></button>)}</div></fieldset>
        <Field label="Term (optional)">{id => <Input id={id} value={form.term} onChange={e => setForm({ ...form, term: e.target.value })} placeholder="e.g. Autumn 2026" />}</Field>
        <details open={form.exams.length > 0}><summary className="min-h-11 cursor-pointer py-2 text-sm font-bold">Exam dates</summary><div className="space-y-2">
          <div className="flex flex-wrap gap-1.5">{form.exams.map(d => <Chip key={d}>{d}<button type="button" aria-label={`Remove ${d}`} className="grid h-6 w-6 place-items-center" onClick={() => setForm({ ...form, exams: form.exams.filter(x => x !== d) })}><X size={14} /></button></Chip>)}</div>
          <div className="flex gap-2"><Input type="date" aria-label="Add exam date" value={form.newExam} onChange={e => setForm({ ...form, newExam: e.target.value })} />
            <Button disabled={!form.newExam} onClick={() => setForm({ ...form, exams: [...new Set([...form.exams, form.newExam])].sort(), newExam: '' })}>Add</Button></div></div></details>
        <div className="flex justify-end gap-2 pt-1"><Button onClick={() => setForm(null)}>Cancel</Button><Button variant="primary" type="submit">Save subject</Button></div>
      </form>}</Dialog>

      <ConfirmDialog open={!!del} onClose={() => setDel(null)} danger confirmLabel="Delete subject" title={`Delete "${del?.name ?? ''}"?`}
        onConfirm={async () => { if (!del) return; try { await deleteSubject(del.id, moveTo || undefined); toast('Subject deleted. Its content was kept.') } catch { toast('Could not delete the subject.', 'err') } }}
        body={<div className="space-y-3"><p>{linked(del) ? `${linked(del)} linked task, deck and session items will not be deleted. Choose where they should go.` : 'Nothing is linked to this subject.'}</p>
          <Field label="Move its content to">{id => <Select id={id} value={moveTo} onChange={e => setMoveTo(e.target.value)}><option value="">No subject</option>{subjects.filter(s => s.id !== del?.id && !s.archivedAt).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</Select>}</Field></div>} />
    </div>)
}
