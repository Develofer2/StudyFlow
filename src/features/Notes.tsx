import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Check, FileText, Layers, Loader2, NotebookPen, Plus, Search, Sparkles, Star, Trash2, TriangleAlert } from 'lucide-react'
import { Button, Card, Chip, ConfirmDialog, Dialog, EmptyState, Field, Input, PageHeader, Segmented, Select, Textarea, cx, useDebounced, useToast } from '@/components/ui'
import { put, remove, useCollection } from '@/data/store'
import { generateCards } from '@/domain/cardgen'
import type { StudyNote, Subject } from '@/types'
import AiPanel from './ai/AiPanel'
import StudyNoteMaker from './ai/StudyNoteMaker'
import DraftReview from './ai/DraftReview'
import { renderMarkdown } from './notes/markdown'

interface Draft { title: string; content: string; folder: string; tags: string; subjectId: string; favorite: boolean }
const toDraft = (n: StudyNote): Draft => ({ title: n.title, content: n.content, folder: n.folder ?? '', tags: n.tags.join(', '), subjectId: n.subjectId ?? '', favorite: n.favorite })
const toRecord = (id: string, d: Draft) => ({ id, title: d.title.trim(), content: d.content, folder: d.folder.trim() || undefined, tags: [...new Set(d.tags.split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean))], subjectId: d.subjectId || undefined, favorite: d.favorite })

export default function Notes() {
  const toast = useToast()
  const notes = useCollection<StudyNote>('notes').filter(n => !n.archivedAt)
  const subjects = useCollection<Subject>('subjects')
  const [sel, setSel] = useState<string | null>(null)
  const [q, setQ] = useState(''); const dq = useDebounced(q, 250).trim().toLowerCase()
  const [folder, setFolder] = useState('*'); const [tag, setTag] = useState(''); const [fav, setFav] = useState(false)
  const folders = useMemo(() => [...new Set(notes.map(n => n.folder).filter(Boolean) as string[])].sort(), [notes])
  const tags = useMemo(() => [...new Set(notes.flatMap(n => n.tags))].sort(), [notes])
  const shown = notes.filter(n => (folder === '*' || (folder === '' ? !n.folder : n.folder === folder)) && (!tag || n.tags.includes(tag)) && (!fav || n.favorite)
    && (!dq || `${n.title} ${n.content} ${n.tags.join(' ')}`.toLowerCase().includes(dq))).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  const current = notes.find(n => n.id === sel)
  const create = async () => {
    try { const n = await put('notes', { title: '', content: '', tags: [], favorite: false, folder: folder !== '*' && folder ? folder : undefined }); setSel(n.id) }
    catch { toast('Could not create the note.', 'err') }
  }
  const [maker, setMaker] = useState(false)
  const newBtn = <div className="flex flex-wrap gap-2"><Button onClick={() => setMaker(true)}><Sparkles size={18} />Make with AI</Button><Button variant="primary" onClick={create}><Plus size={18} />New note</Button></div>
  return (
    <div className="anim-rise">
      <PageHeader title="Notes" sub="Write it down once, then turn it into cards and quizzes." action={newBtn} />
      <StudyNoteMaker open={maker} onClose={() => setMaker(false)} onSaved={setSel} />
      {notes.length === 0 ? <EmptyState icon={<NotebookPen />} title="No notes yet" body="Start with a blank note. Later you can make flashcards from it, or summarise it with AI." action={newBtn} /> : (
        <div className="grid gap-4 lg:grid-cols-[21rem_minmax(0,1fr)]">
          <div className={cx('space-y-3', current && 'hidden lg:block')}>
            <div className="relative"><Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" /><Input aria-label="Search notes" className="pl-9" placeholder="Search notes" value={q} onChange={e => setQ(e.target.value)} /></div>
            <details className="rounded-card border hairline px-3"><summary className="min-h-11 cursor-pointer py-2.5 text-sm font-bold">Filters{(folder !== '*' || tag || fav) && ' (active)'}</summary>
              <div className="space-y-3 pb-3">
                <Field label="Folder">{id => <Select id={id} value={folder} onChange={e => setFolder(e.target.value)}><option value="*">All folders</option><option value="">No folder</option>{folders.map(f => <option key={f}>{f}</option>)}</Select>}</Field>
                {tags.length > 0 && <Field label="Tag">{id => <Select id={id} value={tag} onChange={e => setTag(e.target.value)}><option value="">Any tag</option>{tags.map(t => <option key={t}>{t}</option>)}</Select>}</Field>}
                <Button size="sm" aria-pressed={fav} variant={fav ? 'primary' : 'soft'} onClick={() => setFav(f => !f)}><Star size={14} />Favourites only</Button>
              </div></details>
            {shown.length === 0 ? <p className="py-6 text-center text-muted">No notes match.</p> : (
              <ul className="space-y-2">{shown.map(n => (
                <li key={n.id}><button onClick={() => setSel(n.id)} aria-current={n.id === sel} className={cx('block min-h-11 w-full rounded-card border p-3 text-left transition', n.id === sel ? 'border-brand bg-surface' : 'hairline bg-surface hover:bg-surface2')}>
                  <span className="flex items-center gap-1.5 font-bold [overflow-wrap:anywhere]">{n.favorite && <Star size={14} className="shrink-0 fill-current text-warn" aria-label="Favourite" />}{n.title || 'Untitled note'}</span>
                  <span className="mt-0.5 line-clamp-2 text-sm text-muted">{n.content.replace(/[#*`>\-\[\]]/g, '').trim() || 'Empty note'}</span>
                  <span className="mt-1.5 flex flex-wrap gap-1">{n.folder && <Chip><FileText size={10} />{n.folder}</Chip>}{subjects.find(s => s.id === n.subjectId) && <Chip>{subjects.find(s => s.id === n.subjectId)!.name}</Chip>}{n.tags.slice(0, 3).map(t => <Chip key={t}>#{t}</Chip>)}</span></button></li>))}</ul>
            )}
          </div>
          <div className={cx('min-w-0', !current && 'hidden lg:block')}>
            {current ? <Editor key={current.id} note={current} subjects={subjects.filter(s => !s.archivedAt || s.id === current.subjectId)} folders={folders} onBack={() => setSel(null)} />
              : <Card className="grid min-h-64 place-items-center text-center text-muted">Pick a note on the left, or start a new one.</Card>}
          </div>
        </div>
      )}
    </div>
  )
}

function Editor({ note, subjects, folders, onBack }: { note: StudyNote; subjects: Subject[]; folders: string[]; onBack: () => void }) {
  const toast = useToast()
  const [d, setD] = useState(() => toDraft(note))
  const [status, setStatus] = useState<'saved' | 'dirty' | 'saving' | 'error'>('saved')
  const [preview, setPreview] = useState(false)
  const [del, setDel] = useState(false); const [cards, setCards] = useState(false); const [ai, setAi] = useState(false)
  const dirty = useRef(false); const latest = useRef(d); latest.current = d
  const dd = useDebounced(d, 600)
  const upd = (p: Partial<Draft>) => { dirty.current = true; setStatus('dirty'); setD(x => ({ ...x, ...p })) }

  useEffect(() => {
    if (!dirty.current) return
    setStatus('saving')
    put('notes', toRecord(note.id, dd)).then(() => { if (latest.current === dd) { dirty.current = false; setStatus('saved') } }).catch(() => setStatus('error'))
  }, [dd, note.id])
  useEffect(() => () => { if (dirty.current) put('notes', toRecord(note.id, latest.current)) }, [note.id])

  const drafts = useMemo(() => (cards ? generateCards(d.content) : []), [cards]) // eslint-disable-line react-hooks/exhaustive-deps
  const doDelete = async () => { dirty.current = false; try { await remove('notes', note.id); toast('Note deleted.'); onBack() } catch { toast('Could not delete the note.', 'err') } }
  const st = { saved: [<Check size={14} />, 'Saved'], saving: [<Loader2 size={14} className="animate-spin" />, 'Saving…'], dirty: [<Loader2 size={14} />, 'Unsaved changes'], error: [<TriangleAlert size={14} />, 'Could not save — keep this page open and edit again to retry'] }[status]

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="ghost" size="sm" className="lg:hidden" onClick={onBack}><ArrowLeft size={16} />All notes</Button>
        <span aria-live="polite" className={cx('inline-flex items-center gap-1 text-sm font-semibold', status === 'error' ? 'text-bad' : 'text-muted')}>{st[0]}{st[1]}</span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="!min-h-11 !min-w-11" aria-pressed={d.favorite} aria-label={d.favorite ? 'Remove from favourites' : 'Add to favourites'} onClick={() => upd({ favorite: !d.favorite })}><Star size={18} className={cx(d.favorite && 'fill-current text-warn')} /></Button>
          <Button variant="ghost" size="sm" className="!min-h-11 !min-w-11" aria-label="Delete note" onClick={() => setDel(true)}><Trash2 size={18} /></Button>
        </div>
      </div>
      <input aria-label="Note title" className="w-full min-h-12 bg-transparent font-display text-2xl font-semibold placeholder:text-muted/60 focus-visible:outline-offset-4" placeholder="Untitled note" value={d.title} onChange={e => upd({ title: e.target.value })} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Segmented label="Edit or preview" value={preview ? 'preview' : 'edit'} onChange={v => setPreview(v === 'preview')} options={[{ value: 'edit', label: 'Edit' }, { value: 'preview', label: 'Preview' }]} />
        <div className="flex flex-wrap gap-2"><Button size="sm" onClick={() => setCards(true)} disabled={!d.content.trim()}><Layers size={14} />Make flashcards</Button><Button size="sm" onClick={() => setAi(true)}><Sparkles size={14} />AI actions</Button></div>
      </div>
      {preview ? <div className="md min-h-64 [overflow-wrap:anywhere]">{d.content.trim() ? renderMarkdown(d.content) : <p className="text-muted">Nothing to preview yet.</p>}</div>
        : <Textarea aria-label="Note content" className="min-h-64 font-mono text-sm leading-relaxed lg:min-h-96" placeholder={'Write here. Markdown works: # heading, **bold**, *italic*, - list, `code`, [link](https://…)'} value={d.content} onChange={e => upd({ content: e.target.value })} />}
      <details className="rounded-card border hairline px-3"><summary className="min-h-11 cursor-pointer py-2.5 text-sm font-bold">Organise: folder, tags, subject</summary>
        <div className="grid gap-3 pb-3 sm:grid-cols-3">
          <Field label="Folder">{id => <><Input id={id} list="note-folders" value={d.folder} onChange={e => upd({ folder: e.target.value })} placeholder="e.g. Biology" /><datalist id="note-folders">{folders.map(f => <option key={f} value={f} />)}</datalist></>}</Field>
          <Field label="Tags" hint="Separate with commas.">{(id, a) => <Input id={id} aria-describedby={a} value={d.tags} onChange={e => upd({ tags: e.target.value })} />}</Field>
          <Field label="Subject">{id => <Select id={id} value={d.subjectId} onChange={e => upd({ subjectId: e.target.value })}><option value="">No subject</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</Select>}</Field>
        </div></details>
      <Dialog open={cards} onClose={() => setCards(false)} title="Flashcards from this note" wide>{cards && <DraftReview drafts={drafts} source="rules" defaultDeckTitle={d.title.trim() || 'Note cards'} subjectId={d.subjectId || undefined} onCancel={() => setCards(false)} onDone={() => setCards(false)}
        emptyHint={'No cards found. This simple tool only spots lines like "Term: definition", "X is defined as…", "X consists of…", "The purpose of X is…" and "X is a …". Reword your note in those shapes, add cards by hand in Flashcards, or try the AI helper.'} />}</Dialog>
      <AiPanel open={ai} onClose={() => setAi(false)} actions={['summary', 'cards', 'quiz', 'explain']} initialText={`${d.title}\n\n${d.content}`.trim()} subjectId={d.subjectId || undefined} defaultTitle={d.title.trim() || undefined}
        onInsert={md => upd({ content: `${d.content.trimEnd()}\n\n${md}\n` })} insertLabel="Add to this note" />
      <ConfirmDialog open={del} onClose={() => setDel(false)} danger confirmLabel="Delete note" title="Delete this note?" body="This note will be permanently deleted. Flashcards and quizzes made from it are kept." onConfirm={doDelete} />
    </Card>
  )
}
