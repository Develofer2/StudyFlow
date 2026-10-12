import { Books, Candle, Fireflies, Rain, Stars, Steam, c, useUid, type SceneProps } from './kit'

const BK = [c('#a85a4a', 55), c('#4f7a9a', 55), c('#c9a24e', 55), c('#5e8a62', 55), c('#7a5a8a', 55)]
const INK = 'var(--text)'

export function MinimalDesk({ p }: SceneProps) {
  const wood = c('#a8794f', 45, 'var(--surface2)'), warm = c('#f0c27a', 70)
  return <g>
    <rect width={400} height={250} fill={c('#c9b8a0', 22)} />
    <rect x={30} y={28} width={96} height={114} rx={4} fill={c('#9fc4e0', 40)} stroke={c('#7a6650', 45)} strokeWidth={4} />
    <path d="M78 28v114M30 85h96" stroke={c('#7a6650', 45)} strokeWidth={3} />
    <path d="M30 142 126 142 250 250 100 250z" fill={warm} opacity={.06 + .2 * p} />
    <rect y={198} width={400} height={52} fill={wood} /><rect y={198} width={400} height={4} fill={c('#7a5334', 35, wood)} />
    <g transform="translate(62 198)"><path d="M-12 0l3 -20h18l3 20z" fill={c('#b8654a', 55)} /><path d="M0 -20c-14 -8 -16 -22 -12 -30 10 2 14 12 12 30zM0 -20c12 -10 18 -20 14 -30 -12 4 -16 14 -14 30z" fill={c('#5e8a62', 70)} /></g>
    <rect x={130} y={190} width={64} height={8} rx={1.5} fill={c('#d8cdb8', 40)} /><rect x={134} y={184} width={56} height={6} rx={1.5} fill={c('#7a8aa0', 45)} />
    <g><rect x={214} y={178} width={20} height={20} rx={4} fill={c('#c9a98a', 50)} /><path d="M234 183h6a5 5 0 0 1 0 10h-6" fill="none" stroke={c('#c9a98a', 50)} strokeWidth={3} /></g>
    <Steam x={224} y={176} stroke={INK} />
    <g transform="translate(352 198)"><rect x={-14} y={-4} width={28} height={4} rx={2} fill={c('#5a5048', 45)} /><path d="M0 -4L-14 -60 18 -86" fill="none" stroke={c('#5a5048', 45)} strokeWidth={3} strokeLinecap="round" />
      <path d="M8 -92l22 12 -10 16z" fill={c('#d9a66a', 55)} /><circle cx={20} cy={-62} r={26} fill={warm} opacity={.08 + .06 * p} /></g>
  </g>
}

export function NightSky({ p }: SceneProps) {
  const id = useUid()
  return <g>
    <defs><linearGradient id={id} x1={0} y1={0} x2={0} y2={1}><stop offset="0" stopColor={c('#1c2658', 72)} /><stop offset=".7" stopColor={c('#3a3f80', 62)} /><stop offset="1" stopColor={c('#e59a72', 20 + 55 * p)} /></linearGradient></defs>
    <rect width={400} height={250} fill={`url(#${id})`} />
    <g opacity={1 - .6 * p}><Stars n={46} y1={140} fill={c('#f1e7c4', 80)} /></g>
    <g transform={`translate(${-p * 30} ${p * 14})`}><circle cx={310} cy={52} r={34} fill={c('#f1e7c4', 30)} opacity={.25} /><circle cx={310} cy={52} r={20} fill={c('#eadfb4', 75)} /><circle cx={304} cy={48} r={3.5} fill={c('#c9bc90', 50)} /><circle cx={316} cy={58} r={2.5} fill={c('#c9bc90', 50)} /></g>
    <path d="M0 190c60 -30 120 -34 190 -14s150 4 210 -16V250H0z" fill={c('#2e3b6a', 55)} />
    <path d="M0 215c70 -22 150 -18 230 -2s120 -2 170 -10V250H0z" fill={c('#1f2a52', 62)} />
    <g transform="translate(44 205)" fill={c('#1d3a3a', 55)}><path d="M0 0l10 -30 10 30zM8 -12l8 -26 8 38z" /></g>
  </g>
}

export function RainyLibrary({ p }: SceneProps) {
  const id = useUid()
  const wall = c('#5b4636', 40), wood = c('#6e4d34', 50), warm = c('#f0c27a', 75)
  return <g>
    <rect width={400} height={250} fill={wall} />
    {[0, 1, 2, 3].map(i => <g key={i}><rect x={8} y={26 + i * 40} width={84} height={4} fill={wood} /><Books x={10} y={4 + i * 40 + 6} w={80} h={20} n={10} seed={i * 3 + 1} tints={BK} /></g>)}
    {[0, 1, 2, 3].map(i => <g key={i}><rect x={308} y={26 + i * 40} width={84} height={4} fill={wood} /><Books x={310} y={4 + i * 40 + 6} w={80} h={20} n={10} seed={i * 3 + 20} tints={BK} /></g>)}
    <defs><clipPath id={id}><path d="M118 150V70a82 82 0 0 1 164 0v80z" /></clipPath></defs>
    <path d="M118 150V70a82 82 0 0 1 164 0v80z" fill={c('#7f95b0', 45)} stroke={c('#3e2f22', 55)} strokeWidth={5} />
    <g clipPath={`url(#${id})`}><Rain x={118} y={-12} w={164} h={162} n={16} fill={c('#d6e2f0', 70)} /></g>
    <path d="M200 -12V150M120 80h160" stroke={c('#3e2f22', 55)} strokeWidth={3} />
    <rect y={198} width={400} height={52} fill={c('#7a5538', 50)} /><rect y={198} width={400} height={4} fill={c('#4d3623', 45)} />
    <Candle x={118} y={198} p={p} tall={30} wax={c('#e8dcc0', 70)} flame={c('#f0b050', 85)} glow={warm} />
    <g><rect x={322} y={188} width={46} height={10} rx={1.5} fill={c('#a85a4a', 55)} /><rect x={326} y={178} width={40} height={10} rx={1.5} fill={c('#4f7a9a', 55)} /><rect x={330} y={168} width={34} height={10} rx={1.5} fill={c('#c9a24e', 55)} /></g>
  </g>
}

export function ForestCabin({ p }: SceneProps) {
  const plank = c('#8a6040', 40), sunY = 150 - p * 85
  return <g>
    <rect width={400} height={250} fill={plank} />
    {Array.from({ length: 9 }, (_, i) => <rect key={i} x={i * 46} width={2} height={198} fill={c('#4d3623', 30, plank)} />)}
    <rect x={110} y={26} width={180} height={130} fill={c('#d9a66a', 60)} />
    <svg x={116} y={32} width={168} height={118} viewBox="0 0 168 118" overflow="hidden">
      <rect width={168} height={118} fill={c('#7fa8b8', 45)} /><rect y={50} width={168} height={68} fill={c('#e8b878', p * 40)} opacity={.6} />
      <circle cx={84} cy={sunY - 32} r={14} fill={c('#f6d38a', 80)} />
      {[10, 40, 74, 110, 140].map((x, i) => <path key={x} d={`M${x} 118l${14 - i % 2 * 3} -${58 + i % 3 * 10} ${14 - i % 2 * 3} ${58 + i % 3 * 10}z`} fill={c('#2e5a45', 70 - i % 2 * 12)} />)}
      <Fireflies n={5} x0={10} x1={150} y0={60} y1={105} fill={c('#f0e08a', 85)} />
    </svg>
    <path d="M200 26V156M110 91h180" stroke={c('#5a3d28', 55)} strokeWidth={4} /><rect x={104} y={152} width={192} height={8} fill={c('#5a3d28', 55)} />
    <rect y={198} width={400} height={52} fill={c('#6a4a30', 50)} />
    <ellipse cx={96} cy={214} rx={70} ry={12} fill={c('#a8564a', 45)} />
    <g transform="translate(340 198)"><rect x={-20} y={-34} width={40} height={34} rx={4} fill={c('#7a5538', 45)} /><path d="M-10 0V-18a10 10 0 0 1 20 0V0z" fill={c('#f0a050', 50)} opacity={.8} /><path className="e-flick e-fb" d="M0 -4q6 -6 0 -14q-6 8 0 14z" fill={c('#f6c870', 90)} /></g>
  </g>
}

export function OceanRetreat({ p }: SceneProps) {
  const id = useUid(), shore = 200 - 14 * p
  const wave = (y: number, o: number, t: string) => <path className="e-wave" d={`M0 ${y} ${Array.from({ length: 12 }, () => 'q20 -8 40 0').join(' ')} V250 H0z`} fill={t} opacity={o} />
  return <g>
    <defs><linearGradient id={id} x1={0} y1={0} x2={0} y2={1}><stop offset="0" stopColor={c('#6a7ab0', 55)} /><stop offset="1" stopColor={c('#f0a878', 55)} /></linearGradient></defs>
    <rect width={400} height={250} fill={`url(#${id})`} />
    <circle cx={290} cy={70 + p * 48} r={36} fill={c('#f6c88a', 30)} opacity={.3} /><circle cx={290} cy={70 + p * 48} r={20} fill={c('#f6d09a', 75)} />
    <rect y={128} width={400} height={80} fill={c('#4a78a0', 55)} />
    <g opacity={.35}><rect x={250} y={130} width={80} height={2} fill={c('#f6d09a', 80)} /><rect x={262} y={138} width={56} height={2} fill={c('#f6d09a', 80)} /></g>
    {wave(150, .5, c('#6a96b8', 55))}{wave(174, .55, c('#4a82a8', 55))}
    <rect y={shore} width={400} height={250 - shore} fill={c('#d8b888', 55)} /><rect y={shore} width={400} height={6} fill={c('#f0e0c0', 40)} opacity={.55} />
    <path d="M30 250c0 -20 14 -30 34 -30s32 10 32 30z" fill={c('#7a6a5a', 50)} />
  </g>
}

export function JapaneseGarden({ p }: SceneProps) {
  const sx = 80 + p * 240, sy = 80 - Math.sin(p * Math.PI) * 38
  return <g>
    <rect width={400} height={250} fill={c('#d8e0d8', 35)} />
    <circle cx={sx} cy={sy} r={22} fill={c('#d9534f', 50)} opacity={.85} />
    <path d="M0 140l70 -50 60 40 70 -60 80 70 60 -40 60 40V160H0z" fill={c('#8aa0a8', 40)} opacity={.7} />
    <rect y={150} width={400} height={100} fill={c('#7a9a62', 45)} />
    <ellipse cx={170} cy={205} rx={110} ry={22} fill={c('#6a98a8', 55)} /><ellipse className="e-ripple" cx={170} cy={205} rx={50} ry={10} fill="none" stroke={c('#d8e8ee', 60)} strokeWidth={1.5} />
    <g transform="translate(46 170)"><path d="M-4 0l4 -50 6 50z" fill={c('#5a3d30', 55)} /><circle cx={0} cy={-62} r={34} fill={c('#c4503a', 52)} /><circle cx={-18} cy={-48} r={20} fill={c('#d4703a', 52)} /><circle cx={20} cy={-50} r={22} fill={c('#b8402e', 52)} /></g>
    <svg x={10} y={90} width={90} height={160} viewBox="0 0 90 160" overflow="hidden">{[0, 1, 2].map(i => <path key={i} className="e-leaf" d="M0 0q6 -6 10 0q-4 6 -10 0z" fill={c('#d4703a', 70)} transform={`translate(${20 + i * 24} 0)`} style={{ animationDelay: `${-i * 4}s`, animationDuration: '11s' }} />)}</svg>
    <g fill={c('#8a8a86', 50)}><ellipse cx={300} cy={214} rx={26} ry={12} /><ellipse cx={330} cy={222} rx={16} ry={8} /><ellipse cx={288} cy={196} rx={14} ry={6} /></g>
    <g stroke={c('#8a6a3a', 50)} strokeWidth={4} strokeLinecap="round">{[250, 270, 290, 310, 330, 350, 370].map(x => <path key={x} d={`M${x} 160v26`} />)}<path d="M244 168H376M244 180H376" strokeWidth={2.5} /></g>
  </g>
}

export const SCENES_A = { 'minimal-desk': MinimalDesk, 'night-sky': NightSky, 'rainy-library': RainyLibrary, 'forest-cabin': ForestCabin, 'ocean-retreat': OceanRetreat, 'japanese-garden': JapaneseGarden }
