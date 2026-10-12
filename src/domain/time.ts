// Day keys are "YYYY-MM-DD" strings in the user's timezone; all calendar math happens on keys, so DST never skews a "day".
export function dayKey(input: string | number | Date, tz: string): string {
  const d = input instanceof Date ? input : new Date(input)
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
  return parts
}
const toUTC = (k: string) => { const [y, m, d] = k.split('-').map(Number); return Date.UTC(y, m - 1, d) }
const fromUTC = (t: number) => new Date(t).toISOString().slice(0, 10)
export const addDays = (k: string, n: number) => fromUTC(toUTC(k) + n * 86400000)
export const diffDays = (a: string, b: string) => Math.round((toUTC(a) - toUTC(b)) / 86400000)
export const weekdayOf = (k: string) => new Date(toUTC(k)).getUTCDay()
export function startOfWeek(k: string, weekStartsOn: 0 | 1) { return addDays(k, -((weekdayOf(k) - weekStartsOn + 7) % 7)) }
export const startOfMonth = (k: string) => k.slice(0, 8) + '01'
export function daysBetween(from: string, to: string): string[] {
  const out: string[] = []
  for (let k = from; diffDays(k, to) <= 0; k = addDays(k, 1)) out.push(k)
  return out
}
export interface Range { from: string; to: string }
export function previousRange(r: Range): Range { const n = diffDays(r.to, r.from) + 1; return { from: addDays(r.from, -n), to: addDays(r.from, -1) } }
export const uid = () => (typeof globalThis.crypto?.randomUUID === "function" ? crypto.randomUUID() : 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36))
export const nowIso = () => new Date().toISOString()
export function fmtDuration(sec: number) {
  const m = Math.round(sec / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60), r = m % 60
  return r ? `${h}h ${r}m` : `${h}h`
}
