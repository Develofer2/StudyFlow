import { Plus, Trash2 } from 'lucide-react'
import type { QuestionType, QuizQuestion } from '@/types'
import { validateQuestion } from '@/domain/quiz'
import { uid } from '@/domain/time'
import { Button, Field, Input, Segmented, Textarea } from '@/components/ui'

export const newQuestion = (type: QuestionType = 'multiple_choice'): QuizQuestion => ({
  id: uid(), type, prompt: '', points: 1, topicTags: [],
  ...(type === 'multiple_choice' ? { options: ['', '', '', ''] } : type === 'true_false' ? { options: ['True', 'False'] } : { acceptedAnswers: [''] }),
})
const changeType = (q: QuizQuestion, type: QuestionType): QuizQuestion => ({ ...newQuestion(type), id: q.id, prompt: q.prompt, explanation: q.explanation, points: q.points, topicTags: q.topicTags })
export function cleanQuestion(q: QuizQuestion): QuizQuestion {
  const c: QuizQuestion = { ...q, prompt: q.prompt.trim(), explanation: q.explanation?.trim() || undefined }
  if (q.type === 'short_answer') c.acceptedAnswers = (q.acceptedAnswers ?? []).map(a => a.trim()).filter(Boolean)
  else c.options = (q.options ?? []).map(o => o.trim())
  return c
}

export function QuestionEditor({ q, index, onChange, onRemove, showError }: { q: QuizQuestion; index: number; onChange: (q: QuizQuestion) => void; onRemove?: () => void; showError?: boolean }) {
  const err = showError ? validateQuestion(q) : null
  const set = (p: Partial<QuizQuestion>) => onChange({ ...q, ...p })
  const opts = q.options ?? []
  const setOpt = (i: number, v: string) => set({ options: opts.map((o, j) => (j === i ? v : o)) })
  const delOpt = (i: number) => set({ options: opts.filter((_, j) => j !== i), correctOptionIndex: q.correctOptionIndex == null ? undefined : q.correctOptionIndex === i ? undefined : q.correctOptionIndex > i ? q.correctOptionIndex - 1 : q.correctOptionIndex })
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-display text-lg font-semibold">Question {index + 1}</span>
        <div className="flex items-center gap-2">
          <Segmented label={`Type of question ${index + 1}`} value={q.type} onChange={t => onChange(changeType(q, t))}
            options={[{ value: 'multiple_choice', label: 'Multiple choice' }, { value: 'true_false', label: 'True / false' }, { value: 'short_answer', label: 'Short answer' }]} />
          {onRemove && <Button variant="ghost" size="sm" aria-label={`Remove question ${index + 1}`} onClick={onRemove}><Trash2 size={16} /></Button>}
        </div>
      </div>
      <Field label="Question" error={err && /question\./i.test(err) ? err : undefined}>{(id, d) => <Textarea id={id} aria-describedby={d} rows={2} value={q.prompt} onChange={e => set({ prompt: e.target.value })} />}</Field>
      {q.type === 'multiple_choice' && (
        <fieldset className="space-y-1">
          <legend className="text-sm font-bold">Options — select the correct one</legend>
          {opts.map((o, i) => (
            <div key={i} className="flex items-center gap-1">
              <label className="grid h-11 w-11 shrink-0 cursor-pointer place-items-center"><input type="radio" name={`ans-${q.id}`} className="h-5 w-5 accent-[var(--primary)]" checked={q.correctOptionIndex === i} onChange={() => set({ correctOptionIndex: i })} aria-label={`Option ${i + 1} is correct`} /></label>
              <Input aria-label={`Option ${i + 1}`} placeholder={`Option ${i + 1}`} value={o} onChange={e => setOpt(i, e.target.value)} />
              {opts.length > 2 && <Button variant="ghost" size="sm" aria-label={`Remove option ${i + 1}`} onClick={() => delOpt(i)}><Trash2 size={16} /></Button>}
            </div>
          ))}
          {opts.length < 6 && <Button size="sm" onClick={() => set({ options: [...opts, ''] })}><Plus size={16} />Add option</Button>}
        </fieldset>
      )}
      {q.type === 'true_false' && (
        <div className="space-y-1.5"><span className="block text-sm font-bold">Correct answer</span>
          <Segmented label="Correct answer" value={q.correctOptionIndex == null ? ('' as never) : (String(q.correctOptionIndex) as '0' | '1')} onChange={v => set({ correctOptionIndex: Number(v) })} options={[{ value: '0', label: 'True' }, { value: '1', label: 'False' }]} /></div>
      )}
      {q.type === 'short_answer' && (
        <Field label="Accepted answers" hint="One per line. Capitals and punctuation are ignored when checking.">{(id, d) => <Textarea id={id} aria-describedby={d} rows={2} value={(q.acceptedAnswers ?? []).join('\n')} onChange={e => set({ acceptedAnswers: e.target.value.split('\n') })} />}</Field>
      )}
      {err && !/question\./i.test(err) && <p role="alert" className="text-sm font-semibold text-bad">{err}</p>}
      {err && /question\./i.test(err) && <p role="alert" className="sr-only">{err}</p>}
      <Field label="Explanation (optional)">{id => <Input id={id} value={q.explanation ?? ''} onChange={e => set({ explanation: e.target.value })} placeholder="Why is this the answer?" />}</Field>
    </div>
  )
}
