import { memo, useEffect, type ReactNode } from 'react'
import { usePrefs } from '@/data/store'
import { SPECIES } from '@/domain/catalog'
import { STAGE_NAMES } from '@/domain/growth'
import type { Tree } from '@/types'

type Season = Tree['season']
type Pal = [string, string, string]
const G: Record<Season, Pal> = { spring: ['#62b05c', '#92d27c', '#418c4b'], summer: ['#41994b', '#6fbd5f', '#2c7440'], autumn: ['#c9822b', '#e0a247', '#a35f1f'], winter: ['#6c9a76', '#8dbb95', '#4f7d5b'] }
const WOOD = '#7a5638', WOOD_D = '#5c3f28', SOIL = '#7b5a3c'
/** Foliage palette per species and season; null means a bare winter tree. */
function leaf(sp: string, se: Season): Pal | null {
  const deciduousBare = se === 'winter'
  switch (sp) {
    case 'pine': return ['#2f7a55', '#3f9468', '#235f43']
    case 'bamboo': return se === 'winter' ? ['#7d9f5e', '#9bb97a', '#5f8046'] : ['#6fae45', '#93cc62', '#4f8a33']
    case 'palm': return ['#3f9a52', '#66bd6d', '#2b7541']
    case 'maple': return deciduousBare ? null : se === 'autumn' ? ['#c0392b', '#e0572f', '#9c2a20'] : G[se]
    case 'birch': return deciduousBare ? null : se === 'autumn' ? ['#e3b93a', '#f0d36a', '#c1962a'] : se === 'spring' ? ['#8fcf6a', '#b4e08a', '#6fb455'] : ['#6fb85a', '#93d070', '#4f9a45']
    case 'cherry': return deciduousBare ? null : se === 'autumn' ? ['#d9803f', '#eaa05f', '#b8622b'] : se === 'summer' ? G.summer : ['#f2a3be', '#fbc9db', '#e07fa2']
    case 'willow': return deciduousBare ? null : se === 'autumn' ? ['#d3b04a', '#e3c76a', '#b0902f'] : ['#9bc866', '#b8d983', '#7aa84f']
    case 'ginkgo': return deciduousBare ? null : se === 'autumn' ? ['#f0c419', '#f7da5b', '#d4a40f'] : ['#9fcf5a', '#c0e078', '#7fb040']
    case 'baobab': return deciduousBare ? null : se === 'autumn' ? ['#b9a447', '#d1be64', '#97832f'] : ['#6aa84f', '#8cc470', '#4d8738']
    default: return deciduousBare ? null : G[se]
  }
}
const mapleStar = (() => { const pts: string[] = []; for (let i = 0; i < 16; i++) { const a = (i / 16) * 2 * Math.PI - Math.PI / 2, r = i % 2 ? 17 : 25; pts.push(`${(50 + Math.cos(a) * r * 1.05).toFixed(1)},${(38 + Math.sin(a) * r).toFixed(1)}`) } return pts.join(' ') })()
const BARE = <path d="M50 62 L36 42 M50 56 L64 40 M50 50 L50 26 M36 42 L27 36 M64 40 L73 34 M50 36 L42 26 M50 34 L58 24" stroke={WOOD} strokeWidth="2.6" strokeLinecap="round" fill="none" />
const Trunk = ({ w = 8, h = 34, c = WOOD }: { w?: number; h?: number; c?: string }) => <path d={`M${50 - w / 2 - 3} 88 Q${50 - w / 2} 84 ${50 - w / 2} ${88 - h} L${50 + w / 2} ${88 - h} Q${50 + w / 2} 84 ${50 + w / 2 + 3} 88 Z`} fill={c} />
const Blob = ({ cx, cy, r, c }: { cx: number; cy: number; r: number; c: string }) => <circle cx={cx} cy={cy} r={r} fill={c} />

function crown(sp: string, p: Pal | null, se: Season): ReactNode {
  const [a, b, c] = p ?? ['', '', '']
  switch (sp) {
    case 'pine': return <><Trunk w={6} h={20} c={WOOD_D} /><polygon points="50,40 80,76 20,76" fill={c} /><polygon points="50,26 76,60 24,60" fill={a} /><polygon points="50,12 70,44 30,44" fill={b} />{se === 'winter' && <path d="M50 12 L40 28 Q50 24 60 28 Z M50 26 L36 46 Q50 40 64 46 Z M50 40 L30 64 Q50 56 70 64 Z" fill="#f4f8fb" opacity=".9" />}</>
    case 'bamboo': return <>{[[38, 22, 5], [50, 10, 6], [62, 26, 5]].map(([x, y, w], i) => <g key={i}><path d={`M${x} 88 L${x} ${y}`} stroke={i === 1 ? a : b} strokeWidth={w} strokeLinecap="round" />{[0, 1, 2, 3].map(k => <path key={k} d={`M${x - w / 2 - 1} ${y + 14 + k * 15} h${w + 2}`} stroke={c} strokeWidth="1.6" />)}
      <ellipse cx={x + 7} cy={y + 6} rx="9" ry="3" transform={`rotate(-25 ${x + 7} ${y + 6})`} fill={a} /><ellipse cx={x - 7} cy={y + 14} rx="9" ry="3" transform={`rotate(25 ${x - 7} ${y + 14})`} fill={b} /></g>)}</>
    case 'palm': return <><path d="M47 88 Q58 62 52 36" stroke={WOOD} strokeWidth="7" fill="none" strokeLinecap="round" />{[[-30, 26], [-8, 30], [14, 28], [36, 24], [58, 30]].map(([dx, l], i) => <path key={i} d={`M52 36 Q${52 + dx * 0.9} ${36 - l} ${52 + dx * 1.2 - 8} ${36 + 6 + i % 2 * 4}`} stroke={i % 2 ? b : a} strokeWidth="5" fill="none" strokeLinecap="round" />)}<circle cx="50" cy="40" r="3" fill={WOOD_D} /><circle cx="55" cy="41" r="3" fill={WOOD_D} /></>
    case 'baobab': return <><path d="M34 88 Q40 66 42 44 L58 44 Q60 66 66 88 Z" fill="#8f6a47" />{p ? <><Blob cx={32} cy={40} r={11} c={c} /><Blob cx={50} cy={32} r={14} c={a} /><Blob cx={68} cy={40} r={11} c={c} /><Blob cx={50} cy={40} r={8} c={b} /></> : <path d="M42 46 L28 34 M50 44 L50 26 M58 46 L72 34 M28 34 L22 28 M72 34 L78 28" stroke="#8f6a47" strokeWidth="3.5" strokeLinecap="round" />}</>
    case 'birch': return <><Trunk w={5} h={44} c="#ece8de" />{[62, 70, 78, 54].map(y => <path key={y} d={`M47.5 ${y} h${y % 8 ? 3 : 4}`} stroke="#3b3a36" strokeWidth="1.6" />)}{p ? <><ellipse cx="50" cy="36" rx="16" ry="23" fill={a} /><ellipse cx="38" cy="46" rx="10" ry="15" fill={c} /><ellipse cx="62" cy="46" rx="10" ry="15" fill={c} /><ellipse cx="50" cy="30" rx="9" ry="14" fill={b} /></> : BARE}</>
    case 'willow': return <><Trunk w={9} h={36} c={WOOD_D} />{p ? <><ellipse cx="50" cy="34" rx="28" ry="17" fill={a} />{[26, 33, 40, 47, 54, 61, 68, 74].map((x, i) => <path key={x} d={`M${x} 40 Q${x + (i % 2 ? 3 : -3)} ${56 + (i % 3) * 4} ${x + (i % 2 ? 1 : -1)} ${68 + (i % 3) * 4}`} stroke={i % 2 ? b : c} strokeWidth="2.6" strokeLinecap="round" fill="none" />)}<ellipse cx="50" cy="28" rx="16" ry="9" fill={b} /></> : BARE}</>
    case 'ginkgo': return <><Trunk w={6} h={30} /><path d="M50 62 L56 42" stroke={WOOD} strokeWidth="2" />{p ? <><path d="M50 62 L18 30 Q50 2 82 30 Z" fill={a} /><path d="M50 56 L28 32 Q50 14 72 32 Z" fill={b} /><path d="M50 62 L18 30" stroke={c} strokeWidth="2" /></> : BARE}</>
    case 'maple': return <><Trunk w={8} h={32} />{p ? <><polygon points={mapleStar} fill={a} /><polygon points={mapleStar} fill={b} transform="translate(50 36) scale(.62) translate(-50 -36)" /></> : BARE}</>
    case 'cherry': return <><Trunk w={8} h={34} c={WOOD_D} /><path d="M50 58 L38 44 M50 54 L64 42" stroke={WOOD_D} strokeWidth="3" strokeLinecap="round" />{p ? <><Blob cx={34} cy={42} r={14} c={c} /><Blob cx={66} cy={42} r={14} c={c} /><Blob cx={50} cy={32} r={19} c={a} /><Blob cx={42} cy={28} r={9} c={b} /><Blob cx={60} cy={36} r={7} c={b} />{se === 'summer' && [[36, 38], [58, 26], [66, 46], [46, 44]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="2.4" fill="#f4a7c0" />)}</> : BARE}</>
    default: return <><Trunk w={9} h={34} c={WOOD_D} />{p ? <><Blob cx={32} cy={48} r={14} c={c} /><Blob cx={68} cy={48} r={14} c={c} /><Blob cx={50} cy={38} r={21} c={a} /><Blob cx={44} cy={30} r={11} c={b} /><Blob cx={60} cy={44} r={8} c={b} /></> : BARE}</>
  }
}
const SPOTS: [number, number, string][] = [[36, 40, '#ffd166'], [58, 28, '#ff9bb5'], [66, 50, '#fff3c4'], [44, 54, '#ffd166'], [52, 42, '#ff9bb5'], [30, 52, '#fff3c4']]
function young(sp: string, p: Pal | null): ReactNode {
  const [a, b] = p ?? ['#6c9a76', '#8dbb95']
  return sp === 'pine' ? <><rect x="48" y="66" width="4" height="22" fill={WOOD_D} /><polygon points="50,40 66,72 34,72" fill={a} /><polygon points="50,28 61,54 39,54" fill={b} /></>
    : <><path d="M50 88 Q49 70 50 52" stroke={WOOD} strokeWidth="4" fill="none" strokeLinecap="round" />{[[42, 54, -30], [58, 52, 30], [44, 66, -25], [57, 64, 25], [50, 44, 0]].map(([x, y, r], i) => <ellipse key={i} cx={x} cy={y} rx="9" ry="5.5" transform={`rotate(${r} ${x} ${y})`} fill={i % 2 ? a : b} />)}</>
}
function seedling(sp: string, p: Pal | null): ReactNode {
  const [a, b] = p ?? ['#6c9a76', '#8dbb95']
  return sp === 'bamboo' ? <><path d="M46 88 L46 54 M54 88 L54 62" stroke={b} strokeWidth="4" strokeLinecap="round" /><ellipse cx="53" cy="56" rx="8" ry="3" transform="rotate(-25 53 56)" fill={a} /></>
    : <><path d="M50 88 Q50 72 50 58" stroke="#5f9a52" strokeWidth="3" fill="none" strokeLinecap="round" />{[[43, 62, -28], [57, 60, 28], [45, 72, -22], [56, 71, 22]].map(([x, y, r], i) => <ellipse key={i} cx={x} cy={y} rx="7" ry="4" transform={`rotate(${r} ${x} ${y})`} fill={i % 2 ? a : b} />)}<ellipse cx="50" cy="55" rx="3.5" ry="6" fill={b} /></>
}
const SCALE: Record<number, number> = { 3: 0.62, 4: 0.92, 5: 1 }

let injected = false
function useSway(still?: boolean) {
  const motion = usePrefs().motion
  useEffect(() => { if (injected || typeof document === 'undefined') return; injected = true; const s = document.createElement('style')
    s.textContent = '@keyframes sf-sway{from{transform:rotate(-1.6deg)}to{transform:rotate(1.6deg)}}.sf-sway{transform-box:fill-box;transform-origin:50% 100%;animation:sf-sway 5.5s ease-in-out infinite alternate;animation-delay:var(--sf-d,0s)}'; document.head.appendChild(s) }, [])
  const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
  return !still && motion !== 'off' && !reduce
}
interface Props { species: string; stage: number; season: Season; size?: number; still?: boolean; label?: string; seed?: number }
/** One cheap SVG per tree (no filters or gradients). Sway is a CSS transform on the crown only. */
function TreeArtBase({ species, stage, season, size = 96, still, label, seed = 0 }: Props) {
  const sway = useSway(still), st = Math.max(0, Math.min(5, Math.round(stage))), p = leaf(species, season), name = SPECIES.find(s => s.id === species)?.name ?? species
  const sc = SCALE[st] ?? 1, snow = season === 'winter'
  const body = st === 0 ? <><ellipse cx="50" cy="82" rx="3.6" ry="4.6" fill="#c7a26a" /><path d="M32 88 Q50 74 68 88 Z" fill={SOIL} /></>
    : st === 1 ? <><path d="M50 86 Q50 74 50 66" stroke="#5f9a52" strokeWidth="3" fill="none" strokeLinecap="round" /><ellipse cx="44" cy="66" rx="7" ry="4" transform="rotate(-28 44 66)" fill="#8fd07a" /><ellipse cx="56" cy="64" rx="7" ry="4" transform="rotate(28 56 64)" fill="#6fbd5f" /><path d="M34 88 Q50 78 66 88 Z" fill={SOIL} /></>
    : st === 2 ? seedling(species, p) : st === 3 && species !== 'pine' && species !== 'bamboo' && species !== 'palm' && species !== 'baobab' ? young(species, p)
    : <g transform={`translate(50 88) scale(${sc}) translate(-50 -88)`}>{crown(species, p, season)}{st === 5 && <>{SPOTS.map(([x, y, c], i) => <circle key={i} cx={x} cy={y} r="2.3" fill={c} />)}<path d="M30 74 q-1 -6 2 -9 M70 74 q2 -6 -1 -9" stroke="#e8a0b4" strokeWidth="1.5" fill="none" /></>}</g>
  return <svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-label={label ?? `${name}, ${STAGE_NAMES[st]}, ${season}`} style={{ display: 'block', overflow: 'visible' }}>
    <ellipse cx="50" cy="89" rx={st === 0 ? 14 : 12 + st * 3} ry="3.4" fill={snow ? '#eef3f8' : 'currentColor'} opacity={snow ? 0.95 : 0.14} />
    {st === 5 && <circle cx="50" cy="48" r="38" fill="#ffd166" opacity=".13" />}
    <g className={sway && st >= 2 ? 'sf-sway' : undefined} style={sway ? ({ '--sf-d': `-${(seed % 7) * 0.8}s` } as React.CSSProperties) : undefined}>{body}</g>
    {st === 5 && <><circle cx="26" cy="84" r="2.4" fill="#ff9bb5" /><circle cx="74" cy="85" r="2.4" fill="#ffd166" /><circle cx="32" cy="86" r="1.8" fill="#fff3c4" /></>}</svg>
}
const TreeArt = memo(TreeArtBase)
export default TreeArt
export { TreeArt }
