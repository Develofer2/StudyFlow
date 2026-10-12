import { Hand } from 'lucide-react'
import { Card, Switch, cx } from '@/components/ui'
import { setPrefs, usePrefs } from '@/data/store'
import { COMPANIONS, companionImage } from '@/domain/cursors'
import type { Prefs } from '@/types'

type Fx = Prefs['touch']['fx']
const FX: [Fx, string, string][] = [['critters', 'Critter pop', 'Your animal pops up, with paw prints as you drag'], ['paws', 'Paw prints', 'Tiny paws follow your finger'], ['hearts', 'Hearts', 'Floating hearts'], ['sparkles', 'Sparkles', 'Little stars'], ['bubbles', 'Bubbles', 'Soft bubbles drift up'], ['ripple', 'Ripple', 'A calm ring'], ['off', 'None', 'No touch effects']]

export default function TouchSection() {
  const { touch } = usePrefs()
  const set = (patch: Partial<typeof touch>) => setPrefs(s => ({ ...s, touch: { ...s.touch, ...patch } }))
  return <Card className="space-y-4">
    <div className="flex items-center gap-2"><Hand size={20} className="text-brand" aria-hidden /><h2 className="font-display text-xl font-semibold">Touch effects</h2></div>
    <p className="text-sm text-muted">Cute reactions when you tap or drag on a phone or tablet. They never block taps, stop when reduced motion is on, and nothing leaves your device.</p>
    <ul role="radiogroup" aria-label="Touch effect" className="grid grid-cols-2 gap-2 sm:grid-cols-4">{FX.map(([id, name, blurb]) => <li key={id}><button role="radio" aria-checked={touch.fx === id} onClick={() => set({ fx: id })} className={cx('min-h-[76px] w-full rounded-card border-2 bg-surface p-2 text-left transition', touch.fx === id ? 'border-brand' : 'border-transparent hairline')}><span className="block text-sm font-bold">{name}</span><span className="block text-xs leading-tight text-muted">{blurb}</span></button></li>)}</ul>
    {touch.fx === 'critters' && <div><p className="mb-1.5 text-sm font-bold">Your animal</p>
      <ul role="radiogroup" aria-label="Touch animal" className="grid grid-cols-4 gap-2 sm:grid-cols-6">{COMPANIONS.map(c => <li key={c.id}><button role="radio" aria-checked={touch.animal === c.id} onClick={() => set({ animal: c.id })} className={cx('flex min-h-[72px] w-full flex-col items-center justify-center gap-0.5 rounded-card border-2 bg-surface p-1', touch.animal === c.id ? 'border-brand' : 'border-transparent hairline')}><img src={companionImage(c.id, 40)} alt="" width={40} height={40} /><span className="text-[11px] font-bold">{c.name}</span></button></li>)}</ul></div>}
    <Switch label="Drag trail" hint="Leave paws, hearts or stars behind as you drag your finger." checked={touch.trail} onChange={v => set({ trail: v })} />
    <Switch label="Tiny vibration on taps" hint="Works on most Android phones. iPhones do not allow it." checked={touch.haptics} onChange={v => set({ haptics: v })} />
    <div className="grid h-32 select-none place-items-center rounded-card border border-dashed border-line bg-surface2 text-sm font-bold text-muted" style={{ touchAction: 'none' }}>Tap or drag here to try it</div>
  </Card>
}
