import { Books, Candle, Snow, Stars, Steam, c, r, useUid, type SceneProps } from './kit'

const BK = [c('#a85a4a', 55), c('#4f7a9a', 55), c('#c9a24e', 55), c('#5e8a62', 55), c('#7a5a8a', 55)]
const INK = 'var(--text)'

export function CozyBedroom({ p }: SceneProps) {
  const a = p * Math.PI * 2
  return <g>
    <rect width={400} height={250} fill={c('#c9a0a0', 28)} /><rect y={200} width={400} height={50} fill={c('#8a6a50', 40)} />
    <rect x={28} y={30} width={92} height={100} rx={44} ry={44} fill={c('#2c3a6e', 60)} stroke={c('#d8c8b8', 45)} strokeWidth={5} />
    <Stars n={12} x0={44} x1={106} y0={44} y1={110} fill={c('#f1e7c4', 80)} seed={5} /><circle cx={92} cy={62} r={9} fill={c('#eadfb4', 75)} />
    <g transform="translate(330 56)"><circle r={24} fill={c('#f0e6d0', 45)} stroke={c('#7a5a40', 50)} strokeWidth={3} /><path d="M0 0v-15" stroke={INK} strokeWidth={2.5} strokeLinecap="round" /><path d="M0 0v-19" stroke={INK} strokeWidth={1.8} strokeLinecap="round" transform={`rotate(${a * 57.3})`} /></g>
    <g><rect x={296} y={100} width={92} height={4} fill={c('#7a5538', 50)} /><Books x={298} y={80} w={86} h={22} n={9} seed={4} tints={BK} /><rect x={296} y={140} width={92} height={4} fill={c('#7a5538', 50)} /><Books x={298} y={120} w={86} h={22} n={9} seed={9} tints={BK} /></g>
    <rect x={150} y={176} width={226} height={46} rx={10} fill={c('#8a5a4a', 40)} /><rect x={150} y={150} width={44} height={34} rx={10} fill={c('#d8c8b8', 42)} />
    <path d="M196 182h180v34H196z" fill={c('#7a8ab0', 50)} /><path d="M196 192h180M196 204h180" stroke={c('#d8c8b8', 40)} strokeWidth={2} opacity={.6} />
    <g transform="translate(110 200)"><rect x={-22} y={-26} width={44} height={26} rx={3} fill={c('#7a5538', 50)} /><path d="M-10 -26l4 -22h12l4 22z" fill={c('#e8c080', 55)} /><circle cy={-38} r={26} fill={c('#f0c27a', 70)} opacity={.22} /></g>
  </g>
}

export function CoffeeShop({ p }: SceneProps) {
  const id = useUid()
  return <g>
    <rect width={400} height={250} fill={c('#a8684a', 32)} />
    {Array.from({ length: 6 }, (_, i) => <path key={i} d={`M0 ${i * 34}H400`} stroke={c('#7a4a34', 25, c('#a8684a', 32))} strokeWidth={1.5} />)}
    <clipPath id={id}><rect x={110} y={34} width={180} height={116} rx={6} /></clipPath>
    <rect x={110} y={34} width={180} height={116} rx={6} fill={c('#6a86a0', 40)} />
    <g clipPath={`url(#${id})`}>{Array.from({ length: 10 }, (_, i) => <circle key={i} cx={120 + r(i) * 160} cy={80 + r(i + 4) * 60} r={5 + r(i + 8) * 8} fill={c(i % 2 ? '#f0c27a' : '#c8d8e8', 50)} opacity={.45} />)}
      <rect x={110} y={34} width={180} height={116} fill={c('#f0b060', 60)} opacity={.05 + .3 * p} /></g>
    <rect x={106} y={30} width={188} height={124} rx={8} fill="none" stroke={c('#4a3020', 55)} strokeWidth={5} />
    {[70, 200, 330].map(x => <g key={x}><path d={`M${x} 0V18`} stroke={c('#4a3020', 50)} strokeWidth={2} /><path d={`M${x - 14} 34a14 14 0 0 1 28 0z`} transform="translate(0 -6)" fill={c('#d9a66a', 55)} /><circle cx={x} cy={34} r={22} fill={c('#f0c27a', 70)} opacity={.16} /></g>)}
    <rect x={14} y={30} width={70} height={52} rx={3} fill={c('#2e3a34', 55)} stroke={c('#7a5538', 50)} strokeWidth={3} /><path d="M24 46h36M24 58h46M24 70h28" stroke={c('#e8e0d0', 55)} strokeWidth={2} opacity={.7} />
    <rect y={192} width={400} height={58} fill={c('#7a5034', 48)} /><rect y={192} width={400} height={5} fill={c('#4a3020', 40)} />
    {[60, 150].map(x => <g key={x}><path d={`M${x - 12} 192l2 -18h20l2 18z`} fill={c('#e8dcc8', 45)} /><Steam x={x} y={172} stroke={INK} /></g>)}
    <g><rect x={330} y={180} width={40} height={12} rx={6} fill={c('#d9a66a', 55)} /><circle cx={340} cy={176} r={5} fill={c('#b8764a', 55)} /></g>
  </g>
}

export function SnowyWindow({ p }: SceneProps) {
  const id = useUid(), pile = 3 + p * 12
  return <g>
    <rect width={400} height={250} fill={c('#b8a898', 25)} />
    <clipPath id={id}><rect x={80} y={24} width={240} height={168} /></clipPath>
    <rect x={80} y={24} width={240} height={168} fill={c('#8aa4c0', 45)} />
    <g clipPath={`url(#${id})`}><path d="M80 192V150c40 -10 80 -4 120 -12s80 -2 120 6v48z" fill={c('#d8e4f0', 40)} />
      {[110, 150, 250, 290].map((x, i) => <path key={x} d={`M${x} 160l14 -${60 + i % 2 * 18} 14 ${60 + i % 2 * 18}z`} fill={c('#3e5a58', 55)} />)}
      <Snow x={80} y={24} w={240} h={168} n={22} fill={c('#eef2f8', 55)} /></g>
    <rect x={76} y={20} width={248} height={176} fill="none" stroke={c('#f0e8dc', 45)} strokeWidth={6} /><path d="M200 24V192M80 108H320" stroke={c('#f0e8dc', 45)} strokeWidth={4} />
    <g opacity={.35} fill={c('#eef2f8', 60)}><circle cx={90} cy={34} r={18} /><circle cx={312} cy={182} r={14} /></g>
    <rect x={64} y={194} width={272} height={9} rx={3} fill={c('#d8c8b8', 42)} />
    <path d={`M70 194q40 -${pile} 80 -${pile * .5} t90 0 t90 ${pile * .3}V194z`} fill={c('#eef2f8', 60)} />
    <rect y={203} width={400} height={47} fill={c('#7a5a44', 42)} />
    <path d="M0 0h72v210q-30 0 -36 -20Q-4 160 0 0z" fill={c('#a85a4a', 40)} opacity={.85} /><path d="M400 0h-72v210q30 0 36 -20Q404 160 400 0z" fill={c('#a85a4a', 40)} opacity={.85} />
    <g><rect x={98} y={174} width={20} height={20} rx={4} fill={c('#c9a98a', 50)} /><Steam x={108} y={172} stroke={INK} /></g>
  </g>
}

export function Greenhouse({ p }: SceneProps) {
  const g = .78 + .22 * p, leaf = (x: number, y: number, rot: number, s = 1, t = '#5e8a62') => <ellipse cx={x} cy={y} rx={14 * s} ry={6 * s} transform={`rotate(${rot} ${x} ${y})`} fill={c(t, 65)} />
  return <g>
    <rect width={400} height={250} fill={c('#c8e0d0', 30)} />
    <g stroke={c('#f0f4ee', 40)} strokeWidth={2} fill="none" opacity={.8}><path d="M0 40Q200 -20 400 40M0 100H400M100 20V200M200 8V200M300 20V200M0 160H400" /></g>
    <path d="M80 0L190 200M200 0V200M320 0L210 200" stroke={c('#f6e8b0', 70)} strokeWidth={26} opacity={.07 + .06 * p} />
    <rect y={202} width={400} height={48} fill={c('#8a7a62', 42)} /><rect x={20} y={150} width={90} height={6} fill={c('#7a5538', 50)} /><rect x={290} y={150} width={90} height={6} fill={c('#7a5538', 50)} />
    <g transform="translate(200 205)"><g className="e-sway e-fb"><g transform={`scale(1 ${g})`}><path d="M0 0Q-4 -60 0 -110" stroke={c('#4a6a3a', 70)} strokeWidth={5} fill="none" />{leaf(-22, -100, -30, 2.2)}{leaf(22, -96, 30, 2.2)}{leaf(-18, -76, -20, 1.8)}{leaf(20, -70, 20, 1.8)}{leaf(0, -118, -80, 1.8)}</g></g></g>
    {[[40, 150], [80, 150], [310, 150], [350, 150]].map(([x, y], i) => <g key={x}><path d={`M${x - 10} ${y}l3 -16h14l3 16z`} fill={c('#b8654a', 55)} />{leaf(x, y - 22, -20 + i * 15, 1.1, i % 2 ? '#7a9a52' : '#4f8a6b')}{leaf(x + 3, y - 26, 30, 1, '#5e8a62')}{p > .5 && <circle cx={x} cy={y - 32} r={3.5} fill={c('#d86a8a', 60)} />}</g>)}
    <g transform="translate(60 206)"><path d="M-14 0l3 -22h22l3 22z" fill={c('#b8654a', 55)} />{leaf(0, -34, -10, 1.6)}{leaf(0, -40, 40, 1.4, '#7a9a52')}</g>
  </g>
}

export function SpaceStation({ p }: SceneProps) {
  const id = useUid()
  const py = 150 - p * 50
  return <g>
    <rect width={400} height={250} fill={c('#4a5468', 38)} />
    <clipPath id={id}><rect x={90} y={26} width={220} height={128} rx={44} /></clipPath>
    <rect x={90} y={26} width={220} height={128} rx={44} fill={c('#141a38', 70)} />
    <g clipPath={`url(#${id})`}><Stars n={34} x0={90} x1={310} y0={26} y1={154} fill={c('#e8ecf6', 80)} seed={11} />
      <circle cx={250} cy={py + 70} r={80} fill={c('#4a7ab0', 55)} /><path d={`M180 ${py + 56}q60 -16 140 4M176 ${py + 76}q70 -10 150 2`} stroke={c('#d8e8f0', 40)} strokeWidth={5} fill="none" opacity={.35} /><circle cx={250} cy={py + 70} r={80} fill="none" stroke={c('#8ac0e0', 60)} strokeWidth={3} opacity={.5} /></g>
    <rect x={86} y={22} width={228} height={136} rx={46} fill="none" stroke={c('#8a94a8', 45)} strokeWidth={6} />
    <rect y={198} width={400} height={52} fill={c('#5a6478', 42)} /><rect y={198} width={400} height={5} fill={c('#8a94a8', 40)} />
    {[0, 1, 2, 3, 4, 5].map(i => <circle key={i} className={i % 2 ? 'e-blink' : undefined} cx={24 + i * 22} cy={214} r={3.5} fill={c(['#6ac08a', '#e8b050', '#6aa0e0'][i % 3], 70)} style={i % 2 ? { animationDelay: `${-i * .4}s` } : undefined} />)}
    <rect x={250} y={206} width={130} height={28} rx={5} fill={c('#2e3850', 45)} /><path d="M262 220h40M262 226h70" stroke={c('#6aa0e0', 60)} strokeWidth={2} />
    <path d="M14 0v60M386 0v60" stroke={c('#2e3850', 50)} strokeWidth={8} />
  </g>
}

export function MagicArchive({ p }: SceneProps) {
  const warm = c('#f0c27a', 75), vi = c('#5a3a8a', 40)
  const fb = (x: number, y: number, rot: number, t: string, dl: number) => <g className="e-float e-fb" style={{ animationDelay: `${dl}s` }}><g transform={`rotate(${rot} ${x} ${y})`}><rect x={x - 12} y={y - 8} width={24} height={16} rx={2} fill={c(t, 60)} /><path d={`M${x} ${y - 8}v16`} stroke={warm} strokeWidth={1} /></g></g>
  return <g>
    <rect width={400} height={250} fill={vi} />
    <path d="M110 200V70a90 90 0 0 1 180 0v130z" fill={c('#2e1f52', 55)} /><circle cx={200} cy={100} r={64} fill={warm} opacity={.12} />
    {[0, 1, 2, 3, 4].map(i => <g key={i}><rect x={6} y={20 + i * 36} width={88} height={4} fill={c('#4a3020', 50)} /><Books x={8} y={i * 36 + 2} w={84} h={18} n={10} seed={i + 2} tints={BK} /><rect x={306} y={20 + i * 36} width={88} height={4} fill={c('#4a3020', 50)} /><Books x={308} y={i * 36 + 2} w={84} h={18} n={10} seed={i + 30} tints={BK} /></g>)}
    {fb(150, 60, -12, '#a85a4a', 0)}{fb(250, 52, 10, '#4f7a9a', -2)}{fb(210, 150, -6, '#c9a24e', -4)}
    <g className="e-float e-fb" style={{ animationDelay: '-1s' }}><Candle x={124} y={116} p={p} tall={24} wax={c('#e8dcc0', 70)} flame={c('#f0b050', 85)} glow={warm} /></g>
    <g className="e-float e-fb" style={{ animationDelay: '-3s' }}><Candle x={278} y={130} p={p} tall={28} wax={c('#e8dcc0', 70)} flame={c('#f0b050', 85)} glow={warm} /></g>
    <Stars n={14} x0={110} x1={290} y0={30} y1={190} fill={c('#f0d890', 80)} seed={21} />
    <rect y={204} width={400} height={46} fill={c('#3a2a5a', 50)} /><ellipse cx={288} cy={222} rx={74} ry={12} fill={c('#8a3a5a', 42)} />
  </g>
}

export const SCENES_B = { 'cozy-bedroom': CozyBedroom, 'coffee-shop': CoffeeShop, 'snowy-window': SnowyWindow, 'greenhouse': Greenhouse, 'space-station': SpaceStation, 'magic-archive': MagicArchive }
