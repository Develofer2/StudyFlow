import { useEffect, useRef, useState, type ReactNode } from 'react'
import { KeyRound, Loader2, RotateCcw, ShieldCheck, Sparkles, Trash2, WifiOff, X, Copy } from 'lucide-react'
import { go } from '@/app/router'
import { Button, Card, Chip, Textarea, useToast } from '@/components/ui'
import { put, setPrefs } from '@/data/store'
import type { AiFeature } from '@/types'
import { AiError } from '@/services/ai/client'
import { aiErrorText } from '@/features/ai/util'
import { useAiReady } from '@/features/ai/useAiReady'

export const useOnline = () => {
  const [on, setOn] = useState(typeof navigator === 'undefined' || navigator.onLine)
  useEffect(() => { const a = () => setOn(true), b = () => setOn(false); addEventListener('online', a); addEventListener('offline', b); return () => { removeEventListener('online', a); removeEventListener('offline', b) } }, [])
  return on
}

/** Shared flow for every Coach tool: input -> exact preview -> consent -> loading (cancel) -> error (retry) -> labelled draft. Nothing is saved here. */
export default function ToolFrame<R>({ feature, payload, inputsOk = true, run, sendLabel, renderResult, local, children, extraNote }: {
  feature: AiFeature; payload: string; inputsOk?: boolean; run: (signal: AbortSignal) => Promise<R>; sendLabel: string
  renderResult: (r: R) => ReactNode; local?: ReactNode; children: ReactNode; extraNote?: string
}) {
  const { loading, ready, ai, label, active } = useAiReady(feature)
  const online = useOnline()
  const [phase, setPhase] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [res, setRes] = useState<R | null>(null), [err, setErr] = useState('')
  const ctl = useRef<AbortController | null>(null)
  useEffect(() => () => ctl.current?.abort(), [])
  const go1 = async () => {
    ctl.current?.abort(); const c = (ctl.current = new AbortController())
    setPhase('loading'); setErr('')
    try { const r = await run(c.signal); if (c.signal.aborted) return; setRes(r); setPhase('done') }
    catch (e) { if (e instanceof AiError && e.kind === 'cancel') { setPhase('idle'); return } setErr(aiErrorText(e)); setPhase('error') }
  }
  const cancel = () => ctl.current?.abort()
  const discard = () => { setRes(null); setPhase('idle') }
  const canSend = inputsOk && payload.trim().length > 0

  return <div className="space-y-4">
    {children}
    {phase === 'done' && res !== null
      ? <div className="space-y-3 rounded-card border-2 border-dashed border-brand/50 bg-surface2 p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2"><Chip className="text-brand"><Sparkles size={12} aria-hidden />AI-generated draft</Chip>
          <Button size="sm" onClick={discard}><Trash2 size={16} />Discard</Button></div>
        <p className="text-sm text-muted">Not saved yet and separate from your own notes. Check it against your source and edit it before using it.</p>
        {renderResult(res)}
      </div>
      : <Card className="space-y-3 bg-surface2">
        <h3 className="flex items-center gap-2 font-bold"><Sparkles size={16} className="text-brand" aria-hidden />With AI (optional)</h3>
        {loading ? <p className="text-sm text-muted">Checking AI settings…</p>
          : !ready ? <div className="space-y-2"><p className="flex gap-2 text-[15px]"><KeyRound size={18} className="mt-0.5 shrink-0 text-brand" aria-hidden /><span><b>No AI provider is set up.</b> You can still use the local option below.</span></p>
            <Button size="sm" onClick={() => go('settings', { tab: 'ai' })}>Open AI settings</Button></div>
          : <div className="space-y-3">
            {!online && <p role="status" className="flex gap-2 text-[15px] font-semibold text-warn"><WifiOff size={18} className="mt-0.5 shrink-0" aria-hidden />AI needs an internet connection. Local options still work offline.</p>}
            <details open className="rounded-lg border hairline bg-surface p-3"><summary className="min-h-9 cursor-pointer text-sm font-bold">What will be sent to {label}{active ? ` (${active.model})` : ''}</summary>
              {canSend ? <pre className="mt-2 max-h-48 overflow-y-auto whitespace-pre-wrap break-words font-sans text-sm" tabIndex={0} aria-label="Exact text that will be sent">{payload}</pre> : <p className="mt-2 text-sm text-muted">Nothing yet. Add your input above first.</p>}
              <p className="mt-2 text-xs text-muted">Plus a short fixed instruction. {extraNote ?? 'Nothing else from your notes, tasks or history is included.'}</p></details>
            {!ai.consented
              ? <div className="space-y-2"><p className="flex gap-2 text-sm"><ShieldCheck size={18} className="mt-0.5 shrink-0 text-brand" aria-hidden /><span>Only the text shown above is sent to <b>{label}</b> using your own API key, and only when you press the button. Your provider decides how it stores or uses it and what it bills. AI can be wrong.</span></p>
                <Button variant="primary" onClick={() => setPrefs(s => ({ ...s, ai: { ...s.ai, consented: true } }))}>I understand, continue</Button></div>
              : phase === 'loading'
                ? <div className="flex flex-wrap items-center gap-3" role="status"><Loader2 size={20} className="animate-spin text-brand" aria-hidden /><span className="text-[15px]">Waiting for {label}…</span><Button size="sm" onClick={cancel}><X size={16} />Cancel</Button></div>
                : <div className="space-y-2">
                  {phase === 'error' && <div role="alert" className="flex flex-wrap items-center justify-between gap-2 rounded-lg border hairline bg-surface p-3"><p className="min-w-0 flex-1 basis-56 text-[15px] font-semibold text-bad">{err}</p><Button size="sm" disabled={!online} onClick={go1}><RotateCcw size={16} />Retry</Button></div>}
                  <Button variant="primary" disabled={!canSend || !online} onClick={go1}><Sparkles size={18} />{sendLabel}</Button></div>}
          </div>}
      </Card>}
    {local && <Card className="space-y-3"><h3 className="font-bold">Without AI</h3>{local}</Card>}
  </div>
}

/** Editable AI text draft with copy and an explicit "save as a new note". Never edits existing notes. */
export function TextDraft({ initial, noteTitle }: { initial: string; noteTitle?: string }) {
  const toast = useToast()
  const [t, setT] = useState(initial), [saved, setSaved] = useState(false)
  return <div className="space-y-3">
    <Textarea aria-label="AI draft text (editable)" rows={Math.min(14, Math.max(5, t.split('\n').length + 2))} value={t} onChange={e => { setT(e.target.value); setSaved(false) }} />
    <div className="flex flex-wrap justify-end gap-2">
      <Button size="sm" onClick={async () => { try { await navigator.clipboard.writeText(t); toast('Copied.') } catch { toast('Could not copy.', 'err') } }}><Copy size={16} />Copy</Button>
      {noteTitle && <Button size="sm" variant="primary" disabled={!t.trim() || saved} onClick={async () => { try { await put('notes', { title: noteTitle, content: t, tags: ['ai'], favorite: false }); setSaved(true); toast('Saved as a new note.') } catch { toast('Could not save the note.', 'err') } }}>{saved ? 'Saved' : 'Save as new note'}</Button>}
    </div></div>
}
export const LocalLink = ({ to, children, params }: { to: string; children: ReactNode; params?: Record<string, string> }) => <Button size="sm" onClick={() => go(to, params)}>{children}</Button>
