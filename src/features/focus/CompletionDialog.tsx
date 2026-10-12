import { useEffect, useState } from 'react'
import { Coffee, Play, Star } from 'lucide-react'
import { Button, Dialog, Field, Textarea, cx, useToast } from '@/components/ui'
import { getAll, put } from '@/data/store'
import { dismissCompletion, start, type Completion } from '@/services/timerService'
import type { StudySession } from '@/types'
import { fmtDuration } from '@/domain/time'

const BREAK_TIPS = ['Stand up and stretch your neck and shoulders.', 'Drink a glass of water.', 'Look at something far away for 20 seconds.', 'Take a short walk or step outside for fresh air.', 'Take five slow breaths. No screens.']
const label = { short_break: 'short break', long_break: 'long break', focus: 'focus session' }

export default function CompletionDialog({ c }: { c: Completion | null }) {
  const toast = useToast(); const [rating, setRating] = useState(0); const [notes, setNotes] = useState('')
  useEffect(() => { setRating(0); setNotes('') }, [c?.id])
  if (!c) return null
  const focus = c.finished === 'focus'
  const tip = BREAK_TIPS[(c.focusSeconds + c.sessionId.length) % BREAK_TIPS.length]
  const save = async () => {
    if (!focus || (!rating && !notes.trim())) return
    const s = getAll<StudySession>('sessions').find(x => x.id === c.sessionId)
    if (!s) return
    try { await put('sessions', { ...s, rating: rating || undefined, notes: notes.trim() || undefined }); toast('Reflection saved.') } catch { toast('Could not save your reflection.', 'err') }
  }
  const close = async () => { await save(); dismissCompletion() }
  const next = async () => { await save(); dismissCompletion(); await start(c.next) }
  return (
    <Dialog open onClose={close} title={focus ? 'Nice work, session complete' : 'Break is over'}>
      <div className="space-y-4">
        {focus ? <>
          <p className="text-[15px] text-muted">You focused for {fmtDuration(c.focusSeconds)}. How did it go?</p>
          <div role="radiogroup" aria-label="Rate your focus from 1 to 5" className="flex gap-1">
            {[1, 2, 3, 4, 5].map(n => <button key={n} role="radio" aria-checked={rating === n} aria-label={`${n} of 5`} onClick={() => setRating(n)} className="grid h-11 w-11 place-items-center rounded-full hover:bg-surface2">
              <Star size={26} className={cx(n <= rating ? 'fill-brand text-brand' : 'text-muted')} /></button>)}
            <span className="ml-2 self-center text-sm font-bold text-muted">{rating ? `${rating}/5` : ''}</span></div>
          <Field label="Reflection (optional)">{id => <Textarea id={id} rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="What did you get done? What was hard?" />}</Field>
          <div className="flex gap-3 rounded-card bg-surface2 p-3 text-sm"><Coffee size={20} className="mt-0.5 shrink-0 text-brand" /><p><b>Break idea:</b> {tip}</p></div>
        </> : <p className="text-[15px] text-muted">Ready for the next focus session when you are.</p>}
        <div className="flex flex-wrap justify-end gap-2">
          <Button onClick={close}>Not now</Button>
          <Button variant="primary" onClick={next} data-autofocus>{c.next === 'focus' ? <><Play size={18} />Start focus</> : <><Coffee size={18} />Start {label[c.next]}</>}</Button></div>
      </div>
    </Dialog>)
}
