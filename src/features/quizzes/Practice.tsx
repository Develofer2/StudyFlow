import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, CheckCircle2, CircleHelp, Clock, Sparkles, XCircle } from 'lucide-react'
import { Button, Card, Chip, ConfirmDialog, Field, Input, ProgressRing, Switch, cx, useToast } from '@/components/ui'
import { put } from '@/data/store'
import { grade, scoreQuiz, validateQuestion } from '@/domain/quiz'
import { nowIso } from '@/domain/time'
import type { Quiz, QuizAttempt, QuizQuestion } from '@/types'
import { AI_QUIZ_BADGE } from '../ai/QuizReview'

type Snapshot = QuizAttempt & { questions?: QuizQuestion[] }
const shuffled = <T,>(a: T[]) => { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]] } return r }
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

export function Practice({ quiz, onExit, onFinish }: { quiz: Quiz; onExit: () => void; onFinish: (a: Snapshot) => void }) {
  const toast = useToast()
  const [started, setStarted] = useState(false)
  const [exam, setExam] = useState(false)
  const [mins, setMins] = useState(quiz.timeLimitSeconds ? String(Math.round(quiz.timeLimitSeconds / 60)) : '')
  const [qs, setQs] = useState(quiz.questions)
  const [idx, setIdx] = useState(0)
  const [ans, setAns] = useState<Record<string, string>>({})
  const [left, setLeft] = useState<number | null>(null)
  const [ask, setAsk] = useState(false)
  const startedAt = useRef(nowIso()); const endsAt = useRef<number | null>(null); const finished = useRef(false)

  const finish = async () => {
    if (finished.current) return
    finished.current = true
    const r = scoreQuiz(qs, ans)
    const ungradedPts = qs.filter(q => grade(q, ans[q.id] ?? '') === null).reduce((s, q) => s + q.points, 0)
    const attempt = { quizId: quiz.id, quizTitle: quiz.title, startedAt: startedAt.current, completedAt: nowIso(), score: r.score, maxScore: r.maxScore - ungradedPts, answers: r.answers, questions: qs }
    try { const saved = await put('attempts', attempt); onFinish(saved as Snapshot) }
    catch { finished.current = false; toast('Could not save your attempt.', 'err') }
  }
  const finRef = useRef(finish); finRef.current = finish
  useEffect(() => {
    if (!started || endsAt.current == null) return
    const t = setInterval(() => { const s = Math.max(0, Math.round((endsAt.current! - Date.now()) / 1000)); setLeft(s); if (s === 0) { clearInterval(t); toast("Time's up — marking your answers.", 'info'); finRef.current() } }, 1000)
    return () => clearInterval(t)
  }, [started, toast])

  if (!started) return (
    <Card className="mx-auto max-w-lg space-y-4 anim-rise">
      <Button variant="ghost" size="sm" onClick={onExit}><ArrowLeft size={16} />Back</Button>
      <h2 className="font-display text-2xl font-semibold">{quiz.title}</h2>
      <p className="flex flex-wrap items-center gap-2 text-muted">{quiz.questions.length} question{quiz.questions.length === 1 ? '' : 's'}{quiz.source === 'ai' && <Chip><Sparkles size={12} />{AI_QUIZ_BADGE}</Chip>}</p>
      <Switch checked={exam} onChange={setExam} label="Exam simulation" hint="Shuffles the question order, like a real paper." />
      <Field label="Time limit in minutes (optional)">{id => <Input id={id} type="number" min={1} max={300} className="max-w-32" value={mins} onChange={e => setMins(e.target.value)} />}</Field>
      <Button variant="primary" size="lg" className="w-full" disabled={!quiz.questions.length} onClick={() => {
        if (exam) setQs(shuffled(quiz.questions))
        const m = Number(mins); if (m > 0) { endsAt.current = Date.now() + m * 60000; setLeft(Math.round(m * 60)) }
        startedAt.current = nowIso(); setStarted(true)
      }}>Start</Button>
    </Card>
  )
  const q = qs[idx]; const unanswered = qs.filter(x => !(ans[x.id] ?? '').trim()).length
  const set = (v: string) => setAns(a => ({ ...a, [q.id]: v }))
  return (
    <div className="mx-auto max-w-2xl space-y-4 anim-rise">
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={onExit}><ArrowLeft size={16} />Quit</Button>
        <span className="tnum text-sm font-bold text-muted">Question {idx + 1} of {qs.length}</span>
        {left != null && <span role="timer" className={cx('tnum inline-flex items-center gap-1 text-sm font-bold', left <= 60 && 'text-bad')}><Clock size={14} />{mmss(left)}{left <= 60 && ' left'}</span>}
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface2"><div className="h-full bg-brand transition-all" style={{ width: `${((idx + 1) / qs.length) * 100}%` }} /></div>
      <Card className="space-y-4">
        <h2 className="whitespace-pre-wrap font-display text-xl font-semibold leading-snug [overflow-wrap:anywhere]">{q.prompt}</h2>
        {validateQuestion(q) && <p className="text-sm text-muted">This question has no answer key, so it will not be scored.</p>}
        {q.type === 'short_answer' ? <Input aria-label="Your answer" placeholder="Type your answer" value={ans[q.id] ?? ''} onChange={e => set(e.target.value)} />
          : <fieldset className="space-y-2"><legend className="sr-only">Choose one answer</legend>{(q.options ?? []).map((o, i) => o.trim() && (
            <label key={i} className={cx('flex min-h-12 cursor-pointer items-center gap-3 rounded-card border px-3 py-2', ans[q.id] === String(i) ? 'border-brand bg-surface2' : 'hairline hover:bg-surface2')}>
              <input type="radio" name={q.id} className="h-5 w-5 shrink-0 accent-[var(--primary)]" checked={ans[q.id] === String(i)} onChange={() => set(String(i))} /><span className="[overflow-wrap:anywhere]">{o}</span></label>))}</fieldset>}
      </Card>
      <div className="flex justify-between gap-2">
        <Button disabled={idx === 0} onClick={() => setIdx(i => i - 1)}><ArrowLeft size={16} />Previous</Button>
        {idx < qs.length - 1 ? <Button variant="primary" onClick={() => setIdx(i => i + 1)}>Next<ArrowRight size={16} /></Button>
          : <Button variant="primary" onClick={() => (unanswered ? setAsk(true) : finish())}>Finish</Button>}
      </div>
      <ConfirmDialog open={ask} onClose={() => setAsk(false)} onConfirm={finish} title="Finish the quiz?" confirmLabel="Finish and mark" body={`${unanswered} question${unanswered === 1 ? ' is' : 's are'} unanswered. Unanswered questions count as wrong.`} />
    </div>
  )
}

const keyText = (q: QuizQuestion) => q.type === 'short_answer' ? (q.acceptedAnswers ?? []).filter(Boolean).join(' / ') : (q.options ?? [])[q.correctOptionIndex ?? -1] ?? ''
const answerText = (q: QuizQuestion, a: string) => !a.trim() ? 'No answer' : q.type === 'short_answer' ? a : (q.options ?? [])[Number(a)] ?? 'No answer'

export function Results({ attempt, quiz, onBack, onRetry }: { attempt: Snapshot; quiz?: Quiz; onBack: () => void; onRetry?: () => void }) {
  const [onlyMissed, setOnly] = useState(false)
  const questions = attempt.questions ?? quiz?.questions ?? []
  const rows = useMemo(() => questions.map(q => { const a = attempt.answers.find(x => x.questionId === q.id)?.answer ?? ''; return { q, a, g: grade(q, a) } }), [questions, attempt])
  const pct = attempt.maxScore ? attempt.score / attempt.maxScore : 0
  const ungraded = rows.filter(r => r.g === null).length, missed = rows.filter(r => r.g === false).length
  const shown = onlyMissed ? rows.filter(r => r.g === false) : rows
  return (
    <div className="mx-auto max-w-2xl space-y-5 anim-rise">
      <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft size={16} />Back to quizzes</Button>
      <Card className="flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left">
        <ProgressRing value={pct} label="Score" size={110}><span className="tnum font-display text-2xl font-bold">{Math.round(pct * 100)}%</span></ProgressRing>
        <div><h2 className="font-display text-2xl font-semibold">{attempt.quizTitle}</h2>
          <p className="tnum text-lg font-bold">{attempt.score} / {attempt.maxScore} points</p>
          <p className="text-muted">{pct >= 0.8 ? 'Great work!' : pct >= 0.5 ? 'Getting there — review the misses below.' : 'Keep practising, you will improve.'}</p>
          {ungraded > 0 && <p className="mt-1 text-sm text-muted">{ungraded} question{ungraded === 1 ? ' is' : 's are'} ungraded (no answer key) and not counted.</p>}</div>
      </Card>
      <div className="flex flex-wrap items-center gap-2">
        {onRetry && <Button variant="primary" onClick={onRetry}>Try again</Button>}
        {missed > 0 && <Button aria-pressed={onlyMissed} onClick={() => setOnly(o => !o)}>{onlyMissed ? 'Show all questions' : `Review ${missed} missed`}</Button>}
      </div>
      <ol className="space-y-3">{shown.map(({ q, a, g }) => (
        <li key={q.id}><Card className="space-y-2">
          <p className="flex items-start gap-2 font-bold [overflow-wrap:anywhere]">{g === true ? <CheckCircle2 className="mt-0.5 shrink-0 text-ok" size={20} /> : g === false ? <XCircle className="mt-0.5 shrink-0 text-bad" size={20} /> : <CircleHelp className="mt-0.5 shrink-0 text-muted" size={20} />}
            <span><span className="sr-only">{g === true ? 'Correct. ' : g === false ? 'Incorrect. ' : 'Ungraded. '}</span>{q.prompt}</span></p>
          <p className="text-sm"><span className="font-bold">{g === true ? 'Correct' : g === false ? 'Not quite' : 'Ungraded'}</span> · Your answer: {answerText(q, a)}</p>
          {g === false && <p className="text-sm"><span className="font-bold">Correct answer:</span> {keyText(q)}</p>}
          {g === null && <p className="text-sm text-muted">This question has no answer key.</p>}
          {q.explanation && <p className="rounded-[calc(var(--radius)*.5)] bg-surface2 p-2.5 text-sm text-muted">{q.explanation}</p>}
        </Card></li>))}</ol>
    </div>
  )
}
