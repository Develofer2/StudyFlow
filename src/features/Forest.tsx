import { useMemo, useState } from 'react'
import { Flower2, Leaf, Lock, Moon, Settings2, Sprout, Star, Trophy } from 'lucide-react'
import type { Achievement, LedgerEntry, Subject, Tree } from '@/types'
import { setPrefs, useCollection, usePrefs } from '@/data/store'
import { Button, Card, Chip, Dialog, EmptyState, PageHeader, Segmented, Switch, cx, useToast } from '@/components/ui'
import { DECORATIONS, SPECIES, itemById } from '@/domain/catalog'
import { GROWTH_RULES, STAGE_NAMES, balance, ownedIds } from '@/domain/growth'
import { dayKey, fmtDuration } from '@/domain/time'
import { buy } from '@/services/rewards'
import { go } from '@/app/router'
import TreeArt from './forest/TreeArt'
import DecorArt from './forest/DecorArt'
import { filterTrees, milestones, weeklyGrowth, whyGrew, type Period, type SeasonFilter } from './forest/derive'

const SCENE_MAX = 80, SWAY_MAX = 12
const fmtDay = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
const sceneBg = (quiet: boolean) => quiet ? 'var(--surface-2)' : 'linear-gradient(to bottom, color-mix(in srgb, #9ad0ec 32%, var(--surface)) 0%, color-mix(in srgb, #d6ebc8 30%, var(--surface)) 58%, color-mix(in srgb, #86b56f 42%, var(--surface)) 58.2%, color-mix(in srgb, #5e9a52 38%, var(--surface)) 100%)'

export default function Forest() {
  const p = usePrefs(), toast = useToast(), trees = useCollection<Tree>('trees'), ledger = useCollection<LedgerEntry>('rewards'), subjects = useCollection<Subject>('subjects'), ach = useCollection<Achievement>('achievements')
  const [period, setPeriod] = useState<Period>('all'), [season, setSeason] = useState<SeasonFilter>('all'), [sel, setSel] = useState<Tree | null>(null), [garden, setGarden] = useState(false)
  const quiet = p.forest.mode === 'quiet', owned = useMemo(() => ownedIds(ledger), [ledger]), bal = balance(ledger), today = dayKey(new Date(), p.timezone)
  const shown = useMemo(() => filterTrees(trees, period, season, today, p.weekStartsOn).sort((a, b) => a.plantedAt.localeCompare(b.plantedAt)), [trees, period, season, today, p.weekStartsOn])
  const scene = shown.slice(-SCENE_MAX), weeks = useMemo(() => weeklyGrowth(trees, p.weekStartsOn, today), [trees, p.weekStartsOn, today]), ms = useMemo(() => milestones(trees), [trees])
  const subj = (id?: string) => subjects.find(s => s.id === id)?.name ?? 'No subject'
  const placed = p.forest.placed.filter(id => owned.has(id)), minutes = shown.reduce((a, t) => a + t.minutes, 0), grown = new Set(trees.map(t => t.species))
  const setForest = (patch: Partial<typeof p.forest>) => void setPrefs(x => ({ ...x, forest: { ...x.forest, ...patch } }))
  const maxMin = Math.max(1, ...weeks.map(w => w.minutes))
  const doBuy = async (id: string) => { const it = itemById(id)!; toast((await buy(id)) ? `${it.name} added to your collection` : 'Could not buy that item', 'ok') }

  return <div className="space-y-6">
    <PageHeader title="Focus Forest" sub="Every focus session grows a plant. Trees never die and rest days never harm your forest." action={<div className="flex flex-wrap gap-2">
      <Button onClick={() => setGarden(true)}><Settings2 size={18} />Customize garden</Button>
      <Button onClick={() => setForest({ mode: quiet ? 'rich' : 'quiet' })} aria-pressed={quiet}><Moon size={18} />Quiet forest: {quiet ? 'on' : 'off'}</Button></div>} />

    {!trees.length ? <EmptyState icon={<Sprout />} title="Your forest starts with one seed" body="Your first focus session plants a seed, and longer sessions grow it into a tree. Nothing is lost if you stop early: a small plant still grows." action={<Button variant="primary" onClick={() => go('focus')}>Start a focus session</Button>} /> : <>
      <div className="flex flex-wrap items-center gap-3">
        <Segmented label="Period" value={period} onChange={setPeriod} options={[{ value: 'week', label: 'This week' }, { value: 'month', label: 'This month' }, { value: 'all', label: 'All time' }]} />
        <Segmented label="Season" value={season} onChange={setSeason} options={[{ value: 'all', label: 'All seasons' }, { value: 'spring', label: 'Spring' }, { value: 'summer', label: 'Summer' }, { value: 'autumn', label: 'Autumn' }, { value: 'winter', label: 'Winter' }]} /></div>

      <div className="overflow-hidden rounded-card border hairline" style={{ background: sceneBg(quiet) }}>
        {scene.length ? <ul aria-label={`Your forest: ${shown.length} trees`} className="flex min-h-[260px] flex-wrap content-end items-end justify-center px-2 pb-3 pt-8">
          {scene.map((t, i) => <li key={t.id} className="-mb-2 -mx-1" style={{ transform: `translateY(${(i % 3) * 5}px)` }}>
            <button onClick={() => setSel(t)} aria-label={`${itemById(t.species)?.name ?? t.species} tree, ${STAGE_NAMES[t.stage]}, ${fmtDay(t.day)}. Show details`} className="grid min-h-11 min-w-11 place-items-center rounded-xl hover:bg-white/20">
              <TreeArt species={t.species} stage={t.stage} season={t.season} size={t.stage >= 4 ? 72 : 60} still={quiet || i < scene.length - SWAY_MAX} seed={i} /></button></li>)}</ul>
          : <p className="px-4 py-16 text-center text-muted">No trees match these filters.</p>}
        {placed.length > 0 && <ul aria-label="Garden decorations" className="flex flex-wrap items-end justify-center gap-1 border-t border-white/20 px-2 pb-2 pt-1">{placed.map(id => <li key={id}><DecorArt id={id} size={48} /></li>)}</ul>}
        {shown.length > SCENE_MAX && <p className="px-3 pb-2 text-center text-xs text-muted">Showing your latest {SCENE_MAX} of {shown.length} trees in the scene.</p>}</div>

      <div className="grid grid-cols-3 gap-3 text-center">{[['Trees', shown.length], ['Focus time', fmtDuration(minutes * 60)], ['Species grown', `${grown.size} / ${SPECIES.length}`]].map(([l, v]) => <Card key={l as string} className="!p-3"><p className="font-display text-2xl font-semibold tnum">{v}</p><p className="text-xs font-bold text-muted">{l}</p></Card>)}</div></>}

    <section aria-labelledby="sp"><div className="mb-3 flex flex-wrap items-baseline justify-between gap-2"><h2 id="sp" className="flex items-center gap-2 font-display text-xl font-semibold"><Leaf size={20} className="text-brand" />Species collection</h2><p className="text-sm text-muted tnum">{bal} points available</p></div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{SPECIES.map(s => { const has = owned.has(s.id), needBadge = !!s.unlockBadge && !ach.some(a => a.key === s.unlockBadge), feat = p.forest.featured === s.id
        return <li key={s.id} className={cx('flex flex-col items-center gap-2 rounded-card border p-3 text-center', feat ? 'border-brand bg-surface' : 'hairline bg-surface', !has && 'opacity-90')}>
          <div className={has ? '' : 'grayscale'}><TreeArt species={s.id} stage={4} season="summer" size={72} still /></div>
          <div><p className="font-bold">{s.name}</p><p className="text-xs text-muted">{s.blurb}</p></div>
          {has ? <><Chip className="border-ok text-ok">Owned</Chip><Button size="sm" variant={feat ? 'primary' : 'soft'} aria-pressed={feat} className="min-h-11 w-full" onClick={() => setForest({ featured: feat ? undefined : s.id })}><Star size={16} />{feat ? 'Featured' : 'Feature'}</Button></>
            : <><Chip><Lock size={12} />{s.cost} points</Chip>{needBadge && <p className="text-xs text-muted">Needs the &quot;{s.unlockBadge}&quot; achievement</p>}
              <Button size="sm" className="min-h-11 w-full" disabled={bal < s.cost || needBadge} onClick={() => void doBuy(s.id)}>{bal < s.cost ? `Need ${s.cost - bal} more` : 'Buy'}</Button></>}</li> })}</ul>
      <p className="mt-2 text-sm text-muted">Featured species is used for new trees. Trees already grown keep their species.</p></section>

    <section aria-labelledby="wk"><h2 id="wk" className="mb-3 flex items-center gap-2 font-display text-xl font-semibold"><Flower2 size={20} className="text-brand" />Weekly growth</h2>
      <Card><ul className="space-y-2">{weeks.map(w => <li key={w.start} className="grid grid-cols-[5.5rem_1fr_auto] items-center gap-3 text-sm"><span className="text-muted tnum">{new Date(w.start + 'T12:00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</span>
        <span className="h-3 overflow-hidden rounded-full bg-surface2" aria-hidden><span className="block h-full rounded-full bg-brand" style={{ width: `${(w.minutes / maxMin) * 100}%` }} /></span><span className="tnum font-semibold">{w.trees} {w.trees === 1 ? 'tree' : 'trees'}</span></li>)}</ul>
        <details className="mt-3"><summary className="min-h-11 cursor-pointer py-2 text-sm font-bold text-brand">View as a table</summary>
          <div className="overflow-x-auto"><table className="w-full text-left text-sm"><caption className="sr-only">Trees and focus minutes per week</caption><thead><tr className="text-muted"><th scope="col" className="py-1 pr-3">Week starting</th><th scope="col" className="pr-3">Trees</th><th scope="col">Minutes</th></tr></thead>
            <tbody>{weeks.map(w => <tr key={w.start} className="border-t hairline"><th scope="row" className="py-1.5 pr-3 font-normal">{fmtDay(w.start)}</th><td className="tnum pr-3">{w.trees}</td><td className="tnum">{w.minutes}</td></tr>)}</tbody></table></div></details></Card></section>

    <section aria-labelledby="ml"><h2 id="ml" className="mb-3 flex items-center gap-2 font-display text-xl font-semibold"><Trophy size={20} className="text-brand" />Milestones</h2>
      <ul className="grid gap-2 sm:grid-cols-2">{ms.map(m => <li key={m.id} className="rounded-card border hairline bg-surface p-3"><div className="flex items-center justify-between gap-2"><span className="font-bold">{m.label}</span>{m.done ? <Chip className="border-ok text-ok">Reached</Chip> : <span className="text-sm text-muted tnum">{m.value} / {m.target}</span>}</div>
        <div role="progressbar" aria-label={m.label} aria-valuemin={0} aria-valuemax={m.target} aria-valuenow={m.value} className="mt-2 h-2 overflow-hidden rounded-full bg-surface2"><div className="h-full rounded-full bg-brand" style={{ width: `${(m.value / m.target) * 100}%` }} /></div></li>)}</ul></section>

    <section aria-labelledby="how"><h2 id="how" className="mb-3 font-display text-xl font-semibold">How trees grow</h2>
      <Card><ul className="list-disc space-y-1.5 pl-5 text-[15px]">{GROWTH_RULES.map(r => <li key={r}>{r}</li>)}</ul></Card></section>

    <Dialog open={!!sel} onClose={() => setSel(null)} title={sel ? `${itemById(sel.species)?.name ?? sel.species} tree` : ''}>{sel && <div className="space-y-4">
      <div className="mx-auto w-fit"><TreeArt species={sel.species} stage={sel.stage} season={sel.season} size={150} still={quiet} /></div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-[15px]">{([['Planted', fmtDay(sel.day)], ['Focus time', `${sel.minutes} min`], ['Subject', subj(sel.subjectId)], ['Species', itemById(sel.species)?.name ?? sel.species], ['Stage', STAGE_NAMES[sel.stage]], ['Season', sel.season[0].toUpperCase() + sel.season.slice(1)]] as const).map(([k, v]) => <div key={k} className="contents"><dt className="font-bold">{k}</dt><dd className="text-muted">{v}</dd></div>)}</dl>
      <p className="rounded-card bg-surface2 p-3 text-sm"><span className="font-bold">Why it grew this much: </span>{whyGrew(sel)}</p></div>}</Dialog>

    <Dialog open={garden} onClose={() => setGarden(false)} title="Customize garden"><div className="space-y-3">
      <p className="text-sm text-muted">Place the decorations you own. They appear along the front of your forest. Unowned items can be bought in the Shop.</p>
      <ul className="space-y-2">{DECORATIONS.map(d => { const has = owned.has(d.id), on = p.forest.placed.includes(d.id)
        return <li key={d.id} className="flex items-center gap-3 rounded-card border hairline p-2"><div className={has ? '' : 'grayscale opacity-60'}><DecorArt id={d.id} size={44} /></div>
          <div className="min-w-0 flex-1"><p className="font-bold">{d.name}</p><p className="text-xs text-muted">{has ? d.blurb : `${d.cost} points in the Shop`}</p></div>
          {has ? <Button size="sm" className="min-h-11" variant={on ? 'primary' : 'soft'} aria-pressed={on} onClick={() => setForest({ placed: on ? p.forest.placed.filter(x => x !== d.id) : [...p.forest.placed, d.id] })}>{on ? 'Remove' : 'Place'}</Button>
            : <Button size="sm" className="min-h-11" onClick={() => { setGarden(false); go('shop') }}>Shop</Button>}</li> })}</ul>
      <Switch checked={quiet} onChange={v => setForest({ mode: v ? 'quiet' : 'rich' })} label="Quiet forest" hint="Static and minimal: no movement, plain background." /></div></Dialog>
  </div>
}
