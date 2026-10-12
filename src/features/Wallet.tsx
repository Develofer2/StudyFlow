import { useMemo, useState } from 'react'
import { ArrowDownRight, ArrowUpRight, Coins, Receipt, ShoppingBag, Sparkles } from 'lucide-react'
import type { LedgerEntry } from '@/types'
import { useCollection, usePrefs } from '@/data/store'
import { Card, EmptyState, PageHeader, Segmented, cx } from '@/components/ui'
import { dayKey } from '@/domain/time'
import { KIND_NAME, entryTitle, walletSummary } from '@/domain/wallet'
import { go } from '@/app/router'
import PageTip from '@/components/Tip'

const fmtDay = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
const fmtWeekday = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'narrow' })
type Filter = 'all' | 'in' | 'out'

export default function Wallet() {
  const ledger = useCollection<LedgerEntry>('rewards'), prefs = usePrefs()
  const [filter, setFilter] = useState<Filter>('all'), [rows, setRows] = useState(25)
  const today = dayKey(Date.now(), prefs.timezone)
  const w = useMemo(() => walletSummary(ledger, today), [ledger, today])
  const peak = Math.max(10, ...w.series.map(d => Math.max(d.earned, d.spent)))
  const topSrc = Math.max(1, ...w.bySource.map(s => s.points))
  const list = w.statement.filter(s => filter === 'all' || (filter === 'in' ? s.entry.points > 0 : s.entry.points < 0))
  const tiles: [string, number, string][] = [['Today', w.today, 'earned'], ['Last 7 days', w.week, 'earned'], ['Last 30 days', w.month, 'earned'], ['All time', w.earned, 'earned']]

  return <div className="space-y-5">
    <PageHeader title="Points Wallet" sub="Every point you earn and spend, like a bank statement for your studying." action={<button onClick={() => go('shop')} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-brand px-4 text-sm font-bold text-brand-fg"><ShoppingBag size={16} />Spend in shop</button>} />
    <PageTip id="wallet" />
    <Card className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
      <div className="flex items-center gap-4"><span className="grid size-16 shrink-0 place-items-center rounded-full bg-brand text-brand-fg"><Coins size={30} aria-hidden /></span>
        <div><p className="text-sm font-bold text-muted">Balance</p><p className="font-display text-5xl font-semibold tnum" aria-live="polite">{w.balance}<span className="ml-1 text-lg font-normal text-muted">pts</span></p></div></div>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
        <dt className="flex items-center gap-1 font-bold text-ok"><ArrowUpRight size={15} aria-hidden />Total earned</dt><dd className="tnum text-right font-bold">+{w.earned}</dd>
        <dt className="flex items-center gap-1 font-bold text-warn"><ArrowDownRight size={15} aria-hidden />Total spent</dt><dd className="tnum text-right font-bold">-{w.spent}</dd>
      </dl>
    </Card>
    <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">{tiles.map(([l, n]) => <li key={l} className="rounded-card border hairline bg-surface p-3"><p className="text-xs font-bold uppercase tracking-wide text-muted">{l}</p><p className="font-display text-3xl font-semibold tnum text-ok">+{n}</p></li>)}</ul>
    <div className="grid gap-5 lg:grid-cols-2">
      <Card className="space-y-3"><h2 className="font-display text-xl font-semibold">Last 14 days</h2>
        <div role="img" aria-label={`Points earned and spent per day. Peak ${peak}.`} className="flex h-40 items-end gap-1.5">
          {w.series.map(d => <div key={d.day} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1" title={`${fmtDay(d.day)}: +${d.earned} / -${d.spent}`}>
            <div className="flex h-full w-full items-end justify-center gap-px"><span className="w-1/2 rounded-t bg-ok" style={{ height: `${(d.earned / peak) * 100}%`, minHeight: d.earned ? 3 : 0 }} /><span className="w-1/2 rounded-t bg-warn" style={{ height: `${(d.spent / peak) * 100}%`, minHeight: d.spent ? 3 : 0 }} /></div>
            <span className={cx('text-[10px] font-bold', d.day === today ? 'text-brand' : 'text-muted')}>{fmtWeekday(d.day)}</span></div>)}</div>
        <p className="flex gap-4 text-xs font-bold text-muted"><span className="inline-flex items-center gap-1"><span className="size-2.5 rounded-sm bg-ok" />Earned</span><span className="inline-flex items-center gap-1"><span className="size-2.5 rounded-sm bg-warn" />Spent</span></p>
        <p className="text-sm text-muted">{w.activeDays ? <>You earn about <b className="text-ink tnum">{w.avgPerActiveDay}</b> points on a study day{w.bestDay && <>. Best day: <b className="text-ink tnum">+{w.bestDay.earned}</b> on {fmtDay(w.bestDay.day)}</>}.</> : 'Finish a focus session to earn your first points.'}</p></Card>
      <Card className="space-y-3"><h2 className="font-display text-xl font-semibold">Where points come from</h2>
        {w.bySource.length ? <ul className="space-y-2.5">{w.bySource.map(s => <li key={s.kind}><div className="mb-1 flex justify-between text-sm font-semibold"><span>{KIND_NAME[s.kind]}</span><span className="tnum text-ok">+{s.points}</span></div>
          <div className="h-2.5 rounded-full bg-surface2"><div className="h-full rounded-full bg-brand" style={{ width: `${(s.points / topSrc) * 100}%` }} /></div></li>)}</ul>
          : <p className="text-sm text-muted">Nothing earned yet.</p>}</Card>
    </div>
    <Card className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="flex items-center gap-2 font-display text-xl font-semibold"><Receipt size={20} className="text-brand" aria-hidden />Statement</h2>
        <Segmented label="Show" value={filter} onChange={v => { setFilter(v); setRows(25) }} options={[{ value: 'all', label: 'All' }, { value: 'in', label: 'Earned' }, { value: 'out', label: 'Spent' }]} /></div>
      {list.length === 0 ? <EmptyState icon={<Sparkles />} title="No transactions yet" body="Finish a focus session or a task and it shows up here." /> :
        <><ul className="divide-y divide-[var(--border)]">{list.slice(0, rows).map(({ entry: e, balance }) => <li key={e.id ?? e.key} className="flex items-center gap-3 py-2.5">
          <span className={cx('grid size-9 shrink-0 place-items-center rounded-full', e.points > 0 ? 'bg-ok/15 text-ok' : 'bg-warn/15 text-warn')}>{e.points > 0 ? <ArrowUpRight size={18} aria-hidden /> : <ArrowDownRight size={18} aria-hidden />}</span>
          <div className="min-w-0 flex-1"><p className="truncate font-bold">{entryTitle(e)}</p><p className="text-xs text-muted">{fmtDay(e.day)}</p></div>
          <div className="text-right"><p className={cx('font-bold tnum', e.points > 0 ? 'text-ok' : 'text-warn')}>{e.points > 0 ? '+' : '-'}{Math.abs(e.points)}</p><p className="text-xs text-muted tnum">bal {balance}</p></div></li>)}</ul>
          {list.length > rows && <button onClick={() => setRows(r => r + 25)} className="min-h-11 w-full rounded-full border hairline bg-surface2 text-sm font-bold">Show more</button>}</>}
    </Card>
  </div>
}
