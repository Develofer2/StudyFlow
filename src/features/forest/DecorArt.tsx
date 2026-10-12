import { memo } from 'react'
import { itemById } from '@/domain/catalog'

const ART: Record<string, React.ReactNode> = {
  pond: <><ellipse cx="50" cy="70" rx="40" ry="16" fill="#8fc4d8" /><ellipse cx="50" cy="68" rx="32" ry="11" fill="#b5dcea" /><ellipse cx="38" cy="66" rx="7" ry="2.6" fill="#7bbf7a" /></>,
  bench: <><rect x="20" y="52" width="60" height="9" rx="2" fill="#a77b52" /><rect x="22" y="38" width="56" height="8" rx="2" fill="#b98c60" /><path d="M26 61 v20 M74 61 v20 M26 46 v6 M74 46 v6" stroke="#6b4a2e" strokeWidth="4" /></>,
  lantern: <><path d="M50 20 v8" stroke="#555" strokeWidth="3" /><rect x="40" y="28" width="20" height="30" rx="5" fill="#ffd166" /><rect x="38" y="25" width="24" height="6" rx="2" fill="#6b4a2e" /><rect x="38" y="56" width="24" height="5" rx="2" fill="#6b4a2e" /><path d="M50 61 V84" stroke="#6b4a2e" strokeWidth="4" /></>,
  flowers: <>{[[28, 66, '#ff9bb5'], [44, 58, '#ffd166'], [58, 68, '#fff3c4'], [72, 60, '#c9a3ff']].map(([x, y, c]) => <g key={x as number}><path d={`M${x} 82 V${y}`} stroke="#4f9a45" strokeWidth="3" /><circle cx={x as number} cy={y as number} r="6.5" fill={c as string} /><circle cx={x as number} cy={y as number} r="2.4" fill="#d98a2b" /></g>)}</>,
  mushrooms: <>{[[36, 70, 13], [60, 74, 9]].map(([x, y, r]) => <g key={x}><rect x={x - 3} y={y} width="6" height="12" fill="#f3e9d6" /><path d={`M${x - r} ${y + 1} a${r} ${r} 0 0 1 ${r * 2} 0 Z`} fill="#d9534f" /><circle cx={x - 3} cy={y - 4} r="1.8" fill="#fff" /><circle cx={x + 4} cy={y - 2} r="1.5" fill="#fff" /></g>)}</>,
  fireflies: <>{[[26, 40], [48, 28], [70, 44], [38, 60], [62, 66], [80, 28]].map(([x, y]) => <g key={x}><circle cx={x} cy={y} r="7" fill="#ffe27a" opacity=".25" /><circle cx={x} cy={y} r="2.6" fill="#ffd54a" /></g>)}</>,
  bridge: <><path d="M10 74 Q50 28 90 74 L90 82 L10 82 Z" fill="#a9a59c" /><path d="M10 74 Q50 28 90 74" stroke="#8a867d" strokeWidth="4" fill="none" /><path d="M30 60 v14 M50 50 v24 M70 60 v14" stroke="#8a867d" strokeWidth="2" /></>,
  fence: <>{[14, 30, 46, 62, 78].map(x => <rect key={x} x={x} y="44" width="9" height="38" rx="2" fill="#d8c19a" />)}<rect x="10" y="54" width="82" height="5" fill="#c1a77a" /><rect x="10" y="68" width="82" height="5" fill="#c1a77a" /></>,
}
function DecorArtBase({ id, size = 56 }: { id: string; size?: number }) {
  return <svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-label={itemById(id)?.name ?? id} style={{ display: 'block' }}>{ART[id] ?? <circle cx="50" cy="60" r="16" fill="#8fc4d8" />}</svg>
}
export default memo(DecorArtBase)
