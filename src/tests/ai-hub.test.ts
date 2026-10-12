import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { clearAllData, getPrefs, initStore, setAiKey, setPrefs } from '@/data/store'
import { buildExport } from '@/services/dataio'
import { buildModelsRequest, buildRequest, callProvider, extractText, parseJsonLoose, parseModels, statusFromFetchError, statusFromHttp, testProfile, type BuildInput } from '@/services/ai/client'
import { baseStatus, capabilityProblem, legacyToProfile, logUse, migrateLegacy, newProfile, parseHeaders, saveProfile, selectProfile, validateBaseUrl } from '@/services/ai/profiles'
import { clearSecret, getSecret, hasSecret, setSecret } from '@/services/ai/secrets'
import { sanitize } from '@/services/ai/sanitize'

const KEY = 'sk-test-SECRET1234567890abcdef'
const base = (adapter: BuildInput['adapter']): BuildInput => ({ adapter, key: KEY, model: 'm1', baseUrl: 'https://x.example/v1', maxTokens: 321, prompt: 'P', text: 'T', parts: [], schema: { type: 'OBJECT', properties: {} } })
beforeAll(async () => { await initStore() })
afterEach(() => { vi.unstubAllGlobals() })
const mockFetch = (res: { status?: number; body?: unknown } | 'reject') => vi.stubGlobal('fetch', vi.fn(async () => { if (res === 'reject') throw new TypeError('Failed to fetch'); const s = res.status ?? 200; return { ok: s < 300, status: s, json: async () => res.body } }))

describe('request builders', () => {
  for (const a of ['gemini', 'openai', 'anthropic', 'openai-compatible'] as const) {
    it(`${a}: key not in URL, token limit applied`, () => {
      const r = buildRequest(base(a)); const body = JSON.stringify(r.body)
      expect(r.url).not.toContain(KEY); expect(r.url).not.toMatch(/key=/i); expect(body).not.toContain(KEY)
      expect(body).toContain('321')
    })
  }
  it('headers per adapter', () => {
    expect(buildRequest(base('gemini')).headers['x-goog-api-key']).toBe(KEY)
    const an = buildRequest(base('anthropic')); expect(an.headers['x-api-key']).toBe(KEY); expect(an.headers['anthropic-dangerous-direct-browser-access']).toBe('true'); expect(an.headers['anthropic-version']).toBeTruthy()
    expect(buildRequest(base('openai')).headers.Authorization).toBe(`Bearer ${KEY}`)
    expect(buildRequest(base('openai')).url).toBe('https://api.openai.com/v1/chat/completions')
    expect(buildRequest(base('openai-compatible')).url).toBe('https://x.example/v1/chat/completions')
  })
  it('token limit field names', () => {
    expect((buildRequest(base('gemini')).body as any).generationConfig.maxOutputTokens).toBe(321)
    expect((buildRequest(base('anthropic')).body as any).max_tokens).toBe(321)
    expect((buildRequest(base('openai')).body as any).max_completion_tokens).toBe(321)
    expect((buildRequest(base('openai-compatible')).body as any).max_tokens).toBe(321)
  })
  it('custom headers only for compatible and never override credentials', () => {
    const h = { 'X-Title': 'app', Authorization: 'evil', 'x-api-key': 'evil' }
    const c = buildRequest({ ...base('openai-compatible'), headers: h })
    expect(c.headers['X-Title']).toBe('app'); expect(c.headers.Authorization).toBe(`Bearer ${KEY}`); expect(c.headers['x-api-key']).toBeUndefined()
    expect(buildRequest({ ...base('openai'), headers: h }).headers['X-Title']).toBeUndefined()
  })
  it('model list requests keep key out of URL', () => {
    for (const a of ['gemini', 'openai', 'anthropic', 'openai-compatible'] as const) expect(buildModelsRequest(a, KEY, 'https://x.example/v1').url).not.toContain(KEY)
    expect(buildModelsRequest('openai-compatible', KEY, 'https://x.example/v1/').url).toBe('https://x.example/v1/models')
    expect(buildModelsRequest('anthropic', KEY).headers['anthropic-dangerous-direct-browser-access']).toBe('true')
  })
})

describe('response parsing', () => {
  it('extracts text per adapter', () => {
    expect(extractText('gemini', { candidates: [{ content: { parts: [{ text: '{"a":' }, { text: '1}' }] } }] })).toBe('{"a":1}')
    expect(extractText('anthropic', { content: [{ type: 'text', text: 'hi' }] })).toBe('hi')
    expect(extractText('openai', { choices: [{ message: { content: 'yo' } }] })).toBe('yo')
    expect(extractText('openai', {})).toBe('')
  })
  it('parses fenced JSON', () => { expect(parseJsonLoose('```json\n{"ok":true}\n```')).toEqual({ ok: true }); expect(() => parseJsonLoose('nope')).toThrow() })
  it('model lists; Gemini limited to generateContent', () => {
    expect(parseModels('gemini', { models: [{ name: 'models/a', supportedGenerationMethods: ['generateContent'] }, { name: 'models/emb', supportedGenerationMethods: ['embedContent'] }] })).toEqual(['a'])
    expect(parseModels('openai', { data: [{ id: 'b' }, { id: 'a' }, { id: 'a' }] })).toEqual(['a', 'b'])
    expect(parseModels('anthropic', {})).toEqual([])
  })
})

describe('status mapping', () => {
  it('maps HTTP codes', () => {
    expect(statusFromHttp(401)).toBe('auth-failed'); expect(statusFromHttp(403)).toBe('auth-failed'); expect(statusFromHttp(404)).toBe('model-unavailable')
    expect(statusFromHttp(500)).toBe('provider-error'); expect(statusFromHttp(429)).toBe('provider-error'); expect(statusFromHttp(418)).toBe('provider-error')
    expect(statusFromHttp(400, 'model xyz does not exist')).toBe('model-unavailable'); expect(statusFromHttp(400, 'API key not valid')).toBe('auth-failed')
  })
  it('maps fetch failures and mentions CORS only when online', () => {
    expect(statusFromFetchError(true).status).toBe('network'); expect(statusFromFetchError(true).detail).toMatch(/CORS/)
    expect(statusFromFetchError(false).detail).not.toMatch(/CORS/)
  })
  it('callProvider maps real outcomes and hides the key', async () => {
    mockFetch({ status: 401, body: { error: { message: `Bad key ${KEY}` } } })
    const r = await callProvider('https://x.example', { headers: {}, body: {} }, 1000, undefined, [KEY])
    expect(r.status).toBe('auth-failed'); expect(r.detail).not.toContain(KEY)
    mockFetch('reject'); expect((await callProvider('https://x.example', { headers: {} }, 1000)).status).toBe('network')
  })
  it('callProvider times out', async () => {
    vi.stubGlobal('fetch', vi.fn((_u: string, o: any) => new Promise((_r, rej) => o.signal.addEventListener('abort', () => rej(new Error('abort'))))))
    const r = await callProvider('https://x.example', { headers: {} }, 20); expect(r.status).toBe('network'); expect(r.detail).toMatch(/No answer/)
  })
  it('baseStatus never reports connected and flags unsupported/not-configured', () => {
    const c = newProfile('openai-compatible'); expect(baseStatus(c, false)).toBe('unsupported')
    expect(baseStatus({ ...c, baseUrl: 'https://x.example/v1', model: 'm' }, false)).toBe('ready')
    expect(baseStatus(newProfile('openai'), false)).toBe('not-configured'); expect(baseStatus(newProfile('openai'), true)).toBe('ready')
  })
  it('testProfile performs a real request and sets status from it', async () => {
    const p = { ...newProfile('openai'), id: 't1', keyMode: 'session' as const }
    await saveProfile(p); await setSecret('t1', 'session', KEY)
    mockFetch({ status: 401, body: { error: { message: 'no' } } }); expect((await testProfile(p)).status).toBe('auth-failed')
    mockFetch({ body: { choices: [{ message: { content: '{"ok":true}' } }] } }); const ok = await testProfile(p); expect(ok.status).toBe('connected'); expect(ok.json).toBe(true)
    mockFetch({ body: { choices: [{ message: { content: 'plain words' } }] } }); const nj = await testProfile(p); expect(nj.status).toBe('connected'); expect(nj.json).toBe(false)
    mockFetch({ status: 404 }); expect((await testProfile(p)).status).toBe('model-unavailable')
    mockFetch({ status: 503 }); expect((await testProfile(p)).status).toBe('provider-error')
    mockFetch('reject'); expect((await testProfile(p)).status).toBe('network')
    expect((await testProfile({ ...newProfile('openai-compatible'), id: 't2' })).status).toBe('unsupported')
    expect((await testProfile({ ...newProfile('gemini'), id: 't3' })).status).toBe('not-configured')
    const hub = JSON.stringify(getPrefs().aiHub); expect(hub).not.toContain(KEY)
    await clearSecret('t1')
  })
})

describe('sanitizer', () => {
  it('strips key-like strings', () => {
    for (const s of [`Bearer ${KEY}`, 'x-api-key: abcdef123456', 'AIzaSyA1234567890abcdefghijk', 'https://x/?key=abc123def456', `token=${KEY}`, 'sk-ant-api03-abcdefghijkl', 'A'.repeat(40)])
      expect(sanitize(`failed: ${s} end`)).not.toMatch(/abcdef123456|AIzaSy|abc123def456|SECRET1234|api03|AAAAAAAA/)
    expect(sanitize('plain message')).toBe('plain message')
    expect(sanitize('my secret value zzzzzz', ['zzzzzz'])).toContain('[hidden]')
    expect(sanitize('x'.repeat(10) + ' ' + 'y '.repeat(200)).length).toBeLessThanOrEqual(200)
  })
  it('log entries are sanitized and capped at 50', async () => {
    for (let i = 0; i < 55; i++) await logUse({ profileId: 'p', feature: 'cards', ok: false, detail: `Bearer ${KEY}` })
    const log = getPrefs().aiHub.log; expect(log).toHaveLength(50); expect(JSON.stringify(log)).not.toContain('SECRET1234')
  })
})

describe('validation', () => {
  it('base URL: https or localhost only', () => {
    expect(validateBaseUrl('https://a.example/v1')).toBeNull(); expect(validateBaseUrl('http://localhost:11434/v1')).toBeNull()
    expect(validateBaseUrl('http://a.example')).not.toBeNull(); expect(validateBaseUrl('ftp://a')).not.toBeNull(); expect(validateBaseUrl('nope')).not.toBeNull()
  })
  it('headers: names validated, credential headers rejected', () => {
    expect(parseHeaders('X-Title: a\nHTTP-Referer: b').headers).toEqual({ 'X-Title': 'a', 'HTTP-Referer': 'b' })
    expect(parseHeaders('Authorization: Bearer x').error).toBeTruthy(); expect(parseHeaders('X-API-Key: x').error).toBeTruthy()
    expect(parseHeaders('bad name: x').error).toBeTruthy(); expect(parseHeaders('A: 1\na: 2').error).toBeTruthy(); expect(parseHeaders('nocolon').error).toBeTruthy()
  })
})

describe('migration, selection, secrets, capabilities', () => {
  it('legacyToProfile only when something exists', () => {
    const ai = getPrefs().ai
    expect(legacyToProfile({ ...ai, provider: 'openai', proxyUrl: undefined }, false)).toBeNull()
    const p = legacyToProfile({ ...ai, provider: 'compatible', baseUrl: 'https://x.example/v1', model: 'm' }, false)!
    expect(p.adapter).toBe('openai-compatible'); expect(p.status).toBe('ready'); expect(p.keyMode).toBe('device')
  })
  it('migrates a legacy key to a profile and keeps the legacy slot readable', async () => {
    await clearAllData(); await initStore()
    await setPrefs(s => ({ ...s, ai: { ...s.ai, provider: 'openai', model: 'gpt-x' } })); await setAiKey(KEY, 'openai')
    await migrateLegacy(true)
    const h = getPrefs().aiHub; expect(h.profiles).toHaveLength(1); expect(h.profiles[0]).toMatchObject({ id: 'legacy-openai', adapter: 'openai', model: 'gpt-x', keyMode: 'device' }); expect(h.defaultId).toBe('legacy-openai')
    expect(h.profiles[0].status).not.toBe('connected')
    expect(await getSecret('legacy-openai', 'device')).toBe(KEY)
    await migrateLegacy(true); expect(getPrefs().aiHub.profiles).toHaveLength(1)
    expect(JSON.stringify(h)).not.toContain('SECRET1234')
  })
  it('selects feature, then default, then first enabled, legacy only without profiles', () => {
    const ai = getPrefs().ai, a = { ...newProfile('openai'), id: 'a' }, b = { ...newProfile('gemini'), id: 'b' }, c = { ...newProfile('anthropic'), id: 'c', enabled: false }
    const hub = { profiles: [a, b, c], defaultId: 'b', featureModels: { cards: { profileId: 'a', model: 'zz' }, quiz: { profileId: 'c', model: 'q' } }, log: [] }
    expect(selectProfile(hub, ai, 'cards')).toMatchObject({ model: 'zz', profile: { id: 'a' } })
    expect(selectProfile(hub, ai, 'quiz')?.profile.id).toBe('b'); expect(selectProfile(hub, ai)?.profile.id).toBe('b')
    expect(selectProfile({ ...hub, defaultId: 'c' }, ai)?.profile.id).toBe('a')
    expect(selectProfile({ ...hub, profiles: [c] }, ai)).toBeNull()
    expect(selectProfile({ profiles: [], featureModels: {}, log: [] }, ai)?.legacy).toBe(true)
  })
  it('secret never appears in exported data, session and device modes', async () => {
    await setSecret('e1', 'session', KEY); await setSecret('e2', 'device', KEY + 'b')
    expect(await getSecret('e1', 'session')).toBe(KEY); expect(await hasSecret('e2', 'device')).toBe(true)
    const out = JSON.stringify(buildExport()); expect(out).not.toContain('SECRET1234')
    await clearSecret('e1'); await clearSecret('e2'); expect(await hasSecret('e1', 'session')).toBe(false); expect(await hasSecret('e2', 'device')).toBe(false)
  })
  it('capability fallback suggests another profile or explains', () => {
    const nopdf = { ...newProfile('openai'), name: 'Mine' }, withPdf = { ...newProfile('gemini'), name: 'Gem' }
    const m = capabilityProblem(nopdf, { pdf: true }, [nopdf, withPdf])!; expect(m).toContain('Gem'); expect(m).toMatch(/PDF/)
    expect(capabilityProblem(nopdf, { pdf: true }, [nopdf])).toMatch(/paste the text/)
    expect(capabilityProblem(withPdf, { pdf: true, vision: true }, [withPdf])).toBeNull()
    expect(capabilityProblem(newProfile('openai-compatible'), { vision: true }, [])).toMatch(/photos/)
  })
})
