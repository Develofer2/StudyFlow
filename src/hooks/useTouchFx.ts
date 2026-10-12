import { useEffect } from 'react'
import { usePrefs } from '@/data/store'
import { companionImage } from '@/domain/cursors'

const TAP = 'button,a,[role="button"],[role="tab"],label,summary,select'
const TEXTY = 'input,textarea,[contenteditable="true"]'
const svg = (b: string) => `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">${b}</svg>`)}")`
const ART = {
  heart: svg('<path d="M12 21C5 15.5 2.5 12 2.5 8.4 2.5 5.6 4.600 3.600 7.100 3.600c1.900 0 3.800 1.100 4.900 3 1.100-1.900 3-3 4.900-3 2.500 0 4.600 2 4.600 4.800C21.500 12 19 15.500 12 21z" fill="#ff7aa8" stroke="#c2417a" stroke-width="1.200" stroke-linejoin="round"/><ellipse cx="7.500" cy="7.500" rx="1.600" ry="1" fill="#fff" opacity=".7"/>'),
  sparkle: svg('<path d="M12 1.500l2.600 7.900 7.900 2.600-7.900 2.600L12 22.500l-2.600-7.900L1.500 12l7.900-2.600z" fill="#ffd95a" stroke="#d99a00" stroke-width="1" stroke-linejoin="round"/>'),
  bubble: svg('<circle cx="12" cy="12" r="9.500" fill="#bfe9ff" fill-opacity=".45" stroke="#6ab8e8" stroke-width="1.200"/><path d="M7.500 10a5 5 0 0 1 3-3.400" fill="none" stroke="#fff" stroke-width="1.600" stroke-linecap="round"/>'),
  paw: svg('<ellipse cx="12" cy="16" rx="5.200" ry="4.400" fill="#a9715a"/><ellipse cx="5.200" cy="10.500" rx="2.200" ry="2.800" fill="#a9715a" transform="rotate(-20 5.200 10.500)"/><ellipse cx="9.400" cy="5.800" rx="2.200" ry="2.900" fill="#a9715a" transform="rotate(-6 9.400 5.800)"/><ellipse cx="14.600" cy="5.800" rx="2.200" ry="2.900" fill="#a9715a" transform="rotate(6 14.600 5.800)"/><ellipse cx="18.800" cy="10.500" rx="2.200" ry="2.800" fill="#a9715a" transform="rotate(20 18.800 10.500)"/><ellipse cx="12" cy="16.500" rx="2.600" ry="2.100" fill="#f3b3bd"/>'),
}
const rnd = (a: number, b: number) => a + Math.random() * (b - a)
let live = 0

function puff(img: string, cls: string, x: number, y: number, size: number, vars: Record<string, string> = {}, life = 900) {
  if (live > 36) return
  live++
  const el = document.createElement('span')
  el.className = 'touch-p ' + cls
  el.style.cssText = `left:${x}px;top:${y}px;width:${size}px;height:${size}px;margin:${-size / 2}px 0 0 ${-size / 2}px;background-image:${img}`
  for (const k in vars) el.style.setProperty(k, vars[k])
  document.body.appendChild(el)
  const done = () => { if (el.isConnected) { el.remove(); live-- } }
  el.addEventListener('animationend', done, { once: true }); setTimeout(done, life + 300)
}

const float = (img: string, x: number, y: number, n: number, size: number) => { for (let i = 0; i < n; i++) puff(img, 'tp-float', x, y, size * rnd(.7, 1.1), { '--dx': rnd(-46, 46) + 'px', '--dy': rnd(-90, -45) + 'px', '--rot': rnd(-30, 30) + 'deg' }, 900) }

/** Touch-only feedback: animal and sparkle effects under the finger, a drag trail, and a tiny haptic tick. */
export function useTouchFx() {
  const { touch, motion } = usePrefs()
  const { fx, animal, trail, haptics } = touch
  useEffect(() => {
    const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches || motion === 'off'
    const face = companionImage(animal, 64)
    let lx = 0, ly = 0, side = 1, down = false
    const tapFx = (x: number, y: number) => {
      if (fx === 'critters') { if (face) puff(`url("${face}")`, 'tp-pop', x, y - 6, 46); float(ART.heart, x, y - 10, 3, 14) }
      else if (fx === 'paws') { puff(ART.paw, 'tp-paw', x, y, 30, { '--rot': rnd(-25, 25) + 'deg' }, 1100) }
      else if (fx === 'hearts') float(ART.heart, x, y, 5, 18)
      else if (fx === 'sparkles') float(ART.sparkle, x, y, 6, 16)
      else if (fx === 'bubbles') float(ART.bubble, x, y, 5, 22)
      else if (fx === 'ripple') puff('none', 'tp-ripple', x, y, 14, {}, 600)
    }
    const down_ = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') return
      const t = e.target instanceof Element ? e.target : null
      const ctl = t?.closest(TAP)
      if (haptics && ctl && !(ctl as HTMLButtonElement).disabled) navigator.vibrate?.(6)
      down = true; lx = e.clientX; ly = e.clientY
      if (fx === 'off' || calm() || t?.closest(TEXTY)) return
      tapFx(e.clientX, e.clientY)
    }
    const move = (e: PointerEvent) => {
      if (!trail || !down || e.pointerType === 'mouse' || fx === 'off' || fx === 'ripple' || calm()) return
      if (e.target instanceof Element && e.target.closest(TEXTY)) return
      const dx = e.clientX - lx, dy = e.clientY - ly, d = Math.hypot(dx, dy)
      if (d < (fx === 'paws' || fx === 'critters' ? 46 : 30)) return
      lx = e.clientX; ly = e.clientY
      if (fx === 'paws' || fx === 'critters') { side = -side; const a = Math.atan2(dy, dx) * 180 / Math.PI + 90, nx = -dy / d * 9 * side, ny = dx / d * 9 * side; puff(ART.paw, 'tp-paw', lx + nx, ly + ny, 24, { '--rot': a + 'deg' }, 1100) }
      else float(fx === 'hearts' ? ART.heart : fx === 'sparkles' ? ART.sparkle : ART.bubble, lx, ly, 1, fx === 'bubbles' ? 18 : 12)
    }
    const up = () => { down = false }
    document.addEventListener('pointerdown', down_, { passive: true })
    document.addEventListener('pointermove', move, { passive: true })
    document.addEventListener('pointerup', up, { passive: true }); document.addEventListener('pointercancel', up, { passive: true })
    return () => { document.removeEventListener('pointerdown', down_); document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up); document.removeEventListener('pointercancel', up) }
  }, [fx, animal, trail, haptics, motion])
}
