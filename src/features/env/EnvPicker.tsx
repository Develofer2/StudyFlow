import { useState, type KeyboardEvent } from 'react'
import { Check, Coins, Eye, Lock } from 'lucide-react'
import type { LedgerEntry } from '@/types'
import { setPrefs, useCollection, usePrefs } from '@/data/store'
import { ENVIRONMENTS } from '@/domain/catalog'
import { balance, ownedIds } from '@/domain/growth'
import { isOwnedEnv } from '@/domain/env'
import { buy } from '@/services/rewards'
import { Button, Chip, Dialog, Switch, cx, useToast } from '@/components/ui'
import EnvScene from './EnvScene'

export default function EnvPicker() {
  const prefs = usePrefs(), ledger = useCollection<LedgerEntry>('rewards'), toast = useToast()
  const owned = ownedIds(ledger), bal = balance(ledger), cur = prefs.env.id
  const [preview, setPreview] = useState<string | null>(null)
  const apply = (id: string) => { if (isOwnedEnv(id, owned)) { void setPrefs(p => ({ ...p, env: { ...p.env, id } })); toast('Environment applied') } }
  const purchase = async (id: string) => { const it = ENVIRONMENTS.find(e => e.id === id); const ok = await buy(id); toast(ok ? `${it?.name} unlocked` : bal < (it?.cost ?? 0) ? 'Not enough points yet' : 'Could not buy this item', ok ? 'ok' : 'err') }
  const setEnv = (patch: Partial<typeof prefs.env>) => void setPrefs(p => ({ ...p, env: { ...p.env, ...patch } }))
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0; if (!d) return
    const rs = [...e.currentTarget.querySelectorAll<HTMLElement>('[role=radio]')], i = rs.indexOf(document.activeElement as HTMLElement); if (i < 0) return
    e.preventDefault(); rs[(i + d + rs.length) % rs.length].focus()
  }
  const pv = ENVIRONMENTS.find(e => e.id === preview)
  const Actions = ({ id, cost }: { id: string; cost: number }) => owned.has(id)
    ? (cur === id ? <Chip className="min-h-11 px-3"><Check size={14} />In use</Chip> : <Button variant="primary" size="md" onClick={() => apply(id)}>Apply</Button>)
    : <Button variant="soft" disabled={bal < cost} onClick={() => purchase(id)} aria-label={`Buy for ${cost} points`}><Coins size={16} />Buy {cost}</Button>
  return <div className="space-y-4">
    <p className="text-sm text-muted">Balance: <b className="text-ink">{bal}</b> points</p>
    <div role="radiogroup" aria-label="Focus environment" onKeyDown={onKey} className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-3">
      {ENVIRONMENTS.map((it, i) => { const has = owned.has(it.id), sel = cur === it.id
        return <div key={it.id} className={cx('min-w-0 overflow-hidden rounded-card border bg-surface', sel ? 'border-brand ring-2 ring-brand' : 'hairline')}>
          <button role="radio" aria-checked={sel} tabIndex={sel || (!ENVIRONMENTS.some(e => e.id === cur) && i === 0) ? 0 : -1} aria-label={`${it.name}${has ? '' : `, locked, ${it.cost} points`}`}
            onClick={() => has ? apply(it.id) : setPreview(it.id)} className="relative block w-full text-left">
            <EnvScene id={it.id} progress={0.5} running={false} reduced decorative className="!rounded-none !border-0" />
            {!has && <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-surface px-2 py-0.5 text-xs font-bold text-ink"><Lock size={12} />{it.cost}</span>}
          </button>
          <div className="space-y-2 p-3"><div><p className="font-bold">{it.name}</p><p className="text-sm text-muted">{it.blurb}</p></div>
            <div className="flex flex-wrap items-center gap-2"><Button variant="ghost" onClick={() => setPreview(it.id)} aria-label={`Preview ${it.name}`}><Eye size={16} />Preview</Button><Actions id={it.id} cost={it.cost} /></div></div></div> })}
    </div>
    <div className="rounded-card border hairline bg-surface p-4 sm:p-5">
      <Switch checked={prefs.env.staticBackground} onChange={v => setEnv({ staticBackground: v })} label="Static background" hint="No ambient motion in the scene" />
      <div className="mt-2"><Switch checked={prefs.env.showAvatar !== false} onChange={v => setEnv({ showAvatar: v })} label="Show my avatar" hint="Your avatar studies next to your buddy" /></div>
      <div className="mt-2"><Switch checked={prefs.env.showBuddy} onChange={v => setEnv({ showBuddy: v })} label="Show buddy" hint="Place your buddy in the scene" /></div>
    </div>
    <Dialog open={!!pv} onClose={() => setPreview(null)} title={pv?.name ?? 'Preview'} wide>
      {pv && <div className="space-y-3">
        <EnvScene id={pv.id} progress={0.5} running reduced={false} staticBackground={prefs.env.staticBackground} />
        <p className="text-sm text-muted">{pv.blurb}{!owned.has(pv.id) && ` Locked: ${pv.cost} points.`}</p>
        <div className="flex flex-wrap gap-2"><Actions id={pv.id} cost={pv.cost} /><Button variant="ghost" onClick={() => setPreview(null)}>Close</Button></div></div>}
    </Dialog>
  </div>
}
