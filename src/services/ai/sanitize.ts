/** Strips anything that looks like a credential before text is stored, logged or shown. */
const RULES: [RegExp, string][] = [
  [/\bBearer\s+[A-Za-z0-9._~+/=-]+/gi, '[hidden]'],
  [/([?&](?:key|api_key|apikey|token|access_token)=)[^&\s"']+/gi, '$1[hidden]'],
  [/\b(?:api[_-]?key|x-api-key|x-goog-api-key|authorization|token|secret)["']?\s*[:=]\s*["']?[^\s"',}&]+/gi, '[hidden]'],
  [/\b(?:sk|pk|rk)-[A-Za-z0-9_-]{6,}/g, '[hidden]'],
  [/\bAIza[0-9A-Za-z_-]{16,}/g, '[hidden]'],
  [/\b[A-Za-z0-9_-]{32,}\b/g, '[hidden]'],
]
export function sanitize(text: unknown, secrets: string[] = [], max = 200): string {
  let s = String(text ?? '')
  for (const k of secrets) if (k && k.length >= 6) s = s.split(k).join('[hidden]')
  for (const [re, to] of RULES) s = s.replace(re, to)
  s = s.replace(/\s+/g, ' ').trim()
  return s.length > max ? s.slice(0, max - 1) + '…' : s
}
/** Shows only the last 4 characters of a saved secret. */
export const maskSecret = (k: string) => (k.length <= 8 ? 'saved' : '••••' + k.slice(-4))
