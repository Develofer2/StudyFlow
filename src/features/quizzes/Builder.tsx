import { useState } from 'react'
import { ArrowLeft, Plus } from 'lucide-react'
import { Button, Card, Field, Input, PageHeader, Select, useToast } from '@/components/ui'
import { put, useCollection } from '@/data/store'
import { validateQuestion } from '@/domain/quiz'
import type { Quiz, QuestionType, Subject } from '@/types'
import { cleanQuestion, newQuestion, QuestionEditor } from '../ai/QuestionEditor'

export default function Builder({ quiz, onClose }: { quiz?: Quiz; onClose: () => void }) {
  const toast = useToast()
  const subjects = useCollection<Subject>('subjects').filter(s => !s.archivedAt)
  const [title, setTitle] = useState(quiz?.title ?? ''); const [subjectId, setSubject] = useState(quiz?.subjectId ?? '')
  const [minutes, setMinutes] = useState(quiz?.timeLimitSeconds ? String(Math.round(quiz.timeLimitSeconds / 60)) : '')
  const [qs, setQs] = useState(quiz?.questions ?? [newQuestion()])
  const [showErr, setShowErr] = useState(false); const [titleErr, setTitleErr] = useState('')
  const add = (t: QuestionType) => setQs(a => [...a, newQuestion(t)])
  const save = async () => {
    const bad = qs.filter(q => validateQuestion(q)).length
    if (!title.trim()) setTitleErr('Give your quiz a title.')
    if (!qs.length) return toast('Add at least one question.', 'err')
    if (!title.trim() || bad) { setShowErr(true); if (bad) toast(`${bad} question${bad === 1 ? ' needs' : 's need'} a fix — every question needs an answer key.`, 'err'); return }
    const min = Number(minutes)
    try {
      await put('quizzes', { ...(quiz ? { id: quiz.id } : { source: 'manual' as const }), title: title.trim(), subjectId: subjectId || undefined, questions: qs.map(cleanQuestion), timeLimitSeconds: min > 0 ? Math.round(min * 60) : undefined })
      toast('Quiz saved.'); onClose()
    } catch { toast('Could not save the quiz.', 'err') }
  }
  return (
    <div className="anim-rise space-y-5">
      <Button variant="ghost" size="sm" onClick={onClose}><ArrowLeft size={16} />Back to quizzes</Button>
      <PageHeader title={quiz ? 'Edit quiz' : 'New quiz'} sub="Every question needs an answer key so it can be marked." />
      <Card className="grid gap-4 sm:grid-cols-2">
        <Field label="Title" error={titleErr}>{(id, d) => <Input id={id} aria-describedby={d} value={title} onChange={e => { setTitle(e.target.value); setTitleErr('') }} placeholder="e.g. Chapter 4 check" />}</Field>
        <Field label="Subject (optional)">{id => <Select id={id} value={subjectId} onChange={e => setSubject(e.target.value)}><option value="">No subject</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</Select>}</Field>
        <details className="sm:col-span-2"><summary className="min-h-9 cursor-pointer py-1.5 font-bold">Time limit</summary>
          <div className="pt-2"><Field label="Minutes (leave empty for no limit)">{id => <Input id={id} type="number" min={1} max={300} className="max-w-32" value={minutes} onChange={e => setMinutes(e.target.value)} />}</Field></div></details>
      </Card>
      {qs.map((q, i) => <Card key={q.id}><QuestionEditor q={q} index={i} showError={showErr} onChange={n => setQs(a => a.map(x => (x.id === q.id ? n : x)))} onRemove={qs.length > 1 ? () => setQs(a => a.filter(x => x.id !== q.id)) : undefined} /></Card>)}
      <div className="flex flex-wrap items-center gap-2"><span className="text-sm font-bold">Add question:</span>
        <Button size="sm" onClick={() => add('multiple_choice')}><Plus size={14} />Multiple choice</Button><Button size="sm" onClick={() => add('true_false')}><Plus size={14} />True / false</Button><Button size="sm" onClick={() => add('short_answer')}><Plus size={14} />Short answer</Button></div>
      <div className="flex justify-end gap-2"><Button onClick={onClose}>Cancel</Button><Button variant="primary" onClick={save}>Save quiz</Button></div>
    </div>
  )
}
