import type { ReactNode } from 'react'
import type { BuddyKind, BuddyPrefs } from '@/types'
import type { BuddyState } from '@/domain/buddyState'
import { STATE_LABEL } from '@/domain/buddyState'
import { BUDDIES } from '@/domain/catalog'
import { useReducedMotion } from './useMotion'

const m = (c: string, p = 86) => `color-mix(in oklab, ${c} ${p}%, var(--surface))`
const INK = 'var(--text)'
const O = { stroke: INK, strokeWidth: 2.2, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const }
const E = (cx: number, cy: number, rx: number, ry: number, fill: string, extra: object = {}) => <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={fill} {...O} {...extra} />
const Poly = (pts: string, fill: string) => <polygon points={pts} fill={fill} {...O} />
const Tail = (d: string, c: string, w = 9) => <g fill="none" strokeLinecap="round"><path d={d} stroke={INK} strokeWidth={w + 4.4} /><path d={d} stroke={c} strokeWidth={w} /></g>

type Art = { back?: ReactNode; front: ReactNode; hy: number; ny: number; ex: number; ey: number; my: number; mw: number; ink?: string; big?: number; noMouth?: boolean; blush?: boolean }
const ART: Record<BuddyKind, Art> = {
  cat: { hy: 31, ny: 86, ex: 13, ey: 57, my: 69, mw: 5, blush: true,
    back: <>{Tail('M84 106 Q110 102 104 74', m('#e9b27a'))}{Poly('30,46 33,17 55,34', m('#e9b27a'))}{Poly('90,46 87,17 65,34', m('#e9b27a'))}{Poly('36,38 37,26 47,34', m('#f4a3b0', 100))}{Poly('84,38 83,26 73,34', m('#f4a3b0', 100))}</>,
    front: <>{E(60, 96, 24, 20, m('#e9b27a'))}{E(60, 101, 14, 12, m('#fbe5c6'), { stroke: 'none' })}{E(47, 114, 9, 5, m('#e9b27a'))}{E(73, 114, 9, 5, m('#e9b27a'))}{E(60, 58, 34, 29, m('#e9b27a'))}
      <path d="M60 30 v7 M52 31 l1 6 M68 31 l-1 6" fill="none" {...O} strokeWidth={2} /><path d="M56 65 h8 l-4 4z" fill="#f4a3b0" {...O} strokeWidth={1.6} /><path d="M22 62 h11 M23 69 l10 -2 M98 62 h-11 M97 69 l-10 -2" fill="none" {...O} strokeWidth={1.4} /></> },
  owl: { hy: 27, ny: 88, ex: 13, ey: 56, my: 70, mw: 4, big: 3.8, noMouth: true, blush: true,
    back: <>{E(27, 80, 7, 17, m('#8a6a4b'), { transform: 'rotate(10 27 80)' })}{E(93, 80, 7, 17, m('#8a6a4b'), { transform: 'rotate(-10 93 80)' })}{Poly('30,42 31,20 49,30', m('#8a6a4b'))}{Poly('90,42 89,20 71,30', m('#8a6a4b'))}</>,
    front: <>{E(60, 66, 34, 40, m('#9a7b5b'))}{E(60, 86, 20, 19, m('#e8d2ae'), { stroke: 'none' })}<path d="M50 80 q4 4 8 0 M62 80 q4 4 8 0 M56 90 q4 4 8 0" fill="none" stroke={INK} strokeWidth={1.4} opacity={0.4} strokeLinecap="round" />
      {E(47, 56, 13, 13, m('#f6ecd6', 96))}{E(73, 56, 13, 13, m('#f6ecd6', 96))}<path d="M55 64 L60 75 L65 64Z" fill="#f2b134" {...O} strokeWidth={1.8} />{E(48, 108, 7, 3, '#f2b134', { strokeWidth: 1.6 })}{E(72, 108, 7, 3, '#f2b134', { strokeWidth: 1.6 })}</> },
  frog: { hy: 25, ny: 90, ex: 20, ey: 38, my: 66, mw: 15, blush: true,
    back: <>{E(60, 96, 27, 20, m('#7cc06a'))}{E(37, 112, 12, 5, m('#7cc06a'))}{E(83, 112, 12, 5, m('#7cc06a'))}</>,
    front: <>{E(60, 99, 16, 13, m('#d8efb8'), { stroke: 'none' })}{E(60, 62, 38, 28, m('#7cc06a'))}{E(40, 40, 12, 12, m('#7cc06a'))}{E(80, 40, 12, 12, m('#7cc06a'))}{E(40, 40, 8.5, 8.5, '#fbfaf0', { strokeWidth: 1.4 })}{E(80, 40, 8.5, 8.5, '#fbfaf0', { strokeWidth: 1.4 })}
      <circle cx="55" cy="56" r="1.4" fill={INK} /><circle cx="65" cy="56" r="1.4" fill={INK} /><circle cx="30" cy="72" r="2.2" fill={m('#5aa04a')} /><circle cx="90" cy="70" r="2.8" fill={m('#5aa04a')} /></> },
  fox: { hy: 31, ny: 88, ex: 14, ey: 56, my: 75, mw: 4.5, blush: false,
    back: <>{Tail('M82 106 Q114 106 108 70', m('#e8793a'), 14)}<path d="M104 84 Q112 76 108 66 Q98 74 98 88Z" fill={m('#fff1de')} {...O} strokeWidth={1.6} />{Poly('27,48 29,16 52,34', m('#e8793a'))}{Poly('93,48 91,16 68,34', m('#e8793a'))}{Poly('33,40 34,26 45,34', m('#6b3a22', 80))}{Poly('87,40 86,26 75,34', m('#6b3a22', 80))}</>,
    front: <>{E(60, 100, 22, 17, m('#e8793a'))}{E(60, 103, 12, 11, m('#fff1de'), { stroke: 'none' })}<path d="M24 62 L29 41 Q60 24 91 41 L96 62 Q80 88 60 88 Q40 88 24 62Z" fill={m('#e8793a')} {...O} />
      <path d="M40 70 Q60 60 80 70 Q70 88 60 88 Q50 88 40 70Z" fill={m('#fff1de')} stroke="none" />{E(60, 69, 4.5, 3.2, '#4a2a1c', { strokeWidth: 1 })}</> },
  rabbit: { hy: 38, ny: 88, ex: 12, ey: 61, my: 71, mw: 4.5, blush: true,
    back: <>{E(46, 24, 8, 22, m('#ebe4dc'), { transform: 'rotate(-8 46 24)' })}{E(74, 24, 8, 22, m('#ebe4dc'), { transform: 'rotate(8 74 24)' })}{E(46, 26, 4, 15, m('#f5b5c0', 100), { transform: 'rotate(-8 46 26)', stroke: 'none' })}{E(74, 26, 4, 15, m('#f5b5c0', 100), { transform: 'rotate(8 74 26)', stroke: 'none' })}{E(86, 108, 7, 7, m('#fbf8f4'))}</>,
    front: <>{E(60, 98, 23, 19, m('#ebe4dc'))}{E(60, 102, 13, 12, m('#fbf8f4'), { stroke: 'none' })}{E(48, 114, 8, 4.5, m('#ebe4dc'))}{E(72, 114, 8, 4.5, m('#ebe4dc'))}{E(60, 62, 32, 27, m('#ebe4dc'))}<path d="M56.5 65 h7 l-3.5 4z" fill="#f08aa0" {...O} strokeWidth={1.4} /></> },
  penguin: { hy: 30, ny: 87, ex: 11, ey: 56, my: 70, mw: 4, noMouth: true, blush: true,
    back: <>{E(26, 78, 6, 18, m('#3b4a6b'), { transform: 'rotate(14 26 78)' })}{E(94, 78, 6, 18, m('#3b4a6b'), { transform: 'rotate(-14 94 78)' })}{E(46, 108, 11, 4.5, '#f2a13a', { strokeWidth: 1.6 })}{E(74, 108, 11, 4.5, '#f2a13a', { strokeWidth: 1.6 })}</>,
    front: <>{E(60, 68, 32, 40, m('#3b4a6b'))}{E(60, 80, 21, 27, m('#f4f1ea'), { stroke: 'none' })}{E(60, 58, 24, 18, m('#f4f1ea', 96), { strokeWidth: 1.6 })}<path d="M54 63 Q60 60 66 63 L60 70Z" fill="#f2a13a" {...O} strokeWidth={1.6} /></> },
  robot: { hy: 32, ny: 87, ex: 14, ey: 54, my: 66, mw: 5, ink: '#8fe9ff', blush: false,
    back: <><path d="M60 34 V20" stroke={INK} strokeWidth={2.4} fill="none" strokeLinecap="round" /><circle cx="60" cy="17" r="4.5" fill="#ff8a5c" {...O} strokeWidth={1.8} />{E(31, 100, 6, 10, m('#9fb4c7'))}{E(89, 100, 6, 10, m('#9fb4c7'))}</>,
    front: <><rect x="38" y="84" width="44" height="28" rx="11" fill={m('#9fb4c7')} {...O} /><circle cx="60" cy="98" r="4.5" fill="#ff8a5c" {...O} strokeWidth={1.6} /><circle cx="25" cy="58" r="5" fill={m('#7f95a9')} {...O} /><circle cx="95" cy="58" r="5" fill={m('#7f95a9')} {...O} />
      <rect x="26" y="32" width="68" height="54" rx="17" fill={m('#9fb4c7')} {...O} /><rect x="33" y="40" width="54" height="36" rx="11" fill="#1f2a3a" stroke={INK} strokeWidth={1.6} /></> },
  ghost: { hy: 26, ny: 78, ex: 12, ey: 54, my: 66, mw: 4, blush: true,
    back: <>{E(26, 82, 7, 10, m('#eceafd', 92), { transform: 'rotate(25 26 82)' })}{E(94, 82, 7, 10, m('#eceafd', 92), { transform: 'rotate(-25 94 82)' })}</>,
    front: <path d="M30 108 V56 Q30 24 60 24 Q90 24 90 56 V108 Q82 99 75 108 Q67 99 60 108 Q52 99 45 108 Q38 99 30 108Z" fill={m('#eceafd', 92)} {...O} /> },
  dragon: { hy: 31, ny: 87, ex: 14, ey: 55, my: 74, mw: 5, blush: true,
    back: <>{Tail('M82 106 Q110 108 106 82', m('#5fbf9a'), 9)}<path d="M104 80 l-6 -8 l12 0z" fill="#9b8be0" {...O} strokeWidth={1.6} /><path d="M36 74 Q8 62 12 36 Q30 44 42 60Z" fill={m('#9b8be0')} {...O} /><path d="M84 74 Q112 62 108 36 Q90 44 78 60Z" fill={m('#9b8be0')} {...O} /></>,
    front: <>{E(60, 97, 24, 20, m('#5fbf9a'))}{E(60, 101, 14, 15, m('#f3e2a8'), { stroke: 'none' })}{E(60, 58, 33, 28, m('#5fbf9a'))}{Poly('42,38 37,14 53,31', '#f0c46a')}{Poly('78,38 83,14 67,31', '#f0c46a')}{Poly('54,31 60,21 66,31', m('#9b8be0'))}
      {E(60, 69, 15, 10, m('#8fd8b6'), { strokeWidth: 1.6 })}<circle cx="55" cy="66" r="1.5" fill={INK} /><circle cx="65" cy="66" r="1.5" fill={INK} /></> },
  spirit: { hy: 31, ny: 91, ex: 12, ey: 62, my: 73, mw: 4.5, blush: true,
    back: <><path d="M60 32 Q60 22 62 14" fill="none" stroke={INK} strokeWidth={2.4} strokeLinecap="round" />{E(51, 17, 10, 5.5, '#5aa260', { transform: 'rotate(-30 51 17)' })}{E(72, 12, 10, 5.5, '#5aa260', { transform: 'rotate(25 72 12)' })}{E(48, 109, 8, 3.5, m('#8a6a4b'))}{E(72, 109, 8, 3.5, m('#8a6a4b'))}</>,
    front: <><path d="M60 30 Q93 32 93 66 Q93 105 60 107 Q27 105 27 66 Q27 32 60 30Z" fill={m('#b8dd9a')} {...O} /><circle cx="40" cy="88" r="7" fill={m('#7fb96d')} opacity={0.8} /><circle cx="81" cy="93" r="6" fill={m('#7fb96d')} opacity={0.8} /><circle cx="54" cy="99" r="4.5" fill={m('#7fb96d')} opacity={0.8} /><circle cx="76" cy="44" r="3.5" fill={m('#7fb96d')} opacity={0.7} /></> },
}

type Eyes = 'open' | 'happy' | 'closed' | 'half' | 'down' | 'wide'
type Mouth = 'smile' | 'grin' | 'flat' | 'o' | 'sleep' | 'tiny'
const LOOK: Record<BuddyState, { eyes: Eyes; mouth: Mouth; brows?: 'focus' | 'determined' }> = {
  idle: { eyes: 'open', mouth: 'smile' }, preparing: { eyes: 'wide', mouth: 'o' }, starting: { eyes: 'open', mouth: 'smile', brows: 'determined' }, focusing: { eyes: 'down', mouth: 'tiny', brows: 'focus' },
  break: { eyes: 'closed', mouth: 'smile' }, completed: { eyes: 'happy', mouth: 'grin' }, goal: { eyes: 'happy', mouth: 'grin' }, paused: { eyes: 'half', mouth: 'flat' }, resting: { eyes: 'closed', mouth: 'sleep' }, returning: { eyes: 'open', mouth: 'grin' },
}

function Face({ a, s }: { a: Art; s: BuddyState }) {
  const L = LOOK[s], ink = a.ink ?? INK, r = a.big ?? 3.4, cx = 60, { ex, ey, my, mw } = a
  const eye = (x: number, side: -1 | 1) => {
    const st = { fill: 'none', stroke: ink, strokeWidth: 2.2, strokeLinecap: 'round' as const }
    switch (L.eyes) {
      case 'happy': return <path key={x} d={`M${x - 4.2} ${ey + 1.5} Q${x} ${ey - 5} ${x + 4.2} ${ey + 1.5}`} {...st} />
      case 'closed': return <path key={x} d={`M${x - 4.2} ${ey - 0.5} Q${x} ${ey + 4} ${x + 4.2} ${ey - 0.5}`} {...st} />
      case 'half': return <path key={x} d={`M${x - r} ${ey} A${r} ${r} 0 0 0 ${x + r} ${ey}Z`} fill={ink} stroke={ink} strokeWidth={1.4} strokeLinejoin="round" />
      case 'down': return <ellipse key={x} cx={x} cy={ey + 1.6} rx={r} ry={r * 0.78} fill={ink} />
      default: { const rr = L.eyes === 'wide' ? r + 0.9 : r; return <g key={x}><circle cx={x} cy={ey} r={rr} fill={ink} /><circle cx={x + side * -0.2 + 1} cy={ey - 1.2} r={rr * 0.32} fill="#fff" /></g> }
    }
  }
  const brow = (x: number, side: -1 | 1) => L.brows && <path key={'b' + x} d={L.brows === 'determined' ? `M${x - 4.5} ${ey - 8 - side * -1.2} L${x + 4.5} ${ey - 8 + side * -1.2}` : `M${x - 4.5} ${ey - 8} h9`} stroke={ink} strokeWidth={1.8} strokeLinecap="round" fill="none" opacity={0.75} />
  const sw = L.mouth === 'tiny' ? mw * 0.6 : mw
  const mouth = a.noMouth ? null : {
    smile: <path d={`M${cx - mw} ${my} Q${cx} ${my + mw * 0.9} ${cx + mw} ${my}`} fill="none" stroke={ink} strokeWidth={2} strokeLinecap="round" />,
    tiny: <path d={`M${cx - sw} ${my} Q${cx} ${my + sw * 0.9} ${cx + sw} ${my}`} fill="none" stroke={ink} strokeWidth={2} strokeLinecap="round" />,
    grin: <path d={`M${cx - mw} ${my - 1} Q${cx} ${my + mw * 1.8} ${cx + mw} ${my - 1}Z`} fill={ink} stroke={ink} strokeWidth={1.4} strokeLinejoin="round" />,
    flat: <path d={`M${cx - mw * 0.6} ${my + 1} h${mw * 1.2}`} stroke={ink} strokeWidth={2} strokeLinecap="round" />,
    o: <ellipse cx={cx} cy={my + 1} rx={2} ry={2.6} fill={ink} />,
    sleep: <path d={`M${cx - 2.4} ${my} q2.4 2.6 4.8 0`} fill="none" stroke={ink} strokeWidth={1.8} strokeLinecap="round" />,
  }[L.mouth]
  const happy = L.eyes === 'happy' || L.mouth === 'grin'
  return <g>{a.blush !== false && <g fill="#f08aa0" opacity={happy ? 0.55 : 0.32}><ellipse cx={cx - ex - 8} cy={ey + 8} rx={5} ry={3} /><ellipse cx={cx + ex + 8} cy={ey + 8} rx={5} ry={3} /></g>}
    <g className="bd-eyes">{eye(cx - ex, -1)}{eye(cx + ex, 1)}</g>{brow(cx - ex, -1)}{brow(cx + ex, 1)}{mouth}</g>
}

const Star = ({ x, y, s, c = '#f6c453', cls }: { x: number; y: number; s: number; c?: string; cls?: string }) =>
  <path className={cls} d={`M${x} ${y - s} Q${x} ${y} ${x + s} ${y} Q${x} ${y} ${x} ${y + s} Q${x} ${y} ${x - s} ${y} Q${x} ${y} ${x} ${y - s}Z`} fill={c} />

function Book({ study }: { study: boolean }) {
  return <g><rect x="24" y="115" width="72" height="5" rx="2.500" fill="#b9875a" {...O} strokeWidth={1.6} />
    <path d="M36 100 Q48 93 60 100 V117 Q48 110 36 117Z" fill="#fdf8ec" {...O} strokeWidth={1.8} /><path d="M84 100 Q72 93 60 100 V117 Q72 110 84 117Z" fill="#f7efdc" {...O} strokeWidth={1.8} />
    <path d="M41 104 Q48 100 55 104 M41 109 Q48 105 55 109 M65 104 Q72 100 79 104 M65 109 Q72 105 79 109" fill="none" stroke={INK} strokeWidth={1} opacity={0.35} />
    {study && <><path className="bd-flip" d="M60 100 Q72 93 84 100 V117 Q72 110 60 117Z" fill="#fffdf6" {...O} strokeWidth={1.4} />
      <g className="bd-write"><path d="M83 94 L76 108" stroke={INK} strokeWidth="5.400" strokeLinecap="round" /><path d="M83 94 L76 108" stroke="#f2c14e" strokeWidth="3" strokeLinecap="round" /><circle cx="84" cy="92.500" r="3.600" fill="#f2d5b0" {...O} strokeWidth={1.4} /></g></>}</g>
}
function Mug({ anim }: { anim: boolean }) {
  return <g><path d="M74 96 h16 v11 q0 7 -8 7 q-8 0 -8 -7z" fill="#f6efe4" {...O} strokeWidth={1.8} /><path d="M90 99 q7 0 7 5.5 q0 5.5 -7 5.5" fill="none" {...O} strokeWidth={1.8} />
    <path className={anim ? 'bd-tw' : undefined} d="M79 90 q-3 -4 0 -8 M85 90 q-3 -4 0 -8" fill="none" stroke={INK} strokeWidth={1.6} strokeLinecap="round" opacity={0.5} /></g>
}

function Hat({ id, x, y }: { id: string; x: number; y: number }) {
  if (id === 'beanie') return <g><path d={`M${x - 22} ${y + 6} Q${x - 22} ${y - 16} ${x} ${y - 16} Q${x + 22} ${y - 16} ${x + 22} ${y + 6}Z`} fill="#d9655b" {...O} /><rect x={x - 24} y={y + 1} width="48" height="9" rx="4.5" fill="#b94a42" {...O} /><circle cx={x} cy={y - 18} r="5" fill="#f4e3d3" {...O} strokeWidth={1.8} /></g>
  if (id === 'grad-cap') return <g><path d={`M${x - 15} ${y + 2} v9 q15 8 30 0 v-9`} fill="#3c4b69" {...O} /><polygon points={`${x - 30},${y - 1} ${x},${y - 13} ${x + 30},${y - 1} ${x},${y + 8}`} fill="#2f3b52" {...O} /><path d={`M${x + 22} ${y} v13`} stroke="#f2c14e" strokeWidth="2" /><circle cx={x + 22} cy={y + 14} r="2.5" fill="#f2c14e" /></g>
  if (id === 'crown') return <path d={`M${x - 17} ${y + 6} L${x - 19} ${y - 11} L${x - 9} ${y - 3} L${x} ${y - 15} L${x + 9} ${y - 3} L${x + 19} ${y - 11} L${x + 17} ${y + 6}Z`} fill="#f2c14e" {...O} />
  return null
}
function Neck({ id, x, y }: { id: string; x: number; y: number }) {
  if (id === 'scarf') return <g><path d={`M${x + 8} ${y + 6} l4 20 l10 -3 l-3 -18z`} fill="#4a7ba6" {...O} strokeWidth={1.8} /><rect x={x - 25} y={y - 1} width="50" height="10" rx="5" fill="#5b8fb9" {...O} /></g>
  if (id === 'bow') return <g><polygon points={`${x - 13},${y - 5} ${x},${y + 2} ${x - 13},${y + 9}`} fill="#c4524f" {...O} strokeWidth={1.8} /><polygon points={`${x + 13},${y - 5} ${x},${y + 2} ${x + 13},${y + 9}`} fill="#c4524f" {...O} strokeWidth={1.8} /><circle cx={x} cy={y + 2} r="3.5" fill="#a63f3d" {...O} strokeWidth={1.6} /></g>
  return null
}

const CSS = `.bd-b,.bd-k,.bd-w,.bd-eyes,.bd-study,.bd-flip,.bd-write{transform-box:fill-box}
@keyframes bd-nod{0%,100%{transform:rotate(0) translateY(0)}35%{transform:rotate(2deg) translateY(1.5px)}70%{transform:rotate(-1.2deg) translateY(.5px)}}.bd-study{transform-origin:50% 100%;animation:bd-nod 4s ease-in-out infinite}
@keyframes bd-flip{0%,45%{transform:scaleX(1);opacity:1}70%{transform:scaleX(-1);opacity:1}71%,100%{transform:scaleX(-1);opacity:0}}.bd-flip{transform-origin:0% 50%;animation:bd-flip 5s ease-in-out infinite}
@keyframes bd-write{0%,100%{transform:translate(-5px,-1px)}25%{transform:translate(0,1.5px)}50%{transform:translate(-4px,2px)}75%{transform:translate(1px,0)}}.bd-write{animation:bd-write 1.1s ease-in-out infinite}
@keyframes bd-fl{0%{opacity:0;transform:translateY(6px)}30%,60%{opacity:.7}100%{opacity:0;transform:translateY(-12px)}}.bd-fl{animation:bd-fl 3.6s ease-out infinite}.bd-d2{animation-delay:.9s}.bd-d3{animation-delay:1.8s}.bd-d4{animation-delay:2.7s}
@keyframes bd-breathe{0%,100%{transform:scaleY(1)}50%{transform:scaleY(1.025)}}.bd-b{transform-origin:50% 100%;animation:bd-breathe 5s ease-in-out infinite}
@keyframes bd-blink{0%,93%,100%{transform:scaleY(1)}96%{transform:scaleY(.1)}}.bd-blink .bd-eyes{transform-origin:50% 50%;animation:bd-blink 6s infinite}
@keyframes bd-hop{0%,100%{transform:translateY(0)}40%{transform:translateY(-7px)}}.bd-hop{animation:bd-hop .7s ease-out 3}
@keyframes bd-wave{0%,100%{transform:rotate(0)}50%{transform:rotate(-24deg)}}.bd-w{transform-origin:0% 100%;animation:bd-wave .6s ease-in-out 4}
@keyframes bd-tw{0%,100%{opacity:.3}50%{opacity:1}}.bd-tw{animation:bd-tw 3.2s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){.bd-study,.bd-flip,.bd-write,.bd-fl,.bd-b,.bd-hop,.bd-w,.bd-tw,.bd-blink .bd-eyes{animation:none}}`

export interface BuddyAvatarProps { kind: BuddyKind; state?: BuddyState; size?: number | string; outfit?: BuddyPrefs['outfit']; intensity?: BuddyPrefs['intensity']; name?: string; className?: string }
export default function BuddyAvatar({ kind, state = 'idle', size = 96, outfit = {}, intensity = 'gentle', name, className }: BuddyAvatarProps) {
  const reduced = useReducedMotion(); const a = ART[kind]
  const anim = intensity !== 'still' && !reduced, full = anim && intensity === 'full'
  const who = name || BUDDIES.find(b => b.kind === kind)?.name || kind
  const book = state === 'focusing' || state === 'starting' || (outfit.held === 'book' && state !== 'break')
  const study = state === 'focusing' || state === 'starting'
  const celebrate = state === 'completed' || state === 'goal'
  return (
    <svg viewBox="0 0 120 120" width={size} height={typeof size === 'number' ? size : 'auto'} role="img" aria-label={`${who}, ${STATE_LABEL[state].toLowerCase()}`} className={className} style={{ overflow: 'visible', flexShrink: 0, aspectRatio: '1 / 1' }}>
      <style>{CSS}</style>
      {outfit.aura === 'star-aura' && <g aria-hidden><circle cx="60" cy="62" r="54" fill="#f6c453" opacity=".13" /><Star x={14} y={44} s={5} cls={full ? 'bd-tw' : undefined} /><Star x={106} y={50} s={6} cls={full ? 'bd-tw' : undefined} /><Star x={20} y={96} s={4} /><Star x={102} y={98} s={4.5} /><Star x={60} y={6} s={4} /></g>}
      <g key={state} className={anim && celebrate ? 'bd-hop' : undefined}>
        <g className={anim && study ? 'bd-study' : undefined}><g className={cxs(anim && 'bd-b', full && 'bd-blink')}>
          {a.back}{a.front}
          <Face a={a} s={state} />
          {outfit.neck && <Neck id={outfit.neck} x={60} y={a.ny} />}
          {outfit.held === 'glasses' && <g fill="none" stroke={INK} strokeWidth="1.8"><circle cx={60 - a.ex} cy={a.ey} r="7.2" /><circle cx={60 + a.ex} cy={a.ey} r="7.2" /><path d={`M${60 - a.ex + 7.2} ${a.ey} h${2 * a.ex - 14.4}`} /></g>}
          {outfit.hat && <Hat id={outfit.hat} x={60} y={a.hy} />}
          {book && <Book study={study} />}
          {state === 'break' && <Mug anim={full} />}
        </g></g>
        {state === 'returning' && <g className={anim ? 'bd-w' : undefined}><path d="M86 90 L99 68" stroke={INK} strokeWidth="11" strokeLinecap="round" fill="none" /><path d="M86 90 L99 68" stroke={m(a.ink ? '#9fb4c7' : '#f2d5b0', 100)} strokeWidth="6.6" strokeLinecap="round" fill="none" /></g>}
      </g>
      {celebrate && <g aria-hidden><Star x={16} y={30} s={7} /><Star x={104} y={26} s={6} />{state === 'goal' && <><Star x={100} y={66} s={5} /><Star x={14} y={72} s={4.5} /><Star x={60} y={8} s={5} /></>}</g>}
      {study && anim && <g aria-hidden fill={INK} fontFamily="var(--font-display)" fontWeight="700"><text className="bd-fl" x="98" y="34" fontSize="13">?</text><text className="bd-fl bd-d2" x="14" y="40" fontSize="12">!</text><text className="bd-fl bd-d3" x="104" y="58" fontSize="11">+</text><text className="bd-fl bd-d4" x="8" y="66" fontSize="10">=</text></g>}
      {state === 'resting' && <g aria-hidden fill={INK} opacity="0.55" fontFamily="var(--font-display)" fontWeight="700"><text x="92" y="30" fontSize="13">z</text><text x="102" y="17" fontSize="10">z</text></g>}
      {state === 'preparing' && <g aria-hidden fill="none" stroke={INK} strokeWidth="1.6" opacity="0.6"><circle cx="94" cy="26" r="2.6" /><circle cx="102" cy="17" r="3.6" /></g>}
    </svg>)
}
const cxs = (...a: (string | false | undefined)[]) => a.filter(Boolean).join(' ') || undefined
