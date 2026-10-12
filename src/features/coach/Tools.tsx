import { useMemo, useState, type ReactNode } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { go } from '@/app/router'
import { Button, Card, Field, Input, Select, Textarea, useToast } from '@/components/ui'
import { put, useCollection, usePrefs } from '@/data/store'
import { addDays, dayKey, uid } from '@/domain/time'
import { weeklyReport } from '@/domain/stats'
import { generateCards } from '@/domain/cardgen'
import type { Exam, Quiz, QuizAttempt, QuizQuestion, StudySession, StudyTask, Subject } from '@/types'
import { MAX_TEXT_CHARS, aiBreakdown, aiCards, aiExplain, aiFocusTip, aiMistake, aiPlanText, aiQuiz, aiReflection, aiSummary } from '@/services/ai/gemini'
import DraftReview from '@/features/ai/DraftReview'
import QuizReview from '@/features/ai/QuizReview'
import ToolFrame, { LocalLink, TextDraft } from './ToolFrame'
import { STAT_LABEL, localFocus, localReflection, mistakeText, planText, recentMistakes, snapshot, snapshotText, splitAssignment, statLines, type StatKey } from './local'

const cap = (s: string) => s.trim().slice(0, MAX_TEXT_CHARS)
const Source = ({ value, onChange, label = 'Your text', hint, rows = 6 }: { value: string; onChange: (v: string) => void; label?: string; hint?: string; rows?: number }) => <div>
  <Field label={label} hint={hint}>{(id, d) => <Textarea id={id} aria-describedby={d} rows={rows} value={value} onChange={e => onChange(e.target.value)} placeholder="Paste or type it here…" />}</Field>
  <p className={value.length > MAX_TEXT_CHARS ? 'mt-1 text-sm font-bold text-warn' : 'tnum mt-1 text-sm text-muted'}>{value.length.toLocaleString()} / {MAX_TEXT_CHARS.toLocaleString()} characters{value.length > MAX_TEXT_CHARS && ' - only the first part is sent.'}</p></div>
const Intro = ({ children }: { children: ReactNode }) => <p className="text-[15px] text-muted">{children}</p>

export function ExplainTool() {
  const [t, setT] = useState('')
  return <ToolFrame feature="explain" payload={cap(t)} sendLabel="Explain it simply" run={async s => (await aiExplain(cap(t), { signal: s })).data}
    renderResult={d => <TextDraft initial={[d.explanation, d.example && `Example: ${d.example}`, d.mnemonic && `Memory trick: ${d.mnemonic}`].filter(Boolean).join('\n\n')} noteTitle="Explained simply (AI)" />}
    local={<div className="space-y-2 text-[15px]"><p>Try the self-explanation method: close your notes, explain the idea aloud in two sentences, give one example, then check what you missed.</p><LocalLink to="notes">Open my notes</LocalLink></div>}>
    <Intro>Paste a concept, definition or question you find confusing.</Intro>
    <Source value={t} onChange={setT} label="Concept to explain" rows={4} />
  </ToolFrame>
}

export function SummaryTool() {
  const [t, setT] = useState('')
  const local = useMemo(() => t.split(/\n{2,}/).map(p => p.trim().split(/(?<=[.!?])\s/)[0]).filter(p => p && p.length > 10).slice(0, 8), [t])
  return <ToolFrame feature="summary" payload={cap(t)} sendLabel="Summarise" run={async s => (await aiSummary({ text: cap(t) }, { signal: s })).data}
    renderResult={d => <TextDraft initial={d.summary.map(x => `- ${x}`).join('\n') + (d.keyTerms?.length ? `\n\nKey terms: ${d.keyTerms.join(', ')}` : '')} noteTitle="Summary (AI)" />}
    local={local.length ? <div className="space-y-2"><p className="text-sm text-muted">Simple extract, not AI: the first sentence of each paragraph.</p><ul className="list-disc space-y-1 pl-5 text-[15px]">{local.map((x, i) => <li key={i}>{x}</li>)}</ul></div> : <p className="text-[15px] text-muted">Add text with a few paragraphs to see a simple local extract.</p>}>
    <Source value={t} onChange={setT} label="Material to summarise" rows={7} />
  </ToolFrame>
}

export function CardsTool() {
  const [t, setT] = useState(''), [n, setN] = useState(8)
  const [view, setView] = useState<null | { src: 'ai' | 'rules'; d: { front: string; back: string }[] }>(null)
  if (view) return <DraftReview drafts={view.d} source={view.src} onCancel={() => setView(null)} onDone={() => { setView(null); go('flashcards') }} />
  return <ToolFrame feature="cards" payload={cap(t)} sendLabel="Draft flashcards" extraNote={`Up to ${n} cards requested.`} run={async s => (await aiCards({ text: cap(t), max: n }, { signal: s })).data.cards}
    renderResult={cards => <div className="space-y-2"><p className="text-sm">{cards.length} card draft(s). Review, edit and choose a deck next; nothing is saved until you confirm.</p><Button variant="primary" onClick={() => setView({ src: 'ai', d: cards })}>Review the drafts</Button></div>}
    local={<div className="space-y-2"><p className="text-sm text-muted">Rule-based drafts (finds definitions and Q&amp;A patterns), not AI.</p><Button disabled={!t.trim()} onClick={() => setView({ src: 'rules', d: generateCards(t, n) })}>Draft cards without AI</Button></div>}>
    <Source value={t} onChange={setT} label="Material for the cards" rows={6} />
    <Field label="Maximum cards">{id => <Input id={id} type="number" min={3} max={30} className="max-w-28" value={n} onChange={e => setN(Math.max(3, Math.min(30, Number(e.target.value) || 8)))} />}</Field>
  </ToolFrame>
}

export function QuizTool() {
  const [t, setT] = useState(''), [n, setN] = useState(6)
  const [qs, setQs] = useState<QuizQuestion[] | null>(null)
  if (qs) return <QuizReview questions={qs} onCancel={() => setQs(null)} onDone={() => { setQs(null); go('quizzes') }} />
  const run = async (s: AbortSignal) => (await aiQuiz({ text: cap(t), count: n }, { signal: s })).data.questions.map((q): QuizQuestion => ({ id: uid(), type: q.type, prompt: q.prompt, points: 1, topicTags: [], explanation: q.explanation,
    options: q.type === 'true_false' ? ['True', 'False'] : q.type === 'multiple_choice' ? q.options : undefined, correctOptionIndex: q.type === 'short_answer' ? undefined : q.correctOptionIndex, acceptedAnswers: q.type === 'short_answer' ? (q.acceptedAnswers?.length ? q.acceptedAnswers : ['']) : undefined }))
  return <ToolFrame feature="quiz" payload={cap(t)} sendLabel="Draft quiz questions" extraNote={`Up to ${n} questions requested.`} run={run}
    renderResult={q => <div className="space-y-2"><p className="text-sm">{q.length} question draft(s). Check the answers carefully in the review step; nothing is saved until you confirm.</p><Button variant="primary" disabled={!q.length} onClick={() => setQs(q)}>Review the drafts</Button></div>}
    local={<div className="space-y-2"><p className="text-[15px]">Write your own questions in the quiz builder, or turn this material into flashcards with the rule-based tool.</p><LocalLink to="quizzes">Open quizzes</LocalLink></div>}>
    <Source value={t} onChange={setT} label="Material for the quiz" rows={6} />
    <Field label="Number of questions">{id => <Input id={id} type="number" min={3} max={15} className="max-w-28" value={n} onChange={e => setN(Math.max(3, Math.min(15, Number(e.target.value) || 6)))} />}</Field>
  </ToolFrame>
}

const today = (tz: string) => dayKey(new Date(), tz)

export function PlanTool() {
  const exams = useCollection<Exam>('exams'), p = usePrefs()
  const up = exams.filter(e => e.date >= today(p.timezone)).sort((a, b) => a.date.localeCompare(b.date))
  const [id, setId] = useState('')
  const exam = up.find(e => e.id === id) ?? up[0]
  const pt = exam ? planText(exam, today(p.timezone)) : null
  if (!up.length) return <Card className="space-y-2"><p className="text-[15px]">Add an upcoming exam first. The plan itself is always built by StudyFlow rules; AI can only reword it.</p><LocalLink to="exam-rescue">Go to exams</LocalLink></Card>
  return <ToolFrame feature="exam" payload={pt?.text ?? ''} inputsOk={!!pt} sendLabel="Reword my plan" extraNote="The dates and minutes come from the built-in plan; AI only rewrites the wording."
    run={async s => (await aiPlanText(pt!.text, { feature: 'exam', signal: s })).data.overview} renderResult={o => <TextDraft initial={o} noteTitle={`Plan wording: ${exam!.name} (AI)`} />}
    local={pt ? <div className="space-y-2"><p className="text-sm text-muted">Built by StudyFlow rules, not AI.</p><ul className="space-y-1 text-[15px]">{pt.rows.map(r => <li key={r}>{r}</li>)}</ul><LocalLink to="exam-rescue">Open Exam Rescue</LocalLink></div> : <p className="text-[15px] text-muted">This exam has no topics or coverage yet, so no plan can be built. Add them in Exam Rescue.</p>}>
    <Field label="Exam">{(i, d) => <Select id={i} aria-describedby={d} value={exam?.id ?? ''} onChange={e => setId(e.target.value)}>{up.map(e => <option key={e.id} value={e.id}>{e.name} ({e.date})</option>)}</Select>}</Field>
  </ToolFrame>
}

export function MistakeTool() {
  const attempts = useCollection<QuizAttempt>('attempts'), quizzes = useCollection<Quiz>('quizzes')
  const ms = useMemo(() => recentMistakes(attempts, quizzes), [attempts, quizzes])
  const [key, setKey] = useState('')
  const m = ms.find(x => x.key === key) ?? ms[0]
  if (!m) return <Card className="space-y-2"><p className="text-[15px]">No wrong answers found yet. Take a quiz and any mistakes will show up here.</p><LocalLink to="quizzes">Open quizzes</LocalLink></Card>
  return <ToolFrame feature="explain" payload={mistakeText(m)} sendLabel="Explain this mistake" run={async s => (await aiMistake(mistakeText(m), { signal: s })).data.text}
    renderResult={o => <TextDraft initial={o} noteTitle="Mistake explained (AI)" />}
    local={<div className="space-y-1 text-[15px]"><p><b>Your answer:</b> {m.yours}</p><p><b>Correct answer:</b> {m.correct}</p>{m.explanation ? <p><b>Quiz explanation:</b> {m.explanation}</p> : <p className="text-muted">This question has no saved explanation.</p>}</div>}>
    <Field label="Which wrong answer?">{(i, d) => <Select id={i} aria-describedby={d} value={m.key} onChange={e => setKey(e.target.value)}>{ms.map(x => <option key={x.key} value={x.key}>{x.quizTitle}: {x.prompt.slice(0, 50)}</option>)}</Select>}</Field>
  </ToolFrame>
}

interface Row { id: string; title: string; minutes: number }
export function BreakdownTool() {
  const subjects = useCollection<Subject>('subjects'), toast = useToast(), p = usePrefs()
  const [t, setT] = useState(''), [due, setDue] = useState(''), [subj, setSubj] = useState('')
  const [local, setLocal] = useState<Row[] | null>(null)
  const save = async (rows: Row[], done: () => void) => {
    const rs = rows.filter(r => r.title.trim()); if (!rs.length) return
    try { for (const r of rs) await put('tasks', { title: r.title.trim(), status: 'todo', priority: 'medium', tags: [], subtasks: [], estimatedMinutes: r.minutes || undefined, dueAt: due || undefined, subjectId: subj || undefined }); toast(`${rs.length} task(s) added.`); done(); go('tasks') } catch { toast('Could not save the tasks.', 'err') }
  }
  const dueMin = today(p.timezone)
  const inputs = <><Source value={t} onChange={setT} label="Assignment description" rows={5} hint="Paste the brief, rubric or your own notes about it." />
    <div className="grid gap-3 sm:grid-cols-2"><Field label="Due date (optional)">{id => <Input id={id} type="date" min={dueMin} value={due} onChange={e => setDue(e.target.value)} />}</Field>
      <Field label="Subject (optional)">{id => <Select id={id} value={subj} onChange={e => setSubj(e.target.value)}><option value="">None</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</Select>}</Field></div></>
  return <ToolFrame feature="plan" payload={cap(t)} sendLabel="Break it into tasks" extraNote="The due date and subject are not sent."
    run={async s => (await aiBreakdown(cap(t), { signal: s })).data.tasks.map((x): Row => ({ id: uid(), title: x.title, minutes: x.minutes ?? 30 }))}
    renderResult={rows => <TaskRows initial={rows} onSave={r => save(r, () => {})} />}
    local={<div className="space-y-3"><p className="text-sm text-muted">Rule-based split by lines or sentences, not AI.</p>
      {local ? <TaskRows initial={local} onSave={r => save(r, () => setLocal(null))} onCancel={() => setLocal(null)} /> : <Button disabled={!t.trim()} onClick={() => setLocal(splitAssignment(t).map(x => ({ id: uid(), ...x })))}>Split without AI</Button>}</div>}>
    {inputs}
  </ToolFrame>
}
function TaskRows({ initial, onSave, onCancel }: { initial: Row[]; onSave: (r: Row[]) => void; onCancel?: () => void }) {
  const [rows, setRows] = useState(initial)
  const upd = (id: string, patch: Partial<Row>) => setRows(r => r.map(x => x.id === id ? { ...x, ...patch } : x))
  return <div className="space-y-2">
    {rows.map((r, i) => <div key={r.id} className="flex items-center gap-2"><Input aria-label={`Task ${i + 1} title`} value={r.title} onChange={e => upd(r.id, { title: e.target.value })} className="min-w-0 flex-1" />
      <Input aria-label={`Task ${i + 1} minutes`} type="number" min={5} max={600} value={r.minutes} onChange={e => upd(r.id, { minutes: Math.max(0, Number(e.target.value) || 0) })} className="!w-20 shrink-0" />
      <button aria-label={`Remove task ${i + 1}`} className="grid h-11 w-11 shrink-0 place-items-center rounded-lg hover:bg-surface" onClick={() => setRows(x => x.filter(y => y.id !== r.id))}><Trash2 size={18} /></button></div>)}
    <div className="flex flex-wrap justify-between gap-2"><Button size="sm" onClick={() => setRows(r => [...r, { id: uid(), title: '', minutes: 30 }])}><Plus size={16} />Add task</Button>
      <span className="flex gap-2">{onCancel && <Button size="sm" onClick={onCancel}>Discard</Button>}<Button size="sm" variant="primary" disabled={!rows.some(r => r.title.trim())} onClick={() => onSave(rows)}>Add {rows.filter(r => r.title.trim()).length} to my tasks</Button></span></div></div>
}

export function FocusTool() {
  const p = usePrefs(), sessions = useCollection<StudySession>('sessions'), tasks = useCollection<StudyTask>('tasks'), exams = useCollection<Exam>('exams')
  const snap = useMemo(() => snapshot({ today: today(p.timezone), sessions, tasks, exams, goalMin: p.dailyGoalMinutes, tz: p.timezone }), [p.timezone, p.dailyGoalMinutes, sessions, tasks, exams])
  const loc = localFocus(snap)
  return <ToolFrame feature="plan" payload={snapshotText(snap)} sendLabel="Ask AI for a suggestion" extraNote="Only these counts are sent, no titles or notes." run={async s => (await aiFocusTip(snapshotText(snap), { signal: s })).data.text}
    renderResult={o => <TextDraft initial={o} />}
    local={<div className="space-y-2"><p className="text-sm text-muted">Rule-based suggestion from your own data, not AI.</p><p className="text-lg font-bold">{loc.title}</p><p className="text-[15px]">{loc.reason}</p><LocalLink to="focus">Open the focus timer</LocalLink></div>}>
    <Intro>Your suggestion uses counts only (minutes today, overdue tasks, nearest exam).</Intro>
  </ToolFrame>
}

export function ReflectionTool() {
  const p = usePrefs(), sessions = useCollection<StudySession>('sessions'), tasks = useCollection<StudyTask>('tasks')
  const [keys, setKeys] = useState<StatKey[]>(['minutes', 'activeDays', 'tasks'])
  const to = today(p.timezone), range = { from: addDays(to, -6), to }
  const w = useMemo(() => weeklyReport(sessions, tasks, range, p.timezone, p.weeklyGoalMinutes ?? p.dailyGoalMinutes * 7), [sessions, tasks, to, p.timezone, p.weeklyGoalMinutes, p.dailyGoalMinutes]) // eslint-disable-line react-hooks/exhaustive-deps
  const lines = statLines(w, keys)
  const toggle = (k: StatKey) => setKeys(x => x.includes(k) ? x.filter(y => y !== k) : [...x, k])
  return <ToolFrame feature="plan" payload={lines.join('\n')} inputsOk={lines.length > 0} sendLabel="Write a reflection" extraNote="Only the ticked stats are sent." run={async s => (await aiReflection(lines.join('\n'), { signal: s })).data.text}
    renderResult={o => <TextDraft initial={o} noteTitle="Weekly reflection (AI)" />}
    local={<div className="space-y-2"><p className="text-sm text-muted">Written by rules from the ticked stats, not AI.</p>{keys.length ? <p className="text-[15px]">{localReflection(w, keys)}</p> : <p className="text-[15px] text-muted">Tick at least one stat.</p>}</div>}>
    <fieldset className="space-y-1"><legend className="mb-1 text-sm font-bold">Which stats may be used (last 7 days)?</legend>
      {(Object.keys(STAT_LABEL) as StatKey[]).map(k => <label key={k} className="flex min-h-11 cursor-pointer items-center gap-3 text-[15px]"><input type="checkbox" className="h-5 w-5 shrink-0" checked={keys.includes(k)} onChange={() => toggle(k)} />{STAT_LABEL[k]}</label>)}</fieldset>
  </ToolFrame>
}
