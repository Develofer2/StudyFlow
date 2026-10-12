import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Sparkles, Trophy } from 'lucide-react'
import { Button, Card, ProgressRing, cx, useToast } from '@/components/ui'
import { put, useCollection } from '@/data/store'
import { review, type Rating } from '@/domain/srs'
import { reviewCard } from '@/services/app'
import type { Flashcard } from '@/types'
import AiPanel from '../ai/AiPanel'

const RATINGS: { r: Rating; label: string; cls: string }[] = [
  { r: 'again', label: 'Again', cls: 'border-bad text-bad' }, { r: 'hard', label: 'Hard', cls: 'border-warn text-warn' },
  { r: 'good', label: 'Good', cls: 'border-ok text-ok' }, { r: 'easy', label: 'Easy', cls: 'border-brand text-brand' },
]
const FACE = 'flex min-h-72 cursor-pointer flex-col items-center justify-center whitespace-pre-wrap rounded-card border hairline bg-surface p-6 text-center [overflow-wrap:anywhere] [grid-area:1/1]'
const fmtDays = (d: number) => (d < 30 ? `${d}d` : d < 365 ? `${Math.round(d / 30)}mo` : '1y')
const preview = (c: Flashcard, r: Rating) => (r === 'again' ? '10 min' : fmtDays(review(c, r, new Date()).intervalDays))

export default function Study({ cards, title, onExit }: { cards: Flashcard[]; title: string; onExit: () => void }) {
  const toast = useToast()
  const all = useCollection<Flashcard>('cards')
  const byId = useMemo(() => new Map(all.map(c => [c.id, c])), [all])
  const [queue, setQueue] = useState(() => cards.map(c => c.id))
  const [pos, setPos] = useState(0)
  const [shown, setShown] = useState(false)
  const [tally, setTally] = useState<Record<Rating, number>>({ again: 0, hard: 0, good: 0, easy: 0 })
  const [missed, setMissed] = useState<string[]>([])
  const [reviewed, setReviewed] = useState(0)
  const [explain, setExplain] = useState(false)
  const requeued = useRef(new Set<string>())
  const busy = useRef(false)
  const card = byId.get(queue[pos])
  const done = pos >= queue.length

  useEffect(() => { if (!done && !card) setPos(p => p + 1) }, [done, card])

  const rate = async (r: Rating) => {
    if (!card || !shown || busy.current) return
    busy.current = true
    try {
      await reviewCard(card, r)
      setTally(t => ({ ...t, [r]: t[r] + 1 })); setReviewed(n => n + 1)
      if (r === 'again') { setMissed(m => (m.includes(card.id) ? m : [...m, card.id])); if (!requeued.current.has(card.id)) { requeued.current.add(card.id); setQueue(q => [...q, card.id]) } }
      setShown(false); setPos(p => p + 1)
    } catch { toast('Could not save that review. Please try again.', 'err') }
    busy.current = false
  }
  const rateRef = useRef(rate); rateRef.current = rate
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (explain || e.ctrlKey || e.metaKey || e.altKey || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return
      if (e.key === ' ' && t.tagName !== 'BUTTON') { e.preventDefault(); setShown(true) }
      const i = ['1', '2', '3', '4'].indexOf(e.key)
      if (i >= 0) rateRef.current(RATINGS[i].r)
    }
    addEventListener('keydown', key); return () => removeEventListener('keydown', key)
  }, [explain])

  if (done) {
    const total = tally.again + tally.hard + tally.good + tally.easy
    return (
      <Card className="mx-auto max-w-lg space-y-5 text-center anim-rise">
        <Trophy className="mx-auto text-brand" size={32} />
        <h2 className="font-display text-2xl font-semibold">{reviewed ? 'Session complete' : 'Nothing was reviewed'}</h2>
        {reviewed > 0 && <>
          <p className="text-muted">You reviewed {reviewed} card{reviewed === 1 ? '' : 's'} from {title}.</p>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">{RATINGS.map(x => <li key={x.r} className={cx('rounded-card border p-3', x.cls)}><div className="tnum text-2xl font-bold">{tally[x.r]}</div><div className="text-sm font-bold">{x.label}</div></li>)}</ul>
          <p className="text-sm text-muted">{total && Math.round(((tally.good + tally.easy) / total) * 100)}% felt good or easy. Cards you found hard come back sooner.</p>
        </>}
        <div className="flex flex-wrap justify-center gap-2">
          {missed.length > 0 && <Button onClick={() => { setQueue(missed); setPos(0); setMissed([]); setTally({ again: 0, hard: 0, good: 0, easy: 0 }); setReviewed(0); requeued.current = new Set() }}>Practise the {missed.length} missed</Button>}
          <Button variant="primary" onClick={onExit}>Done</Button>
        </div>
      </Card>
    )
  }
  if (!card) return null
  const seen = Math.min(pos, queue.length)
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={onExit}><ArrowLeft size={16} />End session</Button>
        <span className="tnum text-sm font-bold text-muted" aria-live="polite">Card {seen + 1} of {queue.length}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface2" role="progressbar" aria-label="Session progress" aria-valuemin={0} aria-valuemax={queue.length} aria-valuenow={seen}><div className="h-full bg-brand transition-all" style={{ width: `${(seen / queue.length) * 100}%` }} /></div>
      <p className="text-sm text-muted">{title}</p>
      <div style={{ perspective: '1400px' }} onClick={() => setShown(true)}>
        <div className={cx('flip grid', shown && 'on')}>
          <div aria-hidden={shown} className={cx(FACE)}><span className="mb-3 text-xs font-bold uppercase tracking-wider text-muted">Question</span><p className="font-display text-2xl leading-snug">{card.front}</p></div>
          <div aria-hidden={!shown} className={cx(FACE, 'back')}><span className="mb-3 text-xs font-bold uppercase tracking-wider text-muted">Answer</span><p className="text-xl leading-relaxed">{card.back}</p></div>
        </div>
      </div>
      {!shown ? (
        <Button variant="primary" size="lg" className="w-full" onClick={() => setShown(true)}>Show answer <kbd className="hidden rounded border border-current px-1.5 text-xs sm:inline">Space</kbd></Button>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {RATINGS.map((x, i) => <button key={x.r} onClick={() => rate(x.r)} className={cx('flex min-h-14 flex-col items-center justify-center rounded-card border-2 bg-surface px-2 py-1 font-bold transition hover:bg-surface2 active:scale-[.98]', x.cls)}>
              <span>{x.label} <span className="hidden text-xs opacity-70 sm:inline">({i + 1})</span></span><span className="tnum text-xs font-semibold text-muted">{preview(card, x.r)}</span></button>)}
          </div>
          <div className="text-center"><Button variant="ghost" size="sm" onClick={() => setExplain(true)}><Sparkles size={16} />Explain simply (AI)</Button></div>
        </div>
      )}
      <AiPanel open={explain} onClose={() => setExplain(false)} actions={['explain']} initialText={`${card.front}\n${card.back}`} insertLabel="Add to card back"
        onInsert={md => put('cards', { id: card.id, back: `${card.back}\n\n${md.replace(/^##[^\n]*\n\n/, '')}` })} />
    </div>
  )
}
