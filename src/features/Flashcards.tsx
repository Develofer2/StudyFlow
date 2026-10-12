import { useMemo, useState } from 'react'
import { ArrowLeft, BookOpenText, FileText, Layers, Pencil, Play, Plus, Search, Sparkles, Star, Trash2 } from 'lucide-react'
import { Button, Card, Chip, ConfirmDialog, EmptyState, Input, PageHeader, Segmented, cx, useDebounced, useToast } from '@/components/ui'
import { put, remove, useCollection } from '@/data/store'
import { useRoute } from '@/app/router'
import { isDue } from '@/domain/srs'
import { deleteDeck } from '@/services/app'
import type { Deck, Flashcard, Subject } from '@/types'
import AiPanel from './ai/AiPanel'
import { CardDialog, DeckDialog, FromNotesDialog } from './flashcards/Dialogs'
import Study from './flashcards/Study'

type Mode = 'due' | 'starred' | 'missed' | 'shuffle' | 'quick'
const MODES: { value: Mode; label: string }[] = [{ value: 'due', label: 'Due' }, { value: 'starred', label: 'Starred' }, { value: 'missed', label: 'Missed' }, { value: 'shuffle', label: 'Shuffle' }, { value: 'quick', label: 'Quick 10' }]
const shuffle = <T,>(a: T[]) => { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]] } return r }
const byDue = (a: Flashcard, b: Flashcard) => (a.dueAt ?? '').localeCompare(b.dueAt ?? '')
function pick(mode: Mode, cards: Flashcard[]) {
  const now = new Date(), due = cards.filter(c => isDue(c, now)).sort(byDue)
  switch (mode) {
    case 'due': return due
    case 'starred': return shuffle(cards.filter(c => c.favorite))
    case 'missed': return shuffle(cards.filter(c => c.lapseCount > 0))
    case 'shuffle': return shuffle(cards)
    default: return [...due, ...shuffle(cards.filter(c => !isDue(c, now)))].slice(0, 10)
  }
}
const EMPTY_NOTE: Record<Mode, string> = { due: 'Nothing is due right now. Try Shuffle to practise anyway.', starred: 'Star some cards to practise them here.', missed: 'No missed cards yet — cards you answer "Again" will show up here.', shuffle: 'Add some cards first.', quick: 'Add some cards first.' }

function Launcher({ cards, onStart }: { cards: Flashcard[]; onStart: (cards: Flashcard[], label: string) => void }) {
  const [mode, setMode] = useState<Mode>('due')
  const list = useMemo(() => pick(mode, cards), [mode, cards])
  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented label="Study mode" value={mode} onChange={setMode} options={MODES} />
        <Button variant="primary" disabled={!list.length} onClick={() => onStart(list, MODES.find(m => m.value === mode)!.label)}><Play size={16} />Study {list.length} card{list.length === 1 ? '' : 's'}</Button>
      </div>
      {!list.length && <p className="text-sm text-muted">{cards.length ? EMPTY_NOTE[mode] : 'Add some cards first.'}</p>}
    </Card>
  )
}

export default function Flashcards() {
  const route = useRoute()
  const decks = useCollection<Deck>('decks')
  const cards = useCollection<Flashcard>('cards')
  const [deckId, setDeckId] = useState<string | null>(route.params.get('deck'))
  const [session, setSession] = useState<{ cards: Flashcard[]; title: string } | null>(null)
  const [deckDlg, setDeckDlg] = useState<Deck | 'new' | null>(null)
  const [delDeck, setDelDeck] = useState<Deck | null>(null)
  const toast = useToast()
  const deck = decks.find(d => d.id === deckId)

  if (session) return <Study cards={session.cards} title={session.title} onExit={() => setSession(null)} />
  const removeDeck = async (d: Deck) => { try { await deleteDeck(d.id); if (deckId === d.id) setDeckId(null); toast('Deck deleted.') } catch { toast('Could not delete the deck.', 'err') } }
  const confirm = <ConfirmDialog open={!!delDeck} onClose={() => setDelDeck(null)} danger confirmLabel="Delete deck" title="Delete this deck?" onConfirm={() => delDeck && removeDeck(delDeck)}
    body={delDeck && `"${delDeck.title}" and its ${cards.filter(c => c.deckId === delDeck.id).length} cards will be permanently deleted.`} />

  if (deck) return <><DeckView deck={deck} cards={cards.filter(c => c.deckId === deck.id)} onBack={() => setDeckId(null)} onStudy={(c, l) => setSession({ cards: c, title: `${deck.title} · ${l}` })} onEdit={() => setDeckDlg(deck)} onDelete={() => setDelDeck(deck)} />
    <DeckDialog deck={deckDlg} onClose={() => setDeckDlg(null)} />{confirm}</>

  return (
    <div className="anim-rise space-y-5">
      <PageHeader title="Flashcards" sub="Short questions, spaced out so you remember them." action={<Button variant="primary" onClick={() => setDeckDlg('new')}><Plus size={18} />New deck</Button>} />
      {decks.length === 0 ? (
        <EmptyState icon={<Layers />} title="No decks yet" body="A deck is a set of flashcards for one topic. Create one, then add cards by hand, from your notes, or with AI." action={<Button variant="primary" onClick={() => setDeckDlg('new')}><Plus size={18} />Create your first deck</Button>} />
      ) : <>
        {cards.length > 0 && <Launcher cards={cards} onStart={(c, l) => setSession({ cards: c, title: `All decks · ${l}` })} />}
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {decks.map(d => <DeckTile key={d.id} deck={d} cards={cards.filter(c => c.deckId === d.id)} onOpen={() => setDeckId(d.id)} onEdit={() => setDeckDlg(d)} onDelete={() => setDelDeck(d)} />)}
        </ul>
      </>}
      <DeckDialog deck={deckDlg} onClose={() => setDeckDlg(null)} />{confirm}
    </div>
  )
}

function DeckTile({ deck, cards, onOpen, onEdit, onDelete }: { deck: Deck; cards: Flashcard[]; onOpen: () => void; onEdit: () => void; onDelete: () => void }) {
  const subject = useCollection<Subject>('subjects').find(s => s.id === deck.subjectId)
  const due = cards.filter(c => isDue(c, new Date())).length
  return (
    <li><Card className="flex h-full flex-col gap-3 border-l-4" style={{ borderLeftColor: deck.color }}>
      <button onClick={onOpen} className="min-h-11 flex-1 text-left"><h3 className="font-display text-xl font-semibold">{deck.title}</h3>
        <p className="mt-1 text-sm text-muted tnum">{cards.length} card{cards.length === 1 ? '' : 's'}{subject && ` · ${subject.name}`}</p></button>
      <div className="flex items-center justify-between gap-2">
        {due > 0 ? <Chip className="text-brand">{due} due</Chip> : <Chip>{cards.length ? 'All caught up' : 'Empty'}</Chip>}
        <div className="flex"><Button variant="ghost" size="sm" aria-label={`Edit ${deck.title}`} onClick={onEdit}><Pencil size={16} /></Button><Button variant="ghost" size="sm" aria-label={`Delete ${deck.title}`} onClick={onDelete}><Trash2 size={16} /></Button></div>
      </div>
    </Card></li>
  )
}

function DeckView({ deck, cards, onBack, onStudy, onEdit, onDelete }: { deck: Deck; cards: Flashcard[]; onBack: () => void; onStudy: (c: Flashcard[], l: string) => void; onEdit: () => void; onDelete: () => void }) {
  const toast = useToast()
  const [q, setQ] = useState(''); const dq = useDebounced(q, 200).trim().toLowerCase()
  const [favOnly, setFav] = useState(false)
  const [edit, setEdit] = useState<Flashcard | 'new' | null>(null)
  const [del, setDel] = useState<Flashcard | null>(null)
  const [notesDlg, setNotesDlg] = useState(false); const [ai, setAi] = useState(false)
  const shown = cards.filter(c => (!favOnly || c.favorite) && (!dq || (c.front + ' ' + c.back).toLowerCase().includes(dq)))
  const now = new Date()
  return (
    <div className="anim-rise space-y-5">
      <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft size={16} />All decks</Button>
      <PageHeader title={deck.title} sub={deck.description ?? `${cards.length} card${cards.length === 1 ? '' : 's'}`} action={<div className="flex gap-1"><Button variant="ghost" aria-label="Edit deck" onClick={onEdit}><Pencil size={18} /></Button><Button variant="ghost" aria-label="Delete deck" onClick={onDelete}><Trash2 size={18} /></Button></div>} />
      {cards.length > 0 && <Launcher cards={cards} onStart={onStudy} />}
      <div className="flex flex-wrap gap-2">
        <Button variant="primary" onClick={() => setEdit('new')}><Plus size={18} />Add card</Button>
        <Button onClick={() => setNotesDlg(true)}><FileText size={16} />From notes</Button>
        <Button onClick={() => setAi(true)}><Sparkles size={16} />With AI</Button>
      </div>
      {cards.length === 0 ? (
        <EmptyState icon={<BookOpenText />} title="This deck is empty" body="Add your first card by hand, or generate drafts from a note and review them before saving." action={<Button variant="primary" onClick={() => setEdit('new')}><Plus size={18} />Add a card</Button>} />
      ) : <>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-48 flex-1"><Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" /><Input aria-label="Search cards" className="pl-9" placeholder="Search cards" value={q} onChange={e => setQ(e.target.value)} /></div>
          <Button aria-pressed={favOnly} variant={favOnly ? 'primary' : 'soft'} onClick={() => setFav(f => !f)}><Star size={16} />Starred</Button>
        </div>
        {shown.length === 0 ? <p className="py-6 text-center text-muted">No cards match.</p> : (
          <ul className="space-y-2">{shown.map(c => (
            <li key={c.id} className="flex items-start gap-1 rounded-card border hairline bg-surface p-3">
              <div className="min-w-0 flex-1 space-y-1"><p className="whitespace-pre-wrap font-bold [overflow-wrap:anywhere]">{c.front}</p><p className="whitespace-pre-wrap text-[15px] text-muted [overflow-wrap:anywhere]">{c.back}</p>
                <div className="flex flex-wrap gap-1.5 pt-1">{c.source === 'ai' && <Chip>AI-generated</Chip>}<Chip className={isDue(c, now) ? 'text-brand' : ''}>{isDue(c, now) ? 'Due' : `Due ${new Date(c.dueAt!).toLocaleDateString()}`}</Chip></div></div>
              <Button variant="ghost" size="sm" className="!min-h-11 !min-w-11" aria-pressed={c.favorite} aria-label={c.favorite ? 'Remove star' : 'Star card'} onClick={() => put('cards', { id: c.id, favorite: !c.favorite })}><Star size={18} className={cx(c.favorite && 'fill-current text-warn')} /></Button>
              <Button variant="ghost" size="sm" className="!min-h-11 !min-w-11" aria-label="Edit card" onClick={() => setEdit(c)}><Pencil size={16} /></Button>
              <Button variant="ghost" size="sm" className="!min-h-11 !min-w-11" aria-label="Delete card" onClick={() => setDel(c)}><Trash2 size={16} /></Button>
            </li>))}</ul>
        )}
      </>}
      <CardDialog deckId={deck.id} card={edit && edit !== 'new' ? edit : undefined} open={!!edit} onClose={() => setEdit(null)} />
      <FromNotesDialog deckId={deck.id} open={notesDlg} onClose={() => setNotesDlg(false)} />
      <AiPanel open={ai} onClose={() => setAi(false)} actions={['cards']} deckId={deck.id} subjectId={deck.subjectId} />
      <ConfirmDialog open={!!del} onClose={() => setDel(null)} danger confirmLabel="Delete card" title="Delete this card?" body="This card and its schedule will be removed." onConfirm={async () => { try { await remove('cards', del!.id); toast('Card deleted.') } catch { toast('Could not delete the card.', 'err') } }} />
    </div>
  )
}
