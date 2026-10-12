import { useEffect, useSyncExternalStore } from 'react'
import { usePrefs } from '@/data/store'
import { cursorCss } from '@/domain/cursors'

const mq = () => matchMedia('(hover: hover) and (pointer: fine)')
export const useDesktopPointer = () => useSyncExternalStore(l => { const m = mq(); m.addEventListener('change', l); return () => m.removeEventListener('change', l) }, () => mq().matches, () => false)

export function useCursorTheme() {
  const { cursor } = usePrefs()
  useEffect(() => {
    const root = document.documentElement
    let el = document.getElementById('sf-cursor') as HTMLStyleElement | null
    if (!cursor.on || cursor.mode === 'live') { root.removeAttribute('data-cursor'); el?.remove(); return }
    if (!el) { el = document.createElement('style'); el.id = 'sf-cursor'; document.head.appendChild(el) }
    el.textContent = cursorCss(cursor, cursor.size); root.setAttribute('data-cursor', cursor.arrow)
  }, [cursor.on, cursor.mode, cursor.arrow, cursor.companion, cursor.size])
}
