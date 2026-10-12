import { z } from 'zod'
import type { AiAdapter, AiFeature, ProviderProfile, ProviderStatus } from '@/types'
import { aiCacheGet, aiCacheSet, getPrefs } from '@/data/store'
import { ADAPTERS, GEMINI_FALLBACKS, OPENAI_BASE } from './providers'
import { capabilityProblem, isProtectedHeader, logUse, patchProfile, resolveActive, baseStatus, type Active } from './profiles'
import { getSecret } from './secrets'
import { sanitize } from './sanitize'

/** Multi-adapter JSON client. Keys are supplied by the user at runtime and stay in this browser; nothing is bundled. */
export type AiErrorKind = 'nokey' | 'offline' | 'invalid' | 'quota' | 'rate' | 'limit' | 'bad' | 'cors' | 'cancel' | 'timeout'
export class AiError extends Error { constructor(public kind: AiErrorKind, message: string, public status?: ProviderStatus) { super(message) } }
export interface AiPart { mime: string; data: string } // base64
export interface CallOpts { feature?: AiFeature; signal?: AbortSignal }
const DAY_KEY = 'studyflow:ai-day'
export function aiUsageToday() { try { const d = JSON.parse(localStorage.getItem(DAY_KEY) || '{}'); return d.day === new Date().toDateString() ? (d.count as number) : 0 } catch { return 0 } }
const bump = () => { try { localStorage.setItem(DAY_KEY, JSON.stringify({ day: new Date().toDateString(), count: aiUsageToday() + 1 })) } catch {} }
const recent = new Map<string, number[]>()

async function sha(text: string) {
  if (crypto?.subtle) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('') }
  let h = 5381; for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0; return String(h)
}
export const MAX_TEXT_CHARS = 24000
export const MAX_FILE_BYTES = 10 * 1024 * 1024

export interface BuildInput { adapter: AiAdapter; key: string; model: string; baseUrl?: string; headers?: Record<string, string>; maxTokens: number; prompt: string; text: string; parts: AiPart[]; schema: object }
export interface BuiltRequest { url: string; headers: Record<string, string>; body: unknown }

const lowerTypes = (v: any): any => Array.isArray(v) ? v.map(lowerTypes) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, k === 'type' && typeof x === 'string' ? x.toLowerCase() : lowerTypes(x)])) : v
const jsonInstruction = (prompt: string, schema: object) => `${prompt}\n\nReply with ONLY a single JSON object (no markdown fences, no commentary) matching this JSON schema:\n${JSON.stringify(lowerTypes(schema))}`
export const cleanBase = (b?: string) => (b || '').trim().replace(/\/+$/, '')
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta'
const ANTHROPIC_HEADERS = { 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' }

/** Pure request builder (unit-tested). Never puts the key in the URL. */
export function buildRequest(i: BuildInput): BuiltRequest {
  const user = i.text
  if (i.adapter === 'gemini') {
    return {
      url: `${GEMINI_BASE}/models/${encodeURIComponent(i.model)}:generateContent`,
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': i.key },
      body: { contents: [{ role: 'user', parts: [{ text: `${i.prompt}\n\n${user}` }, ...i.parts.map(p => ({ inline_data: { mime_type: p.mime, data: p.data } }))] }],
        generationConfig: { responseMimeType: 'application/json', responseSchema: i.schema, temperature: 0.4, maxOutputTokens: i.maxTokens } },
    }
  }
  if (i.adapter === 'anthropic') {
    return {
      url: 'https://api.anthropic.com/v1/messages',
      headers: { 'Content-Type': 'application/json', 'x-api-key': i.key, ...ANTHROPIC_HEADERS },
      body: { model: i.model, max_tokens: i.maxTokens, temperature: 0.4, system: jsonInstruction(i.prompt, i.schema),
        messages: [{ role: 'user', content: [
          ...i.parts.map(p => p.mime === 'application/pdf' ? { type: 'document', source: { type: 'base64', media_type: p.mime, data: p.data } } : { type: 'image', source: { type: 'base64', media_type: p.mime, data: p.data } }),
          { type: 'text', text: user || 'Use the attached material.' }] }] },
    }
  }
  const compat = i.adapter === 'openai-compatible'
  const base = compat ? cleanBase(i.baseUrl) : OPENAI_BASE
  const content = i.parts.length
    ? [{ type: 'text', text: user || 'Use the attached material.' }, ...i.parts.map(p => ({ type: 'image_url', image_url: { url: `data:${p.mime};base64,${p.data}` } }))]
    : user || 'Use the provided instructions.'
  const custom = compat ? Object.fromEntries(Object.entries(i.headers ?? {}).filter(([k]) => !isProtectedHeader(k))) : {}
  return {
    url: `${base}/chat/completions`,
    headers: { 'Content-Type': 'application/json', ...custom, ...(i.key ? { Authorization: `Bearer ${i.key}` } : {}) },
    // OpenAI's newer models reject max_tokens/temperature; compatible servers mostly expect the classic names.
    body: { model: i.model, ...(compat ? { max_tokens: i.maxTokens, temperature: 0.4 } : { max_completion_tokens: i.maxTokens }), response_format: { type: 'json_object' },
      messages: [{ role: 'system', content: jsonInstruction(i.prompt, i.schema) }, { role: 'user', content }] },
  }
}
export function extractText(adapter: AiAdapter, json: any): string {
  if (adapter === 'gemini') return json?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') ?? ''
  if (adapter === 'anthropic') return (json?.content ?? []).filter((c: any) => c.type === 'text').map((c: any) => c.text).join('')
  const c = json?.choices?.[0]?.message?.content
  return typeof c === 'string' ? c : Array.isArray(c) ? c.map((x: any) => x.text ?? '').join('') : ''
}
export function parseJsonLoose(raw: string): unknown {
  const t = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  try { return JSON.parse(t) } catch { const a = t.indexOf('{'), b = t.lastIndexOf('}'); if (a >= 0 && b > a) return JSON.parse(t.slice(a, b + 1)); throw new Error('no json') }
}

/** Model-list request for adapters whose API really supports it. */
export function buildModelsRequest(adapter: AiAdapter, key: string, baseUrl?: string, headers?: Record<string, string>): { url: string; headers: Record<string, string> } {
  if (adapter === 'gemini') return { url: `${GEMINI_BASE}/models?pageSize=200`, headers: { 'x-goog-api-key': key } }
  if (adapter === 'anthropic') return { url: 'https://api.anthropic.com/v1/models?limit=100', headers: { 'x-api-key': key, ...ANTHROPIC_HEADERS } }
  const custom = adapter === 'openai-compatible' ? Object.fromEntries(Object.entries(headers ?? {}).filter(([k]) => !isProtectedHeader(k))) : {}
  return { url: `${adapter === 'openai' ? OPENAI_BASE : cleanBase(baseUrl)}/models`, headers: { ...custom, ...(key ? { Authorization: `Bearer ${key}` } : {}) } }
}
export function parseModels(adapter: AiAdapter, json: any): string[] {
  const ids: string[] = adapter === 'gemini'
    ? (json?.models ?? []).filter((m: any) => (m?.supportedGenerationMethods ?? []).includes('generateContent')).map((m: any) => String(m.name ?? '').replace(/^models\//, ''))
    : (json?.data ?? []).map((m: any) => String(m?.id ?? ''))
  return [...new Set(ids.filter(Boolean))].sort()
}

/** Status for an HTTP failure. A 400 is judged by its message. */
export function statusFromHttp(code: number, msg = ''): ProviderStatus {
  if (code === 401 || code === 403) return 'auth-failed'
  if (code === 404) return 'model-unavailable'
  if (code === 400) return /api key|credential|unauth|permission/i.test(msg) ? 'auth-failed' : /model|not found|does not exist/i.test(msg) ? 'model-unavailable' : 'provider-error'
  return 'provider-error'
}
export function statusFromFetchError(online: boolean): { status: ProviderStatus; detail: string } {
  return online
    ? { status: 'network', detail: 'Could not reach the provider. Your connection is up, so the provider may block direct browser calls (CORS), or the address is wrong. Try a proxy URL.' }
    : { status: 'network', detail: 'You appear to be offline.' }
}

export interface CallResult { ok: boolean; status: ProviderStatus; http?: number; detail: string; json?: any }
/** One HTTP call with timeout and caller cancellation. Error text is sanitized and never contains the key. */
export async function callProvider(url: string, init: { method?: string; headers: Record<string, string>; body?: unknown }, timeoutMs: number, signal?: AbortSignal, secrets: string[] = []): Promise<CallResult> {
  const ctl = new AbortController(); let timedOut = false
  const onAbort = () => ctl.abort(); signal?.addEventListener('abort', onAbort)
  if (signal?.aborted) ctl.abort()
  const t = setTimeout(() => { timedOut = true; ctl.abort() }, timeoutMs)
  try {
    const res = await fetch(url, { method: init.method ?? 'POST', headers: init.headers, body: init.body === undefined ? undefined : JSON.stringify(init.body), signal: ctl.signal })
    if (res.ok) { try { return { ok: true, status: 'connected', http: res.status, detail: 'OK', json: await res.json() } } catch { return { ok: false, status: 'provider-error', http: res.status, detail: 'The provider sent a reply that is not JSON.' } } }
    let msg = ''; try { const j = await res.json(); msg = j?.error?.message ?? j?.message ?? (typeof j?.error === 'string' ? j.error : '') } catch {}
    return { ok: false, status: statusFromHttp(res.status, msg), http: res.status, detail: sanitize(`HTTP ${res.status}${msg ? ': ' + msg : ''}`, secrets) }
  } catch {
    if (signal?.aborted) throw new AiError('cancel', 'Cancelled.')
    if (timedOut) return { ok: false, status: 'network', detail: `No answer within ${Math.round(timeoutMs / 1000)} seconds.` }
    return { ...statusFromFetchError(typeof navigator === 'undefined' || navigator.onLine), ok: false }
  } finally { clearTimeout(t); signal?.removeEventListener('abort', onAbort) }
}

async function activeKey(a: Active) { return getSecret(a.profile.id, a.profile.keyMode) }
/** Builds and sends through the user's proxy when set; otherwise straight to the provider. */
function send(p: ProviderProfile, built: BuiltRequest, key: string, signal?: AbortSignal) {
  const proxy = getPrefs().ai.proxyUrl
  return callProvider(proxy || built.url, { headers: proxy ? { 'Content-Type': 'application/json' } : built.headers, body: built.body }, p.timeoutMs, signal, [key])
}
function toError(r: CallResult, name: string, model: string): AiError {
  if (r.status === 'auth-failed') return new AiError('invalid', `${name} rejected this API key or its permissions. Check it in Settings > AI.`, r.status)
  if (r.status === 'model-unavailable') return new AiError('invalid', `${name} could not find the model "${model}" or the address. Check the model name in Settings > AI.`, r.status)
  if (r.http === 429) return new AiError('quota', 'AI is resting: the provider says the usage limit is reached. Try again in a minute. Manual tools still work.', r.status)
  if (r.status === 'network') return new AiError(/offline/.test(r.detail) ? 'offline' : /No answer/.test(r.detail) ? 'timeout' : 'cors', `${r.detail}`, r.status)
  return new AiError('bad', `The AI service returned an error${r.http ? ` (${r.http})` : ''}. Try again shortly.`, r.status)
}

export async function generateJson<T>(opts: { prompt: string; text?: string; parts?: AiPart[]; schema: object; validate: z.ZodType<T> } & CallOpts): Promise<{ data: T; cached: boolean }> {
  const cfg = getPrefs().ai
  const active = await resolveActive(opts.feature)
  if (!active) throw new AiError('nokey', 'All AI providers are switched off. Turn one on in Settings > AI.')
  const { profile } = active, adapter = ADAPTERS[profile.adapter]
  const key = await activeKey(active)
  const parts = opts.parts ?? []
  if (!cfg.proxyUrl && !key && profile.adapter !== 'openai-compatible') throw new AiError('nokey', `Add your ${profile.name} API key in Settings > AI first.`, 'not-configured')
  if (profile.adapter === 'openai-compatible' && !cleanBase(profile.baseUrl) && !cfg.proxyUrl) throw new AiError('nokey', 'Enter the base URL of your provider in Settings > AI first.', 'unsupported')
  const model = active.model || adapter.defaultModel
  if (!model) throw new AiError('nokey', 'Enter a model name in Settings > AI first.', 'not-configured')
  const prob = capabilityProblem(profile, { pdf: parts.some(p => p.mime === 'application/pdf'), vision: parts.some(p => p.mime !== 'application/pdf') }, getPrefs().aiHub.profiles)
  if (prob) throw new AiError('limit', prob)
  const text = (opts.text ?? '').slice(0, MAX_TEXT_CHARS)
  const hash = await sha([profile.id, model, opts.prompt, text, ...parts.map(p => p.data.length + p.data.slice(0, 64) + p.data.slice(-64))].join('|'))
  const hit = await aiCacheGet(hash)
  if (hit) { const v = opts.validate.safeParse(JSON.parse(hit)); if (v.success) return { data: v.data, cached: true } }
  if (typeof navigator !== 'undefined' && !navigator.onLine) throw new AiError('offline', 'AI needs an internet connection. Your manual tools still work offline.')
  const now = Date.now(), rec = recent.get(profile.id) ?? []
  while (rec.length && now - rec[0] > 60000) rec.shift()
  recent.set(profile.id, rec)
  if (rec.length >= profile.maxPerMinute) throw new AiError('rate', 'You are going quickly. Wait a few seconds and try again.')
  // Fallback models only when the user kept the adapter default; a chosen model is never swapped silently.
  const models = profile.adapter === 'gemini' && model === adapter.defaultModel ? [model, ...GEMINI_FALLBACKS.filter(m => m !== model)] : [model]
  let mi = 0
  const feature = opts.feature ?? 'summary'
  const fail = (e: AiError) => { void logUse({ profileId: profile.id, feature, ok: false, detail: e.message }); if (!active.legacy && (e.status === 'auth-failed' || e.status === 'model-unavailable') && profile.status !== e.status) void patchProfile(profile.id, { status: e.status, statusDetail: sanitize(e.message, [key]) }); return e }
  for (let attempt = 0; attempt < 2 + models.length; attempt++) {
    const built = buildRequest({ adapter: profile.adapter, key, model: models[mi], baseUrl: profile.baseUrl, headers: profile.headers, maxTokens: profile.maxOutputTokens, prompt: opts.prompt, text, parts, schema: opts.schema })
    rec.push(Date.now())
    const r = await send(profile, built, key, opts.signal)
    if (r.http === 404 && !cfg.proxyUrl && mi < models.length - 1) { mi++; continue }
    if (r.http === 429 && attempt === 0) { await new Promise(res => setTimeout(res, 2500)); continue }
    if (r.http && r.http >= 500 && attempt === 0) { await new Promise(res => setTimeout(res, 1500)); continue }
    if (!r.ok) throw fail(toError(r, profile.name, models[mi]))
    bump()
    try { const v = opts.validate.parse(parseJsonLoose(extractText(profile.adapter, r.json))); await aiCacheSet(hash, JSON.stringify(v)); void logUse({ profileId: profile.id, feature, ok: true, detail: models[mi] }); return { data: v, cached: false } }
    catch { throw fail(new AiError('bad', 'The AI answered in an unexpected format. Try again, or use a smaller piece of text.')) }
  }
  throw fail(new AiError('bad', 'The AI service is busy. Try again shortly.'))
}

/** Real minimal request through the same builder and transport; records status on the saved profile. */
export async function testProfile(p: ProviderProfile, signal?: AbortSignal): Promise<{ status: ProviderStatus; detail: string; json: boolean }> {
  const proxy = getPrefs().ai.proxyUrl
  const key = await getSecret(p.id, p.keyMode)
  const finish = async (status: ProviderStatus, detail: string, json = false, ok = false) => {
    const d = sanitize(detail, [key], 160)
    await patchProfile(p.id, { status, statusDetail: d, capabilities: { ...p.capabilities, json } })
    void logUse({ profileId: p.id, feature: 'test', ok, detail: d })
    return { status, detail: d, json }
  }
  const pre = baseStatus(p, !!key, proxy)
  if (pre === 'unsupported') return finish('unsupported', 'Add the provider base URL first (or a proxy URL).')
  if (pre === 'not-configured') return finish('not-configured', p.model.trim() ? 'Add an API key first.' : 'Choose a model first.')
  if (typeof navigator !== 'undefined' && !navigator.onLine) return finish('network', 'You appear to be offline.')
  const built = buildRequest({ adapter: p.adapter, key, model: p.model, baseUrl: p.baseUrl, headers: p.headers, maxTokens: Math.min(p.maxOutputTokens, 256), prompt: 'Reply with ok set to true.', text: `Connection test ${Date.now()}`, parts: [], schema: { type: 'OBJECT', properties: { ok: { type: 'BOOLEAN' } }, required: ['ok'] } })
  const r = await send(p, built, key, signal)
  if (!r.ok) return finish(r.status, r.detail)
  bump()
  try { const v = z.object({ ok: z.boolean() }).parse(parseJsonLoose(extractText(p.adapter, r.json))); return finish('connected', v.ok ? 'Connected. The model answered a real test request in JSON.' : 'Connected, and the model answered in JSON.', true, true) }
  catch { return finish('connected', 'Connected, but the model did not answer in JSON. Structured features (cards, quizzes) may fail with this model.', false, true) }
}

/** Lists models via the provider's own endpoint. Throws AiError on failure; the caller should fall back to manual entry. */
export async function listModels(p: ProviderProfile, signal?: AbortSignal): Promise<string[]> {
  if (getPrefs().ai.proxyUrl) throw new AiError('limit', 'Model lists are not available through a proxy. Type the model name instead.')
  if (p.adapter === 'openai-compatible' && !p.baseUrl) throw new AiError('nokey', 'Add the base URL first.', 'unsupported')
  const key = await getSecret(p.id, p.keyMode)
  if (!key && p.adapter !== 'openai-compatible') throw new AiError('nokey', 'Add and save an API key first.', 'not-configured')
  const req = buildModelsRequest(p.adapter, key, p.baseUrl, p.headers)
  const r = await callProvider(req.url, { method: 'GET', headers: req.headers }, Math.min(p.timeoutMs, 30000), signal, [key])
  if (!r.ok) throw new AiError('bad', `Could not list models (${r.detail}). Type the model name instead.`, r.status)
  const ids = parseModels(p.adapter, r.json)
  if (!ids.length) throw new AiError('bad', 'The provider returned no models. Type the model name instead.')
  return ids
}
