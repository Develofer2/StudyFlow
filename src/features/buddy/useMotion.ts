import { useSyncExternalStore } from 'react'
import { usePrefs } from '@/data/store'

const mq = () => (typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null)
const sub = (l: () => void) => { const m = mq(); m?.addEventListener?.('change', l); return () => m?.removeEventListener?.('change', l) }
export const usePrefersReduced = () => useSyncExternalStore(sub, () => !!mq()?.matches, () => false)
/** True when decorative motion must be off: user setting, OS setting, or an explicit still buddy. */
export function useReducedMotion() { const p = usePrefs(); return usePrefersReduced() || p.motion === 'off' }
