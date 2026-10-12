import type { AiAdapter, AiFeature, AiHubState, Prefs, ProviderProfile, ProviderStatus } from '@/types'
import { getAiKey, getPrefs, setPrefs } from '@/data/store'
import { nowIso, uid } from '@/domain/time'
import { ADAPTERS, adapterOf } from './providers'
import { hasSecret } from './secrets'
import { sanitize } from './sanitize'

export const FEATURES: { id: AiFeature; label: string }[] = [
  { id: 'chat', label: 'Buddy chat' }, { id: 'summary', label: 'Summaries and notes' }, { id: 'cards', label: 'Flashcards' }, { id: 'quiz', label: 'Quizzes' },
  { id: 'exam', label: 'Exam plans' }, { id: 'plan', label: 'Plan wording' }, { id: 'explain', label: 'Explanations' },
]
export const LIMITS = { timeoutMs: [5000, 180000], maxOutputTokens: [64, 32000], maxPerMinute: [1, 60] } as const

export function newProfile(adapter: AiAdapter, name?: string): ProviderProfile {
  const a = ADAPTERS[adapter], now = nowIso()
  return { id: uid(), name: name || a.label, adapter, model: a.defaultModel, enabled: true, keyMode: 'session', timeoutMs: 60000, maxOutputTokens: 4096, maxPerMinute: 10,
    capabilities: { json: false, vision: a.vision, pdf: a.pdf, modelList: true }, status: 'not-configured', createdAt: now, updatedAt: now }
}
/** https, or http only for localhost / loopback. */
export function validateBaseUrl(u: string): string | null {
  const t = u.trim(); if (!t) return 'Enter the base URL.'
  let url: URL; try { url = new URL(t) } catch { return 'Use a full address such as https://openrouter.ai/api/v1.' }
  if (url.protocol === 'https:') return url.username || url.password ? 'Do not put credentials in the address.' : null
  if (url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) return null
  return 'Use https (http is only allowed for localhost).'
}
export const validateProxy = (u: string) => (!u.trim() ? null : validateBaseUrl(u))
const PROTECTED = new Set(['authorization', 'x-api-key', 'x-goog-api-key', 'proxy-authorization', 'content-type', 'content-length', 'host', 'cookie'])
export const isProtectedHeader = (n: string) => PROTECTED.has(n.trim().toLowerCase())
/** Parses "Name: value" lines. Rejects invalid names and credential headers. */
export function parseHeaders(text: string): { headers?: Record<string, string>; error?: string } {
  const out: Record<string, string> = {}
  for (const line of text.split('\n').map(l => l.trim()).filter(Boolean)) {
    const i = line.indexOf(':'); if (i < 1) return { error: `"${line.slice(0, 30)}" must look like Name: value.` }
    const n = line.slice(0, i).trim(), v = line.slice(i + 1).trim()
    if (!/^[A-Za-z0-9-]+$/.test(n)) return { error: `"${n}" is not a valid header name.` }
    if (isProtectedHeader(n)) return { error: `${n} is set by the app. Use the key field for credentials.` }
    if (!v) return { error: `Header ${n} needs a value.` }
    if (Object.keys(out).some(k => k.toLowerCase() === n.toLowerCase())) return { error: `Header ${n} is listed twice.` }
    out[n] = v
  }
  return Object.keys(out).length ? { headers: out } : {}
}
export const headersToText = (h?: Record<string, string>) => Object.entries(h ?? {}).map(([k, v]) => `${k}: ${v}`).join('\n')

/** Pre-test status derived only from configuration. Never 'connected'. */
export function baseStatus(p: ProviderProfile, hasKey: boolean, proxy?: string): ProviderStatus {
  if (p.adapter === 'openai-compatible' && !p.baseUrl && !proxy) return 'unsupported'
  if (!p.model.trim()) return 'not-configured'
  if (p.adapter !== 'openai-compatible' && !hasKey && !proxy) return 'not-configured'
  return 'ready'
}
export const needsKey = (p: ProviderProfile) => p.adapter !== 'openai-compatible'
export const profileUsable = (p: ProviderProfile, hasKey: boolean, proxy?: string) => p.enabled && baseStatus(p, hasKey, proxy) === 'ready'

export function legacyToProfile(ai: Prefs['ai'], hasKey: boolean): ProviderProfile | null {
  const adapter = adapterOf(ai.provider)
  if (!hasKey && !(adapter === 'openai-compatible' && ai.baseUrl) && !ai.proxyUrl) return null
  const p = newProfile(adapter)
  return { ...p, id: 'legacy-' + ai.provider, keyMode: 'device', model: ai.model || p.model, baseUrl: adapter === 'openai-compatible' ? ai.baseUrl : undefined, maxPerMinute: ai.maxPerMinute || p.maxPerMinute, status: 'ready', statusDetail: 'Imported from your earlier AI settings. Not tested yet.' }
}
let running: Promise<void> | null = null
const FLAG = 'studyflow:ai-hub-migrated'
async function migrateOnce(ignoreFlag: boolean) {
  if (getPrefs().aiHub.profiles.length) return
  try { if (!ignoreFlag && localStorage.getItem(FLAG)) return } catch {}
  const ai = getPrefs().ai
  const p = legacyToProfile(ai, !!(await getAiKey(ai.provider)))
  if (!p) return
  await setPrefs(s => ({ ...s, aiHub: { ...s.aiHub, profiles: [p], defaultId: p.id } }))
  try { localStorage.setItem(FLAG, '1') } catch {}
}
/** Idempotent. Creates a profile from the legacy provider/model/key once; the legacy key slot stays readable. */
export function migrateLegacy(ignoreFlag = false): Promise<void> {
  if (running) return running
  const p: Promise<void> = migrateOnce(ignoreFlag).finally(() => { if (running === p) running = null })
  return (running = p)
}

const patchHub = (f: (h: AiHubState) => AiHubState) => setPrefs(s => ({ ...s, aiHub: f(s.aiHub) }))
export const saveProfile = (p: ProviderProfile) => patchHub(h => {
  const next = { ...p, updatedAt: nowIso() }, has = h.profiles.some(x => x.id === p.id)
  return { ...h, profiles: has ? h.profiles.map(x => (x.id === p.id ? next : x)) : [...h.profiles, next], defaultId: h.defaultId && h.profiles.some(x => x.id === h.defaultId) ? h.defaultId : next.id }
})
export const patchProfile = (id: string, a: Partial<ProviderProfile>) => patchHub(h => ({ ...h, profiles: h.profiles.map(x => (x.id === id ? { ...x, ...a, updatedAt: nowIso() } : x)) }))
export const removeProfile = (id: string) => patchHub(h => {
  const profiles = h.profiles.filter(x => x.id !== id)
  const featureModels = Object.fromEntries(Object.entries(h.featureModels).filter(([, v]) => v?.profileId !== id))
  return { ...h, profiles, featureModels, defaultId: h.defaultId === id ? profiles.find(x => x.enabled)?.id ?? profiles[0]?.id : h.defaultId }
})
export const setDefaultProfile = (id: string) => patchHub(h => ({ ...h, defaultId: id }))
export const setFeatureModel = (f: AiFeature, v: { profileId: string; model: string } | null) => patchHub(h => { const fm = { ...h.featureModels }; if (v) fm[f] = v; else delete fm[f]; return { ...h, featureModels: fm } })
export const clearUsageLog = () => patchHub(h => ({ ...h, log: [] }))
export const logUse = (e: { profileId: string; feature: string; ok: boolean; detail: string }) =>
  patchHub(h => ({ ...h, log: [{ at: nowIso(), ...e, detail: sanitize(e.detail, [], 80) }, ...h.log].slice(0, 50) }))

export interface Active { profile: ProviderProfile; model: string; legacy: boolean }
/** Pure: feature entry -> default -> first enabled profile; legacy prefs.ai only when no profiles exist. */
export function selectProfile(hub: AiHubState, ai: Prefs['ai'], feature?: AiFeature): Active | null {
  const on = (id?: string) => hub.profiles.find(p => p.id === id && p.enabled)
  const fm = feature ? hub.featureModels[feature] : undefined
  const fp = on(fm?.profileId)
  if (fp) return { profile: fp, model: fm?.model?.trim() || fp.model, legacy: false }
  const p = on(hub.defaultId) ?? hub.profiles.find(x => x.enabled)
  if (p) return { profile: p, model: p.model, legacy: false }
  if (hub.profiles.length) return null
  const lp = { ...newProfile(adapterOf(ai.provider)), id: 'legacy-' + ai.provider, keyMode: 'device' as const, model: ai.model || ADAPTERS[adapterOf(ai.provider)].defaultModel, baseUrl: ai.baseUrl, maxPerMinute: ai.maxPerMinute || 10 }
  return { profile: lp, model: lp.model, legacy: true }
}
export async function resolveActive(feature?: AiFeature): Promise<Active | null> {
  await migrateLegacy()
  const s = getPrefs(); return selectProfile(s.aiHub, s.ai, feature)
}
export async function isUsable(a: Active | null) { return !!a && profileUsable(a.profile, await hasSecret(a.profile.id, a.profile.keyMode), getPrefs().ai.proxyUrl) }
export function alternativeFor(cap: 'vision' | 'pdf', profiles: ProviderProfile[], excludeId?: string) { return profiles.find(p => p.enabled && p.id !== excludeId && p.capabilities[cap]) }
/** Message for a file the active profile cannot read, or null when fine. */
export function capabilityProblem(p: ProviderProfile, need: { pdf?: boolean; vision?: boolean }, profiles: ProviderProfile[]): string | null {
  const kind = need.pdf && !p.capabilities.pdf ? 'pdf' : need.vision && !p.capabilities.vision ? 'vision' : null
  if (!kind) return null
  const alt = alternativeFor(kind, profiles, p.id)
  return `"${p.name}" is not set up to read ${kind === 'pdf' ? 'PDF files' : 'photos'}. ${alt ? `"${alt.name}" can: make it the default (or pick it for this feature) in Settings > AI. ` : ''}${kind === 'pdf' ? 'You can also paste the text or add photos of the pages.' : 'You can also paste the text instead.'}`
}
export async function checkCapability(kind: 'pdf' | 'vision', feature?: AiFeature): Promise<string | null> {
  const a = await resolveActive(feature); if (!a) return null
  return capabilityProblem(a.profile, { [kind]: true }, getPrefs().aiHub.profiles)
}
