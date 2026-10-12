export default function Logo({ size = 36, className = '' }: { size?: number; className?: string }) {
  return <svg viewBox="0 0 64 64" width={size} height={size} className={className} role="img" aria-label="StudyFlow">
    <rect width="64" height="64" rx="15" className="fill-[var(--primary)]" />
    <path d="M17 47C17 27 30 15 49 15C49 35 37 47 17 47Z" className="fill-[var(--primary-fg)]" />
    <path d="M12 52L22 42" className="stroke-[var(--primary-fg)]" strokeWidth="4" strokeLinecap="round" fill="none" />
    <path d="M24 40L39 25" className="stroke-[var(--primary)]" strokeWidth="3.6" strokeLinecap="round" fill="none" />
  </svg>
}
