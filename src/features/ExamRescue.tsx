import { useEffect, useMemo, useState } from 'react'
import { Plus, Sparkles, Trash2 } from 'lucide-react'
import { Button, Card, Chip, EmptyState, Field, PageHeader, Select, cx, useToast } from '@/components/ui'
import { put, useCollection, usePrefs } from '@/data/store'
import { PLAN_RULES, explainItem, generatePlan } from '@/domain/examPlan'
import { masteryMap, MIN_SAMPLE, type MasteryLevel } from '@/domain/mastery'
import { addDays, dayKey, diffDays, fmtDuration, uid } from '@/domain/time'
import type { Deck, Exam, ExamTopic, Flashcard, PlanItem, Quiz, QuizAttempt, ReviewLog, StudyNote, Subject } from '@/types'

const field = 'min-h-11 w-full min-w-0 rounded-[calc(var(--radius)*.7)] border hairline bg-surface2 px-3 text-[15px]'
/** Text/number input that commits on blur so typing never writes to storage per keystroke. */
function Edit({ value, onCommit, label, type = 'text', min, max, className }: { value: string | number; onCommit: (v: string) => void; label: string; type?: string; min?: number; max?: number; className?: string }) {
  const [v, setV] = useState(String(value)); useEffect(() => setV(String(value)), [value])
  return <input aria-label={label} type={type} min={min} max={max} inputMode={type === 'number' ? 'numeric' : undefined} value={v} onChange={e => setV(e.target.value)} onBlur={() => v !== String(value) && onCommit(v)} className={cx(field, className)} />
}
const fmt = (k: string) => new Date(k + 'T00:00').toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })
const LEVEL: Record<MasteryLevel, { label: string; cls: string }> = {
  'not-enough-data': { label: 'Not enough data', cls: '' }, 'needs-work': { label: 'Needs work', cls: 'text-bad' }, developing: { label: 'Developing', cls: 'text-warn' }, strong: { label: 'Strong', cls: 'text-ok' },
}

function Links({ topic, notes, decks, quizzes, onChange }: { topic: ExamTopic; notes: StudyNote[]; decks: Deck[]; quizzes: Quiz[]; onChange: (p: Partial<ExamTopic>) => void }) {
  const group = (key: 'noteIds' | 'deckIds' | 'quizIds', title: string, items: { id: string; title: string }[]) => <fieldset className="min-w-0"><legend className="text-sm font-bold">{title}</legend>
    {items.length ? items.map(i => { const on = topic[key]?.includes(i.id) ?? false
      return <label key={i.id} className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" className="size-5 accent-brand" checked={on} onChange={() => onChange({ [key]: on ? topic[key]!.filter(x => x !== i.id) : [...(topic[key] ?? []), i.id] })} /><span className="min-w-0 break-words">{i.title}</span></label> }) : <p className="text-sm text-muted">None yet.</p>}</fieldset>
  const n = (topic.noteIds?.length ?? 0) + (topic.deckIds?.length ?? 0) + (topic.quizIds?.length ?? 0)
  return <details><summary className="min-h-11 cursor-pointer py-2 text-sm font-bold">Linked material ({n})</summary>
    <p className="text-xs text-muted">Decks and quizzes feed the plan and mastery map. Notes are for your reference only.</p>
    <div className="grid gap-3 sm:grid-cols-3">{group('noteIds', 'Notes', notes)}{group('deckIds', 'Decks', decks)}{group('quizIds', 'Quizzes', quizzes)}</div></details>
}

export default function ExamRescue() {
  const toast = useToast(), { timezone } = usePrefs(), today = dayKey(Date.now(), timezone)
  const exams = useCollection<Exam>('exams'), subjects = useCollection<Subject>('subjects').filter(s => !s.archivedAt)
  const notes = useCollection<StudyNote>('notes'), decks = useCollection<Deck>('decks'), quizzes = useCollection<Quiz>('quizzes')
  const cards = useCollection<Flashcard>('cards'), reviews = useCollection<ReviewLog>('reviews'), attempts = useCollection<QuizAttempt>('attempts')
  const sorted = useMemo(() => [...exams].sort((a, b) => a.date.localeCompare(b.date)), [exams])
  const [selId, setSelId] = useState('')
  const exam = sorted.find(e => e.id === selId) ?? sorted.find(e => e.date >= today) ?? sorted[0]
  const [manual, setManual] = useState({ title: '', day: today, minutes: 30 })
  const topics = exam?.topics ?? [], plan = exam?.plan ?? []
  const data = { cards, reviews, quizzes, attempts }
  const mastery = useMemo(() => masteryMap(topics, data, plan), [topics, cards, reviews, quizzes, attempts, plan]) // eslint-disable-line react-hooks/exhaustive-deps
  const result = exam ? generatePlan({ exam, today, data }) : null

  const save = (p: Partial<Exam>) => exam && put('exams', { id: exam.id, ...p })
  const setTopic = (id: string, p: Partial<ExamTopic>) => save({ topics: topics.map(t => (t.id === id ? { ...t, ...p } : t)) })
  const setItem = (id: string, p: Partial<PlanItem>) => save({ plan: plan.map(i => (i.id === id ? { ...i, ...p } : i)) })
  const create = async () => { const e = await put('exams', { name: 'New exam', date: addDays(today, 14), priority: 'medium', coverage: [], topics: [], plan: [], availableMinutesPerDay: 60 }); setSelId(e.id) }
  const regenerate = () => { if (!exam || !result) return; if (result.status === 'needs-info') return toast('Add the missing details first', 'info'); if (result.status === 'past') return toast('This exam date has passed', 'info'); save({ plan: result.items }); toast('Plan updated. Done and manual items were kept.', 'ok') }
  const left = exam?.date ? diffDays(exam.date, today) : null
  const byDay = useMemo(() => { const m = new Map<string, PlanItem[]>(); for (const i of plan) m.set(i.day, [...(m.get(i.day) ?? []), i]); return [...m].sort(([a], [b]) => a.localeCompare(b)) }, [plan])

  return <div className="space-y-4">
    <PageHeader title="Exam rescue" sub="Build an editable plan from your own confidence, cards and quiz results. Nothing is sent anywhere." action={<Button variant="primary" onClick={create}><Plus size={18} aria-hidden />New exam</Button>} />
    {!exam ? <EmptyState icon={<Sparkles />} title="No exam yet" body="Add an exam with its date, topics and the time you have each day." action={<Button variant="primary" onClick={create}>Create exam</Button>} /> : <>
      <Card className="space-y-3">
        {sorted.length > 1 && <label className="block space-y-1.5 text-sm font-bold">Exam<Select value={exam.id} onChange={e => setSelId(e.target.value)}>{sorted.map(e => <option key={e.id} value={e.id}>{e.name} ({e.date || 'no date'})</option>)}</Select></label>}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Exam name">{() => <Edit label="Exam name" value={exam.name} onCommit={v => v.trim() && save({ name: v.trim() })} />}</Field>
          <label className="block space-y-1.5 text-sm font-bold">Subject<Select value={exam.subjectId ?? ''} onChange={e => save({ subjectId: e.target.value || undefined })}><option value="">None</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></label>
          <Field label="Exam date">{() => <Edit label="Exam date" type="date" value={exam.date} onCommit={v => save({ date: v })} />}</Field>
          <Field label="Minutes available per day" hint="Be realistic. The plan never goes above this.">{() => <Edit label="Minutes available per day" type="number" min={10} max={720} value={exam.availableMinutesPerDay ?? ''} onCommit={v => save({ availableMinutesPerDay: Number(v) > 0 ? Math.min(720, Number(v)) : undefined })} />}</Field>
        </div>
        {left !== null && <Chip>{left < 0 ? `${-left} day(s) ago` : left === 0 ? 'Exam is today' : `${left} day(s) to go`}</Chip>}
      </Card>

      <Card className="space-y-3">
        <div className="flex items-center justify-between gap-2"><h2 className="font-display text-xl font-semibold">Topics</h2>
          <Button size="sm" onClick={() => save({ topics: [...topics, { id: uid(), title: 'New topic', confidence: 3, effortHours: 2, done: false }] })}><Plus size={16} aria-hidden />Add topic</Button></div>
        {!topics.length && <p className="text-sm text-muted">Add the topics the exam covers. Rate your confidence honestly: 1 is lost, 5 is solid.</p>}
        <ul className="space-y-3">{topics.map(t => <li key={t.id} className="space-y-2 rounded-card border hairline p-3">
          <div className="flex items-center gap-2"><Edit label="Topic title" value={t.title} onCommit={v => v.trim() && setTopic(t.id, { title: v.trim() })} />
            <button type="button" aria-label={`Delete topic ${t.title}`} onClick={() => save({ topics: topics.filter(x => x.id !== t.id) })} className="grid size-11 shrink-0 place-items-center rounded-full hover:bg-surface2"><Trash2 size={18} aria-hidden /></button></div>
          <div className="grid grid-cols-2 gap-2">
            <label className="block space-y-1 text-xs font-bold">Confidence<Select value={t.confidence} onChange={e => setTopic(t.id, { confidence: Number(e.target.value) as ExamTopic['confidence'] })}>{[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} of 5</option>)}</Select></label>
            <label className="block space-y-1 text-xs font-bold">Effort (hours)<Edit label="Effort in hours" type="number" min={0} max={100} value={t.effortHours} onCommit={v => setTopic(t.id, { effortHours: Math.max(0, Math.min(100, Number(v) || 0)) })} /></label></div>
          <label className="flex min-h-11 items-center gap-2 text-sm font-bold"><input type="checkbox" className="size-5 accent-brand" checked={t.done} onChange={e => setTopic(t.id, { done: e.target.checked })} />Topic complete (not scheduled)</label>
          <Links topic={t} notes={notes} decks={decks} quizzes={quizzes} onChange={p => setTopic(t.id, p)} />
        </li>)}</ul>
      </Card>

      <Card className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-display text-xl font-semibold">Plan</h2>
          <Button variant="primary" onClick={regenerate}><Sparkles size={18} aria-hidden />{plan.some(p => !p.manual) ? 'Regenerate plan' : 'Generate plan'}</Button></div>
        {result?.status === 'needs-info' && <p role="status" className="rounded-card bg-surface2 p-3 text-sm">To build a plan I still need: <strong>{result.missing.join(', ')}</strong>. I will not guess these.</p>}
        {result?.status === 'past' && <p role="status" className="rounded-card bg-surface2 p-3 text-sm">This exam date is today or has passed, so there is nothing to plan.</p>}
        {result?.status === 'ok' && result.coveragePct < 100 && <p role="status" className="rounded-card bg-surface2 p-3 text-sm">Your time covers about {result.coveragePct}% of your estimated effort. Add daily minutes or focus on the lowest-confidence topics.</p>}
        <p className="text-sm text-muted">Regenerating replaces only unfinished generated items. Items you finished or added yourself are kept.</p>
        {!byDay.length && <p className="text-sm text-muted">No plan items yet.</p>}
        {byDay.map(([day, items]) => <section key={day} aria-label={fmt(day)} className="space-y-2"><h3 className="text-sm font-bold">{fmt(day)} <span className="font-normal text-muted">({fmtDuration(items.reduce((a, i) => a + i.minutes * 60, 0))})</span></h3>
          <ul className="space-y-2">{items.map(i => <li key={i.id} className="space-y-2 rounded-card border hairline p-3">
            <div className="flex items-center gap-2"><input type="checkbox" aria-label={`Mark ${i.title} done`} className="size-6 shrink-0 accent-brand" checked={i.done} onChange={e => setItem(i.id, { done: e.target.checked })} />
              <Edit label="Item title" value={i.title} onCommit={v => v.trim() && setItem(i.id, { title: v.trim() })} className={i.done ? 'line-through opacity-60' : ''} />
              <button type="button" aria-label={`Delete ${i.title}`} onClick={() => save({ plan: plan.filter(x => x.id !== i.id) })} className="grid size-11 shrink-0 place-items-center rounded-full hover:bg-surface2"><Trash2 size={18} aria-hidden /></button></div>
            <div className="grid grid-cols-2 gap-2"><Edit label="Day" type="date" value={i.day} onCommit={v => v && setItem(i.id, { day: v })} /><Edit label="Minutes" type="number" min={5} max={720} value={i.minutes} onCommit={v => setItem(i.id, { minutes: Math.max(5, Math.min(720, Number(v) || i.minutes)) })} /></div>
            <p className="text-xs text-muted"><span className="font-bold">Why: </span>{explainItem(i, exam, data, today)}</p>
          </li>)}</ul></section>)}
        <form className="space-y-2 border-t hairline pt-3" onSubmit={e => { e.preventDefault(); if (!manual.title.trim() || !manual.day) return; save({ plan: [...plan, { id: uid(), day: manual.day, title: manual.title.trim(), minutes: manual.minutes, done: false, manual: true }] }); setManual({ ...manual, title: '' }) }}>
          <h3 className="text-sm font-bold">Add your own item</h3>
          <input aria-label="New item title" placeholder="e.g. Past paper 2019" value={manual.title} onChange={e => setManual({ ...manual, title: e.target.value })} className={field} />
          <div className="grid grid-cols-2 gap-2"><input aria-label="New item day" type="date" value={manual.day} onChange={e => setManual({ ...manual, day: e.target.value })} className={field} /><input aria-label="New item minutes" type="number" min={5} max={720} value={manual.minutes} onChange={e => setManual({ ...manual, minutes: Number(e.target.value) || 30 })} className={field} /></div>
          <Button type="submit" disabled={!manual.title.trim()}>Add item</Button></form>
        <details><summary className="min-h-11 cursor-pointer py-2 text-sm font-bold">How the plan is made</summary><ul className="list-disc space-y-1 pl-5 text-sm text-muted">{PLAN_RULES.map(r => <li key={r}>{r}</li>)}</ul></details>
      </Card>

      <Card className="space-y-3"><div><h2 className="font-display text-xl font-semibold">Mastery map</h2>
        <p className="text-sm text-muted">Based on cards and quiz answers you have actually done. Time studied is shown separately because hours alone do not prove you know something. A rating needs at least {MIN_SAMPLE} cards reviewed or quiz answers.</p></div>
        {!topics.length && <p className="text-sm text-muted">Add topics to see their map.</p>}
        <ul className="space-y-2">{mastery.map((m, i) => <li key={m.topicId} className="space-y-1 rounded-card border hairline p-3 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2"><span className="font-bold break-words">{topics[i].title}</span><span className={cx('font-bold', LEVEL[m.level].cls)}>{LEVEL[m.level].label}</span></div>
          <p><span className="font-bold">Demonstrated: </span>{m.cards.total ? `${m.cards.pct}% of ${m.cards.total} cards mastered (${m.cards.reviewed} reviewed, ${m.cards.lapses} lapses)` : 'no linked cards'}; {m.quiz.answered ? `quiz accuracy ${m.quiz.pct}% over ${m.quiz.answered} answers` : 'no quiz answers'}. Sample size: {m.sample}.</p>
          {m.level === 'not-enough-data' && <p className="text-muted">Not enough data yet. Link a deck or quiz and review or answer a few more.</p>}
          <p className="text-muted"><span className="font-bold">Time studied: </span>{m.minutesStudied ? fmtDuration(m.minutesStudied * 60) : 'none logged'} (effort, not evidence of mastery)</p>
        </li>)}</ul></Card>
    </>}
  </div>
}
