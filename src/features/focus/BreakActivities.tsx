import { useEffect, useState } from 'react'
import { Droplets, Eye, Footprints, Heart, Wind, X, ArrowRight } from 'lucide-react'
import { Button, Card, Select, Textarea, useToast } from '@/components/ui'
import { put, useCollection, usePrefs } from '@/data/store'
import { go } from '@/app/router'
import type { Subject } from '@/types'

type Tab = 'stretch' | 'water' | 'eyes' | 'breathe' | 'reflect' | 'next'
const TABS: { id: Tab; label: string; icon: typeof Wind }[] = [
  { id: 'stretch', label: 'Stretch', icon: Footprints }, { id: 'water', label: 'Water', icon: Droplets }, { id: 'eyes', label: 'Eyes', icon: Eye },
  { id: 'breathe', label: 'Breathe', icon: Wind }, { id: 'reflect', label: 'Reflect', icon: Heart }, { id: 'next', label: 'Next', icon: ArrowRight },
]
const PROMPTS = ['What is one thing that clicked in that session?', 'What felt hard, and what could help next time?', 'What is the very next small step?']

function Breathe() {
  const { motion } = usePrefs()
  const still = motion === 'off' || (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [inhale, setInhale] = useState(true)
  useEffect(() => { if (still) return; const t = setInterval(() => setInhale(v => !v), 4000); return () => clearInterval(t) }, [still])
  return <div className="flex flex-col items-center gap-3 py-2">
    <div aria-hidden className="grid size-24 place-items-center"><div className="size-24 rounded-full bg-brand/30 ring-2 ring-brand" style={{ transform: `scale(${still || inhale ? 1 : 0.6})`, transition: still ? 'none' : 'transform 4s ease-in-out' }} /></div>
    <p className="font-bold">{still ? 'Breathe in slowly, then out slowly.' : inhale ? 'Breathe in' : 'Breathe out'}</p>
    <p className="text-sm text-muted">{still ? 'Animation is off to respect your motion setting. Try 4 seconds in, 4 seconds out, a few times.' : 'About four seconds each way. Stop whenever you like.'}</p>
  </div>
}

function Reflect() {
  const toast = useToast(), [i] = useState(() => Math.floor(Math.random() * PROMPTS.length)), [txt, setTxt] = useState('')
  const save = async () => { await put('notes', { title: 'Reflection', content: `${PROMPTS[i]}\n\n${txt.trim()}`, tags: ['reflection'], favorite: false }); setTxt(''); toast('Saved as a note', 'ok') }
  return <div className="space-y-2"><label htmlFor="refl" className="block text-sm font-bold">{PROMPTS[i]}</label>
    <Textarea id="refl" rows={3} value={txt} onChange={e => setTxt(e.target.value)} placeholder="Optional. Stays on this screen unless you save it." />
    <Button size="sm" onClick={save} disabled={!txt.trim()}>Save as note</Button></div>
}

function Next() {
  const subjects = useCollection<Subject>('subjects').filter(s => !s.archivedAt), [sid, setSid] = useState(''), [hint, setHint] = useState('')
  return <div className="space-y-2">
    <label className="block space-y-1.5 text-sm font-bold">Subject for next session<Select value={sid} onChange={e => setSid(e.target.value)}><option value="">Any</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></label>
    <label className="block space-y-1.5 text-sm font-bold">Intention (a reminder for yourself)<input value={hint} onChange={e => setHint(e.target.value)} placeholder="e.g. finish chapter 3 questions" className="min-h-11 w-full rounded-[calc(var(--radius)*.7)] border hairline bg-surface2 px-3 font-normal" /></label>
    <Button size="sm" variant="primary" onClick={() => go('focus', { ...(sid ? { subject: sid } : {}), ...(hint ? { intention: hint } : {}) })}>Open Focus</Button></div>
}

/** Optional, dismissible, never blocking. phase is the current break type. */
export default function BreakActivities({ phase, onDismiss }: { phase: string; onDismiss: () => void }) {
  const { habits } = usePrefs()
  const [tab, setTab] = useState<Tab>(phase === 'long_break' ? 'stretch' : 'breathe')
  if (!habits.breakActivities) return null
  return <Card aria-label="Break ideas" className="space-y-3">
    <div className="flex items-start justify-between gap-2"><div><h2 className="font-display text-lg font-semibold">Break ideas</h2><p className="text-sm text-muted">Pick one, or just rest. Totally optional.</p></div>
      <button type="button" onClick={onDismiss} aria-label="Dismiss break ideas" className="grid size-11 shrink-0 place-items-center rounded-full hover:bg-surface2"><X size={18} aria-hidden /></button></div>
    <div role="group" aria-label="Break activities" className="flex flex-wrap gap-1.5">
      {TABS.map(t => <button key={t.id} type="button" aria-pressed={tab === t.id} onClick={() => setTab(t.id)} className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border hairline px-3 text-sm font-bold ${tab === t.id ? 'bg-brand text-brand-fg' : 'bg-surface2'}`}><t.icon size={16} aria-hidden />{t.label}</button>)}</div>
    {tab === 'stretch' && <p>Stand up and roll your shoulders. Gently stretch your neck, wrists and back for about a minute.</p>}
    {tab === 'water' && <p>Have a glass of water. Drinking a little now is easier than catching up later.</p>}
    {tab === 'eyes' && <p>Try the 20-20-20 idea: look at something about 20 feet (6 metres) away for 20 seconds, roughly every 20 minutes of screen time.</p>}
    {tab === 'breathe' && <Breathe />}
    {tab === 'reflect' && <Reflect />}
    {tab === 'next' && <Next />}
  </Card>
}
