import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { go } from '@/app/router'
import { ENVIRONMENTS } from '@/domain/catalog'
import EnvPicker from '../env/EnvPicker'
import SoundPanel from './SoundPanel'
import { Button, ConfirmDialog, Dialog, Field, Input, Segmented, Switch, useToast } from '@/components/ui'
import { put, remove, setPrefs } from '@/data/store'
import { validatePreset } from '@/domain/timer'
import { chime } from '@/services/platform'
import type { FocusPreset, Prefs } from '@/types'

type Form = { id?: string; name: string; work: string; short: string; long: string; every: string; autoB: boolean; autoW: boolean }
const blank: Form = { name: '', work: '25', short: '5', long: '15', every: '4', autoB: false, autoW: false }
const toPreset = (f: Form) => ({ name: f.name, workMinutes: Number(f.work), shortBreakMinutes: Number(f.short), longBreakMinutes: Number(f.long), sessionsBeforeLongBreak: Number(f.every) })

export default function PresetPanel({ presets, active, prefs, locked }: { presets: FocusPreset[]; active: FocusPreset; prefs: Prefs; locked: boolean }) {
  const toast = useToast(); const [form, setForm] = useState<Form | null>(null); const [errs, setErrs] = useState<Record<string, string>>({}); const [del, setDel] = useState<FocusPreset | null>(null); const [envOpen, setEnvOpen] = useState(false)
  const set = (k: keyof Form, v: string | boolean) => setForm(f => f && { ...f, [k]: v })
  const save = async () => {
    if (!form) return
    const p = toPreset(form); const e = validatePreset(p); setErrs(e); if (Object.keys(e).length) return
    try {
      const rec = await put<Partial<FocusPreset>>('presets', { id: form.id, ...p, name: p.name.trim(), autoStartBreaks: form.autoB, autoStartWork: form.autoW, soundEnabled: active.soundEnabled, builtIn: false })
      if (!form.id) await setPrefs({ activePresetId: rec.id! })
      toast('Preset saved.'); setForm(null)
    } catch { toast('Could not save the preset.', 'err') }
  }
  const field = (k: keyof Form, label: string, num = true) => <Field label={label} error={errs[{ name: 'name', work: 'workMinutes', short: 'shortBreakMinutes', long: 'longBreakMinutes', every: 'sessionsBeforeLongBreak' }[k as string]!]}>
    {(id, d) => <Input id={id} aria-describedby={d} inputMode={num ? 'numeric' : undefined} value={form![k] as string} onChange={e => set(k, e.target.value)} />}</Field>
  const edit = (p: FocusPreset) => { setErrs({}); setForm({ id: p.id, name: p.name, work: String(p.workMinutes), short: String(p.shortBreakMinutes), long: String(p.longBreakMinutes), every: String(p.sessionsBeforeLongBreak), autoB: p.autoStartBreaks, autoW: p.autoStartWork }) }
  return (
    <details className="group rounded-card border hairline bg-surface">
      <summary className="flex min-h-12 cursor-pointer items-center justify-between px-4 font-bold">Customize<span className="text-sm font-semibold text-muted group-open:hidden">Style, scene, sound, presets</span></summary>
      <div className="space-y-5 border-t hairline p-4">
        <div className="space-y-2"><div className="text-sm font-bold">Timer style</div>
          <Segmented label="Timer style" value={prefs.timerStyle} onChange={v => setPrefs({ timerStyle: v })} options={[{ value: 'ring', label: 'Ring' }, { value: 'minimal', label: 'Minimal' }, { value: 'bar', label: 'Bar' }]} /></div>
        <div className="space-y-2"><div className="text-sm font-bold">Scene and buddy</div>
          <div className="flex flex-wrap items-center gap-2"><span className="text-sm text-muted">Environment: <b className="text-ink">{ENVIRONMENTS.find(e => e.id === prefs.env.id)?.name ?? 'Minimalist desk'}</b></span>
            <Button size="sm" onClick={() => setEnvOpen(true)}>Change</Button><Button size="sm" variant="ghost" onClick={() => go('buddy')}>Buddy settings</Button></div>
          <Switch checked={prefs.env.staticBackground} onChange={v => setPrefs({ env: { ...prefs.env, staticBackground: v } })} label="Static background" hint="No moving scenery" />
          <Switch checked={prefs.env.showAvatar !== false} onChange={v => setPrefs({ env: { ...prefs.env, showAvatar: v } })} label="Show my avatar studying" />
          <Switch checked={prefs.env.showBuddy} onChange={v => setPrefs({ env: { ...prefs.env, showBuddy: v } })} label="Show buddy in the scene" /></div>
        <SoundPanel />
        <Switch checked={active.soundEnabled} label="Chime when a phase ends" hint={`Applies to "${active.name}"`} onChange={v => { void put('presets', { ...active, soundEnabled: v }); if (v) chime() }} />
        <div className="space-y-2"><div className="text-sm font-bold">Your presets</div>
          {presets.filter(p => !p.builtIn).length === 0 && <p className="text-sm text-muted">Built-in presets cannot be edited. Create your own to tune the lengths.</p>}
          <ul className="space-y-2">{presets.filter(p => !p.builtIn).map(p => <li key={p.id} className="flex items-center justify-between gap-2 rounded-card border hairline p-2 pl-3">
            <span className="min-w-0"><span className="block truncate font-bold">{p.name}</span><span className="text-sm text-muted">{p.workMinutes}/{p.shortBreakMinutes}/{p.longBreakMinutes} min, long break every {p.sessionsBeforeLongBreak}</span></span>
            <span className="flex shrink-0"><Button variant="ghost" size="sm" aria-label={`Edit ${p.name}`} onClick={() => edit(p)}><Pencil size={16} /></Button>
              <Button variant="ghost" size="sm" aria-label={`Delete ${p.name}`} disabled={locked && p.id === active.id} onClick={() => setDel(p)}><Trash2 size={16} /></Button></span></li>)}</ul>
          <Button onClick={() => { setErrs({}); setForm(blank) }}><Plus size={18} />New preset</Button></div>
      </div>
      <Dialog open={envOpen} onClose={() => setEnvOpen(false)} title="Environment" wide><EnvPicker /></Dialog>
      <Dialog open={!!form} onClose={() => setForm(null)} title={form?.id ? 'Edit preset' : 'New preset'}>{form && <form className="space-y-3" onSubmit={e => { e.preventDefault(); void save() }}>
        {field('name', 'Name', false)}
        <div className="grid grid-cols-2 gap-3">{field('work', 'Focus (min)')}{field('every', 'Sessions per cycle')}{field('short', 'Short break (min)')}{field('long', 'Long break (min)')}</div>
        <Switch checked={form.autoB} onChange={v => set('autoB', v)} label="Auto-start breaks" />
        <Switch checked={form.autoW} onChange={v => set('autoW', v)} label="Auto-start next focus" />
        <div className="flex justify-end gap-2 pt-2"><Button onClick={() => setForm(null)}>Cancel</Button><Button variant="primary" type="submit">Save preset</Button></div></form>}</Dialog>
      <ConfirmDialog open={!!del} onClose={() => setDel(null)} title="Delete this preset?" danger confirmLabel="Delete" body="Your past sessions are not affected."
        onConfirm={async () => { if (!del) return; try { if (prefs.activePresetId === del.id) await setPrefs({ activePresetId: 'preset-classic' }); await remove('presets', del.id); toast('Preset deleted.') } catch { toast('Could not delete the preset.', 'err') } }} />
    </details>)
}
