import { useEffect, useState } from 'react'
import { KeyRound, Search, ShieldAlert, Trash2, TriangleAlert, Zap } from 'lucide-react'
import { Button, Card, Chip, Field, Input, Select, Switch, Textarea, useToast } from '@/components/ui'
import { getPrefs } from '@/data/store'
import type { AiAdapter, ProviderProfile } from '@/types'
import { AiError, listModels, testProfile } from '@/services/ai/client'
import { ADAPTER_LIST, ADAPTERS, QUICK_FILL } from '@/services/ai/providers'
import { LIMITS, baseStatus, headersToText, parseHeaders, saveProfile, validateBaseUrl } from '@/services/ai/profiles'
import { clearSecret, getSecret, moveSecret, setSecret, hasSecret } from '@/services/ai/secrets'
import { maskSecret } from '@/services/ai/sanitize'
import { NumField } from '../common'
import { StatusChip } from './parts'

const SESSION_NOTE = 'Kept only until this browser tab or session ends. You will paste it again next time.'
const DEVICE_WARN = 'Browser storage is not a secure vault. A saved key can be read by malicious scripts, browser extensions or anyone using this device profile. Use a key with a low spending limit.'

export default function ProfileEditor({ initial, isNew, onClose }: { initial: ProviderProfile; isNew: boolean; onClose: () => void }) {
  const toast = useToast()
  const [p, setP] = useState(initial)
  const [keyDraft, setKeyDraft] = useState(''), [saved, setSaved] = useState<string | null>(null)
  const [hdr, setHdr] = useState(headersToText(initial.headers))
  const [models, setModels] = useState<string[]>([]), [busy, setBusy] = useState<'' | 'models' | 'test' | 'save'>(''), [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [touched, setTouched] = useState(false)
  const a = ADAPTERS[p.adapter], compat = p.adapter === 'openai-compatible'
  const set = (x: Partial<ProviderProfile>) => { setP(s => ({ ...s, ...x })); setMsg(null) }
  useEffect(() => { void getSecret(initial.id, initial.keyMode).then(k => setSaved(k ? maskSecret(k) : '')) }, [initial.id, initial.keyMode])

  const urlErr = compat && p.baseUrl ? validateBaseUrl(p.baseUrl) : null
  const hp = compat ? parseHeaders(hdr) : {}
  const nameErr = !p.name.trim() ? 'Give this provider a name.' : undefined
  const invalid = !!nameErr || (compat && (!!urlErr || !!hp.error)) || !p.model.trim()

  const pickAdapter = (ad: AiAdapter) => { const n = ADAPTERS[ad]; setModels([]); set({ adapter: ad, model: n.defaultModel, baseUrl: undefined, headers: undefined, capabilities: { ...p.capabilities, json: false, vision: n.vision, pdf: n.pdf }, name: isNew && p.name === a.label ? n.label : p.name }); setHdr('') }
  /** Persists secret + profile. Changing connection fields resets verified status. */
  const persist = async (): Promise<ProviderProfile | null> => {
    if (invalid) { setMsg({ ok: false, text: 'Fix the highlighted fields first.' }); return null }
    if (p.keyMode !== initial.keyMode) await moveSecret(p.id, initial.keyMode, p.keyMode)
    if (keyDraft.trim()) await setSecret(p.id, p.keyMode, keyDraft)
    const has = await hasSecret(p.id, p.keyMode)
    const changed = p.adapter !== initial.adapter || p.model !== initial.model || (p.baseUrl ?? '') !== (initial.baseUrl ?? '') || hdr !== headersToText(initial.headers) || !!keyDraft.trim() || p.keyMode !== initial.keyMode
    const next: ProviderProfile = { ...p, name: p.name.trim(), model: p.model.trim(), baseUrl: compat ? p.baseUrl?.trim().replace(/\/+$/, '') || undefined : undefined, headers: hp.headers,
      ...(changed || isNew ? { status: baseStatus({ ...p, model: p.model.trim(), baseUrl: compat ? p.baseUrl?.trim() || undefined : undefined }, has, getPrefs().ai.proxyUrl), statusDetail: undefined, capabilities: { ...p.capabilities, json: false } } : {}) }
    await saveProfile(next); setKeyDraft(''); setTouched(false)
    const k = await getSecret(p.id, p.keyMode); setSaved(k ? maskSecret(k) : '')
    return next
  }
  const save = async () => { setBusy('save'); try { if (await persist()) { toast('Provider saved.'); onClose() } } finally { setBusy('') } }
  const saveTest = async () => {
    setBusy('test')
    try { const n = await persist(); if (!n) return; const r = await testProfile(n); setP(s => ({ ...s, status: r.status, statusDetail: r.detail, capabilities: { ...s.capabilities, json: r.json } })); setMsg({ ok: r.status === 'connected', text: r.detail }) }
    finally { setBusy('') }
  }
  const find = async () => {
    setBusy('models'); setMsg(null)
    try {
      if (keyDraft.trim()) { await setSecret(p.id, p.keyMode, keyDraft); setTouched(true); setKeyDraft(''); setSaved(maskSecret(await getSecret(p.id, p.keyMode))) }
      setModels(await listModels({ ...p, baseUrl: p.baseUrl?.trim(), headers: hp.headers }))
    } catch (e) { setMsg({ ok: false, text: e instanceof AiError ? e.message : 'Could not list models. Type the model name instead.' }) }
    finally { setBusy('') }
  }
  const removeKey = async () => { await clearSecret(p.id); setSaved(''); setMsg(null); toast('Key removed.') }
  const cancel = async () => { if (isNew && touched) await clearSecret(p.id); onClose() }

  return <Card className="space-y-4 border-brand">
    <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-display text-xl font-semibold">{isNew ? 'Add provider' : 'Edit provider'}</h3><StatusChip status={p.status} /></div>
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Name" error={nameErr}>{(id, d) => <Input id={id} aria-describedby={d} value={p.name} onChange={e => set({ name: e.target.value })} maxLength={40} />}</Field>
      <Field label="Provider type" hint={isNew ? undefined : 'Changing the type resets the model.'}>{id => <Select id={id} value={p.adapter} onChange={e => pickAdapter(e.target.value as AiAdapter)}>{ADAPTER_LIST.map(x => <option key={x.id} value={x.id}>{x.label}</option>)}</Select>}</Field>
    </div>
    <p className="rounded-lg bg-surface2 p-3 text-sm text-muted">{a.note} {a.limits}</p>

    {compat && <div className="space-y-3">
      <Field label="Base URL" error={urlErr ?? undefined} hint="The address that ends before /chat/completions. https only (http allowed for localhost).">{(id, d) => <Input id={id} aria-describedby={d} type="url" inputMode="url" placeholder="https://your-provider.example/v1" value={p.baseUrl ?? ''} onChange={e => { setModels([]); set({ baseUrl: e.target.value }) }} />}</Field>
      <Field label="Quick-fill an address (untested here)" hint="Only fills the address. These services have not been tested in StudyFlow.">{id => <Select id={id} value="" onChange={e => { if (e.target.value) { setModels([]); set({ baseUrl: e.target.value }) } }}><option value="">Choose a hint…</option>{QUICK_FILL.map(q => <option key={q.name} value={q.baseUrl}>{q.name} - untested here</option>)}</Select>}</Field>
      <p className="flex gap-2 text-sm text-muted"><TriangleAlert size={16} className="mt-0.5 shrink-0 text-warn" aria-hidden />Entering a URL does not make a service compatible. It works only if the provider follows the OpenAI chat-completions format. Use Test connection.</p>
    </div>}

    <div className="space-y-2">
      <Field label="Model" hint="Availability must be verified with the provider.">{(id, d) => <Input id={id} aria-describedby={d} value={p.model} spellCheck={false} placeholder={a.defaultModel || 'Model name from your provider'} onChange={e => set({ model: e.target.value })} />}</Field>
      {a.defaultModel && p.model !== a.defaultModel && <button className="min-h-11 text-sm font-bold text-brand underline" onClick={() => set({ model: a.defaultModel })}>Use suggested model: {a.defaultModel}</button>}
      <div className="flex flex-wrap items-center gap-2"><Button size="sm" disabled={busy !== ''} onClick={find}><Search size={16} />{busy === 'models' ? 'Looking…' : 'Find models from provider'}</Button><span className="text-sm text-muted">Optional. You can always type a name.</span></div>
      {models.length > 0 && <Field label={`Models the provider lists (${models.length})`} hint="Availability must be verified with the provider. Gemini list is limited to models that support generateContent.">{id => <Select id={id} value={models.includes(p.model) ? p.model : ''} onChange={e => e.target.value && set({ model: e.target.value })}><option value="">Pick a model…</option>{models.map(m => <option key={m}>{m}</option>)}</Select>}</Field>}
    </div>

    <div className="space-y-3 rounded-card border hairline p-3">
      <h4 className="flex items-center gap-2 font-bold"><KeyRound size={18} className="text-brand" aria-hidden />API key{compat && ' (optional for local servers)'}</h4>
      {saved ? <p className="text-sm">Saved key: <span className="font-mono tnum" aria-label="A key is saved, hidden">{saved}</span></p> : <p className="text-sm text-muted">No key saved for this provider.</p>}
      <Field label={saved ? 'Replace key' : 'Paste key'}>{id => <Input id={id} type="password" autoComplete="off" spellCheck={false} placeholder={a.keyHint} value={keyDraft} onChange={e => { setKeyDraft(e.target.value); setMsg(null) }} />}</Field>
      <fieldset className="space-y-2"><legend className="text-sm font-bold">Where to keep the key</legend>
        {(['session', 'device'] as const).map(m => <label key={m} className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg p-1"><input type="radio" name={'km-' + p.id} className="mt-1 h-5 w-5 accent-[var(--primary)]" checked={p.keyMode === m} onChange={() => set({ keyMode: m })} />
          <span className="text-[15px]"><b>{m === 'session' ? 'This session only (default)' : 'Save on this device'}</b><span className="block text-sm text-muted">{m === 'session' ? SESSION_NOTE : 'Stays after you close the browser.'}</span></span></label>)}</fieldset>
      {p.keyMode === 'device' && <p role="note" className="flex gap-2 rounded-lg bg-surface2 p-3 text-sm"><ShieldAlert size={18} className="mt-0.5 shrink-0 text-warn" aria-hidden />{DEVICE_WARN}</p>}
      {saved && <Button size="sm" onClick={removeKey}><Trash2 size={16} />Remove saved key</Button>}
      <p className="text-xs text-muted">Keys are never part of exports, backups or share cards, and are never shown in full.</p>
    </div>

    {compat && <Field label="Custom headers (optional)" error={hp.error} hint="One per line as Name: value. Authorization and x-api-key are not allowed here (use the key field).">{(id, d) => <Textarea id={id} aria-describedby={d} rows={3} spellCheck={false} className="font-mono text-sm" placeholder={'HTTP-Referer: https://example.com'} value={hdr} onChange={e => { setHdr(e.target.value); setMsg(null) }} />}</Field>}
    {compat && hdr.trim() && <p className="flex gap-2 text-sm text-warn"><TriangleAlert size={16} className="mt-0.5 shrink-0" aria-hidden />Headers are stored in plain text in your settings and backups. Never put secrets in them.</p>}

    <div className="grid gap-4 sm:grid-cols-3">
      <NumField label="Timeout" unit="seconds" value={Math.round(p.timeoutMs / 1000)} min={LIMITS.timeoutMs[0] / 1000} max={LIMITS.timeoutMs[1] / 1000} onCommit={v => v && set({ timeoutMs: v * 1000 })} />
      <NumField label="Max output tokens" value={p.maxOutputTokens} min={LIMITS.maxOutputTokens[0]} max={LIMITS.maxOutputTokens[1]} onCommit={v => v && set({ maxOutputTokens: v })} hint="Caps the length (and cost) of each answer." />
      <NumField label="Requests per minute" value={p.maxPerMinute} min={1} max={60} onCommit={v => v && set({ maxPerMinute: v })} />
    </div>
    <div className="space-y-2">
      <h4 className="font-bold">Capabilities</h4>
      <div className="flex flex-wrap gap-2"><Chip className={p.capabilities.json ? 'text-ok' : 'text-muted'}>JSON output: {p.capabilities.json ? 'verified by test' : 'not verified yet'}</Chip>
        <Chip>Photos: {p.capabilities.vision ? 'assumed yes' : 'assumed no'}</Chip><Chip>PDF: {p.capabilities.pdf ? 'assumed yes' : 'assumed no'}</Chip></div>
      <p className="text-sm text-muted">Photos and PDF are provider-level assumptions, not tested. Only JSON output is checked by Test connection.</p>
      {compat && <><Switch label="This model reads photos" checked={p.capabilities.vision} onChange={v => set({ capabilities: { ...p.capabilities, vision: v } })} /><Switch label="This model reads PDFs" checked={p.capabilities.pdf} onChange={v => set({ capabilities: { ...p.capabilities, pdf: v } })} /></>}
    </div>
    <p className="text-sm text-muted">Billing is decided by your provider. StudyFlow cannot see your plan and does not claim any provider is free. Test connection sends one small real request.</p>

    <div aria-live="polite">{(msg || p.statusDetail) && <p className={`flex gap-2 rounded-lg bg-surface2 p-3 text-sm ${msg ? (msg.ok ? 'text-ok' : 'text-bad') : 'text-muted'}`}>{msg?.text ?? p.statusDetail}</p>}</div>
    <div className="flex flex-wrap justify-end gap-2">
      <Button onClick={cancel}>Cancel</Button>
      <Button disabled={busy !== ''} onClick={saveTest}><Zap size={16} />{busy === 'test' ? 'Testing…' : 'Save and test'}</Button>
      <Button variant="primary" disabled={busy !== ''} onClick={save}>Save</Button>
    </div>
  </Card>
}
