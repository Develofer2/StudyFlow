import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { Button, Card, Chip, Field, Input, Select, useToast } from '@/components/ui'
import { put, useCollection } from '@/data/store'
import { validateQuestion } from '@/domain/quiz'
import type { QuizQuestion, Subject } from '@/types'
import { cleanQuestion, QuestionEditor } from './QuestionEditor'

export const AI_QUIZ_BADGE = 'AI-generated – check the answers'

export default function QuizReview({ questions, subjectId, defaultTitle, onDone, onCancel }: { questions: QuizQuestion[]; subjectId?: string; defaultTitle?: string; onDone: () => void; onCancel: () => void }) {
  const toast = useToast()
  const subjects = useCollection<Subject>('subjects').filter(s => !s.archivedAt)
  const [qs, setQs] = useState(questions)
  const [ok, setOk] = useState<Record<string, boolean>>({})
  const [title, setTitle] = useState(defaultTitle ?? 'AI quiz')
  const [subj, setSubj] = useState(subjectId ?? '')
  const [busy, setBusy] = useState(false)
  const allOk = qs.length > 0 && qs.every(q => ok[q.id] && !validateQuestion(q))
  const left = qs.filter(q => !ok[q.id]).length
  const save = async () => {
    setBusy(true)
    try { await put('quizzes', { title: title.trim() || 'AI quiz', subjectId: subj || undefined, questions: qs.map(cleanQuestion), source: 'ai' }); toast('Quiz saved.'); onDone() }
    catch { toast('Could not save the quiz.', 'err'); setBusy(false) }
  }
  return (
    <div className="space-y-4">
      <p className="flex flex-wrap items-center gap-2 text-[15px] text-muted"><Chip className="text-warn"><Sparkles size={12} />{AI_QUIZ_BADGE}</Chip>Confirm each answer key before saving.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Quiz title">{id => <Input id={id} value={title} onChange={e => setTitle(e.target.value)} />}</Field>
        <Field label="Subject">{id => <Select id={id} value={subj} onChange={e => setSubj(e.target.value)}><option value="">No subject</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</Select>}</Field>
      </div>
      {qs.map((q, i) => (
        <Card key={q.id} className="space-y-3">
          <QuestionEditor q={q} index={i} showError onChange={n => { setQs(a => a.map(x => (x.id === q.id ? n : x))); setOk(o => ({ ...o, [q.id]: false })) }} onRemove={() => setQs(a => a.filter(x => x.id !== q.id))} />
          <label className="flex min-h-11 items-center gap-2 text-[15px] font-bold"><input type="checkbox" className="h-5 w-5 accent-[var(--primary)]" checked={!!ok[q.id]} disabled={!!validateQuestion(q)} onChange={e => setOk(o => ({ ...o, [q.id]: e.target.checked }))} />I checked this answer key is correct</label>
        </Card>
      ))}
      <div className="flex flex-wrap items-center justify-end gap-2">
        {!allOk && qs.length > 0 && <span className="text-sm text-muted">{left} question{left === 1 ? '' : 's'} still to confirm</span>}
        <Button onClick={onCancel}>Back</Button>
        <Button variant="primary" disabled={!allOk || busy} onClick={save}>Save quiz</Button>
      </div>
    </div>
  )
}
