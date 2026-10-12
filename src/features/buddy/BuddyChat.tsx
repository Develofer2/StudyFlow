import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Send, Trash2 } from 'lucide-react'
import { Button, Card, Chip, Input, cx } from '@/components/ui'
import { aiAvailable, aiChat, type ChatMsg } from '@/services/ai/hub'
import { STATE_LABEL, type BuddyState } from '@/domain/buddyState'

type Line = { from: 'you' | 'ai' | 'builtin'; text: string }
const onl = (l: () => void) => { addEventListener('online', l); addEventListener('offline', l); return () => { removeEventListener('online', l); removeEventListener('offline', l) } }
const SYSTEM = (name: string, ctx: string) => `You are ${name}, a friendly study buddy inside a study app. Keep replies short (under 90 words), warm and practical. Help with study encouragement, explaining concepts simply, and planning the next study session. Never give medical, mental-health or therapy advice; if someone seems unwell or very stressed, suggest rest and talking to a trusted person. Do not pressure the student to keep studying when tired. ${ctx}`

export default function BuddyChat({ name, state, minutesToday, greeting }: { name: string; state: BuddyState; minutesToday: number; greeting: string }) {
  const [ok, setOk] = useState<boolean | null>(null); const online = useSyncExternalStore(onl, () => navigator.onLine, () => true)
  const [lines, setLines] = useState<Line[]>([{ from: 'builtin', text: greeting }]); const [text, setText] = useState(''); const [busy, setBusy] = useState(false)
  const token = useRef(0); const end = useRef<HTMLDivElement>(null)
  useEffect(() => { let on = true; aiAvailable().then(v => on && setOk(v), () => on && setOk(false)); return () => { on = false; token.current++ } }, [])
  useEffect(() => { end.current?.scrollIntoView?.({ block: 'nearest' }) }, [lines.length, busy])
  const send = async () => {
    const t = text.trim(); if (!t || busy || !ok || !online) return
    const mine = ++token.current; const next: Line[] = [...lines, { from: 'you', text: t }]
    setLines(next); setText(''); setBusy(true)
    const msgs: ChatMsg[] = next.filter(l => l.from !== 'builtin').slice(-8).map(l => ({ role: l.from === 'you' ? 'user' : 'assistant', content: l.text }))
    try {
      const r = await aiChat('chat', msgs, SYSTEM(name, `Context: the timer is "${STATE_LABEL[state]}", ${minutesToday} minutes focused today.`))
      if (token.current === mine) setLines(l => [...l, { from: 'ai', text: r.text }])
    } catch (e) { if (token.current === mine) setLines(l => [...l, { from: 'builtin', text: `The AI could not answer: ${e instanceof Error ? e.message : 'unknown error'}. Built-in messages still work.` }]) }
    finally { if (token.current === mine) setBusy(false) }
  }
  const stop = () => { token.current++; setBusy(false) }
  const blocked = ok === false ? 'AI buddy mode needs an AI provider. Add one in Settings > AI. Until then your buddy keeps using built-in rule-based messages.' : !online ? 'You are offline. AI chat needs a connection. Built-in messages still work.' : null
  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between gap-2"><h2 className="font-display text-lg font-bold">Chat with {name}</h2><Chip>{ok ? 'AI ready' : 'Built-in only'}</Chip></div>
      {blocked && <p role="status" className="rounded-card border hairline bg-surface2 p-3 text-sm">{blocked}</p>}
      <div role="log" aria-live="polite" aria-label="Chat" className="max-h-72 space-y-2 overflow-y-auto pr-1">
        {lines.map((l, i) => <div key={i} className={cx('flex flex-col gap-0.5', l.from === 'you' ? 'items-end' : 'items-start')}>
          <span className="text-[11px] font-bold uppercase tracking-wide text-muted">{l.from === 'you' ? 'You' : l.from === 'ai' ? 'AI' : 'Built-in'}</span>
          <p className={cx('max-w-[90%] whitespace-pre-wrap break-words rounded-card px-3 py-2 text-sm', l.from === 'you' ? 'bg-brand text-brand-fg' : 'border hairline bg-surface2')}>{l.text}</p></div>)}
        {busy && <p className="text-sm text-muted">{name} is thinking... <button className="font-bold underline" onClick={stop}>Stop waiting</button></p>}
        <div ref={end} /></div>
      <form className="flex gap-2" onSubmit={e => { e.preventDefault(); void send() }}>
        <Input aria-label={`Message ${name}`} maxLength={500} placeholder={ok && online ? 'Ask for a tip, an explanation or a plan' : 'Chat is unavailable'} value={text} disabled={!ok || !online} onChange={e => setText(e.target.value)} />
        <Button variant="primary" type="submit" aria-label="Send" disabled={!ok || !online || busy || !text.trim()}><Send size={18} /></Button>
        <Button type="button" aria-label="Clear chat" onClick={() => { token.current++; setBusy(false); setLines([{ from: 'builtin', text: greeting }]) }}><Trash2 size={18} /></Button></form>
      <p className="text-xs text-muted">Only what you type here plus a one-line context (timer phase and minutes today) is sent to your AI provider. Notes and tasks are never sent. AI replies can be wrong and are not medical or therapy advice.</p>
    </Card>)
}
