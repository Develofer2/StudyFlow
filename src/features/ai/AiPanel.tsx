import { useEffect, useRef, useState } from 'react'
import { Copy, FileUp, KeyRound, Loader2, ShieldCheck, Sparkles, X } from 'lucide-react'
import { Button, Card, Dialog, Field, Input, Segmented, Textarea, useToast } from '@/components/ui'
import { setPrefs, usePrefs } from '@/data/store'
import { go } from '@/app/router'
import { AiError, MAX_FILE_BYTES, MAX_TEXT_CHARS, aiCards, aiExplain, aiPlanText, aiQuiz, aiSummary, aiUsageToday, fileToPart, type AiPart } from '@/services/ai/gemini'
import { uid } from '@/domain/time'
import type { QuizQuestion } from '@/types'
import DraftReview from './DraftReview'
import QuizReview from './QuizReview'
import { aiErrorText } from './util'
import { checkCapability } from '@/services/ai/profiles'
import { useAiReady } from './useAiReady'

const FEATURE: Record<string, 'cards' | 'quiz' | 'summary' | 'explain' | 'plan'> = { cards: 'cards', quiz: 'quiz', summary: 'summary', explain: 'explain', plan: 'plan' }
export type AiAction = 'cards' | 'quiz' | 'summary' | 'explain' | 'plan'
const LABEL: Record<AiAction, string> = { cards: 'Flashcards', quiz: 'Quiz', summary: 'Summary', explain: 'Explain simply', plan: 'Friendlier plan' }
const GO: Record<AiAction, string> = { cards: 'Make flashcards', quiz: 'Make a quiz', summary: 'Summarise', explain: 'Explain simply', plan: 'Rewrite my plan' }

type Result =
  | { kind: 'cards'; cards: { front: string; back: string }[] } | { kind: 'quiz'; questions: QuizQuestion[] }
  | { kind: 'text'; title: string; text: string; extra?: string; markdown: string; cached: boolean }

export interface AiPanelProps {
  open: boolean; onClose: () => void; actions: AiAction[]; initialText?: string
  deckId?: string; subjectId?: string; defaultTitle?: string
  /** Lets summary/explain results be put somewhere useful (e.g. appended to a note). */
  onInsert?: (markdown: string) => void; insertLabel?: string
}
export default function AiPanel(p: AiPanelProps) {
  return <Dialog open={p.open} onClose={p.onClose} title="AI helper" wide>{p.open && <Body {...p} />}</Dialog>
}

function Body({ actions, initialText, deckId, subjectId, defaultTitle, onInsert, insertLabel, onClose }: AiPanelProps) {
  const toast = useToast()
  const { loading, ready, ai, label } = useAiReady(FEATURE[(actions[0])])
  const [action, setAction] = useState<AiAction>(actions[0])
  const [text, setText] = useState(initialText ?? '')
  const [file, setFile] = useState<{ name: string; part: AiPart } | null>(null)
  const [count, setCount] = useState(8)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<Result | null>(null)
  const [used, setUsed] = useState(aiUsageToday())
  const fileRef = useRef<HTMLInputElement>(null)
  const textOnly = action === 'explain' || action === 'plan'

  if (loading) return <p className="py-6 text-center text-muted">Checking AI settings…</p>
  if (!ready) return (
    <Card className="space-y-3 bg-surface2 text-center">
      <KeyRound className="mx-auto text-brand" />
      <h3 className="font-display text-xl font-semibold">AI is optional and switched off</h3>
      <p className="text-[15px] text-muted">To use it, turn on AI and add your own API key (Gemini, OpenAI, Claude or another provider you choose) in Settings. Everything else in StudyFlow works without it.</p>
      <Button variant="primary" onClick={() => { onClose(); go('settings', { tab: 'ai' }) }}>Open AI settings</Button>
    </Card>
  )
  if (!ai.consented) return (
    <div className="space-y-4">
      <div className="flex items-center gap-2"><ShieldCheck className="text-brand" /><h3 className="font-display text-xl font-semibold">Before you use AI</h3></div>
      <ul className="list-disc space-y-2 pl-5 text-[15px] text-muted">
        <li>When you press a button here, <b className="text-ink">only the text, image or PDF you select</b> is sent to {label} using your own API key.</li>
        <li>Nothing is sent automatically, and your other notes, tasks and settings are never included.</li>
        <li>Your provider decides how it stores or uses what you send, and what it bills. Check its terms and do not send anything private or sensitive.</li>
        <li>AI can be wrong. You review every result before it is saved.</li>
      </ul>
      <div className="flex flex-wrap justify-end gap-2"><Button onClick={onClose}>Not now</Button>
        <Button variant="primary" onClick={() => setPrefs(s => ({ ...s, ai: { ...s.ai, consented: true } }))}>I understand, continue</Button></div>
    </div>
  )

  const pickFile = async (f?: File) => {
    if (!f) return
    setError('')
    try {
      if (f.type.startsWith('text/') || /\.(txt|md)$/i.test(f.name)) {
        if (f.size > MAX_FILE_BYTES) throw new AiError('limit', 'That file is over 10 MB. Paste the part you need instead.')
        const t = await f.text(); setText(s => (s ? s + '\n\n' : '') + t)
      } else {
        const prob = await checkCapability(f.type === 'application/pdf' ? 'pdf' : 'vision', FEATURE[action]); if (prob) throw new AiError('limit', prob)
        setFile({ name: f.name, part: await fileToPart(f) })
      }
    } catch (e) { setError(aiErrorText(e)) }
  }
  const run = async () => {
    setBusy(true); setError('')
    const input = { text: text.trim() || undefined, parts: file ? [file.part] : undefined }
    try {
      if (action === 'cards') {
        const r = await aiCards({ ...input, max: count })
        if (!r.data.cards.length) setError('The AI could not find anything to turn into cards. Try more detailed material.')
        else setResult({ kind: 'cards', cards: r.data.cards })
      } else if (action === 'quiz') {
        const r = await aiQuiz({ ...input, count })
        const qs: QuizQuestion[] = r.data.questions.map(q => ({ id: uid(), type: q.type, prompt: q.prompt, points: 1, topicTags: [], explanation: q.explanation,
          options: q.type === 'true_false' ? ['True', 'False'] : q.type === 'multiple_choice' ? q.options : undefined,
          correctOptionIndex: q.type === 'short_answer' ? undefined : q.correctOptionIndex, acceptedAnswers: q.type === 'short_answer' ? (q.acceptedAnswers?.length ? q.acceptedAnswers : ['']) : undefined }))
        if (!qs.length) setError('The AI could not write questions from that. Try more detailed material.')
        else setResult({ kind: 'quiz', questions: qs })
      } else if (action === 'summary') {
        const r = await aiSummary(input)
        const md = r.data.summary.map(s => `- ${s}`).join('\n') + (r.data.keyTerms?.length ? `\n\n**Key terms:** ${r.data.keyTerms.join(', ')}` : '')
        setResult({ kind: 'text', title: 'Summary', text: r.data.summary.map(s => `• ${s}`).join('\n'), extra: r.data.keyTerms?.length ? `Key terms: ${r.data.keyTerms.join(', ')}` : undefined, markdown: `## Summary (AI)\n\n${md}`, cached: r.cached })
      } else if (action === 'explain') {
        const r = await aiExplain(text); const d = r.data
        const parts = [d.explanation, d.example && `Example: ${d.example}`, d.mnemonic && `Memory trick: ${d.mnemonic}`].filter(Boolean) as string[]
        setResult({ kind: 'text', title: 'In simple words', text: parts.join('\n\n'), markdown: `## Explained simply (AI)\n\n${parts.join('\n\n')}`, cached: r.cached })
      } else {
        const r = await aiPlanText(text)
        setResult({ kind: 'text', title: 'Your plan, in friendlier words', text: r.data.overview, markdown: r.data.overview, cached: r.cached })
      }
    } catch (e) { setError(aiErrorText(e)) } finally { setBusy(false); setUsed(aiUsageToday()) }
  }

  if (result?.kind === 'cards') return <DraftReview drafts={result.cards} source="ai" deckId={deckId} subjectId={subjectId} defaultDeckTitle={defaultTitle} onCancel={() => setResult(null)} onDone={onClose} />
  if (result?.kind === 'quiz') return <QuizReview questions={result.questions} subjectId={subjectId} defaultTitle={defaultTitle ? `${defaultTitle} quiz` : undefined} onCancel={() => setResult(null)} onDone={onClose} />
  if (result) return (
    <div className="space-y-4">
      <h3 className="font-display text-xl font-semibold">{result.title}</h3>
      <div className="whitespace-pre-wrap rounded-card border hairline bg-surface2 p-4 text-[15px] leading-relaxed">{result.text}{result.extra && <p className="mt-3 font-bold">{result.extra}</p>}</div>
      <p className="text-sm text-muted">AI-generated, so double-check it against your own material.{result.cached && ' Reused a saved answer, so no quota was used.'}</p>
      <div className="flex flex-wrap justify-end gap-2">
        <Button onClick={() => setResult(null)}>Back</Button>
        <Button onClick={async () => { try { await navigator.clipboard.writeText(result.text); toast('Copied.') } catch { toast('Could not copy.', 'err') } }}><Copy size={16} />Copy</Button>
        {onInsert && <Button variant="primary" onClick={() => { onInsert(result.markdown); toast('Added.'); onClose() }}>{insertLabel ?? 'Add to my note'}</Button>}
      </div>
    </div>
  )

  const over = text.length > MAX_TEXT_CHARS
  const empty = !text.trim() && !file
  return (
    <div className="space-y-4">
      {actions.length > 1 && <Segmented label="What should the AI do?" value={action} onChange={a => { setAction(a); setError('') }} options={actions.map(a => ({ value: a, label: LABEL[a] }))} />}
      <Field label="Material to use" hint={action === 'plan' ? 'This exact text will be sent to {label} when you press the button.' : 'This exact text (and any file you add) is what will be sent to {label} when you press the button.'}>
        {(id, d) => <Textarea id={id} aria-describedby={d} rows={7} value={text} onChange={e => setText(e.target.value)} placeholder="Paste your notes or textbook text here…" />}
      </Field>
      <p className={over ? 'text-sm font-bold text-warn' : 'tnum text-sm text-muted'}>{text.length.toLocaleString()} / {MAX_TEXT_CHARS.toLocaleString()} characters{over && ' — only the first part will be sent.'}</p>
      {!textOnly && (
        <div className="space-y-2">
          <input ref={fileRef} type="file" hidden accept="image/*,application/pdf,.txt,.md,text/plain,text/markdown" onChange={e => { pickFile(e.target.files?.[0]); e.target.value = '' }} />
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={() => fileRef.current?.click()}><FileUp size={16} />Add photo, PDF or text file</Button>
            {file && <span className="inline-flex items-center gap-1 rounded-full border hairline bg-surface2 py-0.5 pl-3 pr-1 text-sm font-semibold">{file.name}<button aria-label="Remove file" className="grid h-8 w-8 place-items-center rounded-full hover:bg-surface" onClick={() => setFile(null)}><X size={14} /></button></span>}
          </div>
          <p className="text-sm text-muted">Files up to {Math.round(MAX_FILE_BYTES / 1048576)} MB. Photos are shrunk on your device before sending.</p>
        </div>
      )}
      {(action === 'cards' || action === 'quiz') && <Field label={action === 'cards' ? 'Maximum cards' : 'Number of questions'}>{id => <Input id={id} type="number" min={3} max={action === 'cards' ? 30 : 15} value={count} onChange={e => setCount(Math.max(3, Math.min(action === 'cards' ? 30 : 15, Number(e.target.value) || 8)))} className="max-w-28" />}</Field>}
      {error && <p role="alert" className="rounded-card border hairline bg-surface2 p-3 text-[15px] font-semibold text-bad">{error}</p>}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="tnum text-sm text-muted">AI used {used} time{used === 1 ? '' : 's'} today on this device</span>
        <Button variant="primary" disabled={busy || empty} onClick={run}>{busy ? <><Loader2 size={18} className="animate-spin" />Thinking…</> : <><Sparkles size={18} />{GO[action]}</>}</Button>
      </div>
    </div>
  )
}
