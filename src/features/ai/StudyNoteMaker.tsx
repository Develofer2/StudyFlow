import { useEffect, useRef, useState } from 'react'
import { FileUp, KeyRound, Layers, ListChecks, Loader2, Sparkles, X } from 'lucide-react'
import { Button, Dialog, Field, Input, Select, Textarea, useToast } from '@/components/ui'
import { put, setPrefs, useCollection, usePrefs } from '@/data/store'
import { go } from '@/app/router'
import { AiError, MAX_FILE_BYTES, MAX_TEXT_CHARS, aiStudyNote, aiUsageToday, fileToPart, noteToMarkdown, type AiPart, type NoteDetail, type NoteLength, type NotePurpose, type StudyNoteData } from '@/services/ai/gemini'
import { checkCapability } from '@/services/ai/profiles'
import { useAiReady } from './useAiReady'
import type { StudyNote, Subject } from '@/types'
import AiPanel from './AiPanel'
import { aiErrorText } from './util'

const PURPOSES: { value: NotePurpose; label: string }[] = [
  { value: 'learn', label: 'Learn something new' }, { value: 'revise', label: 'Revise for an exam' },
  { value: 'summarise', label: 'Summarise a reading' }, { value: 'homework', label: 'Homework help' },
]
const LANGS = ['English', 'Spanish', 'French', 'German', 'Portuguese', 'Italian', 'Arabic', 'Hindi', 'Chinese', 'Japanese', 'Korean', 'Filipino', 'Indonesian', 'Turkish']
interface Src { name: string; part: AiPart }

export default function StudyNoteMaker({ open, onClose, onSaved, defaultSubjectId }: { open: boolean; onClose: () => void; onSaved?: (id: string) => void; defaultSubjectId?: string }) {
  return <Dialog open={open} onClose={onClose} title="Make a note with AI" wide>{open && <Body onClose={onClose} onSaved={onSaved} defaultSubjectId={defaultSubjectId} />}</Dialog>
}

function Body({ onClose, onSaved, defaultSubjectId }: { onClose: () => void; onSaved?: (id: string) => void; defaultSubjectId?: string }) {
  const toast = useToast()
  const consented = usePrefs().ai.consented
  const { ready, loading, label, active } = useAiReady('summary')
  const subjects = useCollection<Subject>('subjects').filter(s => !s.archivedAt)

  const [title, setTitle] = useState(''), [subjectId, setSubjectId] = useState(defaultSubjectId ?? '')
  const [purpose, setPurpose] = useState<NotePurpose>('learn'), [detail, setDetail] = useState<NoteDetail>('standard'), [length, setLength] = useState<NoteLength>('medium')
  const [language, setLanguage] = useState('English'), [extra, setExtra] = useState('')
  const [folder, setFolder] = useState(''), [tags, setTags] = useState('')
  const [text, setText] = useState(''), [files, setFiles] = useState<Src[]>([])
  const [busy, setBusy] = useState(false), [error, setError] = useState('')
  const [note, setNote] = useState<StudyNoteData | null>(null), [md, setMd] = useState('')
  const [saved, setSaved] = useState<StudyNote | null>(null), [follow, setFollow] = useState<'cards' | 'quiz' | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  if (loading) return <p className="py-6 text-center text-muted">Checking AI settings…</p>
  if (!ready) return (
    <div className="space-y-3 rounded-card bg-surface2 p-5 text-center">
      <KeyRound className="mx-auto text-brand" />
      <h3 className="font-display text-xl font-semibold">AI is optional and switched off</h3>
      <p className="text-[15px] text-muted">Add a provider and key (Gemini, OpenAI, Claude or another) in Settings to turn photos, PDFs and pasted text into study notes.</p>
      <Button variant="primary" onClick={() => { onClose(); go('settings', { tab: 'ai' }) }}>Open AI settings</Button>
    </div>
  )
  if (!consented) return (
    <div className="space-y-4">
      <ul className="list-disc space-y-2 pl-5 text-[15px] text-muted">
        <li>When you press <b className="text-ink">Write my note</b>, only the text, photos or PDF you add here are sent to {label} with your own key.</li>
        <li>Nothing is sent automatically. Your other notes and settings are never included.</li>
        <li>Your provider decides how it stores or uses what you send, and what it bills. Avoid private details.</li>
        <li>You preview and edit the note before it is saved. AI can be wrong, so check it.</li>
      </ul>
      <div className="flex flex-wrap justify-end gap-2"><Button onClick={onClose}>Not now</Button><Button variant="primary" onClick={() => setPrefs(s => ({ ...s, ai: { ...s.ai, consented: true } }))}>I understand, continue</Button></div>
    </div>
  )

  const pick = async (list: FileList | null) => {
    if (!list) return
    setError('')
    for (const f of [...list]) {
      try {
        if (f.type.startsWith('text/') || /\.(txt|md)$/i.test(f.name)) {
          if (f.size > MAX_FILE_BYTES) throw new AiError('limit', 'That file is over 10 MB. Paste the part you need instead.')
          const t = await f.text(); setText(s => (s ? s + '\n\n' : '') + t)
        } else {
          if (files.length >= 4) throw new AiError('limit', 'Up to 4 photos or PDFs at a time keeps the request small.')
          const prob = await checkCapability(f.type === 'application/pdf' ? 'pdf' : 'vision', 'summary'); if (prob) throw new AiError('limit', prob)
          const part = await fileToPart(f); setFiles(s => [...s, { name: f.name, part }])
        }
      } catch (e) { setError(aiErrorText(e)); break }
    }
  }
  const generate = async () => {
    setBusy(true); setError('')
    try {
      const subj = subjects.find(s => s.id === subjectId)?.name
      const r = await aiStudyNote({ title: title.trim() || undefined, subject: subj, purpose, detail, length, language, extra: extra.trim() || undefined, text: text.trim() || undefined, parts: files.length ? files.map(f => f.part) : undefined })
      setNote(r.data); setMd(noteToMarkdown(r.data, title.trim() || undefined))
    } catch (e) { setError(aiErrorText(e)) } finally { setBusy(false) }
  }
  const save = async () => {
    try {
      const h = md.match(/^#\s+(.+)$/m)?.[1]?.trim()
      const t = [...new Set(['ai', ...tags.split(',').map(x => x.trim().replace(/^#/, '')).filter(Boolean)])]
      const n = await put('notes', { title: title.trim() || h || note?.title || 'AI note', content: md, subjectId: subjectId || undefined, folder: folder.trim() || undefined, tags: t, favorite: false }) as StudyNote
      setSaved(n); onSaved?.(n.id); toast('Note saved.')
    } catch { toast('Could not save the note.', 'err') }
  }

  if (saved) return (
    <div className="space-y-4">
      <p className="text-[15px]">Saved <b>{saved.title}</b> to your notes. Want to practise it?</p>
      <div className="flex flex-wrap gap-2"><Button onClick={() => setFollow('cards')}><Layers size={16} />Make flashcards</Button><Button onClick={() => setFollow('quiz')}><ListChecks size={16} />Make a quiz</Button></div>
      <div className="flex justify-end"><Button variant="primary" onClick={onClose}>Done</Button></div>
      {follow && <AiPanel open onClose={() => setFollow(null)} actions={[follow]} initialText={saved.content} subjectId={saved.subjectId} defaultTitle={saved.title} />}
    </div>
  )

  if (note) return (
    <div className="space-y-4">
      <p className="text-sm text-muted">Preview. Edit anything before saving; it is plain text (markdown). Nothing is saved until you press Save.</p>
      <Textarea aria-label="Note text" rows={16} value={md} onChange={e => setMd(e.target.value)} className="font-mono text-sm" />
      <div className="flex flex-wrap justify-end gap-2"><Button onClick={() => setNote(null)}>Back to form</Button><Button variant="primary" disabled={!md.trim()} onClick={save}>Save note</Button></div>
    </div>
  )

  const over = text.length > MAX_TEXT_CHARS
  const empty = !text.trim() && !files.length
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Note title" hint="Optional. The AI suggests one if blank.">{id => <Input id={id} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Photosynthesis" />}</Field>
        <Field label="Subject">{id => <Select id={id} value={subjectId} onChange={e => setSubjectId(e.target.value)}><option value="">No subject</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</Select>}</Field>
        <Field label="Purpose">{id => <Select id={id} value={purpose} onChange={e => setPurpose(e.target.value as NotePurpose)}>{PURPOSES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}</Select>}</Field>
        <Field label="Language">{id => <Select id={id} value={language} onChange={e => setLanguage(e.target.value)}>{LANGS.map(l => <option key={l}>{l}</option>)}</Select>}</Field>
        <Field label="Detail level">{id => <Select id={id} value={detail} onChange={e => setDetail(e.target.value as NoteDetail)}><option value="brief">Brief</option><option value="standard">Standard</option><option value="deep">Deep</option></Select>}</Field>
        <Field label="Length">{id => <Select id={id} value={length} onChange={e => setLength(e.target.value as NoteLength)}><option value="short">Short</option><option value="medium">Medium</option><option value="long">Long</option></Select>}</Field>
      </div>
      <Field label="Anything else the AI should know?" hint="For example: focus on formulas, or explain like I am 12.">{id => <Textarea id={id} rows={2} value={extra} onChange={e => setExtra(e.target.value)} maxLength={600} />}</Field>
      <Field label="Your material" hint="Paste text, or add photos, a PDF or a text file below. This is exactly what gets sent.">{(id, d) => <Textarea id={id} aria-describedby={d} rows={6} value={text} onChange={e => setText(e.target.value)} placeholder="Paste notes or textbook text here…" />}</Field>
      <p className={over ? 'text-sm font-bold text-warn' : 'tnum text-sm text-muted'}>{text.length.toLocaleString()} / {MAX_TEXT_CHARS.toLocaleString()} characters{over && ' — only the first part will be sent.'}</p>
      <div className="space-y-2">
        <input ref={fileRef} type="file" hidden multiple accept="image/*,application/pdf,.txt,.md,text/plain,text/markdown" onChange={e => { void pick(e.target.files); e.target.value = '' }} />
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={() => fileRef.current?.click()}><FileUp size={16} />Add photos, PDF or text file</Button>
          {files.map((f, i) => <span key={i} className="inline-flex max-w-full items-center gap-1 rounded-full border hairline bg-surface2 py-0.5 pl-3 pr-1 text-sm font-semibold"><span className="truncate">{f.name}</span><button aria-label={`Remove ${f.name}`} className="grid h-8 w-8 place-items-center rounded-full hover:bg-surface" onClick={() => setFiles(s => s.filter((_, j) => j !== i))}><X size={14} /></button></span>)}
        </div>
        {active && !active.profile.capabilities.pdf && <p className="text-sm text-muted">{label} is not set up to read PDFs. Paste the text or add photos of the pages.</p>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Folder (optional)">{id => <Input id={id} value={folder} onChange={e => setFolder(e.target.value)} />}</Field>
        <Field label="Tags (optional)" hint="Comma separated. 'ai' is added for you.">{id => <Input id={id} value={tags} onChange={e => setTags(e.target.value)} />}</Field>
      </div>
      {error && <p role="alert" className="rounded-card border hairline bg-surface2 p-3 text-[15px] font-semibold text-bad">{error}</p>}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="tnum text-sm text-muted">AI used {aiUsageToday()} time{aiUsageToday() === 1 ? '' : 's'} today on this device</span>
        <Button variant="primary" disabled={busy || empty} onClick={generate}>{busy ? <><Loader2 size={18} className="animate-spin" />Writing…</> : <><Sparkles size={18} />Write my note</>}</Button>
      </div>
    </div>
  )
}
