import { MESSAGE_LABEL } from '@/domain/buddyMessages'

export default function BuddyBubble({ name, text }: { name: string; text: string }) {
  return <div className="relative mx-auto max-w-sm rounded-card border hairline bg-surface px-4 py-2.5 text-left shadow-sm">
    <div className="text-sm font-semibold text-ink"><span className="font-display font-bold">{name}</span>: {text}</div>
    <div className="mt-0.5 text-[11px] font-bold uppercase tracking-wide text-muted">{MESSAGE_LABEL}</div></div>
}
