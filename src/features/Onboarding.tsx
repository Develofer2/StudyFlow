import { useCallback, useState } from 'react'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { usePrefs, put, setPrefs } from '@/data/store'
import { Button, Dialog, Field, Input, useToast, cx } from '@/components/ui'
import { THEMES, tokensFor } from '@/domain/themes'

const PICKS = ['paper-ink', 'cloud-nine', 'matcha-garden', 'lavender-haze', 'midnight-focus', 'sunset-study']
const GOALS = [20, 45, 90]
const COLORS = ['#5b8f6b', '#4f7cac', '#b5651d', '#8e5ea2', '#c0506a', '#3a8f9b']

export default function Onboarding() {
  const p = usePrefs(); const toast = useToast()
  const [step, setStep] = useState(0)
  const [name, setName] = useState(p.displayName)
  const [goal, setGoal] = useState(p.dailyGoalMinutes), [custom, setCustom] = useState(!GOALS.includes(p.dailyGoalMinutes) && p.dailyGoalMinutes !== 60)
  const [subject, setSubject] = useState(''), [color, setColor] = useState(COLORS[0])
  const [saving, setSaving] = useState(false)

  const skip = useCallback(() => { void setPrefs({ onboarded: true }) }, [])
  const finish = async () => {
    setSaving(true)
    try {
      await setPrefs({ displayName: name.trim(), dailyGoalMinutes: Math.min(600, Math.max(5, goal || 60)), onboarded: true })
      if (subject.trim()) await put('subjects', { name: subject.trim(), color, icon: 'book', examDates: [] })
      toast(subject.trim() ? 'All set. Your subject is ready.' : 'All set. Happy studying!')
    } catch { toast("Couldn't save everything. You can change it in Settings.", 'err'); setSaving(false) }
  }
  const titles = ['Welcome. What should we call you?', 'Pick a look that feels calm', 'Add your first subject']

  return <Dialog open onClose={skip} title={titles[step]}>
    <div className="space-y-5">
      <p className="text-sm font-bold text-muted tnum" aria-live="polite">Step {step + 1} of 3. Every step is optional.</p>
      {step === 0 && <div className="space-y-4">
        <Field label="Your name">{(id) => <Input id={id} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Sam" autoComplete="given-name" maxLength={40} />}</Field>
        <fieldset className="space-y-2"><legend className="text-sm font-bold">How many minutes a day would feel good?</legend>
          <div className="flex flex-wrap gap-2">
            {GOALS.map(g => <Button key={g} aria-pressed={!custom && goal === g} variant={!custom && goal === g ? 'primary' : 'soft'} onClick={() => { setCustom(false); setGoal(g) }}>{g} min</Button>)}
            <Button aria-pressed={custom} variant={custom ? 'primary' : 'soft'} onClick={() => setCustom(true)}>Custom</Button></div>
          {custom && <Field label="Minutes per day" hint="Between 5 and 600. You can change this later.">{(id, d) => <Input id={id} aria-describedby={d} type="number" inputMode="numeric" min={5} max={600} value={goal || ''} onChange={e => setGoal(Number(e.target.value))} />}</Field>}
        </fieldset></div>}
      {step === 1 && <div className="space-y-3" role="radiogroup" aria-label="Theme">
        <div className="grid grid-cols-2 gap-3">{PICKS.map(id => { const th = THEMES.find(t => t.id === id)!; const mode = p.appearance === 'system' ? th.mode : p.appearance; const tk = tokensFor(th, mode === 'dark' ? 'dark' : 'light'); const on = p.themeId === id
          return <button key={id} role="radio" aria-checked={on} onClick={() => void setPrefs({ themeId: id, appearance: th.mode })} className={cx('min-h-11 rounded-card border-2 p-2 text-left transition', on ? 'border-brand' : 'hairline')}>
            <span className="flex h-10 overflow-hidden rounded-lg border hairline" aria-hidden>{[tk.bg, tk.surface2, tk.primary, tk.text].map((c, i) => <span key={i} className="flex-1" style={{ background: c }} />)}</span>
            <span className="mt-2 flex items-center gap-1 text-sm font-bold">{on && <Check size={14} aria-hidden />}{th.name}</span><span className="block text-xs text-muted">{th.blurb}</span></button> })}</div>
        <p className="text-sm text-muted">The page behind this card is already using your pick. There are many more in Themes.</p></div>}
      {step === 2 && <div className="space-y-4">
        <Field label="Subject name" hint="Something like Biology or Calculus. Leave empty to skip.">{(id, d) => <Input id={id} aria-describedby={d} value={subject} onChange={e => setSubject(e.target.value)} maxLength={60} />}</Field>
        <div role="radiogroup" aria-label="Subject colour" className="flex flex-wrap gap-2">{COLORS.map(c => <button key={c} role="radio" aria-checked={color === c} aria-label={`Colour ${COLORS.indexOf(c) + 1}`} onClick={() => setColor(c)} className="grid h-11 w-11 place-items-center rounded-full border-2 hairline" style={{ background: c }}>{color === c && <Check size={18} className="text-white" aria-hidden />}</button>)}</div></div>}
      <div className="flex items-center justify-between gap-2 border-t hairline pt-4">
        <Button variant="ghost" onClick={skip}>Skip for now</Button>
        <div className="flex gap-2">
          {step > 0 && <Button onClick={() => setStep(step - 1)} aria-label="Back"><ArrowLeft size={18} aria-hidden /></Button>}
          {step < 2 ? <Button variant="primary" onClick={() => setStep(step + 1)}>Next<ArrowRight size={18} aria-hidden /></Button> : <Button variant="primary" disabled={saving} onClick={finish}>Finish</Button>}
        </div></div>
    </div></Dialog>
}
