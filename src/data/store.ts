import { useSyncExternalStore } from 'react'
import type { Base, Prefs, TimerSnapshot } from '@/types'
import { COLLECTIONS, describeStorageError, getDb, type CollectionName } from './db'
import { BUILT_IN_PRESETS, defaultPrefs } from './defaults'
import { sanitizeAvatar } from '@/domain/avatar'
import { migrateCursor } from '@/domain/cursors'
import { idleTimer } from '@/domain/timer'
import { nowIso, uid } from '@/domain/time'

type Rec = Base & Record<string, any>
const cache = {} as Record<CollectionName, Rec[]>
for (const c of COLLECTIONS) cache[c] = []
let prefs: Prefs = defaultPrefs()
let timer: TimerSnapshot = idleTimer()
const listeners = new Set<() => void>()
const errorListeners = new Set<(msg: string) => void>()
let lastError: string | null = null
const emit = () => listeners.forEach(l => l())
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l) } }
export const onStorageError = (l: (m: string) => void) => { errorListeners.add(l); return () => { errorListeners.delete(l) } }
function fail(e: unknown) { lastError = describeStorageError(e); console.error('[studyflow] storage error', e); errorListeners.forEach(l => l(lastError!)) }
export const getLastStorageError = () => lastError

const PREF_LS = 'studyflow:prefs'
export async function initStore() {
  try {
    const db = await getDb()
    for (const c of COLLECTIONS) cache[c] = (await db.getAll(c as any)) as Rec[]
    const p = (await db.get('kv', 'prefs')) as Partial<Prefs> | undefined
    if (p) prefs = mergePrefs(defaultPrefs(), p)
    else { try { const ls = localStorage.getItem(PREF_LS); if (ls) prefs = mergePrefs(defaultPrefs(), JSON.parse(ls)) } catch {} }
    const t = (await db.get('kv', 'timer')) as TimerSnapshot | undefined
    if (t) timer = t
    if (!cache.presets.length) { cache.presets = BUILT_IN_PRESETS.map(p => ({ ...p })); for (const p of cache.presets) await db.put('presets', p) }
  } catch (e) {
    fail(e)
    try { const ls = localStorage.getItem(PREF_LS); if (ls) prefs = mergePrefs(defaultPrefs(), JSON.parse(ls)) } catch {}
    if (!cache.presets.length) cache.presets = BUILT_IN_PRESETS.map(p => ({ ...p }))
  }
  emit()
}
function mergePrefs(base: Prefs, p: any): Prefs {
  const out: any = { ...base, ...p }
  for (const k of ['reminders', 'ai', 'shareFields', 'game', 'buddy2', 'env', 'sound', 'forest', 'habits', 'aiHub', 'journey', 'cursor', 'touch', 'avatar'] as const) out[k] = { ...(base as any)[k], ...(p?.[k] ?? {}) }
  { const m = migrateCursor(out.cursor); out.cursor = { ...out.cursor, ...m }; delete out.cursor.id }
  out.avatar = sanitizeAvatar(out.avatar)
  if (out.ai?.model === 'gemini-2.5-flash') out.ai.model = base.ai.model
  return out
}

export function useCollection<T extends Rec = Rec>(name: CollectionName): T[] { return useSyncExternalStore(subscribe, () => cache[name]) as T[] }
export const usePrefs = () => useSyncExternalStore(subscribe, () => prefs)
export const useTimerSnapshot = () => useSyncExternalStore(subscribe, () => timer)
export const getPrefs = () => prefs
export const getAll = <T extends Rec = Rec>(name: CollectionName) => cache[name] as T[]
export const getTimer = () => timer

export async function put<T extends Partial<Rec>>(name: CollectionName, rec: T, keepTs = false): Promise<T & Rec> {
  const now = nowIso()
  const existing = rec.id ? cache[name].find(r => r.id === rec.id) : undefined
  const full = { ...existing, ...rec, id: rec.id ?? uid(), createdAt: existing?.createdAt ?? rec.createdAt ?? now, updatedAt: keepTs && rec.updatedAt ? rec.updatedAt : now } as T & Rec
  cache[name] = existing ? cache[name].map(r => (r.id === full.id ? full : r)) : [...cache[name], full]
  emit()
  try { await (await getDb()).put(name as any, full) } catch (e) { fail(e) }
  return full
}
export async function putMany(name: CollectionName, recs: Partial<Rec>[], keepTs = false) { for (const r of recs) await put(name, r, keepTs) }
export async function remove(name: CollectionName, id: string) {
  cache[name] = cache[name].filter(r => r.id !== id); emit()
  try { await (await getDb()).delete(name as any, id) } catch (e) { fail(e) }
}
export async function removeMany(name: CollectionName, ids: string[]) { for (const id of ids) await remove(name, id) }

export async function setPrefs(patch: Partial<Prefs> | ((p: Prefs) => Prefs)) {
  prefs = typeof patch === 'function' ? patch(prefs) : { ...prefs, ...patch }
  emit()
  try { localStorage.setItem(PREF_LS, JSON.stringify(prefs)) } catch {}
  try { await (await getDb()).put('kv', prefs, 'prefs') } catch (e) { fail(e) }
}
export async function setTimer(s: TimerSnapshot) {
  timer = s; emit()
  try { await (await getDb()).put('kv', s, 'timer') } catch (e) { fail(e) }
}

/** AI key lives only in this device's IndexedDB `kv` store under a separate key; it is never part of prefs, export or sharing. */
const keyName = (p: string) => (p === 'gemini' ? 'ai-key' : 'ai-key:' + p)
export async function getAiKey(provider: string = getPrefs().ai.provider): Promise<string> { try { return ((await (await getDb()).get('kv', keyName(provider))) as string) ?? '' } catch { return '' } }
export async function setAiKey(k: string, provider: string = getPrefs().ai.provider) { try { const db = await getDb(); if (k) await db.put('kv', k, keyName(provider)); else await db.delete('kv', keyName(provider)) } catch (e) { fail(e) } }
export async function aiCacheGet(h: string) { try { return (await (await getDb()).get('kv', 'aicache:' + h)) as string | undefined } catch { return undefined } }
export async function aiCacheSet(h: string, v: string) { try { await (await getDb()).put('kv', v, 'aicache:' + h) } catch {} }

export async function clearAllData() {
  const db = await getDb()
  for (const c of COLLECTIONS) { await db.clear(c as any); cache[c] = [] }
  await db.clear('kv'); try { localStorage.removeItem(PREF_LS) } catch {}
  prefs = defaultPrefs(); timer = idleTimer()
  cache.presets = BUILT_IN_PRESETS.map(p => ({ ...p })); for (const p of cache.presets) await db.put('presets', p)
  emit()
}
export async function replaceAll(data: Partial<Record<CollectionName, Rec[]>>) {
  const db = await getDb()
  for (const c of COLLECTIONS) { if (!data[c]) continue; await db.clear(c as any); cache[c] = data[c]!; for (const r of data[c]!) await db.put(c as any, r) }
  if (!cache.presets.length) { cache.presets = BUILT_IN_PRESETS.map(p => ({ ...p })); for (const p of cache.presets) await db.put('presets', p) }
  emit()
}
