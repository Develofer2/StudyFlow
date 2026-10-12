import { useEffect, useState } from 'react'
import { Pencil, Plus, ShieldAlert, Trash2, Zap } from 'lucide-react'
import { clearUsageLog, migrateLegacy, newProfile, removeProfile, setDefaultProfile, patchProfile, validateProxy } from '@/services/ai/profiles'
import { testProfile, aiUsageToday } from '@/services/ai/client'
import { ADAPTERS, PRESETS } from '@/services/ai/providers'
import { setPrefs, usePrefs } from '@/data/store'
import { Button, Card, Chip, ConfirmDialog, Field, Input, Select, Switch, useToast } from '@/components/ui'
import type { ProviderProfile } from '@/types'
import { Section } from './common'
import FeatureRouting from './ai/FeatureRouting'
import ProfileEditor from './ai/ProfileEditor'
import { StatusChip } from './ai/parts'

export default function AiTab() {
  const p = usePrefs(), ai = p.ai, hub = p.aiHub, toast = useToast()
  const [edit, setEdit] = useState<{ p: ProviderProfile; isNew: boolean } | null>(null)
  const [testing, setTesting] = useState<string | null>(null), [del, setDel] = useState<ProviderProfile | null>(null)
  const [preset, setPreset] = useState('gemini'), [proxy, setProxy] = useState(ai.proxyUrl ?? '')
  useEffect(() => { void migrateLegacy() }, [])
  const proxyErr = validateProxy(proxy)
  const patch = (a: Partial<typeof ai>) => void setPrefs(s => ({ ...s, ai: { ...s.ai, ...a } }))
  const test = async (x: ProviderProfile) => { setTesting(x.id); try { const r = await testProfile(x); toast(r.status === 'connected' ? 'Connected.' : r.detail, r.status === 'connected' ? 'ok' : 'err') } finally { setTesting(null) } }
  const add = () => { const pr = PRESETS.find(x => x.id === preset) ?? PRESETS[0]; setEdit({ p: newProfile(pr.adapter), isNew: true }) }

  return <div className="space-y-5">
    <Section title="AI helpers (optional)" sub="Make notes, flashcards and quizzes from your own material. Everything else works without AI.">
      <div className="space-y-2 rounded-lg bg-surface2 p-3 text-sm"><p className="flex gap-2"><ShieldAlert size={18} className="mt-0.5 shrink-0 text-brand" aria-hidden /><span><strong>Privacy:</strong> your key goes only to the provider you choose, together with the text or file you picked for that request. It is never included in exports or share cards. By default it is kept for this browser session only.</span></p>
        <p className="text-muted">Billing is decided by your provider. StudyFlow cannot see your plan and does not promise any provider is free. If a key was ever pasted somewhere public, rotate it with the provider.</p>
        <p className="text-muted"><strong>Production note:</strong> StudyFlow is local-first. For a deployment with many users, keep provider keys in a backend and call it from here (see Proxy URL) instead of putting keys in browsers.</p></div>
      <Switch label="Enable AI features" hint="Shows AI buttons in Flashcards, Quizzes, Notes and the Study Coach." checked={ai.enabled} onChange={v => patch({ enabled: v, consented: v || ai.consented })} />
    </Section>

    <Section title="Providers" sub="Add one or more. The default is used unless you pick another per feature.">
      {hub.profiles.length === 0 && <p className="rounded-lg border border-dashed border-line p-4 text-[15px] text-muted">No provider yet. Add one below, paste your key and press Test connection.</p>}
      <ul className="space-y-3">{hub.profiles.map(x => <li key={x.id}><Card className="space-y-3 !p-3 sm:!p-4">
        <div className="flex flex-wrap items-start justify-between gap-2"><div className="min-w-0"><p className="truncate font-bold">{x.name}{hub.defaultId === x.id && <Chip className="ml-2 text-brand">Default</Chip>}</p>
          <p className="truncate text-sm text-muted">{ADAPTERS[x.adapter].label} · <span className="font-mono">{x.model || 'no model'}</span> · key: {x.keyMode === 'device' ? 'saved on device' : 'this session'}</p></div>
          <StatusChip status={testing === x.id ? 'testing' : x.status === 'testing' ? 'ready' : x.status} /></div>
        {x.statusDetail && <p className="text-sm text-muted">{x.statusDetail}</p>}
        <div className="flex flex-wrap gap-2">
          <Button size="sm" disabled={testing !== null} onClick={() => test(x)}><Zap size={16} />Test connection</Button>
          <Button size="sm" onClick={() => setEdit({ p: x, isNew: false })}><Pencil size={16} />Edit</Button>
          {hub.defaultId !== x.id && x.enabled && <Button size="sm" onClick={() => void setDefaultProfile(x.id)}>Make default</Button>}
          <Button size="sm" onClick={() => void patchProfile(x.id, { enabled: !x.enabled })}>{x.enabled ? 'Disable' : 'Enable'}</Button>
          <Button size="sm" onClick={() => setDel(x)} aria-label={`Remove ${x.name}`}><Trash2 size={16} />Remove</Button></div>
      </Card></li>)}</ul>
      {edit ? <ProfileEditor key={edit.p.id} initial={edit.p} isNew={edit.isNew} onClose={() => setEdit(null)} /> : (
        <div className="flex flex-wrap items-end gap-2"><div className="min-w-0 flex-1 basis-48"><Field label="Add a provider">{id => <Select id={id} value={preset} onChange={e => setPreset(e.target.value)}>{PRESETS.map(x => <option key={x.id} value={x.id}>{x.label}</option>)}</Select>}</Field></div>
          <Button variant="primary" onClick={add}><Plus size={16} />Add</Button></div>)}
    </Section>

    {hub.profiles.length > 0 && <Section title="Which provider for which feature" sub="Optional. Each feature can use its own provider and model."><FeatureRouting hub={hub} /></Section>}

    <details className="rounded-card border hairline bg-surface p-4 sm:p-5"><summary className="min-h-11 cursor-pointer font-display text-xl font-semibold">Advanced and usage</summary>
      <div className="mt-3 space-y-4">
        <Field label="Proxy URL (optional)" error={proxyErr ?? undefined} hint="Only if you run your own relay that adds the key, or if a provider blocks browser calls (CORS). All AI requests then go to this address instead, with no key from this app.">{(id, d) => <Input id={id} aria-describedby={d} type="url" placeholder="https://" value={proxy} onChange={e => setProxy(e.target.value)} onBlur={() => { if (!proxyErr) patch({ proxyUrl: proxy.trim() || undefined }) }} />}</Field>
        <p className="text-sm text-muted tnum">Real AI requests today on this device: <strong className="text-ink">{aiUsageToday()}</strong> (a local count; your provider keeps the official one).</p>
        <div className="flex items-center justify-between gap-2"><h3 className="font-bold">Recent requests</h3>{hub.log.length > 0 && <Button size="sm" onClick={() => void clearUsageLog()}>Clear log</Button>}</div>
        {hub.log.length === 0 ? <p className="text-sm text-muted">Nothing yet.</p> : <ul className="max-h-64 divide-y divide-line overflow-y-auto text-sm">{hub.log.map((l, i) => <li key={i} className="flex flex-wrap gap-x-2 py-1.5"><span className="tnum text-muted">{new Date(l.at).toLocaleTimeString()}</span><span className="font-bold">{hub.profiles.find(x => x.id === l.profileId)?.name ?? 'removed provider'}</span><span>{l.feature}</span><span className={l.ok ? 'text-ok' : 'text-bad'}>{l.ok ? 'ok' : 'failed'}</span><span className="min-w-0 break-words text-muted">{l.detail}</span></li>)}</ul>}
      </div></details>
    <ConfirmDialog open={!!del} onClose={() => setDel(null)} title="Remove provider?" danger confirmLabel="Remove" body={`${del?.name ?? ''} and its saved key on this device will be removed.`} onConfirm={() => { if (del) { void removeProfile(del.id); void import('@/services/ai/secrets').then(m => m.clearSecret(del.id)) } }} />
  </div>
}
