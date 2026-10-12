import { useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { usePrefs } from '@/data/store'
import { INTERACTIVE, cursorLayers } from '@/domain/cursors'
import { useDesktopPointer } from './useCursor'

const TEXTY = 'input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="color"]):not([type="file"]), textarea, [contenteditable="true"]'

/** Draws the cursor as a real element and hides the system one. The tip is exact; the character eases behind it. */
export default function LiveCursor() {
  const { cursor, motion } = usePrefs(), desktop = useDesktopPointer()
  const active = cursor.on && cursor.mode === 'live' && desktop
  const px = cursor.size === 'large' ? 48 : 32
  const norm = useMemo(() => cursorLayers(cursor, false, px), [cursor.arrow, cursor.companion, px])
  const ptr = useMemo(() => cursorLayers(cursor, true, px), [cursor.arrow, cursor.companion, px])
  const root = useRef<HTMLDivElement>(null), head = useRef<HTMLDivElement>(null), tipEl = useRef<HTMLImageElement>(null), headImg = useRef<HTMLImageElement>(null)

  useEffect(() => {
    if (!active) return
    const html = document.documentElement
    const still = motion === 'off' || matchMedia('(prefers-reduced-motion: reduce)').matches
    let x = 0, y = 0, hx = 0, hy = 0, vx = 0, down = false, hover = false, seen = false, hidden = true, raf = 0
    const setHidden = (h: boolean) => { hidden = h; if (root.current) root.current.style.opacity = h ? '0' : '1' }
    const frame = () => {
      raf = 0
      const k = still ? 1 : 0.22
      const px0 = hx; hx += (x - hx) * k; hy += (y - hy) * k; vx = hx - px0
      const tilt = still ? 0 : Math.max(-25, Math.min(25, vx * 2.5))
      const scale = (down ? 0.85 : hover ? 1.15 : 1)
      if (root.current) root.current.style.transform = `translate3d(${x}px,${y}px,0)`
      if (head.current) head.current.style.transform = `translate3d(${hx - x}px,${hy - y}px,0) rotate(${tilt}deg) scale(${scale})`
      if (!still && (Math.abs(x - hx) > 0.1 || Math.abs(y - hy) > 0.1)) raf = requestAnimationFrame(frame)
    }
    const kick = () => { if (!raf) raf = requestAnimationFrame(frame) }
    const sync = (t: EventTarget | null) => {
      const el = t instanceof Element ? t : null
      const texty = !!el?.closest(TEXTY), hv = !!el?.closest(INTERACTIVE)
      setHidden(texty); if (hv !== hover) { hover = hv; const l = hv ? ptr : norm; if (tipEl.current) tipEl.current.src = l.tip; if (headImg.current && l.head) headImg.current.src = l.head }
      html.toggleAttribute('data-cursor-live', seen && !texty)
    }
    const move = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return
      x = e.clientX; y = e.clientY
      if (!seen) { seen = true; hx = x; hy = y }
      sync(e.target); kick()
    }
    const dn = () => { down = true; kick() }, up = () => { down = false; kick() }
    const leave = () => setHidden(true)
    window.addEventListener('pointermove', move, { passive: true }); window.addEventListener('pointerdown', dn); window.addEventListener('pointerup', up)
    document.documentElement.addEventListener('mouseleave', leave)
    return () => {
      cancelAnimationFrame(raf); html.removeAttribute('data-cursor-live')
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerdown', dn); window.removeEventListener('pointerup', up)
      document.documentElement.removeEventListener('mouseleave', leave)
    }
  }, [active, motion, norm, ptr])

  useEffect(() => {
    if (!active) return
    const el = root.current as (HTMLDivElement & { showPopover?: () => void; hidePopover?: () => void }) | null
    try { el?.showPopover?.() } catch { /* already open or unsupported */ }
    const reopen = () => { try { el?.hidePopover?.(); el?.showPopover?.() } catch { /* ignore */ } }
    // Native dialogs/popovers opened later sit above earlier top-layer items, so re-assert on open.
    const mo = new MutationObserver(reopen); mo.observe(document.body, { childList: true })
    return () => mo.disconnect()
  }, [active])
  if (!active) return null
  return createPortal(<div ref={root} popover="manual" aria-hidden="true" className="pointer-events-none fixed left-0 top-0 z-[2147483647] m-0 border-0 bg-transparent p-0 opacity-0 transition-opacity duration-150" style={{ width: px, height: px, marginLeft: -norm.hot[0], marginTop: -norm.hot[1], left: 0, top: 0, right: 'auto', bottom: 'auto', overflow: 'visible' }}>
    {norm.head && <div ref={head} className="absolute inset-0 will-change-transform"><img ref={headImg} src={norm.head} alt="" width={px} height={px} draggable={false} /></div>}
    <img ref={tipEl} src={norm.tip} alt="" width={px} height={px} draggable={false} className="absolute inset-0" />
  </div>, document.body)
}
