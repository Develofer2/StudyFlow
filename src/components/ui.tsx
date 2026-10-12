import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle2, ChevronDown, Info, TriangleAlert, X } from 'lucide-react'

export const cx = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(' ')

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'soft' | 'ghost' | 'danger'; size?: 'sm' | 'md' | 'lg' }
export function Button({ variant = 'soft', size = 'md', className, ...p }: BtnProps) {
  const v = { primary: 'bg-brand text-brand-fg hover:brightness-110 glow', soft: 'bg-surface2 text-ink hover:brightness-95 border hairline', ghost: 'text-ink hover:bg-surface2', danger: 'bg-bad text-bg hover:brightness-110' }[variant]
  const s = { sm: 'min-h-9 px-3 text-sm', md: 'min-h-11 px-4 text-[15px]', lg: 'min-h-14 px-6 text-lg' }[size]
  return <button type="button" {...p} className={cx('inline-flex items-center justify-center gap-2 rounded-[calc(var(--radius)*.7)] font-bold transition active:scale-[.98] disabled:opacity-50 disabled:pointer-events-none', v, s, className)} />
}
export const Card = ({ className, children, as: As = 'section', ...p }: { className?: string; children: ReactNode; as?: any } & Record<string, any>) =>
  <As {...p} className={cx('rounded-card border hairline bg-surface p-4 sm:p-5', className)}>{children}</As>

export function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: (id: string, describedBy?: string) => ReactNode }) {
  const id = useId(); const d = error ? id + '-e' : hint ? id + '-h' : undefined
  return <div className="space-y-1.5"><label htmlFor={id} className="block text-sm font-bold">{label}</label>{children(id, d)}
    {error ? <p id={id + '-e'} role="alert" className="text-sm text-bad flex gap-1.5"><TriangleAlert size={16} className="mt-0.5 shrink-0" />{error}</p> : hint ? <p id={id + '-h'} className="text-sm text-muted">{hint}</p> : null}</div>
}
const inputCls = 'w-full min-h-11 rounded-[calc(var(--radius)*.6)] border hairline bg-bg px-3 text-[15px] placeholder:text-muted/70 focus-visible:outline-offset-0'
export const Input = (p: InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={cx(inputCls, p.className)} />
export const Textarea = (p: TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...p} className={cx(inputCls, 'py-2.5 leading-relaxed', p.className)} />
export const Select = (p: SelectHTMLAttributes<HTMLSelectElement>) => <div className={cx('relative', p.className?.includes('w-auto') ? 'w-auto' : 'w-full')}>
  <select {...p} className={cx(inputCls, 'cursor-pointer appearance-none pr-11', p.className)} />
  <ChevronDown size={18} aria-hidden className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted" /></div>

export function Switch({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="flex w-full min-h-11 items-center justify-between gap-4 text-left">
    <span><span className="block font-bold text-[15px]">{label}</span>{hint && <span className="block text-sm text-muted">{hint}</span>}</span>
    <span className={cx('relative h-7 w-12 shrink-0 rounded-full shadow-[inset_0_0_0_1px_var(--border)] transition-colors', checked ? 'bg-brand' : 'bg-surface2')}><span className={cx('absolute left-1 top-1 size-5 rounded-full bg-white shadow-[0_1px_3px_rgb(0_0_0/.35)] transition-transform duration-200', checked ? 'translate-x-5' : 'translate-x-0 !bg-[var(--muted)]')} /></span></button>
}
export function Segmented<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode }[]; label: string }) {
  return <div role="radiogroup" aria-label={label} className="inline-flex max-w-full flex-wrap gap-1 rounded-[calc(var(--radius)*.7)] border hairline bg-surface2 p-1">
    {options.map(o => <button key={o.value} role="radio" aria-checked={value === o.value} onClick={() => onChange(o.value)} className={cx('min-h-9 whitespace-nowrap rounded-[calc(var(--radius)*.5)] px-3 text-sm font-bold transition', value === o.value ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink')}>{o.label}</button>)}</div>
}
export const Chip = ({ children, className }: { children: ReactNode; className?: string }) => <span className={cx('inline-flex items-center gap-1 rounded-full border hairline bg-surface2 px-2.5 py-0.5 text-xs font-bold', className)}>{children}</span>

export function Dialog({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null); const prev = useRef<Element | null>(null); const tid = useId()
  useEffect(() => {
    if (!open) return
    prev.current = document.activeElement
    const el = ref.current!; (el.querySelector<HTMLElement>('[data-autofocus],input,textarea,select') ?? el).focus()
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Tab') { const f = [...el.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input,textarea,select,[tabindex]:not([tabindex="-1"])')].filter(x => x.offsetParent !== null); if (!f.length) return
        const first = f[0], last = f[f.length - 1]; if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() } }
    }
    document.addEventListener('keydown', key); const ov = document.body.style.overflow; document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', key); document.body.style.overflow = ov; (prev.current as HTMLElement | null)?.focus?.() }
  }, [open, onClose])
  if (!open) return null
  return createPortal(<div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" style={{ animation: 'fade .15s' }}>
    <div className="absolute inset-0 bg-black/45" onClick={onClose} />
    <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={tid} tabIndex={-1} style={{ animation: 'sheet .22s ease' }}
      className={cx('relative z-10 flex max-h-[92dvh] w-full flex-col rounded-t-[calc(var(--radius)*1.4)] border hairline bg-surface text-ink shadow-2xl sm:rounded-[calc(var(--radius)*1.2)]', wide ? 'sm:max-w-2xl' : 'sm:max-w-lg')}>
      <div className="flex items-center justify-between gap-3 border-b hairline px-5 py-3.5"><h2 id={tid} className="font-display text-xl font-semibold">{title}</h2>
        <button aria-label="Close dialog" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full hover:bg-surface2"><X size={20} /></button></div>
      <div className="overflow-y-auto px-5 pb-6 pt-4 sm:px-6 sm:pb-6 safe-b">{children}</div></div></div>, document.body)
}
export function ConfirmDialog({ open, onClose, onConfirm, title, body, confirmLabel = 'Confirm', danger }: { open: boolean; onClose: () => void; onConfirm: () => void; title: string; body: ReactNode; confirmLabel?: string; danger?: boolean }) {
  return <Dialog open={open} onClose={onClose} title={title}><div className="space-y-5"><div className="text-[15px] leading-relaxed text-muted">{body}</div>
    <div className="flex justify-end gap-2"><Button onClick={onClose} data-autofocus>Cancel</Button><Button variant={danger ? 'danger' : 'primary'} onClick={() => { onConfirm(); onClose() }}>{confirmLabel}</Button></div></div></Dialog>
}

export function EmptyState({ icon, title, body, action }: { icon: ReactNode; title: string; body: string; action?: ReactNode }) {
  return <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-line px-6 py-10 text-center"><div className="grid h-12 w-12 place-items-center rounded-full bg-surface2 text-brand">{icon}</div>
    <h3 className="font-display text-xl font-semibold">{title}</h3><p className="max-w-sm text-[15px] text-muted">{body}</p>{action}</div>
}
export function ProgressRing({ value, size = 96, stroke = 9, children, label }: { value: number; size?: number; stroke?: number; children?: ReactNode; label: string }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, v = Math.min(1, Math.max(0, value))
  return <div className="relative grid place-items-center" style={{ width: size, height: size }} role="img" aria-label={`${label}: ${Math.round(v * 100)}%`}>
    <svg width={size} height={size} className="-rotate-90"><circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--primary)" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - v)} style={{ transition: 'stroke-dashoffset .5s' }} /></svg>
    <div className="absolute inset-0 grid place-items-center text-center">{children}</div></div>
}
export function PageHeader({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return <header className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><h1 className="font-display text-[clamp(1.75rem,5vw,2.5rem)] font-semibold leading-tight">{title}</h1>{sub && <p className="mt-1 max-w-xl text-[15px] text-muted">{sub}</p>}</div>{action}</header>
}

type Toast = { id: number; msg: string; kind: 'ok' | 'err' | 'info' }
const ToastCtx = createContext<(msg: string, kind?: Toast['kind']) => void>(() => {})
export const useToast = () => useContext(ToastCtx)
export function ToastProvider({ children }: { children: ReactNode }) {
  const [list, setList] = useState<Toast[]>([])
  const push = useCallback((msg: string, kind: Toast['kind'] = 'ok') => { const id = Date.now() + Math.random(); setList(l => [...l.slice(-2), { id, msg, kind }]); setTimeout(() => setList(l => l.filter(t => t.id !== id)), kind === 'err' ? 7000 : 3500) }, [])
  return <ToastCtx.Provider value={push}>{children}
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-[60] flex flex-col items-center gap-2 px-4 lg:bottom-6">
      {list.map(t => <div key={t.id} className="anim-rise pointer-events-auto flex max-w-md items-start gap-2 rounded-card border hairline bg-ink px-4 py-3 text-sm font-semibold text-bg shadow-xl">
        {t.kind === 'ok' ? <CheckCircle2 size={18} className="mt-0.5 shrink-0" /> : t.kind === 'err' ? <TriangleAlert size={18} className="mt-0.5 shrink-0" /> : <Info size={18} className="mt-0.5 shrink-0" />}{t.msg}</div>)}</div></ToastCtx.Provider>
}
export function useDebounced<T>(v: T, ms = 200) { const [d, setD] = useState(v); useEffect(() => { const t = setTimeout(() => setD(v), ms); return () => clearTimeout(t) }, [v, ms]); return d }
