import { useMemo, useState } from 'react'
import { Check, Coins, LayoutGrid, Lock, Receipt, Rows3, ShieldCheck } from 'lucide-react'
import type { Achievement, LedgerEntry } from '@/types'
import { useCollection } from '@/data/store'
import { Button, Card, Chip, ConfirmDialog, PageHeader, Segmented, cx, useToast } from '@/components/ui'
import { ALL_ITEMS, type CatalogItem, type ItemKind } from '@/domain/catalog'
import { BADGES } from '@/domain/achievements'
import { DAILY_POINT_CAP, balance, ownedIds } from '@/domain/growth'
import { go } from '@/app/router'
import { buy } from '@/services/rewards'
import ShopPreview from './shop/ShopPreview'

const GROUPS: { kind: ItemKind; title: string }[] = [{ kind: 'outfit', title: 'Outfits' }, { kind: 'species', title: 'Tree species' }, { kind: 'decoration', title: 'Garden decorations' }, { kind: 'environment', title: 'Environments' }, { kind: 'timer-skin', title: 'Timer skins' }, { kind: 'effect', title: 'Celebration effects' }, { kind: 'buddy', title: 'Buddies' }]
const EARN = ['Focus sessions: about 1 point per 2 focus minutes, only for sessions you finish', 'Finishing a task: 10 points', 'Completing a quiz: 15 points', 'Flashcard review days: 4 to 30 points on days you review 5 or more cards', 'Achievements: 15, 30 or 60 points per badge']
const KIND_LABEL: Record<string, string> = { add: 'Earned', purchase: 'Spent' }
const fmtDay = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short' })

export default function Shop() {
  const ledger = useCollection<LedgerEntry>('rewards'), ach = useCollection<Achievement>('achievements'), toast = useToast()
  const [group, setGroup] = useState<ItemKind | 'all'>('all')
  const [view, setViewState] = useState<'large' | 'small'>(() => { try { const v = localStorage.getItem('sf-shop-view'); if (v === 'large' || v === 'small') return v } catch { /* ignore */ } return typeof window !== 'undefined' && window.innerWidth < 640 ? 'small' : 'large' })
  const setView = (v: 'large' | 'small') => { setViewState(v); try { localStorage.setItem('sf-shop-view', v) } catch { /* ignore */ } }
  const small = view === 'small'
  const owned = useMemo(() => ownedIds(ledger), [ledger]), bal = balance(ledger)
  const recent = useMemo(() => [...ledger].filter(l => l.points !== 0).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 12), [ledger])
  const reason = (l: LedgerEntry) => l.kind === 'purchase' ? `Bought ${l.note ?? l.refId}` : l.kind === 'session' ? 'Focus session' : l.kind === 'task' ? 'Finished a task' : l.kind === 'quiz' ? 'Completed a quiz' : l.kind === 'review' ? 'Flashcard review day' : l.kind === 'achievement' ? `Achievement${l.note ? ': ' + l.note : ''}` : l.note ?? 'Bonus'
  const badgeOk = (it: CatalogItem) => !it.unlockBadge || ach.some(a => a.key === it.unlockBadge)
  const [pending, setPending] = useState<CatalogItem | null>(null)
  const doBuy = async (it: CatalogItem) => toast((await buy(it.id)) ? `${it.name} is yours` : 'Could not buy that item', 'ok')
  return <div className="space-y-6">
    <PageHeader title="Reward Shop" sub="Spend the points you earn by studying on things that make your space your own." />
    <Card className="flex flex-wrap items-center gap-4"><span className="grid h-14 w-14 place-items-center rounded-full bg-brand text-brand-fg"><Coins size={26} /></span>
      <div><p className="text-sm font-bold text-muted">Your balance</p><p className="font-display text-4xl font-semibold tnum" aria-live="polite">{bal} <span className="text-lg font-normal text-muted">points</span></p></div><button onClick={() => go('wallet')} className="ml-auto inline-flex min-h-11 items-center gap-2 rounded-full border hairline bg-surface2 px-4 text-sm font-bold"><Receipt size={16} />See wallet</button></Card>

    <Card className="space-y-3"><h2 className="flex items-center gap-2 font-display text-xl font-semibold"><ShieldCheck size={20} className="text-brand" />How points work</h2>
      <ul className="list-disc space-y-1 pl-5 text-[15px]">{EARN.map(e => <li key={e}>{e}</li>)}</ul>
      <p className="text-[15px]">At most {DAILY_POINT_CAP} points can be earned from study per day. Nothing here is paid, random, timed or lost: there are no loot boxes, no countdowns, and your points and items never expire.</p></Card>

    <Card className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-display text-xl font-semibold">Avatar wardrobe</h2><p className="text-[15px] text-muted">Clothes, hats and accessories are bought while you try them on.</p></div><Button variant="primary" className="min-h-11" onClick={() => go('avatar')}>Open wardrobe</Button></Card>
    <div className="sticky top-0 z-20 -mx-4 space-y-2 bg-[var(--bg)]/95 px-4 py-2 backdrop-blur md:static md:mx-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
      <div className="flex items-center justify-between gap-3"><span className="inline-flex items-center gap-1.5 rounded-full border hairline bg-surface px-3 py-1 text-sm font-bold tnum md:hidden"><Coins size={15} className="text-brand" aria-hidden />{bal} pts</span>
        <div role="group" aria-label="Item size" className="ml-auto inline-flex rounded-full border hairline bg-surface p-0.5">{([['large', 'Large', Rows3], ['small', 'Small', LayoutGrid]] as const).map(([v, l, Ic]) => <button key={v} onClick={() => setView(v)} aria-pressed={view === v} className={cx('inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-sm font-bold', view === v ? 'bg-brand text-brand-fg' : 'text-muted')}><Ic size={15} aria-hidden />{l}</button>)}</div></div>
      <div className="-mx-4 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0"><Segmented label="Category" value={group} onChange={setGroup} options={[{ value: 'all', label: 'All' }, ...GROUPS.map(g => ({ value: g.kind, label: g.title }))]} /></div></div>
    {GROUPS.filter(g => group === 'all' || g.kind === group).map(g => <section key={g.kind} aria-labelledby={'g-' + g.kind}><h2 id={'g-' + g.kind} className="mb-3 font-display text-xl font-semibold">{g.title}</h2>
      <ul className={small ? 'grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6' : 'grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}>{ALL_ITEMS.filter(i => i.kind === g.kind).map(it => { const has = owned.has(it.id), okBadge = badgeOk(it), short = it.cost - bal, bd = it.unlockBadge ? BADGES.find(b => b.key === it.unlockBadge) : undefined
        return <li key={it.id} className={cx('flex flex-col overflow-hidden rounded-card border hairline bg-surface touch-pop', has && 'border-ok/50')}><div className={small ? '[&>div]:!h-24' : undefined}><ShopPreview it={it} /></div>
          <div className={cx('flex flex-1 flex-col gap-2', small ? 'p-2' : 'p-3')}><div className="min-w-0 flex-1"><p className={cx('font-bold', small && 'truncate text-sm')}>{it.name}</p>{!small && <p className="text-sm text-muted">{it.blurb}</p>}
            {!small && bd && !has && <p className="mt-0.5 text-xs font-semibold text-muted">{okBadge ? 'Requirement met: ' : 'Requires achievement: '}{bd.name} ({bd.condition})</p>}</div>
          {has ? <Chip className="self-start border-ok text-ok"><Check size={13} />Owned{it.cost === 0 ? ' (free)' : ''}</Chip> : <Button size="sm" className="min-h-11 w-full" disabled={short > 0 || !okBadge} onClick={() => setPending(it)} aria-label={`Buy ${it.name} for ${it.cost} points`}>{!okBadge ? <><Lock size={14} />Locked</> : short > 0 ? `${it.cost} pts` : `Buy ${it.cost}`}</Button>}</div></li> })}</ul></section>)}

    <section aria-labelledby="tx"><h2 id="tx" className="mb-3 font-display text-xl font-semibold">Recent transactions</h2>
      {recent.length ? <Card className="!p-0"><ul className="divide-y hairline">{recent.map(l => <li key={l.id} className="flex items-center justify-between gap-3 px-4 py-3 text-[15px]"><div className="min-w-0"><p className="truncate font-semibold">{reason(l)}</p><p className="text-xs text-muted">{fmtDay(l.day)} · {l.points > 0 ? KIND_LABEL.add : KIND_LABEL.purchase}</p></div>
        <span className={cx('shrink-0 font-bold tnum', l.points > 0 ? 'text-ok' : 'text-muted')}>{l.points > 0 ? '+' : ''}{l.points}</span></li>)}</ul></Card>
        : <p className="text-[15px] text-muted">No transactions yet. Finish a focus session or a task to earn your first points.</p>}</section>
    <ConfirmDialog open={!!pending} onClose={() => setPending(null)} title={`Buy ${pending?.name ?? ''}?`} confirmLabel={`Spend ${pending?.cost ?? 0} points`}
      body={`This costs ${pending?.cost ?? 0} points and you have ${bal}. You would have ${bal - (pending?.cost ?? 0)} left. Purchases are final and cannot be refunded.`}
      onConfirm={() => { if (pending) void doBuy(pending) }} />
  </div>
}
