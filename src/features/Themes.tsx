import { useState, useSyncExternalStore } from 'react'
import { Check, Heart, Moon, Palette, RotateCcw, Sun, Sunset, TriangleAlert } from 'lucide-react'
import { usePrefs, setPrefs } from '@/data/store'
import { Button, Card, Field, PageHeader, Segmented, Switch, cx } from '@/components/ui'
import { THEMES, contrast, safeAccent, tokensFor, type ThemeDef } from '@/domain/themes'
import { systemDark } from '@/services/platform'
import CursorSection from './themes/CursorSection'
import TouchSection from './themes/TouchSection'
import type { Prefs } from '@/types'

type Filter = 'all' | 'light' | 'dark' | 'warm' | 'contrast' | 'fav'
const FILTERS: { id: Filter; label: string }[] = [{ id: 'all', label: 'All' }, { id: 'light', label: 'Light' }, { id: 'dark', label: 'Dark' }, { id: 'warm', label: 'Warm & low-blue' }, { id: 'contrast', label: 'High contrast' }, { id: 'fav', label: 'Favourites' }]
const grade = (r: number) => (r >= 7 ? 'AAA' : r >= 4.5 ? 'AA' : 'Low')
const useSystemDark = () => useSyncExternalStore(l => { const m = matchMedia('(prefers-color-scheme: dark)'); m.addEventListener('change', l); return () => m.removeEventListener('change', l) }, systemDark)

function Swatch({ t, mode, active, fav, onApply, onFav }: { t: ThemeDef; mode: 'light' | 'dark'; active: boolean; fav: boolean; onApply: () => void; onFav: () => void }) {
  const k = tokensFor(t, mode), r = contrast(k.text, k.bg), g = grade(r)
  return <li className={cx('relative rounded-card border-2 bg-surface p-2.5', active ? 'border-brand' : 'border-transparent hairline')}>
    <button onClick={onApply} aria-pressed={active} aria-label={`${active ? 'Current theme: ' : 'Apply '}${t.name}`} className="block w-full rounded-[calc(var(--radius)*.7)] text-left">
      <span className="block overflow-hidden rounded-[calc(var(--radius)*.6)] border p-2.5" style={{ background: k.bg, borderColor: k.border }}>
        <span className="block rounded-lg border p-2" style={{ background: k.surface, borderColor: k.border }}>
          <span className="block font-display text-sm font-semibold" style={{ color: k.text }}>Aa Study</span><span className="block text-xs" style={{ color: k.muted }}>Quiet reading text</span>
          <span className="mt-1.5 flex gap-1"><span className="h-3 flex-1 rounded-full" style={{ background: k.primary }} /><span className="h-3 w-5 rounded-full" style={{ background: k.surface2 }} /></span></span>
        <span className="mt-2 flex gap-1">{[k.primary, k.success, k.warning, k.danger].map((c, i) => <span key={i} className="h-3.5 w-3.5 rounded-full" style={{ background: c }} />)}</span></span>
      <span className="mt-2 flex items-center justify-between gap-2 px-0.5"><span className="font-bold">{t.name}</span>{active && <Check size={18} className="text-brand" aria-hidden />}</span>
      <span className="block px-0.5 text-sm text-muted">{t.blurb}</span>
      <span className="mt-1.5 inline-flex items-center gap-1 px-0.5 text-xs font-bold text-muted" title="WCAG contrast between text and background">Text contrast <span className={cx('rounded border px-1', g === 'Low' ? 'border-warn text-warn' : 'border-ok text-ok')}>{g}</span> <span className="tnum font-mono font-normal">{r.toFixed(1)}:1</span></span></button>
    <button onClick={onFav} aria-pressed={fav} aria-label={`${fav ? 'Remove' : 'Add'} ${t.name} ${fav ? 'from' : 'to'} favourites`} className="absolute right-3.5 top-3.5 grid h-10 w-10 place-items-center rounded-full bg-surface/90 shadow-sm"><Heart size={18} className={fav ? 'fill-[var(--danger)] text-bad' : 'text-muted'} /></button></li>
}

export default function Themes() {
  const p = usePrefs(), sysDark = useSystemDark(); const [filter, setFilter] = useState<Filter>('all')
  const mode = p.appearance === 'system' ? (sysDark ? 'dark' : 'light') : p.appearance
  const active = THEMES.find(t => t.id === p.themeId) ?? THEMES[0], bg = tokensFor(active, mode).bg
  const list = THEMES.filter(t => filter === 'all' || (filter === 'light' && t.mode === 'light') || (filter === 'dark' && t.mode === 'dark') || (filter === 'warm' && t.tags.includes('warm')) || (filter === 'contrast' && !!t.contrast) || (filter === 'fav' && p.favoriteThemes.includes(t.id)))
  const set = (patch: Partial<Prefs>) => void setPrefs(patch)
  const toggleFav = (id: string) => set({ favoriteThemes: p.favoriteThemes.includes(id) ? p.favoriteThemes.filter(x => x !== id) : [...p.favoriteThemes, id] })
  const hex = p.accent ?? '#8a3d22', safe = p.accent ? safeAccent(p.accent, bg) : undefined, adjusted = !!p.accent && safe!.toLowerCase() !== p.accent.toLowerCase()
  const range = 'w-full min-h-11 accent-[var(--primary)]'

  return <div className="space-y-5">
    <PageHeader title="Themes" sub="Pick a look that is easy on your eyes. Changes apply instantly and are saved on this device." />
    <Card className="space-y-3"><div className="flex flex-wrap items-center gap-4"><div><p className="mb-1.5 text-sm font-bold">Appearance</p>
      <Segmented<Prefs['appearance']> label="Appearance" value={p.appearance} onChange={v => set({ appearance: v })} options={[{ value: 'light', label: <span className="flex items-center gap-1.5"><Sun size={15} />Light</span> }, { value: 'dark', label: <span className="flex items-center gap-1.5"><Moon size={15} />Dark</span> }, { value: 'system', label: 'System' }]} /></div>
      <div className="min-w-[240px] flex-1"><Switch label="Evening warm shift" hint="Adds a gentle amber tint between 8pm and 6am to reduce blue light." checked={p.eveningWarm} onChange={v => set({ eveningWarm: v })} /></div></div>
      <p className="flex items-center gap-1.5 text-sm text-muted"><Sunset size={16} />Previews below are shown in your current {mode} setting.</p></Card>

    <div role="group" aria-label="Filter themes" className="flex flex-wrap gap-2">{FILTERS.map(f => <button key={f.id} aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}
      className={cx('min-h-10 rounded-full border px-4 text-sm font-bold', filter === f.id ? 'border-brand bg-brand text-brand-fg' : 'hairline bg-surface text-ink hover:bg-surface2')}>{f.label}{f.id === 'fav' && p.favoriteThemes.length ? ` (${p.favoriteThemes.length})` : ''}</button>)}</div>
    {list.length ? <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{list.map(t => <Swatch key={t.id} t={t} mode={mode} active={t.id === p.themeId} fav={p.favoriteThemes.includes(t.id)} onApply={() => set({ themeId: t.id })} onFav={() => toggleFav(t.id)} />)}</ul>
      : <p className="rounded-card border border-dashed border-line p-6 text-center text-muted">{filter === 'fav' ? 'No favourites yet. Tap the heart on a theme to keep it handy.' : 'No themes match this filter.'}</p>}

    <CursorSection />
    <TouchSection />

    <details className="group rounded-card border hairline bg-surface p-4 sm:p-5"><summary className="flex min-h-11 cursor-pointer items-center gap-2 font-display text-xl font-semibold"><Palette size={20} className="text-brand" />Customize</summary>
      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_minmax(0,320px)]">
        <div className="space-y-5">
          <Field label="Accent colour" hint={p.accent ? undefined : 'Using the theme accent.'}>{id => <div className="flex flex-wrap items-center gap-3"><input id={id} type="color" value={hex} onChange={e => set({ accent: e.target.value })} className="h-11 w-16 cursor-pointer rounded-lg border hairline bg-bg p-1" />
            {p.accent && <Button size="sm" onClick={() => set({ accent: undefined })}><RotateCcw size={15} />Use theme accent</Button>}</div>}</Field>
          {adjusted && <p role="status" className="flex gap-2 rounded-lg bg-surface2 p-3 text-sm text-warn"><TriangleAlert size={18} className="mt-0.5 shrink-0" /><span>That colour is hard to read on this background, so it is shown as a slightly {mode === 'dark' ? 'lighter' : 'darker'} shade (<span className="font-mono">{safe}</span>) to keep text readable.</span></p>}
          <Field label={`Corner radius: ${p.radius}px`}>{id => <input id={id} type="range" min={0} max={28} step={2} value={p.radius} onChange={e => set({ radius: +e.target.value })} className={range} />}</Field>
          <Field label={`Glow: ${Math.round(p.glow * 100)}%`} hint="A soft halo on primary buttons. Off by default.">{id => <input id={id} type="range" min={0} max={1} step={0.05} value={p.glow} onChange={e => set({ glow: +e.target.value })} className={range} />}</Field>
          <div><p className="mb-1.5 text-sm font-bold">Text size</p><Segmented label="Text size" value={String(p.fontScale)} onChange={v => set({ fontScale: +v })} options={[{ value: '0.9', label: 'Small' }, { value: '1', label: 'Default' }, { value: '1.1', label: 'Large' }, { value: '1.25', label: 'Larger' }]} /></div>
          <div><p className="mb-1.5 text-sm font-bold">Density</p><Segmented<Prefs['density']> label="Density" value={p.density} onChange={v => set({ density: v })} options={[{ value: 'comfortable', label: 'Comfortable' }, { value: 'compact', label: 'Compact' }]} /></div>
          <div><p className="mb-1.5 text-sm font-bold">Motion</p><Segmented<Prefs['motion']> label="Motion" value={p.motion} onChange={v => set({ motion: v })} options={[{ value: 'full', label: 'Full' }, { value: 'low', label: 'Low' }, { value: 'off', label: 'Off' }]} /></div>
          <div><p className="mb-1.5 text-sm font-bold">Timer style</p><Segmented<Prefs['timerStyle']> label="Timer style" value={p.timerStyle} onChange={v => set({ timerStyle: v })} options={[{ value: 'ring', label: 'Ring' }, { value: 'minimal', label: 'Minimal' }, { value: 'bar', label: 'Bar' }]} /></div></div>
        <div className="lg:sticky lg:top-4 lg:self-start"><p className="mb-1.5 text-sm font-bold">Live preview</p>
          <div className="space-y-3 rounded-card border hairline bg-bg p-4"><p className="font-display text-xl font-semibold">Biology revision</p><p className="text-sm text-muted">Chapter 4 · 25 minutes left</p>
            <div className="h-2.5 overflow-hidden rounded-full bg-surface2"><div className="h-full w-2/3 rounded-full bg-brand" /></div>
            <div className="flex flex-wrap gap-2"><Button variant="primary" size="sm">Start focus</Button><Button size="sm">Skip</Button><span className="inline-flex items-center rounded-full border hairline bg-surface2 px-2.5 text-xs font-bold">{p.timerStyle}</span></div></div></div></div></details>
  </div>
}
