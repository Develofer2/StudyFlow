import { useSyncExternalStore, type ReactNode } from 'react'
import { Card } from '@/components/ui'

const mq = () => matchMedia('(min-width: 640px)')
export const useWide = () => useSyncExternalStore(l => { const m = mq(); m.addEventListener('change', l); return () => m.removeEventListener('change', l) }, () => mq().matches)

export const fmtDay = (k: string) => new Date(k + 'T12:00:00Z').toLocaleDateString(undefined, { day: 'numeric', month: 'short', timeZone: 'UTC' })
export const tick = { fill: 'var(--muted)', fontSize: 12 }
export const tipStyle = { contentStyle: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text)', fontSize: 13 }, itemStyle: { color: 'var(--text)' }, labelStyle: { color: 'var(--muted)', fontWeight: 700 }, cursor: { fill: 'var(--surface-2)', opacity: 0.6 } }
export const tickInterval = (n: number, wide: boolean) => Math.max(0, Math.ceil(n / (wide ? 10 : 5)) - 1)

/** Every chart ships with a real table so the data is reachable without sight or a pointer. */
export function DataTable({ caption, head, rows }: { caption: string; head: string[]; rows: (string | number)[][] }) {
  return <details className="mt-3 text-sm"><summary className="min-h-9 cursor-pointer py-1.5 font-bold text-muted hover:text-ink">View as table</summary>
    <div className="mt-1 max-h-64 overflow-auto rounded-lg border hairline"><table className="w-full text-left"><caption className="sr-only">{caption}</caption>
      <thead className="sticky top-0 bg-surface2"><tr>{head.map(h => <th key={h} scope="col" className="px-3 py-1.5 font-bold">{h}</th>)}</tr></thead>
      <tbody>{rows.map((r, i) => <tr key={i} className="border-t hairline">{r.map((c, j) => j === 0 ? <th key={j} scope="row" className="px-3 py-1.5 font-semibold">{c}</th> : <td key={j} className="tnum px-3 py-1.5">{c}</td>)}</tr>)}</tbody></table></div></details>
}
export function ChartCard({ title, sub, children, aside }: { title: string; sub?: string; children: ReactNode; aside?: ReactNode }) {
  return <Card className="break-inside-avoid"><div className="mb-3 flex items-start justify-between gap-3"><div><h2 className="font-display text-xl font-semibold">{title}</h2>{sub && <p className="text-sm text-muted">{sub}</p>}</div>{aside}</div>{children}</Card>
}
export const NoData = ({ text }: { text: string }) => <p className="grid min-h-28 place-items-center rounded-lg border border-dashed border-line px-4 text-center text-sm text-muted">{text}</p>
export const Stat = ({ label, value, sub }: { label: string; value: ReactNode; sub?: string }) => <div className="rounded-lg bg-surface2 px-3 py-2.5"><p className="text-xs font-bold uppercase tracking-wide text-muted">{label}</p><p className="font-display text-2xl font-semibold tnum">{value}</p>{sub && <p className="text-xs text-muted">{sub}</p>}</div>
