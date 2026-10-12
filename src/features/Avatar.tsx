import { useMemo, useState } from 'react'
import { Check, Coins, Dices, Lock, ShoppingBag } from 'lucide-react'
import type { LedgerEntry } from '@/types'
import { setPrefs, useCollection, usePrefs } from '@/data/store'
import { Button, Card, PageHeader, cx, useToast } from '@/components/ui'
import { HAIR_COLORS, HAIR_STYLES, FOR_LABEL, PARTS, SKIN_TONES, SLOTS, SLOT_LABEL, costOf, fits, partKey, sanitizeAvatar, surprise, VIBE_LABEL, type AvatarCfg, type Slot } from '@/domain/avatar'
import { balance, ownedIds } from '@/domain/growth'
import { buy } from '@/services/rewards'
import { go } from '@/app/router'
import AvatarArt from './avatar/AvatarArt'

const OPTIONAL: Slot[] = ['hat', 'face', 'back', 'held']
const CLOTHES: Slot[] = ['top', 'bottom', 'shoes']
type Filter = 'mine' | 'b' | 'g' | 'all'
type Tab = 'look' | Slot

export default function Avatar() {
  const prefs = usePrefs(), toast = useToast(), ledger = useCollection<LedgerEntry>('rewards')
  const owned = useMemo(() => ownedIds(ledger), [ledger]), bal = balance(ledger)
  const [tab, setTab] = useState<Tab>('top'), [trial, setTrial] = useState<Partial<AvatarCfg>>({}), [busy, setBusy] = useState(false), [filter, setFilter] = useState<Filter>('mine')
  const saved = sanitizeAvatar(prefs.avatar), view = sanitizeAvatar({ ...saved, ...trial })
  const save = (x: Partial<AvatarCfg>) => setPrefs(p => ({ ...p, avatar: sanitizeAvatar({ ...p.avatar, ...x }) }))
  const pending = SLOTS.filter(s => trial[s] !== undefined && trial[s] !== '' && !owned.has(partKey(s, trial[s]!)))
  const total = pending.reduce((a, s) => a + costOf(s, trial[s]!), 0)

  const shown = tab === 'look' ? [] : [...PARTS[tab as Slot]].filter(p => !CLOTHES.includes(tab as Slot) || filter === 'all' || (filter === 'mine' ? fits(p, view.body) : p.g === filter || p.g === 'u')).sort((a, b) => a.cost - b.cost)
  const choose = (slot: Slot, id: string) => {
    if (!id || owned.has(partKey(slot, id))) { save({ [slot]: id }); setTrial(t => { const n = { ...t }; delete n[slot]; return n }) }
    else setTrial(t => ({ ...t, [slot]: id }))
  }
  const buyAll = async () => {
    setBusy(true); const done: Partial<AvatarCfg> = {}; let bought = 0
    for (const s of pending) { if (await buy(partKey(s, trial[s]!))) { done[s] = trial[s]!; bought++ } }
    save(done); setTrial({}); setBusy(false)
    toast(bought ? `${bought} new item${bought > 1 ? 's' : ''} added to your wardrobe` : 'Could not buy those items', bought ? 'ok' : 'err')
  }

  return <div className="space-y-5">
    <PageHeader title="My Avatar" sub="Dress up your character. Clothes and accessories are yours to mix; earn points by studying to unlock more." />
    <div className="grid gap-5 lg:grid-cols-[minmax(0,320px)_1fr]">
      <div className="lg:sticky lg:top-6 lg:self-start">
        <Card className="space-y-3 text-center">
          <div className="mx-auto w-full max-w-[220px] overflow-hidden rounded-card"><AvatarArt cfg={view} size="100%" /></div>
          <div className="flex items-center justify-center gap-1.5 text-sm font-bold text-muted"><Coins size={16} className="text-brand" aria-hidden /><span className="tnum" aria-live="polite">{bal}</span> points</div>
          {pending.length > 0 && <div className="space-y-2 rounded-card border border-brand/40 bg-surface2 p-3 text-left">
            <p className="text-sm font-bold">Trying on {pending.length} new item{pending.length > 1 ? 's' : ''}</p>
            <ul className="text-sm text-muted">{pending.map(s => <li key={s}>{PARTS[s].find(p => p.id === trial[s])?.name} <span className="tnum">· {costOf(s, trial[s]!)} pts</span></li>)}</ul>
            <div className="flex gap-2"><Button variant="primary" className="min-h-11 flex-1" disabled={busy || total > bal} onClick={() => void buyAll()}><ShoppingBag size={16} />{total > bal ? `Need ${total - bal} more` : `Buy for ${total}`}</Button>
              <Button className="min-h-11" onClick={() => setTrial({})}>Undo</Button></div></div>}
          <div className="flex flex-wrap justify-center gap-2">
            <Button className="min-h-11" onClick={() => { setTrial({}); save(surprise(owned, saved)) }}><Dices size={16} />Surprise me</Button>
            <Button className="min-h-11" onClick={() => go('shop')}><ShoppingBag size={16} />Shop</Button></div>
        </Card>
      </div>
      <div className="min-w-0 space-y-4">
        <div role="tablist" aria-label="Avatar sections" className="flex flex-wrap gap-1.5">
          {([['look', 'Look'], ...SLOTS.map(s => [s, SLOT_LABEL[s]])] as [Tab, string][]).map(([id, label]) => <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
            className={cx('min-h-11 rounded-full border px-4 text-sm font-bold transition', tab === id ? 'border-brand bg-brand text-brand-fg' : 'hairline bg-surface hover:bg-surface2')}>{label}</button>)}</div>
        {tab === 'look' ? <Card className="space-y-4">
          <div><h2 className="mb-2 font-display text-lg font-semibold">Art style</h2><div className="flex flex-wrap gap-2">{([['chibi', 'Chibi'], ['mochi', 'Mochi']] as const).map(([v, l]) => <button key={v} aria-pressed={view.style === v} onClick={() => save({ style: v } as Partial<AvatarCfg>)} className="rounded-full border px-4 py-2 text-sm font-semibold aria-pressed:border-transparent aria-pressed:bg-[var(--accent)] aria-pressed:text-[var(--on-accent,#fff)]">{l}</button>)}</div></div>
          <div><h2 className="mb-2 font-display text-lg font-semibold">Body</h2><div className="flex flex-wrap gap-2">{([['masc', 'Male'], ['femme', 'Female']] as const).map(([v, l]) => <button key={v} aria-pressed={view.body === v} onClick={() => save({ body: v } as Partial<AvatarCfg>)} className="rounded-full border px-4 py-2 text-sm font-semibold aria-pressed:border-transparent aria-pressed:bg-[var(--accent)] aria-pressed:text-[var(--on-accent,#fff)]">{l}</button>)}</div></div>
          <div><h2 className="mb-2 font-display text-lg font-semibold">Skin tone</h2><div className="flex flex-wrap gap-2">{SKIN_TONES.map(c => <Swatch key={c} c={c} on={view.skin === c} label="Skin tone" onClick={() => save({ skin: c })} />)}</div></div>
          <div><h2 className="mb-2 font-display text-lg font-semibold">Hair style</h2><div className="flex flex-wrap gap-2">{HAIR_STYLES.map(h => <button key={h.id} aria-pressed={view.hair === h.id} onClick={() => save({ hair: h.id })}
            className={cx('min-h-11 rounded-full border px-4 text-sm font-bold', view.hair === h.id ? 'border-brand bg-brand text-brand-fg' : 'hairline bg-surface2')}>{h.name}</button>)}</div></div>
          <div><h2 className="mb-2 font-display text-lg font-semibold">Hair colour</h2><div className="flex flex-wrap gap-2">{HAIR_COLORS.map(c => <Swatch key={c} c={c} on={view.hairColor === c} label="Hair colour" onClick={() => save({ hairColor: c })} />)}</div></div>
          <p className="text-sm text-muted">Face and eyes are chosen for you so the focus stays on your outfits.</p>
        </Card> : <>
        {CLOTHES.includes(tab as Slot) && <div className="space-y-1.5"><div role="group" aria-label="Show clothes for" className="flex flex-wrap items-center gap-1.5"><span className="mr-1 text-sm font-bold text-muted">Show</span>
          {([['mine', view.body === 'masc' ? 'For you (boys + everyone)' : 'For you (girls + everyone)'], ['b', 'Boys'], ['g', 'Girls'], ['all', 'Everything']] as [Filter, string][]).map(([v, l]) => <button key={v} aria-pressed={filter === v} onClick={() => setFilter(v)}
            className={cx('min-h-9 rounded-full border px-3 text-sm font-bold', filter === v ? 'border-brand bg-brand text-brand-fg' : 'hairline bg-surface')}>{l}</button>)}</div>
          <p className="text-xs text-muted">Anything can be worn on any body. Free items are listed first, then by price.</p></div>}
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {OPTIONAL.includes(tab as Slot) && <Tile name="None" sel={view[tab as Slot] === ''} onClick={() => choose(tab as Slot, '')}><div className="grid h-[120px] place-items-center text-sm text-muted">Nothing</div></Tile>}
          {shown.map(p => { const has = owned.has(partKey(tab as Slot, p.id)), sel = view[tab as Slot] === p.id, short = p.cost - bal
            return <Tile key={p.id} name={p.name} tag={p.g ? <span className="block truncate text-[11px] font-semibold text-muted">{FOR_LABEL[p.g]}{p.v ? ` · ${VIBE_LABEL[p.v]}` : ''}</span> : undefined} sel={sel} onClick={() => choose(tab as Slot, p.id)} foot={has ? <span className="inline-flex items-center gap-1 text-ok"><Check size={13} />{sel && !trial[tab as Slot] ? 'Wearing' : 'Owned'}</span> : <span className={cx('inline-flex items-center gap-1 tnum', short > 0 ? 'text-muted' : 'text-brand')}>{short > 0 && <Lock size={12} />}{p.cost} pts</span>}>
              <div className="flex h-[120px] justify-center overflow-hidden"><AvatarArt cfg={{ ...view, [tab]: p.id }} size={72} bg={tab === 'bg'} animate={false} label={p.name} /></div></Tile> })}
        </ul></>}
      </div>
    </div>
  </div>
}

function Swatch({ c, on, label, onClick }: { c: string; on: boolean; label: string; onClick: () => void }) {
  return <button aria-pressed={on} aria-label={`${label} ${c}`} onClick={onClick} className={cx('grid size-11 place-items-center rounded-full border-2 transition', on ? 'border-brand ring-2 ring-brand/30' : 'border-transparent')}><span className="size-8 rounded-full border border-black/15" style={{ background: c }} /></button>
}
function Tile({ name, sel, onClick, foot, tag, children }: { name: string; tag?: React.ReactNode; sel: boolean; onClick: () => void; foot?: React.ReactNode; children: React.ReactNode }) {
  return <li><button aria-pressed={sel} onClick={onClick} className={cx('w-full overflow-hidden rounded-card border bg-surface p-2 text-left transition hover:bg-surface2', sel ? 'border-brand ring-2 ring-brand/30' : 'hairline')}>
    {children}<span className="mt-1 block truncate text-sm font-bold">{name}</span>{tag}<span className="block min-h-[18px] text-xs font-bold">{foot}</span></button></li>
}
