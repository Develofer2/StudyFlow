import { useState } from 'react'
import { Button, Field, Input, Select, Textarea, useToast } from '@/components/ui'
import { useCollection, put } from '@/data/store'
import { newCard } from '@/services/app'
import type { Deck, Flashcard } from '@/types'
import { DECK_COLORS } from './util'

interface Row { front: string; back: string; on: boolean }

/** Nothing is written until the user presses Save. */
export default function DraftReview({ drafts, source, deckId, defaultDeckTitle, subjectId, onDone, onCancel, emptyHint }: {
  drafts: { front: string; back: string }[]; source: Flashcard['source']; deckId?: string; defaultDeckTitle?: string; subjectId?: string
  onDone: (count: number, deckId: string) => void; onCancel: () => void; emptyHint?: string
}) {
  const toast = useToast()
  const decks = useCollection<Deck>('decks')
  const [rows, setRows] = useState<Row[]>(() => drafts.map(d => ({ ...d, on: true })))
  const [deck, setDeck] = useState(deckId ?? decks[0]?.id ?? 'new')
  const [title, setTitle] = useState(defaultDeckTitle ?? 'New deck')
  const [busy, setBusy] = useState(false)
  const valid = rows.filter(r => r.on && r.front.trim() && r.back.trim())
  const set = (i: number, p: Partial<Row>) => setRows(rs => rs.map((r, j) => (j === i ? { ...r, ...p } : r)))
  const fixed = deckId ? decks.find(d => d.id === deckId) : undefined

  if (!rows.length) return (
    <div className="space-y-4"><p className="rounded-card border border-dashed border-line p-4 text-[15px] text-muted">{emptyHint ?? 'No cards were found in that text.'}</p>
      <div className="flex justify-end"><Button onClick={onCancel}>Back</Button></div></div>
  )
  const save = async () => {
    setBusy(true)
    try {
      let did = deck
      if (!fixed && deck === 'new') did = (await put('decks', { title: title.trim() || 'New deck', subjectId, color: DECK_COLORS[0] })).id
      for (const r of valid) await put('cards', newCard(did, r.front, r.back, source))
      toast(`Saved ${valid.length} card${valid.length === 1 ? '' : 's'}.`); onDone(valid.length, did)
    } catch { toast('Could not save the cards. Please try again.', 'err'); setBusy(false) }
  }
  return (
    <div className="space-y-4">
      <p className="text-[15px] text-muted">Review the drafts. Untick or edit anything — nothing is saved until you press Save.</p>
      {fixed ? <p className="text-sm font-bold">Adding to deck: {fixed.title}</p> : (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Save into">{id => <Select id={id} value={deck} onChange={e => setDeck(e.target.value)}>{decks.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}<option value="new">+ New deck</option></Select>}</Field>
          {deck === 'new' && <Field label="New deck name">{id => <Input id={id} value={title} onChange={e => setTitle(e.target.value)} />}</Field>}
        </div>
      )}
      <ul className="space-y-3">
        {rows.map((r, i) => (
          <li key={i} className={`flex gap-2 rounded-card border hairline p-3 ${r.on ? 'bg-surface' : 'bg-surface2 opacity-70'}`}>
            <label className="grid h-11 w-11 shrink-0 cursor-pointer place-items-center"><input type="checkbox" className="h-5 w-5 accent-[var(--primary)]" checked={r.on} onChange={e => set(i, { on: e.target.checked })} aria-label={`Include card ${i + 1}`} /></label>
            <div className="min-w-0 flex-1 space-y-2">
              <Input aria-label={`Front of card ${i + 1}`} value={r.front} onChange={e => set(i, { front: e.target.value })} />
              <Textarea aria-label={`Back of card ${i + 1}`} rows={2} value={r.back} onChange={e => set(i, { back: e.target.value })} />
            </div>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button onClick={onCancel}>Back</Button>
        <Button variant="primary" disabled={!valid.length || busy} onClick={save}>Save {valid.length} card{valid.length === 1 ? '' : 's'}</Button>
      </div>
    </div>
  )
}
