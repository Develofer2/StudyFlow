import { useState } from 'react'
import { ClipboardCheck, History, Pencil, Play, Plus, Sparkles, Trash2 } from 'lucide-react'
import { Button, Card, Chip, ConfirmDialog, EmptyState, PageHeader, Segmented, useToast } from '@/components/ui'
import { remove, useCollection } from '@/data/store'
import { useRoute } from '@/app/router'
import type { Quiz, QuizAttempt, Subject } from '@/types'
import AiPanel from './ai/AiPanel'
import { AI_QUIZ_BADGE } from './ai/QuizReview'
import Builder from './quizzes/Builder'
import Exams from './quizzes/Exams'
import { Practice, Results } from './quizzes/Practice'

type View = { k: 'list' } | { k: 'build'; quiz?: Quiz } | { k: 'practice'; quiz: Quiz } | { k: 'result'; attempt: QuizAttempt; quiz?: Quiz }

export default function Quizzes() {
  const route = useRoute()
  const toast = useToast()
  const quizzes = useCollection<Quiz>('quizzes'); const attempts = useCollection<QuizAttempt>('attempts'); const subjects = useCollection<Subject>('subjects')
  const [tab, setTab] = useState<'quizzes' | 'exams'>(route.params.get('view') === 'exams' ? 'exams' : 'quizzes')
  const [view, setView] = useState<View>({ k: 'list' })
  const [ai, setAi] = useState(false); const [del, setDel] = useState<Quiz | null>(null)
  const list = () => setView({ k: 'list' })

  if (view.k === 'build') return <Builder quiz={view.quiz} onClose={list} />
  if (view.k === 'practice') return <Practice quiz={view.quiz} onExit={list} onFinish={a => setView({ k: 'result', attempt: a, quiz: view.quiz })} />
  if (view.k === 'result') return <Results attempt={view.attempt} quiz={view.quiz} onBack={list} onRetry={view.quiz && quizzes.some(q => q.id === view.quiz!.id) ? () => setView({ k: 'practice', quiz: view.quiz! }) : undefined} />

  return (
    <div className="anim-rise space-y-5">
      <PageHeader title="Quizzes" sub="Test yourself, then see exactly what to revisit."
        action={tab === 'quizzes' ? <div className="flex flex-wrap gap-2"><Button onClick={() => setAi(true)}><Sparkles size={16} />With AI</Button><Button variant="primary" onClick={() => setView({ k: 'build' })}><Plus size={18} />New quiz</Button></div> : undefined} />
      <Segmented label="Quizzes or exams" value={tab} onChange={setTab} options={[{ value: 'quizzes', label: 'Quizzes' }, { value: 'exams', label: 'Exams' }]} />
      {tab === 'exams' ? <Exams /> : quizzes.length === 0 ? (
        <EmptyState icon={<ClipboardCheck />} title="No quizzes yet" body="Write a few questions with answers, or let AI draft some from your notes for you to check." action={<Button variant="primary" onClick={() => setView({ k: 'build' })}><Plus size={18} />Build a quiz</Button>} />
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">{quizzes.map(q => {
          const mine = attempts.filter(a => a.quizId === q.id).sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))
          const pct = (a: QuizAttempt) => (a.maxScore ? Math.round((a.score / a.maxScore) * 100) : 0)
          return <li key={q.id}><Card className="flex h-full flex-col gap-3">
            <div><h3 className="font-display text-xl font-semibold [overflow-wrap:anywhere]">{q.title}</h3>
              <p className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-muted"><span className="tnum">{q.questions.length} question{q.questions.length === 1 ? '' : 's'}</span>{subjects.find(s => s.id === q.subjectId) && <span>· {subjects.find(s => s.id === q.subjectId)!.name}</span>}
                {q.source === 'ai' && <Chip><Sparkles size={12} />{AI_QUIZ_BADGE}</Chip>}{mine[0] && <Chip className="tnum">Last: {pct(mine[0])}%</Chip>}</p></div>
            <div className="mt-auto flex flex-wrap items-center gap-2">
              <Button variant="primary" disabled={!q.questions.length} onClick={() => setView({ k: 'practice', quiz: q })}><Play size={16} />Practise</Button>
              <Button variant="ghost" aria-label={`Edit ${q.title}`} onClick={() => setView({ k: 'build', quiz: q })}><Pencil size={16} /></Button>
              <Button variant="ghost" aria-label={`Delete ${q.title}`} onClick={() => setDel(q)}><Trash2 size={16} /></Button>
            </div>
            {mine.length > 0 && <details><summary className="flex min-h-11 cursor-pointer items-center gap-1.5 text-sm font-bold"><History size={14} />Past attempts ({mine.length})</summary>
              <ul className="space-y-1 pt-1">{mine.slice(0, 10).map(a => <li key={a.id}><button className="flex min-h-11 w-full items-center justify-between gap-2 rounded-[calc(var(--radius)*.5)] px-2 text-left text-sm hover:bg-surface2" onClick={() => setView({ k: 'result', attempt: a, quiz: q })}>
                <span>{a.completedAt ? new Date(a.completedAt).toLocaleString() : 'Unfinished'}</span><span className="tnum font-bold">{a.score}/{a.maxScore} ({pct(a)}%)</span></button></li>)}</ul></details>}
          </Card></li>
        })}</ul>
      )}
      <AiPanel open={ai} onClose={() => setAi(false)} actions={['quiz']} />
      <ConfirmDialog open={!!del} onClose={() => setDel(null)} danger confirmLabel="Delete quiz" title="Delete this quiz?" body="Your past attempts keep their results." onConfirm={async () => { try { await remove('quizzes', del!.id); toast('Quiz deleted.') } catch { toast('Could not delete the quiz.', 'err') } }} />
    </div>
  )
}
