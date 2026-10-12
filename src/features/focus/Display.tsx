import { cx } from '@/components/ui'

export const fmtClock = (ms: number) => {
  const s = Math.ceil(ms / 1000), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60
  const p = (n: number) => String(n).padStart(2, '0')
  return h ? `${h}:${p(m)}:${p(r)}` : `${p(m)}:${p(r)}`
}

const digits = 'font-mono font-semibold tnum leading-none tracking-tight text-ink'

export default function TimerDisplay({ style, clock, progress, label, sub, big }: { style: 'ring' | 'minimal' | 'bar'; clock: string; progress: number; label: string; sub: string; big: boolean }) {
  const v = Math.min(1, Math.max(0, progress)), r = 90, c = 2 * Math.PI * r
  const size = big ? 'text-[clamp(4.5rem,22vw,14rem)]' : 'text-[clamp(3.5rem,18vw,7rem)]'
  const title = <div className="text-sm font-bold uppercase tracking-widest text-muted">{label}</div>
  if (style === 'ring') return (
    <div className={cx('relative mx-auto aspect-square w-full', big ? 'max-w-[min(34rem,80vh)]' : 'max-w-[22rem]')} role="img" aria-label={`${label}, ${clock} remaining`}>
      <svg viewBox="0 0 200 200" className="absolute inset-0 -rotate-90"><circle cx="100" cy="100" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="8" />
        <circle cx="100" cy="100" r={r} fill="none" stroke="var(--primary)" strokeWidth="8" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - v)} /></svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">{title}<div className={cx(digits, big ? 'text-[clamp(3rem,13vw,9rem)]' : 'text-[clamp(2.5rem,13vw,4.25rem)]')}>{clock}</div><div className="text-sm text-muted">{sub}</div></div></div>)
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-3 py-4 text-center" role="img" aria-label={`${label}, ${clock} remaining`}>
      {title}<div className={cx(digits, size)}>{clock}</div><div className="text-sm text-muted">{sub}</div>
      {style === 'bar' && <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-surface2 border hairline"><div className="h-full rounded-full bg-brand" style={{ width: `${v * 100}%` }} /></div>}
    </div>)
}

export function CycleDots({ total, done, active }: { total: number; done: number; active: boolean }) {
  const d = done % total
  return <div className="flex items-center justify-center gap-2" role="img" aria-label={`Session ${Math.min(d + 1, total)} of ${total} before a long break`}>
    {Array.from({ length: total }, (_, i) => <span key={i} className={cx('h-3 w-3 rounded-full border border-brand', i < d ? 'bg-brand' : i === d && active ? 'bg-brand/40' : 'bg-transparent')} />)}</div>
}
