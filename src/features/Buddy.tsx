import { useEffect, useState } from 'react'
import { Check, Coins, Lock } from 'lucide-react'
import { Button, Card, Chip, Field, Input, PageHeader, Segmented, Switch, cx, useToast } from '@/components/ui'
import { setPrefs, useCollection, usePrefs } from '@/data/store'
import { BUDDIES, OUTFITS, buddyDefaultName, itemById } from '@/domain/catalog'
import { balance, ownedIds, totalXp } from '@/domain/growth'
import { levelFor, levelTitle, milestonesFor } from '@/domain/buddyGrowth'
import { fmtDuration } from '@/domain/time'
import { useStats } from '@/hooks/useStats'
import { buy } from '@/services/rewards'
import { aiAvailable } from '@/services/ai/hub'
import type { BuddyKind, BuddyPrefs, LedgerEntry } from '@/types'
import BuddyAvatar from './buddy/BuddyAvatar'
import BuddyBubble from './buddy/BuddyBubble'
import BuddyChat from './buddy/BuddyChat'
import { useBuddy } from './buddy/useBuddy'

const SLOTS = [['hat', 'Hats'], ['neck', 'Neck'], ['held', 'Held'], ['aura', 'Aura']] as const

function NameField({ kind, value, onSave }: { kind: BuddyKind; value: string; onSave: (v: string) => void }) {
  const [d, setD] = useState(value); useEffect(() => setD(value), [kind, value])
  const commit = () => { const t = d.trim().slice(0, 20); onSave(t === buddyDefaultName(kind) ? '' : t); if (!t) setD(buddyDefaultName(kind)) }
  return <div className="flex items-end gap-2"><div className="flex-1"><Field label="Name">{id => <Input id={id} maxLength={20} value={d} onChange={e => setD(e.target.value)} onBlur={commit} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); commit() } }} />}</Field></div>
    <Button disabled={value === buddyDefaultName(kind) && d === value} onClick={() => { onSave(''); setD(buddyDefaultName(kind)) }}>Reset</Button></div>
}

export default function Buddy() {
  const toast = useToast(); const prefs = usePrefs(); const b = prefs.buddy2; const stats = useStats(); const ledger = useCollection<LedgerEntry>('rewards')
  const live = useBuddy(); const [ai, setAi] = useState<boolean | null>(null)
  useEffect(() => { let on = true; aiAvailable().then(v => on && setAi(v), () => on && setAi(false)); return () => { on = false } }, [])
  const owned = ownedIds(ledger), bal = balance(ledger), xp = totalXp(ledger), lv = levelFor(xp), ms = milestonesFor(xp)
  const setB = (patch: Partial<BuddyPrefs>) => setPrefs(p => ({ ...p, buddy2: { ...p.buddy2, ...patch } }))
  const purchase = async (id: string) => { const it = itemById(id); if (await buy(id)) toast(`${it?.name ?? 'Item'} unlocked.`); else toast('Not enough points yet. Finished focus sessions earn them.', 'info') }
  const nameOf = (k: BuddyKind) => b.names[k]?.trim() || buddyDefaultName(k)
  const days = stats.byDay.size, sessions = stats.sessions.filter(s => s.type === 'focus' && s.status !== 'cancelled').length

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader title="Buddy" sub="A quiet study companion. It cheers, never nags." action={<Chip><Coins size={14} />{bal} points</Chip>} />
      <Card className="flex flex-col items-center gap-3 text-center">
        <BuddyAvatar kind={b.kind} state={live.state} size={176} outfit={b.outfit} intensity={b.intensity} name={live.name} />
        <div className="font-display text-xl font-bold">{live.name}</div>
        <div className="text-sm text-muted">Level {lv.level} · {levelTitle(lv.level)}</div>
        {b.enabled && b.messages && <BuddyBubble name={live.name} text={live.message} />}
      </Card>

      <Card className="space-y-3"><h2 className="font-display text-lg font-bold">Choose your buddy</h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">{BUDDIES.map(x => { const have = owned.has('buddy:' + x.kind), sel = b.kind === x.kind
          return <li key={x.kind} className={cx('flex flex-col items-center gap-1.5 rounded-card border p-2 text-center', sel ? 'border-brand bg-surface2' : 'hairline')}>
            <button aria-pressed={sel} disabled={!have} aria-label={`Choose ${x.name}`} onClick={() => setB({ kind: x.kind })} className="flex min-h-11 w-full flex-col items-center gap-1 rounded-card disabled:opacity-60">
              <BuddyAvatar kind={x.kind} size={72} intensity="still" state="idle" name={nameOf(x.kind)} />
              <span className="max-w-full truncate text-sm font-bold">{nameOf(x.kind)}</span><span className="text-[11px] leading-tight text-muted">{x.trait}</span></button>
            {have ? <span className="flex min-h-6 items-center gap-1 text-xs font-bold text-ok">{sel ? <><Check size={14} />Selected</> : 'Owned'}</span>
              : <Button size="sm" className="w-full" disabled={bal < x.cost} onClick={() => purchase('buddy:' + x.kind)}><Lock size={13} />Buy {x.cost}</Button>}</li> })}</ul>
        <p className="text-xs text-muted">Growth and points are shared. Switching buddy never loses progress, and each buddy keeps its own name.</p></Card>

      <Card className="space-y-4"><h2 className="font-display text-lg font-bold">Personalise</h2>
        <NameField kind={b.kind} value={nameOf(b.kind)} onSave={v => setB({ names: { ...b.names, [b.kind]: v || undefined } })} />
        <div className="space-y-2"><div className="text-sm font-bold">Message style</div>
          <Segmented label="Message style" value={b.style} onChange={v => setB({ style: v })} options={[{ value: 'cheerful', label: 'Cheerful' }, { value: 'calm', label: 'Calm' }, { value: 'playful', label: 'Playful' }, { value: 'minimal', label: 'Minimal' }]} /></div>
        <div className="space-y-2"><div className="text-sm font-bold">Animation</div>
          <Segmented label="Animation intensity" value={b.intensity} onChange={v => setB({ intensity: v })} options={[{ value: 'full', label: 'Full' }, { value: 'gentle', label: 'Gentle' }, { value: 'still', label: 'Still' }]} />
          {prefs.motion === 'off' && <p className="text-xs text-muted">Motion is off in your theme settings, so the buddy stays still.</p>}</div>
        <Switch checked={b.enabled} onChange={v => setB({ enabled: v })} label="Show buddy" hint="On the Focus page" />
        <Switch checked={b.messages} onChange={v => setB({ messages: v })} label="Buddy messages" hint="Short built-in, rule-based lines" />
        <Switch checked={b.sound} onChange={v => setB({ sound: v })} label="Buddy sound" hint="A soft chime when you reach your daily goal" />
        <Switch checked={b.aiMode} onChange={v => setB({ aiMode: v })} label="AI buddy chat" hint={ai === false ? 'Needs an AI provider (Settings > AI)' : 'Optional. Sends only what you type.'} /></Card>

      {b.aiMode && <BuddyChat name={live.name} state={live.state} minutesToday={live.minutesToday} greeting={live.message} />}

      <Card className="space-y-4"><h2 className="font-display text-lg font-bold">Outfits</h2>
        {SLOTS.map(([slot, title]) => { const items = OUTFITS.filter(o => o.slot === slot); return <div key={slot} className="space-y-2"><div className="text-sm font-bold">{title}</div>
          <ul className="grid gap-2 sm:grid-cols-2">{items.map(o => { const have = owned.has(o.id), on = b.outfit[slot] === o.id
            return <li key={o.id} className="flex items-center gap-3 rounded-card border hairline p-2">
              <BuddyAvatar kind={b.kind} size={52} intensity="still" outfit={{ [slot]: o.id }} name={o.name} />
              <div className="min-w-0 flex-1"><div className="truncate text-sm font-bold">{o.name}</div><div className="text-xs text-muted">{o.blurb}</div></div>
              {have ? <Button size="sm" aria-pressed={on} variant={on ? 'primary' : 'soft'} onClick={() => setB({ outfit: { ...b.outfit, [slot]: on ? undefined : o.id } })}>{on ? 'Remove' : 'Equip'}</Button>
                : <Button size="sm" disabled={bal < o.cost} onClick={() => purchase(o.id)}>Buy {o.cost}</Button>}</li> })}</ul></div> })}</Card>

      <Card className="space-y-3"><h2 className="font-display text-lg font-bold">Growth</h2>
        <div className="flex items-baseline justify-between gap-2"><div className="font-bold">Level {lv.level} · {levelTitle(lv.level)}</div><div className="font-mono text-sm tnum text-muted">{xp} xp</div></div>
        <div role="progressbar" aria-label="Progress to next level" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(lv.pct * 100)} className="h-3 overflow-hidden rounded-full border hairline bg-surface2"><div className="h-full rounded-full bg-brand" style={{ width: `${lv.pct * 100}%` }} /></div>
        <p className="text-sm text-muted">{lv.next === null ? 'Top level reached. Thank you for the company.' : `${lv.toNext} xp to level ${lv.level + 1}. One focused minute is one xp.`}</p>
        <ul className="space-y-1.5">{ms.list.map(x => <li key={x.name} className={cx('flex items-start gap-2 text-sm', !x.reached && 'text-muted')}>
          <span className={cx('mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border', x.reached ? 'border-brand bg-brand text-brand-fg' : 'hairline')}>{x.reached && <Check size={12} />}</span>
          <span><b className={x.reached ? 'text-ink' : ''}>{x.name}</b> <span className="font-mono text-xs tnum">{x.xp} xp</span><br />{x.blurb}</span></li>)}</ul></Card>

      <Card className="space-y-3"><h2 className="font-display text-lg font-bold">Together so far</h2>
        <p className="text-sm text-muted">{sessions ? `You and ${live.name} have studied for ${fmtDuration(stats.totalSeconds)} across ${days} ${days === 1 ? 'day' : 'days'}. Every minute counted, rest days included.` : `${live.name} is waiting for your first session. No rush.`}</p>
        <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">{[['Focus time', fmtDuration(stats.totalSeconds)], ['Sessions', String(sessions)], ['Days studied', String(days)], ['Items owned', String([...owned].filter(i => itemById(i)?.cost).length)]].map(([k, v]) =>
          <div key={k} className="rounded-card border hairline bg-surface2 p-3"><dt className="text-xs font-bold uppercase tracking-wide text-muted">{k}</dt><dd className="font-mono text-lg font-semibold tnum">{v}</dd></div>)}</dl></Card>
    </div>)
}
