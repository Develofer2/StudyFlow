import { memo, useEffect, useState, type ReactNode } from 'react'
import { envInfo, envProgressVisual, isEnvId, DEFAULT_ENV } from '@/domain/env'
import { ENV_CSS } from './scenes/kit'
import { SCENES_A } from './scenes/a'
import { SCENES_B } from './scenes/b'

const SCENES = { ...SCENES_A, ...SCENES_B }
export interface EnvSceneProps { id: string; progress: number; running: boolean; reduced: boolean; staticBackground?: boolean; decorative?: boolean; className?: string; children?: ReactNode; childrenWidth?: number; centered?: boolean }

function useHidden() {
  const [h, setH] = useState(() => typeof document !== 'undefined' && document.hidden)
  useEffect(() => { const f = () => setH(document.hidden); document.addEventListener('visibilitychange', f); return () => document.removeEventListener('visibilitychange', f) }, [])
  return h
}

/** Illustrated SVG scene. Text zone is the soft scrim in the middle; the buddy slot sits at the scene's anchor. */
function EnvSceneImpl({ id, progress, running, reduced, staticBackground, decorative, className, children, childrenWidth = 30, centered }: EnvSceneProps) {
  const hidden = useHidden()
  const eid = isEnvId(id) ? id : DEFAULT_ENV, info = envInfo(eid), Scene = SCENES[eid]
  const { level } = envProgressVisual(progress)
  const anim = !reduced && !staticBackground, paused = !running || hidden
  return <div className={`env-sc relative mx-auto w-full overflow-hidden rounded-card border hairline ${anim ? 'env-anim' : ''} ${paused ? 'env-pause' : ''} ${className ?? ''}`}
    style={{ aspectRatio: '8 / 5', width: 'min(100%, 96dvh)', contain: 'paint' }}
    {...(decorative ? { 'aria-hidden': true } : { role: 'img', 'aria-label': info.aria })}>
    <style>{ENV_CSS}</style>
    <svg viewBox="0 0 400 250" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><Scene p={level} /></svg>
    <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(ellipse 46% 40% at 50% 42%, color-mix(in srgb, var(--bg) 78%, transparent), color-mix(in srgb, var(--bg) 40%, transparent) 62%, transparent 100%)' }} />
    {children && <div className="absolute" style={{ left: `${Math.min(100 - childrenWidth / 2, Math.max(childrenWidth / 2, centered ? 50 : info.anchor.x))}%`, top: `${info.anchor.y}%`, width: `${childrenWidth}%`, transform: 'translate(-50%, -100%)' }}>{children}</div>}
  </div>
}
export default memo(EnvSceneImpl)
