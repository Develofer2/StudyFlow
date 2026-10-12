import { getDb } from '@/data/db'

/** Session mode keeps the key in sessionStorage (or memory); device mode stores it in IndexedDB kv. Neither is a secure vault. Secrets never enter prefs or exports. */
const mem = new Map<string, string>()
const SS = 'studyflow:ai-secret:'
const kv = (id: string) => 'ai-secret:' + id
const subs = new Set<() => void>()
export const onSecretChange = (l: () => void) => { subs.add(l); return () => { subs.delete(l) } }
const emit = () => subs.forEach(l => l())
const ss = () => { try { return globalThis.sessionStorage ?? null } catch { return null } }

/** Legacy slots written by older versions: 'ai-key' (gemini) and 'ai-key:<provider>'. Profiles migrated from them have id 'legacy-<provider>'. */
const legacyName = (id: string) => (id.startsWith('legacy-') ? (id === 'legacy-gemini' ? 'ai-key' : 'ai-key:' + id.slice(7)) : '')

export async function getSecret(id: string, mode: 'session' | 'device'): Promise<string> {
  if (mode === 'session') { try { return ss()?.getItem(SS + id) ?? mem.get(id) ?? '' } catch { return mem.get(id) ?? '' } }
  try {
    const db = await getDb()
    const v = (await db.get('kv', kv(id))) as string | undefined
    if (v) return v
    const l = legacyName(id); return l ? (((await db.get('kv', l)) as string | undefined) ?? '') : ''
  } catch { return '' }
}
export async function setSecret(id: string, mode: 'session' | 'device', value: string) {
  const v = value.trim()
  if (!v) return clearSecret(id, mode)
  if (mode === 'session') { mem.set(id, v); try { ss()?.setItem(SS + id, v) } catch {} }
  else { const db = await getDb(); await db.put('kv', v, kv(id)) }
  emit()
}
export async function clearSecret(id: string, mode?: 'session' | 'device') {
  if (mode !== 'device') { mem.delete(id); try { ss()?.removeItem(SS + id) } catch {} }
  if (mode !== 'session') { try { const db = await getDb(); await db.delete('kv', kv(id)); const l = legacyName(id); if (l) await db.delete('kv', l) } catch {} }
  emit()
}
export async function hasSecret(id: string, mode: 'session' | 'device') { return !!(await getSecret(id, mode)) }
/** Moves a secret when the user switches storage mode. */
export async function moveSecret(id: string, from: 'session' | 'device', to: 'session' | 'device') {
  if (from === to) return
  const v = await getSecret(id, from)
  if (v) await setSecret(id, to, v)
  await clearSecret(id, from)
}
