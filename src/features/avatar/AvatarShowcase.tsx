import { useMemo } from 'react'
import { Shirt } from 'lucide-react'
import type { LedgerEntry } from '@/types'
import { useCollection, usePrefs } from '@/data/store'
import { Button, Card } from '@/components/ui'
import { ALL_PARTS, partKey } from '@/domain/avatar'
import { balance, ownedIds } from '@/domain/growth'
import { go } from '@/app/router'
import AvatarArt from './AvatarArt'

export default function AvatarShowcase() {
  const { avatar } = usePrefs(), ledger = useCollection<LedgerEntry>('rewards'), owned = useMemo(() => ownedIds(ledger), [ledger]), bal = balance(ledger)
  const have = ALL_PARTS.filter(x => owned.has(partKey(x.slot, x.part.id))).length
  const next = ALL_PARTS.filter(x => !owned.has(partKey(x.slot, x.part.id))).sort((a, b) => a.part.cost - b.part.cost)[0]
  return <Card className="grid items-center gap-5 sm:grid-cols-[200px_1fr]">
    <div className="mx-auto w-full max-w-[200px] overflow-hidden rounded-card"><AvatarArt cfg={avatar} size="100%" /></div>
    <div className="space-y-3"><h2 className="font-display text-2xl font-semibold">Your avatar</h2>
      <p className="text-[15px] text-muted">{have} of {ALL_PARTS.length} items collected. Every focus session earns points toward new clothes and accessories.</p>
      <div className="h-2.5 overflow-hidden rounded-full bg-surface2" role="progressbar" aria-label="Wardrobe collected" aria-valuenow={have} aria-valuemin={0} aria-valuemax={ALL_PARTS.length}><div className="h-full rounded-full bg-brand" style={{ width: `${(have / ALL_PARTS.length) * 100}%` }} /></div>
      {next && <p className="text-sm font-semibold">Next easy unlock: {next.part.name} · {next.part.cost} pts {bal >= next.part.cost ? '(you can afford it)' : `(${next.part.cost - bal} to go)`}</p>}
      <Button variant="primary" className="min-h-11" onClick={() => go('avatar')}><Shirt size={16} />Customize avatar</Button></div>
  </Card>
}
