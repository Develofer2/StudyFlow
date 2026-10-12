import { useState } from 'react'
import { Button, Dialog, Field, Input, Select, Textarea, cx, useToast } from '@/components/ui'
import { put, useCollection } from '@/data/store'
import { generateCards, type Draft } from '@/domain/cardgen'
import { newCard } from '@/services/app'
import type { Deck, Flashcard, StudyNote, Subject } from '@/types'
import DraftReview from '../ai/DraftReview'
import { DECK_COLORS } from '../ai/util'

export function DeckDialog({ deck, onClose }: { deck: Deck | 'new' | null; onClose: () => void }) {
  return <Dialog open={!!deck} onClose={onClose} title={deck === 'new' ? 'New deck' : 'Edit deck'}>{deck && <DeckForm key={deck === 'new' ? 'new' : deck.id} deck={deck === 'new' ? undefined : deck} onClose={onClose} />}</Dialog>
}
function DeckForm({ deck, onClose }: { deck?: Deck; onClose: () => void }) {
  const toast = useToast()
  const subjects = useCollection<Subject>('subjects').filter(s => !s.archivedAt)
  const [title, setTitle] = useState(deck?.title ?? ''); const [description, setDesc] = useState(deck?.description ?? '')
  const [subjectId, setSubject] = useState(deck?.subjectId ?? ''); const [color, setColor] = useState(deck?.color ?? DECK_COLORS[0])
  const [err, setErr] = useState('')
  const save = async () => {
    if (!title.trim()) return setErr('Give your deck a name.')
    try { await put('decks', { ...(deck ? { id: deck.id } : {}), title: title.trim(), description: description.trim() || undefined, subjectId: subjectId || undefined, color }); toast(deck ? 'Deck updated.' : 'Deck created.'); onClose() }
    catch { toast('Could not save the deck.', 'err') }
  }
  return (
    <form className="space-y-4" onSubmit={e => { e.preventDefault(); save() }}>
      <Field label="Deck name" error={err}>{(id, d) => <Input id={id} aria-describedby={d} value={title} onChange={e => { setTitle(e.target.value); setErr('') }} placeholder="e.g. Cell biology" data-autofocus />}</Field>
      <Field label="Subject (optional)">{id => <Select id={id} value={subjectId} onChange={e => setSubject(e.target.value)}><option value="">No subject</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</Select>}</Field>
      <details className="rounded-card border hairline px-3 py-2"><summary className="min-h-9 cursor-pointer py-1.5 font-bold">More options</summary>
        <div className="space-y-4 pb-2 pt-2">
          <Field label="Description">{id => <Textarea id={id} rows={2} value={description} onChange={e => setDesc(e.target.value)} />}</Field>
          <fieldset><legend className="mb-1 text-sm font-bold">Colour</legend><div className="flex flex-wrap gap-1">{DECK_COLORS.map(c => (
            <label key={c} className="grid h-11 w-11 cursor-pointer place-items-center"><input type="radio" name="deck-color" className="sr-only" checked={color === c} onChange={() => setColor(c)} aria-label={`Colour ${c}`} />
              <span className={cx('h-8 w-8 rounded-full border-2', color === c ? 'border-ink ring-2 ring-brand' : 'border-transparent')} style={{ background: c }} /></label>))}</div></fieldset>
        </div></details>
      <div className="flex justify-end gap-2"><Button onClick={onClose}>Cancel</Button><Button variant="primary" type="submit">{deck ? 'Save' : 'Create deck'}</Button></div>
    </form>
  )
}

export function CardDialog({ deckId, card, open, onClose }: { deckId: string; card?: Flashcard; open: boolean; onClose: () => void }) {
  return <Dialog open={open} onClose={onClose} title={card ? 'Edit card' : 'Add card'}>{open && <CardForm deckId={deckId} card={card} onClose={onClose} />}</Dialog>
}
function CardForm({ deckId, card, onClose }: { deckId: string; card?: Flashcard; onClose: () => void }) {
  const toast = useToast()
  const [front, setFront] = useState(card?.front ?? ''); const [back, setBack] = useState(card?.back ?? ''); const [err, setErr] = useState('')
  const save = async (another: boolean) => {
    if (!front.trim() || !back.trim()) return setErr('Fill in both sides of the card.')
    try {
      if (card) await put('cards', { id: card.id, front: front.trim(), back: back.trim() }); else await put('cards', newCard(deckId, front, back))
      toast(card ? 'Card updated.' : 'Card added.')
      if (another) { setFront(''); setBack(''); setErr(''); document.getElementById('card-front')?.focus() } else onClose()
    } catch { toast('Could not save the card.', 'err') }
  }
  return (
    <form className="space-y-4" onSubmit={e => { e.preventDefault(); save(false) }}>
      <Field label="Front (question or term)" error={err}>{(_, d) => <Textarea id="card-front" aria-describedby={d} rows={2} value={front} onChange={e => { setFront(e.target.value); setErr('') }} data-autofocus />}</Field>
      <Field label="Back (answer)">{id => <Textarea id={id} rows={3} value={back} onChange={e => setBack(e.target.value)} />}</Field>
      <div className="flex flex-wrap justify-end gap-2"><Button onClick={onClose}>Cancel</Button>{!card && <Button onClick={() => save(true)}>Save and add another</Button>}<Button variant="primary" type="submit">{card ? 'Save' : 'Save card'}</Button></div>
    </form>
  )
}

export function FromNotesDialog({ deckId, open, onClose }: { deckId: string; open: boolean; onClose: () => void }) {
  return <Dialog open={open} onClose={onClose} title="Generate cards from notes" wide>{open && <FromNotes deckId={deckId} onClose={onClose} />}</Dialog>
}
function FromNotes({ deckId, onClose }: { deckId: string; onClose: () => void }) {
  const notes = useCollection<StudyNote>('notes').filter(n => !n.archivedAt)
  const [text, setText] = useState(''); const [drafts, setDrafts] = useState<Draft[] | null>(null)
  return drafts ? (
    <DraftReview drafts={drafts} source="rules" deckId={deckId} onCancel={() => setDrafts(null)} onDone={onClose}
      emptyHint={'No cards found. This simple tool only spots lines like "Term: definition", "X is defined as…", "X consists of…", "The purpose of X is…" and "X is a …". Try rewording your notes in those shapes, add cards by hand, or use the AI helper.'} />
  ) : (
    <div className="space-y-4">
      <p className="text-[15px] text-muted">Rules-based and works offline. It spots definition-style sentences — you review every draft before anything is saved.</p>
      {notes.length > 0 && <Field label="Use one of your notes">{id => <Select id={id} defaultValue="" onChange={e => setText(notes.find(n => n.id === e.target.value)?.content ?? '')}><option value="">Choose a note…</option>{notes.map(n => <option key={n.id} value={n.id}>{n.title || 'Untitled note'}</option>)}</Select>}</Field>}
      <Field label="Or paste text">{id => <Textarea id={id} rows={8} value={text} onChange={e => setText(e.target.value)} placeholder={'Mitochondria: the powerhouse of the cell\nPhotosynthesis is defined as…'} />}</Field>
      <div className="flex justify-end gap-2"><Button onClick={onClose}>Cancel</Button><Button variant="primary" disabled={!text.trim()} onClick={() => setDrafts(generateCards(text))}>Find cards</Button></div>
    </div>
  )
}
