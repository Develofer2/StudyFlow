import { useId } from 'react'
export interface SceneProps { p: number }
/** Mixes a scene tint into a theme token so scenes follow light and dark themes. */
export const c = (tint: string, pct: number, base = 'var(--bg)') => `color-mix(in srgb, ${tint} ${pct}%, ${base})`
export const r = (i: number) => { const x = Math.sin(i * 12.9898 + 4.1) * 43758.5453; return x - Math.floor(x) }
export const useUid = () => useId().replace(/:/g, '')
export const ENV_CSS = `
.env-sc .e-fb{transform-box:fill-box}
.env-anim .e-tw{animation:e-tw 3s ease-in-out infinite}
.env-anim .e-rain{animation:e-rain .9s linear infinite}
.env-anim .e-snow{animation:e-snow 9s linear infinite}
.env-anim .e-leaf{animation:e-leaf 12s linear infinite}
.env-anim .e-float{animation:e-float 6s ease-in-out infinite}
.env-anim .e-flick{animation:e-flick 1.6s ease-in-out infinite;transform-origin:50% 100%}
.env-anim .e-steam{animation:e-steam 4s ease-out infinite}
.env-anim .e-wave{animation:e-wave 9s linear infinite}
.env-anim .e-fly{animation:e-fly 7s ease-in-out infinite}
.env-anim .e-sway{animation:e-sway 7s ease-in-out infinite;transform-origin:50% 100%}
.env-anim .e-blink{animation:e-blink 2.4s steps(1) infinite}
.env-anim .e-ripple{animation:e-ripple 5s ease-out infinite;transform-origin:50% 50%}
.env-pause .env-sc *{animation-play-state:paused!important}
@keyframes e-tw{0%,100%{opacity:.25}50%{opacity:1}}
@keyframes e-rain{from{transform:translateY(-30px)}to{transform:translateY(240px)}}
@keyframes e-snow{0%{transform:translate(0,-10px)}50%{transform:translate(10px,120px)}100%{transform:translate(-4px,250px)}}
@keyframes e-leaf{0%{transform:translate(0,-10px) rotate(0)}50%{transform:translate(-30px,100px) rotate(160deg)}100%{transform:translate(10px,230px) rotate(320deg)}}
@keyframes e-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
@keyframes e-flick{0%,100%{opacity:.8;transform:scaleY(.92)}50%{opacity:1;transform:scaleY(1.08)}}
@keyframes e-steam{0%{transform:translateY(0);opacity:0}30%{opacity:.5}100%{transform:translateY(-14px);opacity:0}}
@keyframes e-wave{from{transform:translateX(0)}to{transform:translateX(-80px)}}
@keyframes e-fly{0%,100%{transform:translate(0,0);opacity:.1}25%{opacity:.9}50%{transform:translate(10px,-8px);opacity:.3}75%{opacity:.9}}
@keyframes e-sway{0%,100%{transform:rotate(-2deg)}50%{transform:rotate(2deg)}}
@keyframes e-blink{0%{opacity:1}50%{opacity:.25}}
@keyframes e-ripple{0%{transform:scale(.4);opacity:.6}100%{transform:scale(1.4);opacity:0}}
`
const d = (i: number, a: number, b: number) => `${-r(i) * a}s`
export const Stars = ({ n, x0 = 0, x1 = 400, y0 = 0, y1 = 100, fill, seed = 1 }: { n: number; x0?: number; x1?: number; y0?: number; y1?: number; fill: string; seed?: number }) =>
  <g>{Array.from({ length: n }, (_, i) => <circle key={i} className={i % 3 === 0 ? 'e-tw' : undefined} cx={x0 + r(i + seed) * (x1 - x0)} cy={y0 + r(i + seed + 40) * (y1 - y0)} r={.6 + r(i + seed + 9) * 1.1} fill={fill} opacity={.75} style={i % 3 === 0 ? { animationDelay: d(i, 4, 0), animationDuration: `${2.5 + r(i) * 3}s` } : undefined} />)}</g>
/** Falling streaks; nested svg clips them to the given window. */
export const Rain = ({ x, y, w, h, n, fill }: { x: number; y: number; w: number; h: number; n: number; fill: string }) =>
  <svg x={x} y={y} width={w} height={h} viewBox={`0 0 ${w} ${h}`}>{Array.from({ length: n }, (_, i) => <line key={i} className="e-rain" x1={r(i) * w} x2={r(i) * w - 2} y1={0} y2={9} stroke={fill} strokeWidth={1.2} strokeLinecap="round" opacity={.55} style={{ animationDelay: d(i + 3, 1, 0), animationDuration: `${.7 + r(i + 8) * .5}s` }} />)}</svg>
export const Snow = ({ x, y, w, h, n, fill }: { x: number; y: number; w: number; h: number; n: number; fill: string }) =>
  <svg x={x} y={y} width={w} height={h} viewBox={`0 0 ${w} ${h}`}>{Array.from({ length: n }, (_, i) => <circle key={i} className="e-snow" cx={r(i) * w} cy={0} r={1.2 + r(i + 5) * 1.6} fill={fill} opacity={.85} style={{ animationDelay: d(i, 9, 0), animationDuration: `${8 + r(i + 2) * 6}s` }} />)}</svg>
export const Fireflies = ({ n, x0, x1, y0, y1, fill }: { n: number; x0: number; x1: number; y0: number; y1: number; fill: string }) =>
  <g>{Array.from({ length: n }, (_, i) => <circle key={i} className="e-fly" cx={x0 + r(i + 20) * (x1 - x0)} cy={y0 + r(i + 30) * (y1 - y0)} r={1.8} fill={fill} opacity={.8} style={{ animationDelay: d(i, 7, 0), animationDuration: `${6 + r(i) * 4}s` }} />)}</g>
export const Steam = ({ x, y, stroke }: { x: number; y: number; stroke: string }) =>
  <g fill="none" stroke={stroke} strokeWidth={1.6} strokeLinecap="round">{[0, 1, 2].map(i => <path key={i} className="e-steam" d={`M${x + i * 5 - 5} ${y} q-3 -5 0 -9 q3 -4 0 -8`} style={{ animationDelay: `${-i * 1.3}s` }} />)}</g>
/** Candle whose wax shortens with progress p. */
export const Candle = ({ x, y, p, tall = 26, wax, flame, glow }: { x: number; y: number; p: number; tall?: number; wax: string; flame: string; glow: string }) => {
  const h = tall * (1 - 0.55 * p)
  return <g><circle cx={x} cy={y - h - 5} r={14} fill={glow} opacity={.3} /><rect x={x - 3} y={y - h} width={6} height={h} rx={1.5} fill={wax} />
    <path className="e-flick e-fb" d={`M${x} ${y - h - 10} q4 5 0 9 q-4 -4 0 -9z`} fill={flame} /></g>
}
export const Books = ({ x, y, w, h, n, seed = 1, tints }: { x: number; y: number; w: number; h: number; n: number; seed?: number; tints: string[] }) => {
  let cx = x; const bw = w / n
  return <g>{Array.from({ length: n }, (_, i) => { const bh = h * (.72 + r(i + seed) * .28); const el = <rect key={i} x={cx + .5} y={y + h - bh} width={bw - 1} height={bh} rx={1} fill={tints[Math.floor(r(i + seed + 5) * tints.length)]} />; cx += bw; return el })}</g>
}
