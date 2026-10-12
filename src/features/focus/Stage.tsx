import { useEffect, useRef } from 'react'
import { Users } from 'lucide-react'
import { cx } from '@/components/ui'
import { setPrefs, usePrefs } from '@/data/store'
import { chime } from '@/services/platform'
import { STATE_LABEL } from '@/domain/buddyState'
import BuddyAvatar from '../buddy/BuddyAvatar'
import { useBuddy } from '../buddy/useBuddy'
import { useReducedMotion } from '../buddy/useMotion'
import AvatarArt from '../avatar/AvatarArt'
import { sanitizeAvatar } from '@/domain/avatar'
import EnvScene from '../env/EnvScene'

export default function Stage({ progress, running, clock, big, preparing }: { progress: number; running: boolean; clock: string; big: boolean; preparing: boolean }) {
  const prefs = usePrefs(); const b = prefs.buddy2; const live = useBuddy({ preparing }); const reducedMotion = useReducedMotion()
  const prev = useRef(live.state)
  useEffect(() => { if (live.state === 'goal' && prev.current !== 'goal' && b.sound) chime(); prev.current = live.state }, [live.state, b.sound])
  const showBuddy = b.enabled && prefs.env.showBuddy, showAvatar = prefs.env.showAvatar !== false
  const pose = live.state === 'focusing' || live.state === 'starting' ? 'study' : live.state === 'completed' || live.state === 'goal' ? 'cheer' : 'idle'
  const held = pose === 'study' ? '' : live.state === 'break' || live.state === 'returning' ? 'cocoa' : live.state === 'completed' || live.state === 'goal' ? 'trophy' : sanitizeAvatar(prefs.avatar).held
  const buddyEl = showBuddy && <BuddyAvatar kind={b.kind} state={live.state} size="100%" outfit={b.outfit} intensity={b.intensity} name={live.name} />
  return (
    <div className="space-y-2">
      <div className={cx('mx-auto', big ? 'max-w-3xl' : 'max-w-[min(28rem,100%,48dvh)]')}>
        <EnvScene id={prefs.env.id} centered={showAvatar} childrenWidth={showAvatar && showBuddy ? 54 : 30} progress={progress} running={running} reduced={reducedMotion || prefs.env.staticBackground}>
          {showAvatar && showBuddy ? <div className="flex items-end gap-[4%]"><div className="w-1/2"><AvatarArt cfg={{ ...sanitizeAvatar(prefs.avatar), held }} pose={pose} bg={false} size="100%" animate={running} label="Your avatar studying" /></div><div className="w-1/2">{buddyEl}</div></div>
            : showAvatar ? <AvatarArt cfg={{ ...sanitizeAvatar(prefs.avatar), held }} pose={pose} bg={false} size="100%" animate={running} label="Your avatar studying" /> : buddyEl}
        </EnvScene>
      </div>
      {b.enabled && <div className="mx-auto flex max-w-md items-center gap-2">
        {b.messages ? <div className="min-w-0 flex-1 rounded-card border hairline bg-surface px-3 py-1.5 text-left" aria-live="polite">
          <div key={live.message} className="anim-rise text-sm font-semibold leading-snug text-ink"><span className="font-display font-bold">{live.name}</span>: {live.isQuote ? `\u201C${live.message}\u201D` : live.message}</div>
          <div className="text-[10px] font-bold uppercase tracking-wide text-muted">{live.isQuote ? `Motivation from ${live.name}` : b.coStudy ? `${STATE_LABEL[live.state]} · ${clock} · virtual buddy` : 'Built-in, rule-based'}</div></div> : <div className="flex-1" />}
        <button aria-pressed={b.coStudy} aria-label="Co-study with buddy" title="Co-study" onClick={() => setPrefs(p => ({ ...p, buddy2: { ...p.buddy2, coStudy: !p.buddy2.coStudy } }))}
          className={cx('inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm font-bold transition', b.coStudy ? 'border-brand bg-brand text-brand-fg' : 'hairline bg-surface2 hover:brightness-95')}><Users size={16} />Co-study</button>
      </div>}
    </div>)
}
