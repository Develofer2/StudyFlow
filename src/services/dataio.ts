import { z } from 'zod'
import { COLLECTIONS, type CollectionName } from '@/data/db'
import { getAll, getPrefs, putMany, removeMany, setPrefs } from '@/data/store'
import { nowIso } from '@/domain/time'
export const EXPORT_VERSION = 1
export const MAX_IMPORT_BYTES = 20 * 1024 * 1024
const rec = z.object({ id: z.string().min(1), createdAt: z.string(), updatedAt: z.string() }).passthrough()
const schema = z.object({ app: z.literal('studyflow'), version: z.number().int().min(1), exportedAt: z.string(), prefs: z.record(z.string(), z.unknown()).optional(), data: z.record(z.string(), z.array(z.unknown())) })

export function buildExport() {
  const { dismissedRecs: _d, ...prefs } = getPrefs()
  const data: Record<string, unknown[]> = {}
  for (const c of COLLECTIONS) data[c] = getAll(c)
  return { app: 'studyflow', version: EXPORT_VERSION, exportedAt: nowIso(), prefs, data } // no AI key, tokens or secrets
}
export function download(name: string, text: string, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([text], { type })); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
}
const csvCell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
export function toCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return ''
  const keys = [...new Set(rows.flatMap(r => Object.keys(r)))].filter(k => typeof rows[0][k] !== 'object')
  return [keys.join(','), ...rows.map(r => keys.map(k => csvCell(r[k])).join(','))].join('\n')
}
export interface ImportPreview { ok: boolean; error?: string; version?: number; counts: Partial<Record<CollectionName, { total: number; duplicates: number; invalid: number }>>; data?: Partial<Record<CollectionName, any[]>>; prefs?: Record<string, unknown> }
export function parseImport(text: string): ImportPreview {
  if (text.length > MAX_IMPORT_BYTES) return { ok: false, error: 'That file is larger than 20 MB, which is too large to import safely.', counts: {} }
  let json: unknown
  try { json = JSON.parse(text) } catch { return { ok: false, error: 'This file is not valid JSON. Choose a StudyFlow backup (.json).', counts: {} } }
  const p = schema.safeParse(json)
  if (!p.success) return { ok: false, error: 'This does not look like a StudyFlow backup.', counts: {} }
  if (p.data.version > EXPORT_VERSION) return { ok: false, error: `This backup is from a newer StudyFlow (v${p.data.version}). Update the app first.`, counts: {} }
  const counts: ImportPreview['counts'] = {}, data: Partial<Record<CollectionName, any[]>> = {}
  for (const c of COLLECTIONS) {
    const arr = p.data.data[c] ?? []
    const seen = new Set<string>(); let invalid = 0, dup = 0; const good: any[] = []
    const existing = new Set(getAll(c).map(r => r.id))
    for (const r of arr) { const v = rec.safeParse(r); if (!v.success) { invalid++; continue } if (seen.has(v.data.id)) { dup++; continue } seen.add(v.data.id); if (existing.has(v.data.id)) dup++; good.push(v.data) }
    if (arr.length) counts[c] = { total: arr.length, duplicates: dup, invalid }
    data[c] = good
  }
  return { ok: true, version: p.data.version, counts, data, prefs: p.data.prefs }
}
/** Merge: adds unknown records; for IDs that already exist, the newer updatedAt wins. Nothing is deleted. */
export async function applyMerge(pv: ImportPreview) {
  let added = 0, updated = 0
  for (const c of COLLECTIONS) {
    const local = new Map(getAll(c).map(r => [r.id, r]))
    const toPut = (pv.data?.[c] ?? []).filter(r => { const l = local.get(r.id); if (!l) { added++; return true } if (r.updatedAt > l.updatedAt) { updated++; return true } return false })
    await putMany(c, toPut, true)
  }
  return { added, updated }
}
export async function applyReplace(pv: ImportPreview) {
  const backup = buildExport()
  try {
    for (const c of COLLECTIONS) { await removeMany(c, getAll(c).map(r => r.id)); await putMany(c, pv.data?.[c] ?? [], true) }
    if (pv.prefs) await setPrefs(p => ({ ...p, ...(pv.prefs as object) }))
  } catch (e) { for (const c of COLLECTIONS) await putMany(c, backup.data[c] as any[], true); throw e }
}
