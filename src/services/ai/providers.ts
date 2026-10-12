import type { AiAdapter, AiProviderId } from '@/types'
/** Adapter-level defaults. Vision/PDF are provider-level ASSUMPTIONS; only JSON output is ever verified by a real test. */
export interface AdapterInfo { id: AiAdapter; label: string; defaultModel: string; keyHint: string; keyUrl: string; vision: boolean; pdf: boolean; note: string; limits: string }
export const ADAPTERS: Record<AiAdapter, AdapterInfo> = {
  gemini: { id: 'gemini', label: 'Google Gemini', defaultModel: 'gemini-3.5-flash-lite', keyHint: 'Paste your Gemini key', keyUrl: 'aistudio.google.com', vision: true, pdf: true, note: 'Photos and PDFs are assumed supported.', limits: 'Key is sent in a header, never in the URL. Usage limits and billing are set by Google for your account.' },
  openai: { id: 'openai', label: 'OpenAI', defaultModel: 'gpt-4o-mini', keyHint: 'sk-...', keyUrl: 'platform.openai.com', vision: true, pdf: false, note: 'Photos assumed supported. PDFs are not sent directly: paste text or photograph pages.', limits: 'Billing is per use under your OpenAI account. Some models reject custom limits; use Test connection.' },
  anthropic: { id: 'anthropic', label: 'Anthropic (Claude)', defaultModel: 'claude-haiku-4-5-20251001', keyHint: 'sk-ant-...', keyUrl: 'console.anthropic.com', vision: true, pdf: true, note: 'Photos and PDFs are assumed supported.', limits: 'Browser calls need the anthropic-dangerous-direct-browser-access header (added for you). If your network or account blocks it, use a proxy URL.' },
  'openai-compatible': { id: 'openai-compatible', label: 'OpenAI-compatible', defaultModel: '', keyHint: 'Key for your provider (optional for local servers)', keyUrl: '', vision: false, pdf: false, note: 'Compatible only if the provider follows the OpenAI chat-completions format; use Test connection. Photo support depends on the model.', limits: 'Many providers block direct browser calls (CORS). Local servers such as Ollama must allow this page as an origin.' },
}
export const ADAPTER_LIST = Object.values(ADAPTERS)
/** Presets exist only for adapters implemented in client.ts, plus one generic compatible entry. */
export const PRESETS: { id: string; label: string; adapter: AiAdapter }[] = [
  { id: 'gemini', label: 'Google Gemini', adapter: 'gemini' }, { id: 'openai', label: 'OpenAI', adapter: 'openai' },
  { id: 'anthropic', label: 'Anthropic (Claude)', adapter: 'anthropic' }, { id: 'compatible', label: 'OpenAI-compatible (generic)', adapter: 'openai-compatible' },
]
/** Address hints only. These services are untested here. */
export const QUICK_FILL: { name: string; baseUrl: string }[] = [
  { name: 'OpenRouter', baseUrl: 'https://openrouter.ai/api/v1' }, { name: 'Groq', baseUrl: 'https://api.groq.com/openai/v1' },
  { name: 'Together', baseUrl: 'https://api.together.xyz/v1' }, { name: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1' },
  { name: 'Mistral', baseUrl: 'https://api.mistral.ai/v1' }, { name: 'Ollama (local)', baseUrl: 'http://localhost:11434/v1' },
]
export const adapterOf = (p: AiProviderId): AiAdapter => (p === 'compatible' ? 'openai-compatible' : p)

/** Legacy shape kept for older UI code. */
export interface ProviderInfo { id: AiProviderId; label: string; defaultModel: string; keyHint: string; keyUrl: string; vision: boolean; pdf: boolean; note: string }
export const PROVIDERS: ProviderInfo[] = (['gemini', 'openai', 'anthropic', 'compatible'] as AiProviderId[]).map(id => { const a = ADAPTERS[adapterOf(id)]; return { id, label: a.label, defaultModel: a.defaultModel, keyHint: a.keyHint, keyUrl: a.keyUrl, vision: a.vision, pdf: a.pdf, note: a.note } })
export const providerInfo = (id: AiProviderId) => PROVIDERS.find(p => p.id === id) ?? PROVIDERS[0]
export const GEMINI_FALLBACKS = ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-3.8-flash']
export const OPENAI_BASE = 'https://api.openai.com/v1'
