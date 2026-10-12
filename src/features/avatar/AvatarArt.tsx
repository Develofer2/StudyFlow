import { useId, type ReactNode } from 'react'
import { BOTTOMS, SHOES, TOPS, sanitizeAvatar, type AvatarCfg, type Bottom, type Shoe, type Top } from '@/domain/avatar'
import { useReducedMotion } from '../buddy/useMotion'

const INK = '#2b2230'
const OL = { stroke: INK, strokeOpacity: 0.5, strokeWidth: 1.4, strokeLinejoin: 'round' as const }
const STAR = 'M0-6 L1.8-1.9 6.3-1.7 2.8 1.1 4 5.5 0 3.1-4 5.5-2.8 1.1-6.3-1.7-1.8-1.9Z'
const HEART = 'M0 5 C-8 -1 -5 -6 0 -2 C5 -6 8 -1 0 5Z'

function topArt(t: Top, id: string): { body: ReactNode; sleeves: ReactNode } {
  const sleeveC = t.d === 'varsity' ? t.c2 : t.d === 'rainbow' ? '#ff9f43' : t.c
  const sl = t.long ? 34 : 16
  const sleeves = <>
    <rect x="24" y="70" width="14" height={sl} rx="6" fill={sleeveC} {...OL} /><rect x="82" y="70" width="14" height={sl} rx="6" fill={sleeveC} {...OL} />
    {t.d === 'jersey' && <><rect x="24" y="82" width="14" height="4" fill={t.c2} /><rect x="82" y="82" width="14" height="4" fill={t.c2} /></>}
    {t.long && t.d !== 'armor' && <><rect x="24" y="100" width="14" height="4" rx="2" fill={t.c2} opacity=".55" /><rect x="82" y="100" width="14" height="4" rx="2" fill={t.c2} opacity=".55" /></>}
    {t.d === 'armor' && <><circle cx="31" cy="73" r="8" fill={t.c2} {...OL} /><circle cx="89" cy="73" r="8" fill={t.c2} {...OL} /></>}
  </>
  const base = (fill: string) => <rect x="38" y="68" width="44" height="46" rx="7" fill={fill} {...OL} />
  let body: ReactNode
  switch (t.d) {
    case 'stripes': body = <>{base(t.c)}{[78, 90, 102].map(y => <rect key={y} x="38.7" y={y} width="42.6" height="5.5" fill={t.c2} />)}</>; break
    case 'star': body = <>{base(t.c)}<path transform="translate(60 91) scale(2.2)" d={STAR} fill={t.c2} /></>; break
    case 'heart': body = <>{base(t.c)}<path transform="translate(60 92) scale(2.6)" d={HEART} fill={t.c2} /></>; break
    case 'hoodie': body = <>{base(t.c)}<path d="M46 68 Q60 84 74 68 L74 74 Q60 90 46 74Z" fill={t.c2} {...OL} /><rect x="46" y="98" width="28" height="11" rx="4" fill={t.c2} opacity=".55" /><path d="M55 80 V92 M65 80 V92" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" /></>; break
    case 'jersey': body = <>{base(t.c)}<rect x="38.7" y="68.7" width="42.6" height="5" fill={t.c2} /><text x="60" y="102" textAnchor="middle" fontSize="26" fontWeight="800" fill={t.c2} fontFamily="var(--font-display)">7</text></>; break
    case 'overalls': body = <>{base(t.c)}<rect x="46" y="88" width="28" height="26" rx="3" fill={t.c2} {...OL} /><path d="M48 70 L50 88 M72 70 L70 88" stroke={t.c2} strokeWidth="4" strokeLinecap="round" /><circle cx="51" cy="90" r="1.8" fill="#ffd54a" /><circle cx="69" cy="90" r="1.8" fill="#ffd54a" /><rect x="53" y="98" width="14" height="8" rx="2" fill="#000" opacity=".12" /></>; break
    case 'robe': body = <>{base(t.c)}<path d="M52 68 L60 90 L68 68" fill="none" stroke={t.c2} strokeWidth="2.4" strokeLinejoin="round" /><rect x="38.7" y="96" width="42.6" height="6" fill={t.c2} opacity=".9" />{[[48, 78], [72, 82], [50, 108], [70, 108]].map(([x, y]) => <path key={`${x}${y}`} transform={`translate(${x} ${y}) scale(.8)`} d={STAR} fill={t.c2} />)}</>; break
    case 'armor': body = <>{base(t.c)}<path d="M60 70 V112 M44 84 H76 M44 98 H76" stroke={t.c2} strokeWidth="2" opacity=".8" /><path transform="translate(60 80) scale(1.3)" d={STAR} fill={t.c2} opacity=".9" /></>; break
    case 'suit': body = <>{base(t.c)}<path d="M52 68 L60 96 L68 68Z" fill={t.c2} /><path d="M52 68 L60 96 L45 112 M68 68 L60 96 L75 112" fill="none" stroke="#000" strokeOpacity=".35" strokeWidth="1.4" /><path d="M54 72 L60 76 L66 72 L66 80 L60 76 L54 80Z" fill="#e2457a" /></>; break
    case 'coat': body = <>{base(t.c)}<path d="M52 68 L60 84 L68 68" fill="#fff" stroke={t.c2} strokeWidth="1.6" /><circle cx="60" cy="92" r="1.8" fill={t.c2} /><circle cx="60" cy="102" r="1.8" fill={t.c2} /><rect x="45" y="98" width="11" height="9" rx="2" fill="none" stroke={t.c2} strokeWidth="1.4" /></>; break
    case 'varsity': body = <>{base(t.c)}<path d="M60 68 V114" stroke="#fff" strokeWidth="1.8" /><text x="50" y="92" textAnchor="middle" fontSize="15" fontWeight="800" fill="#f1f1ea" fontFamily="var(--font-display)">S</text></>; break
    case 'galaxy': body = <><defs><linearGradient id={`${id}g`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={t.c} /><stop offset="1" stopColor={t.c2} /></linearGradient></defs>{base(`url(#${id}g)`)}{[[48, 80, 1.3], [66, 76, 1], [56, 98, 1.4], [72, 94, 1.1], [46, 106, 1]].map(([x, y, r]) => <circle key={`${x}${y}`} cx={x} cy={y} r={r} fill="#fff" />)}</>; break
    case 'rainbow': body = <>{base('#ff6b6b')}{['#ff9f43', '#ffd54a', '#5cbf7a', '#5fa8f5', '#8a6cf0'].map((c, i) => <rect key={c} x="38.7" y={79 + i * 7} width="42.6" height={i === 4 ? 6.5 : 7} fill={c} />)}</>; break
    case 'sailor': body = <>{base(t.c)}<path d="M42 68 H78 L68 88 H52Z" fill={t.c2} {...OL} /><path d="M54 70 L60 80 L66 70" fill="none" stroke="#fff" strokeWidth="1.4" /><path d="M56 88 L60 94 L64 88 L66 100 L60 96 L54 100Z" fill="#e2574c" /></>; break
    case 'pj': body = <>{base(t.c)}{[[48, 80], [70, 86], [54, 102], [72, 104]].map(([x, y]) => <path key={`${x}${y}`} transform={`translate(${x} ${y}) scale(.75)`} d={STAR} fill={t.c2} />)}<circle cx="60" cy="74" r="2" fill={t.c2} /></>; break
    case 'polo': body = <>{base(t.c)}<path d="M48 68 L60 80 L72 68 L68 66 L60 73 L52 66Z" fill={t.c2} {...OL} /><rect x="58.8" y="78" width="2.4" height="14" rx="1" fill={t.c2} /><circle cx="60" cy="83" r="1.3" fill={t.c} /><circle cx="60" cy="89" r="1.3" fill={t.c} /></>; break
    case 'bolt': body = <>{base(t.c)}<path d="M65 74 L53 94 H61 L56 108 L70 87 H62Z" fill={t.c2} stroke="#000" strokeOpacity=".25" strokeWidth="1" strokeLinejoin="round" /></>; break
    case 'cat': body = <>{base(t.c)}<path d="M50 86 L51 75 L58 81Z M70 86 L69 75 L62 81Z" fill={t.c2} /><circle cx="60" cy="90" r="10" fill={t.c2} /><circle cx="56" cy="89" r="1.5" fill={INK} /><circle cx="64" cy="89" r="1.5" fill={INK} /><path d="M58.5 93 Q60 95 61.5 93" fill="none" stroke={INK} strokeWidth="1.2" strokeLinecap="round" /><path d="M46 91 H52 M68 91 H74" stroke={INK} strokeWidth=".9" /></>; break
    case 'flower': body = <>{base(t.c)}{[[60, 92, 1], [47, 78, .55], [73, 104, .55]].map(([x, y, k]) => <g key={`${x}${y}`} transform={`translate(${x} ${y}) scale(${k})`}>{[0, 72, 144, 216, 288].map(a => <circle key={a} cx={Math.cos(a * Math.PI / 180) * 6.5} cy={Math.sin(a * Math.PI / 180) * 6.5} r="4.4" fill={t.c2} />)}<circle r="3.6" fill="#ffd54a" /></g>)}</>; break
    case 'bow': body = <>{base(t.c)}<path d="M44 68 Q60 80 76 68" fill="none" stroke={t.c2} strokeWidth="2" opacity=".6" /><path d="M60 78 L47 70 V86Z M60 78 L73 70 V86Z" fill={t.c2} {...OL} /><circle cx="60" cy="78" r="3.4" fill={t.c2} {...OL} />{[92, 101].map(y => <circle key={y} cx="60" cy={y} r="1.4" fill={t.c2} />)}</>; break
    case 'ruffle': body = <>{base(t.c)}<path d="M44 68 Q60 84 76 68" fill="none" stroke={t.c2} strokeWidth="4" strokeDasharray="3 2.5" strokeLinecap="round" />{[43, 51, 59, 67, 75].map(x => <circle key={x} cx={x} cy="112" r="4.4" fill={t.c2} {...OL} />)}<path d="M60 80 L55 75 V84Z M60 80 L65 75 V84Z" fill={t.c2} opacity=".9" /></>; break
    case 'dress': body = <>{base(t.c)}<path d="M38 100 H82 L94 134 Q60 144 26 134Z" fill={t.c} {...OL} /><rect x="38.7" y="96" width="42.6" height="5" fill={t.c2} /><path d="M32 128 Q60 138 88 128" fill="none" stroke={t.c2} strokeWidth="2.4" strokeDasharray="1 5" strokeLinecap="round" /><path transform="translate(60 84) scale(1.3)" d={HEART} fill={t.c2} /></>; break
    default: body = base(t.c)
  }
  return { body, sleeves }
}

function bottomArt(b: Bottom, skin: string, id: string): ReactNode {
  if (b.d === 'skirt') return <>
    <rect x="42" y="112" width="16" height="36" rx="6" fill={skin} {...OL} /><rect x="62" y="112" width="16" height="36" rx="6" fill={skin} {...OL} />
    <path d="M38 108 H82 L90 132 Q82 126 76 132 Q68 126 60 132 Q52 126 44 132 Q38 126 30 132Z" fill={b.c} {...OL} /><path d="M38 112 H82" stroke={b.c2} strokeWidth="3" /></>
  if (b.d === 'tutu') return <>
    <rect x="42" y="112" width="16" height="36" rx="6" fill={skin} {...OL} /><rect x="62" y="112" width="16" height="36" rx="6" fill={skin} {...OL} />
    <path d="M36 106 H84 L99 128 Q60 142 21 128Z" fill={b.c} {...OL} /><path d="M40 112 H80 L91 126 Q60 135 29 126Z" fill={b.c2} opacity=".75" />
    {[[34, 124], [52, 130], [70, 128], [86, 123], [60, 118]].map(([x, y]) => <path key={`${x}${y}`} transform={`translate(${x} ${y}) scale(.55)`} d={STAR} fill="#fff" opacity=".9" />)}<rect x="38" y="106" width="44" height="5" rx="2" fill="#ff7ab8" {...OL} /></>
  const h = b.short ? 128 : 148
  const fill = b.d === 'galaxy' ? `url(#${id}b)` : b.c
  const leg = (x: number) => <g key={x}><rect x={x} y="110" width="16" height={h - 110} rx="5" fill={fill} {...OL} />
    {b.d === 'plaid' && <><path d={`M${x + 5} 112 V${h - 3} M${x + 11} 112 V${h - 3}`} stroke={b.c2} strokeWidth="1.4" opacity=".8" />{[120, 132, 142].filter(y => y < h - 2).map(y => <path key={y} d={`M${x + 1} ${y} H${x + 15}`} stroke={b.c2} strokeWidth="1.4" opacity=".8" />)}</>}
    {b.d === 'stripe' && <rect x={x === 42 ? x + 1 : x + 12} y="111" width="3" height={h - 113} fill={b.c2} />}
    {b.d === 'cuff' && !b.short && <rect x={x + .7} y={h - 6} width="14.6" height="5" rx="2" fill={b.c2} opacity=".6" />}
    {b.d === 'rainbow' && ['#ff9f43', '#ffd54a', '#5cbf7a', '#5fa8f5'].map((c, i) => <rect key={c} x={x + .7} y={118 + i * 8} width="14.6" height="4" fill={c} />)}
    {b.d === 'hearts' && [[8, 120], [8, 134]].map(([dx, y]) => <path key={y} transform={`translate(${x + dx} ${y}) scale(.9)`} d={HEART} fill={b.c2} />)}
    {b.d === 'camo' && [[4, 118, 5, 3.4], [11, 128, 4.5, 3], [5, 138, 5, 3.4], [11, 114, 3.5, 2.6]].map(([dx, y, rx, ry]) => <ellipse key={`${dx}${y}`} cx={x + dx} cy={y} rx={rx} ry={ry} fill={b.c2} opacity=".85" />)}
    {b.d === 'galaxy' && [[3, 20], [11, 34], [6, 10]].map(([dx, dy]) => <circle key={`${dx}${dy}`} cx={x + dx} cy={110 + dy} r="1.1" fill="#fff" />)}</g>
  return <>{b.short && <><rect x="42" y="126" width="16" height="22" rx="6" fill={skin} {...OL} /><rect x="62" y="126" width="16" height="22" rx="6" fill={skin} {...OL} /></>}
    {b.d === 'galaxy' && <defs><linearGradient id={`${id}b`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={b.c} /><stop offset="1" stopColor={b.c2} /></linearGradient></defs>}{leg(42)}{leg(62)}</>
}

function shoeArt(s: Shoe): ReactNode {
  const one = (x: number, flip: boolean) => {
    const w = s.kind === 'cloud' ? 23 : 21, ox = flip ? x - (w - 20) : x - 0.5
    return <g key={x}>
      {s.tall && <rect x={x + 0.5} y="136" width="15" height="14" rx="3" fill={s.c} {...OL} />}
      <rect x={ox} y={s.kind === 'ballet' ? 150 : 147} width={w} height={s.kind === 'ballet' ? 9 : 12} rx={s.kind === 'cloud' ? 6 : 5} fill={s.c} {...OL} />
      {s.kind === 'maryjane' ? <><rect x={x + 0.5} y="148.4" width="15" height="2.6" rx="1.3" fill={s.c2} /><circle cx={x + 8} cy="149.7" r="1.7" fill="#ffd54a" /><rect x={ox + 1} y="156" width={w - 2} height="2.4" rx="1.2" fill={s.c2} opacity=".7" /></> : s.kind === 'ballet' ? <><path d={`M${x + 3} 151 L${x + 8} 141 M${x + 13} 151 L${x + 8} 141`} stroke={s.c2} strokeWidth="1.6" strokeLinecap="round" /><path d={`M${x + 6} 153.5 q2 -2.4 4 0 q-2 2.4 -4 0Z`} fill={s.c2} /></> : s.kind === 'slipper' ? <><circle cx={x + 4} cy="145" r="3" fill={s.c2} /><circle cx={x + 12} cy="145" r="3" fill={s.c2} /></> : s.kind === 'skate' ? <><rect x={ox} y="154" width={w} height="3.5" fill={s.c2} /><circle cx={x + 3} cy="160" r="2.6" fill={INK} /><circle cx={x + 14} cy="160" r="2.6" fill={INK} /></> :
        <><rect x={ox + 1} y="155.5" width={w - 2} height="2.8" rx="1.4" fill={s.c2} />{!s.tall && <path d={`M${x + 4} 150 h8 M${x + 4} 152.5 h8`} stroke={s.c2} strokeWidth="1" opacity=".8" />}</>}
    </g>
  }
  return <>{one(42, true)}{one(62, false)}</>
}

function hairParts(style: string, c: string): { back: ReactNode; front: ReactNode } {
  const fringe = <path d="M34 38 Q32 11 60 11 Q88 11 86 38 Q80 24 62 25 Q50 26 44 33 Q40 36 34 38Z" fill={c} {...OL} />
  switch (style) {
    case 'bob': return { back: <rect x="31" y="20" width="58" height="46" rx="14" fill={c} {...OL} />, front: fringe }
    case 'long': return { back: <rect x="31" y="20" width="58" height="82" rx="16" fill={c} {...OL} />, front: fringe }
    case 'buns': return { back: <><circle cx="38" cy="15" r="10" fill={c} {...OL} /><circle cx="82" cy="15" r="10" fill={c} {...OL} /></>, front: fringe }
    case 'pony': return { back: <path d="M80 24 Q108 20 102 54 Q98 74 90 84 Q92 56 82 44Z" fill={c} {...OL} />, front: <>{fringe}<circle cx="84" cy="26" r="3.4" fill="#e2457a" /></> }
    case 'spiky': return { back: null, front: <path d="M33 40 L32 20 L42 26 L44 8 L54 20 L60 4 L67 20 L77 8 L78 26 L88 20 L87 40 Q80 26 60 26 Q42 26 33 40Z" fill={c} {...OL} /> }
    case 'curly': return { back: null, front: <g fill={c} {...OL}>{[[38, 30], [34, 40], [44, 18], [56, 13], [68, 13], [78, 18], [86, 30], [82, 40], [48, 26], [72, 26], [60, 22]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="9" />)}</g> }
    case 'side': return { back: null, front: <path d="M33 40 Q28 8 62 8 Q92 10 87 40 Q86 28 74 22 Q54 24 44 36 Q40 38 33 40Z" fill={c} {...OL} /> }
    case 'wavy': return { back: <path d="M31 22 H89 V70 Q82 78 76 70 Q70 78 64 70 Q58 78 52 70 Q46 78 40 70 Q34 78 31 70Z" fill={c} {...OL} />, front: fringe }
    case 'undercut': return { back: null, front: <path d="M37 30 Q36 6 62 7 Q86 8 84 30 Q76 18 60 19 Q46 20 37 30Z" fill={c} {...OL} /> }
    case 'afro': return { back: <ellipse cx="60" cy="30" rx="38" ry="34" fill={c} {...OL} />, front: <path d="M40 27 Q46 17 60 17 Q74 17 80 27 Q72 21 60 21 Q48 21 40 27Z" fill={c} /> }
    case 'braids': return { back: <g fill={c} {...OL}>{[0, 1, 2, 3].map(i => <circle key={`l${i}`} cx="33" cy={44 + i * 11} r="5.4" />)}{[0, 1, 2, 3].map(i => <circle key={`r${i}`} cx="87" cy={44 + i * 11} r="5.4" />)}</g>, front: fringe }
    case 'none': return { back: null, front: null }
    default: return { back: null, front: fringe }
  }
}

function hatArt(id: string): ReactNode {
  switch (id) {
    case 'cap': return <><path d="M35 30 Q36 6 60 6 Q84 6 85 30Z" fill="#e2574c" {...OL} /><path d="M60 26 H98 Q100 31 94 32 H60Z" fill="#c43e34" {...OL} /><circle cx="60" cy="7" r="2.4" fill="#fff" /></>
    case 'beanie': return <><path d="M34 32 Q34 4 60 4 Q86 4 86 32Z" fill="#4f8cf0" {...OL} /><rect x="33" y="26" width="54" height="9" rx="4" fill="#3a6fc8" {...OL} /><circle cx="60" cy="3" r="5" fill="#fff" {...OL} /></>
    case 'headband': return <><rect x="34" y="20" width="52" height="6" rx="3" fill="#fff" {...OL} /><rect x="34" y="22" width="52" height="2" fill="#e2574c" /></>
    case 'party': return <><path d="M44 18 L60 -14 L76 18Z" fill="#ff7ab8" {...OL} /><path d="M49 8 L71 8 M53 -2 L67 -2" stroke="#ffd54a" strokeWidth="3" /><circle cx="60" cy="-14" r="4" fill="#ffd54a" /></>
    case 'bow': return <g transform="translate(60 12)"><path d="M0 0 L-18 -9 V9Z M0 0 L18 -9 V9Z" fill="#ff7ab8" {...OL} /><circle r="4" fill="#e2457a" {...OL} /></g>
    case 'chef': return <><rect x="40" y="18" width="40" height="10" rx="3" fill="#fff" {...OL} /><path d="M38 20 Q26 6 40 0 Q44 -12 60 -6 Q76 -12 80 0 Q94 6 82 20Z" fill="#fff" {...OL} /></>
    case 'cat-ears': return <><path d="M38 24 L40 0 L56 16Z" fill="#3b3548" {...OL} /><path d="M82 24 L80 0 L64 16Z" fill="#3b3548" {...OL} /><path d="M42 18 L43 7 L50 14Z M78 18 L77 7 L70 14Z" fill="#f7a8c4" /></>
    case 'cowboy': return <><path d="M20 24 Q40 34 60 28 Q80 34 100 24 Q96 18 84 20 Q82 2 60 2 Q38 2 36 20 Q24 18 20 24Z" fill="#b8814e" {...OL} /><rect x="37" y="16" width="46" height="5" fill="#7a4f2e" /></>
    case 'headphones': return <><path d="M36 38 Q36 4 60 4 Q84 4 84 38" fill="none" stroke="#3b3548" strokeWidth="5" strokeLinecap="round" /><rect x="29" y="30" width="11" height="20" rx="5" fill="#ff7ab8" {...OL} /><rect x="80" y="30" width="11" height="20" rx="5" fill="#ff7ab8" {...OL} /></>
    case 'strawberry': return <><path d="M34 30 Q30 4 60 4 Q90 4 86 30 Q60 38 34 30Z" fill="#e8474c" {...OL} />{[[46, 16], [58, 22], [70, 14], [76, 24], [50, 26]].map(([x, y]) => <ellipse key={`${x}${y}`} cx={x} cy={y} rx="1.4" ry="2" fill="#ffe9a8" />)}<path d="M50 6 L56 -2 L60 4 L64 -2 L70 6Z" fill="#4caf63" {...OL} /></>
    case 'bunny-ears': return <><ellipse cx="46" cy="-10" rx="7" ry="20" fill="#fff" {...OL} /><ellipse cx="74" cy="-10" rx="7" ry="20" fill="#fff" {...OL} /><ellipse cx="46" cy="-8" rx="3.4" ry="14" fill="#f7a8c4" /><ellipse cx="74" cy="-8" rx="3.4" ry="14" fill="#f7a8c4" /></>
    case 'fox-ears': return <><path d="M36 26 L38 -4 L58 14Z" fill="#ee8a3a" {...OL} /><path d="M84 26 L82 -4 L62 14Z" fill="#ee8a3a" {...OL} /><path d="M40 18 L40 6 L50 14Z M80 18 L80 6 L70 14Z" fill="#fff" /></>
    case 'flowers': return <>{[[40, 18, '#ff7ab8'], [52, 11, '#ffd54a'], [66, 11, '#fff'], [80, 18, '#a78bfa']].map(([x, y, c]) => <g key={String(x)} transform={`translate(${x} ${y})`}>{[0, 72, 144, 216, 288].map(a => <circle key={a} cx={Math.cos(a * Math.PI / 180) * 4} cy={Math.sin(a * Math.PI / 180) * 4} r="3.2" fill={String(c)} />)}<circle r="2.2" fill="#f6a623" /></g>)}</>
    case 'devil': return <><path d="M40 20 Q34 6 44 -2 Q44 10 50 16Z M80 20 Q86 6 76 -2 Q76 10 70 16Z" fill="#e2403a" {...OL} /></>
    case 'tophat': return <><rect x="42" y="-12" width="36" height="34" rx="3" fill="#2c2e38" {...OL} /><rect x="42" y="10" width="36" height="6" fill="#e2457a" /><rect x="30" y="20" width="60" height="7" rx="3.5" fill="#2c2e38" {...OL} /></>
    case 'grad-cap': return <><path d="M60 0 L96 14 L60 28 L24 14Z" fill="#2c2e38" {...OL} /><path d="M44 22 V32 Q60 40 76 32 V22 L60 28Z" fill="#3b3548" {...OL} /><path d="M92 15 V32" stroke="#ffd54a" strokeWidth="2" /><circle cx="92" cy="34" r="3" fill="#ffd54a" /></>
    case 'pirate': return <><path d="M24 26 Q34 -4 60 2 Q86 -4 96 26 Q60 18 24 26Z" fill="#2c2e38" {...OL} /><circle cx="60" cy="12" r="5" fill="#f1f1ea" /><path d="M54 18 L66 22 M66 18 L54 22" stroke="#f1f1ea" strokeWidth="2" /></>
    case 'wizard': return <><path d="M24 26 Q60 34 96 26 Q80 22 74 20 L66 -22 Q60 -26 54 -22 L46 20 Q40 22 24 26Z" fill="#5b3fb0" {...OL} /><rect x="45" y="14" width="30" height="5" fill="#ffd54a" />{[[58, -4], [64, 6]].map(([x, y]) => <path key={String(x)} transform={`translate(${x} ${y}) scale(.7)`} d={STAR} fill="#ffd54a" />)}</>
    case 'viking': return <><path d="M34 30 Q34 4 60 4 Q86 4 86 30Z" fill="#aab4c6" {...OL} /><rect x="34" y="24" width="52" height="6" fill="#6f7a90" /><path d="M36 22 Q22 22 24 6 Q32 14 40 14Z M84 22 Q98 22 96 6 Q88 14 80 14Z" fill="#f4ecd8" {...OL} /></>
    case 'halo': return <ellipse cx="60" cy="2" rx="20" ry="5" fill="none" stroke="#ffd54a" strokeWidth="4" />
    case 'unicorn': return <><path d="M54 14 L60 -20 L66 14Z" fill="#fff" {...OL} /><path d="M56 6 L65 2 M57 -2 L63 -5" stroke="#f08ac0" strokeWidth="2" /></>
    case 'astro': return <><circle cx="60" cy="36" r="31" fill="#bfe3ff" fillOpacity=".28" stroke="#e8edf5" strokeWidth="4" /><path d="M42 20 Q50 12 62 12" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".7" /></>
    case 'crown': return <><path d="M38 24 L38 4 L50 14 L60 0 L70 14 L82 4 L82 24Z" fill="#f2c230" {...OL} /><circle cx="60" cy="14" r="2.6" fill="#e2457a" /><circle cx="46" cy="18" r="1.8" fill="#5fa8f5" /><circle cx="74" cy="18" r="1.8" fill="#5cbf7a" /></>
    default: return null
  }
}

function faceArt(id: string): ReactNode {
  switch (id) {
    case 'blush': return <><ellipse cx="45" cy="46" rx="4.5" ry="2.8" fill="#ff7a9c" opacity=".5" /><ellipse cx="75" cy="46" rx="4.5" ry="2.8" fill="#ff7a9c" opacity=".5" /></>
    case 'freckles': return <g fill="#a86a45" opacity=".7">{[[45, 44], [49, 46], [43, 47], [71, 44], [75, 46], [77, 43]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="1" />)}</g>
    case 'whiskers': return <path d="M30 42 H42 M30 47 L42 46 M90 42 H78 M90 47 L78 46" stroke={INK} strokeOpacity=".6" strokeWidth="1.4" strokeLinecap="round" />
    case 'glasses': return <g fill="#fff" fillOpacity=".2" stroke={INK} strokeWidth="2"><circle cx="50" cy="38" r="8" /><circle cx="70" cy="38" r="8" /><path d="M58 38 H62 M42 37 L36 34 M78 37 L84 34" fill="none" /></g>
    case 'eyepatch': return <g><path d="M36 28 L84 44" stroke={INK} strokeWidth="2" /><ellipse cx="50" cy="38" rx="8" ry="7" fill="#2c2e38" /></g>
    case 'shades': return <g fill="#1d1b26"><rect x="40" y="31" width="17" height="11" rx="4" /><rect x="63" y="31" width="17" height="11" rx="4" /><path d="M57 35 H63" stroke="#1d1b26" strokeWidth="2.4" /><path d="M43 34 l5 -1.4" stroke="#fff" strokeOpacity=".6" strokeWidth="1.4" /></g>
    case 'glasses-3d': return <g><rect x="40" y="31" width="17" height="12" rx="3" fill="#ff4d4d" fillOpacity=".7" stroke="#fff" strokeWidth="2" /><rect x="63" y="31" width="17" height="12" rx="3" fill="#4dd2ff" fillOpacity=".7" stroke="#fff" strokeWidth="2" /><path d="M57 36 H63" stroke="#fff" strokeWidth="2" /></g>
    case 'heart-glasses': return <g fill="#ff7ab8" fillOpacity=".75" stroke="#c43e7a" strokeWidth="1.6"><path transform="translate(50 38) scale(1.5)" d={HEART} /><path transform="translate(70 38) scale(1.5)" d={HEART} /></g>
    case 'star-glasses': return <g fill="#ffd54a" fillOpacity=".8" stroke="#c9961a" strokeWidth="1.4"><path transform="translate(50 38) scale(1.6)" d={STAR} /><path transform="translate(70 38) scale(1.6)" d={STAR} /></g>
    case 'monocle': return <g fill="none" stroke="#c9961a" strokeWidth="2"><circle cx="70" cy="38" r="8" /><path d="M76 45 Q80 56 76 64" stroke={INK} strokeOpacity=".5" strokeWidth="1" /></g>
    case 'ninja': return <><path d="M35 44 H85 V56 Q60 66 35 56Z" fill="#2c2e38" {...OL} /><path d="M35 30 H85 V38 H35Z" fill="#2c2e38" {...OL} opacity=".0" /></>
    case 'visor': return <><rect x="37" y="30" width="46" height="13" rx="6.5" fill="#5fe0d0" fillOpacity=".65" stroke="#1d7a70" strokeWidth="1.8" /><path d="M43 34 H52" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity=".8" /></>
    default: return null
  }
}

function backArt(id: string): ReactNode {
  switch (id) {
    case 'backpack': return <><rect x="34" y="72" width="52" height="40" rx="9" fill="#e8734a" {...OL} /><rect x="42" y="96" width="36" height="14" rx="4" fill="#cf5a32" /></>
    case 'tail-fox': return <path d="M78 120 Q116 124 104 84 Q100 106 82 108Z" fill="#ee8a3a" {...OL} />
    case 'cape-red': return <path d="M36 70 H84 L98 150 Q60 142 22 150Z" fill="#e2403a" {...OL} />
    case 'cape-purple': return <><path d="M36 70 H84 L98 150 Q60 142 22 150Z" fill="#6f52d6" {...OL} /><path d="M24 146 Q60 138 96 146 L98 150 Q60 142 22 150Z" fill="#f1ecff" /></>
    case 'guitar': return <g transform="rotate(-22 60 100)"><rect x="57" y="40" width="5" height="42" fill="#7a4f2e" {...OL} /><path d="M60 78 Q42 78 42 96 Q42 104 50 106 Q42 118 56 124 Q76 126 78 108 Q80 96 70 90 Q76 80 60 78Z" fill="#d68a3c" {...OL} /><circle cx="60" cy="102" r="4.5" fill="#3b2a1a" /></g>
    case 'wings-bat': return <g fill="#4a3366" {...OL}><path d="M36 76 Q4 56 6 100 Q14 90 20 100 Q26 90 34 104Z" /><path d="M84 76 Q116 56 114 100 Q106 90 100 100 Q94 90 86 104Z" /></g>
    case 'wings-angel': return <g fill="#fff" {...OL}><path d="M36 74 Q-2 52 4 96 Q16 104 24 110 Q34 100 38 92Z" /><path d="M84 74 Q122 52 116 96 Q104 104 96 110 Q86 100 82 92Z" /></g>
    case 'wings-fairy': return <g fill="#bfe3ff" fillOpacity=".75" stroke="#7aa8d8" strokeWidth="1.4"><ellipse cx="22" cy="80" rx="16" ry="24" transform="rotate(-24 22 80)" /><ellipse cx="98" cy="80" rx="16" ry="24" transform="rotate(24 98 80)" /><ellipse cx="26" cy="106" rx="10" ry="15" transform="rotate(-12 26 106)" fill="#f0c8ff" fillOpacity=".7" /><ellipse cx="94" cy="106" rx="10" ry="15" transform="rotate(12 94 106)" fill="#f0c8ff" fillOpacity=".7" /></g>
    case 'jetpack': return <><rect x="29" y="72" width="15" height="38" rx="6" fill="#aab4c6" {...OL} /><rect x="76" y="72" width="15" height="38" rx="6" fill="#aab4c6" {...OL} /><path d="M31 110 L36.5 124 L42 110Z M78 110 L83.5 124 L89 110Z" fill="#ff9f43" /><rect x="29" y="82" width="15" height="4" fill="#e2574c" /><rect x="76" y="82" width="15" height="4" fill="#e2574c" /></>
    default: return null
  }
}

function heldArt(id: string): ReactNode {
  switch (id) {
    case 'book': return <g transform="translate(89 108) rotate(-12)"><rect x="-9" y="-16" width="18" height="22" rx="2" fill="#4f8cf0" {...OL} /><rect x="-7" y="-14" width="3" height="18" fill="#fff" opacity=".5" /><path d="M-1 -9 H6 M-1 -5 H6" stroke="#fff" strokeWidth="1.4" /></g>
    case 'pencil': return <g transform="translate(89 108) rotate(24)"><rect x="-2.5" y="-30" width="5" height="26" fill="#ffd54a" {...OL} /><path d="M-2.5 -4 L0 3 L2.5 -4Z" fill="#f3c9a0" /><rect x="-2.5" y="-33" width="5" height="4" fill="#f08ac0" /></g>
    case 'flower': return <g transform="translate(89 108)"><path d="M0 0 V-24" stroke="#4caf63" strokeWidth="2.4" />{[0, 72, 144, 216, 288].map(a => <circle key={a} cx={Math.cos(a * Math.PI / 180) * 5} cy={-28 + Math.sin(a * Math.PI / 180) * 5} r="3.6" fill="#fff" {...OL} />)}<circle cy="-28" r="2.8" fill="#ffd54a" /></g>
    case 'balloon': return <g transform="translate(89 108)"><path d="M0 0 Q-6 -14 2 -34" stroke={INK} strokeOpacity=".5" fill="none" /><ellipse cx="2" cy="-46" rx="11" ry="13" fill="#ff5e8a" {...OL} /><path d="M-1 -34 L2 -31 L5 -34Z" fill="#ff5e8a" /><path d="M-3 -52 Q-1 -56 3 -56" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" opacity=".7" /></g>
    case 'cocoa': return <g transform="translate(89 108)"><rect x="-8" y="-14" width="16" height="16" rx="3" fill="#fff" {...OL} /><path d="M8 -10 Q15 -10 15 -5 Q15 0 8 -2" fill="none" stroke={INK} strokeOpacity=".5" strokeWidth="1.6" /><rect x="-6" y="-13" width="12" height="4" rx="2" fill="#7a4f2e" /><path d="M-3 -18 Q-1 -22 -3 -26 M3 -18 Q5 -22 3 -26" stroke="#fff" strokeWidth="1.4" fill="none" opacity=".8" /></g>
    case 'boba': return <g transform="translate(89 108)"><path d="M-8 -22 H8 L6 2 H-6Z" fill="#f7d6e6" fillOpacity=".9" {...OL} /><rect x="-9" y="-24" width="18" height="3" rx="1.5" fill="#fff" {...OL} /><path d="M2 -24 L5 -36" stroke="#e2457a" strokeWidth="2.4" /><circle cx="-2" cy="-1" r="1.7" fill="#3b2a1a" /><circle cx="2.4" cy="-3" r="1.7" fill="#3b2a1a" /><circle cx="-2.4" cy="-5" r="1.7" fill="#3b2a1a" /></g>
    case 'controller': return <g transform="translate(89 104)"><rect x="-13" y="-8" width="26" height="14" rx="6" fill="#4a4e5e" {...OL} /><path d="M-8 -4 V2 M-11 -1 H-5" stroke="#fff" strokeWidth="1.6" /><circle cx="6" cy="-3" r="1.8" fill="#5cbf7a" /><circle cx="9" cy="1" r="1.8" fill="#e2574c" /></g>
    case 'lantern': return <g transform="translate(89 108)"><path d="M0 0 V-8" stroke={INK} strokeOpacity=".6" /><rect x="-7" y="-26" width="14" height="18" rx="3" fill="#ffd54a" fillOpacity=".85" {...OL} /><rect x="-8" y="-28" width="16" height="3" rx="1.5" fill="#6f4a2e" /><circle cy="-17" r="9" fill="#ffd54a" opacity=".25" /></g>
    case 'umbrella': return <g transform="translate(89 108) rotate(14)"><path d="M0 4 V-34" stroke={INK} strokeOpacity=".7" strokeWidth="2" /><path d="M-22 -34 Q0 -58 22 -34 Q15 -38 11 -34 Q5 -39 0 -34 Q-5 -39 -11 -34 Q-15 -38 -22 -34Z" fill="#ff7ab8" {...OL} /></g>
    case 'wand': return <g transform="translate(89 108) rotate(30)"><rect x="-1.8" y="-30" width="3.6" height="32" fill="#7a4f2e" {...OL} /><path transform="translate(0 -34) scale(1.5)" d={STAR} fill="#ffd54a" {...OL} /></g>
    case 'sword': return <g transform="translate(89 108) rotate(18)"><rect x="-2.5" y="-40" width="5" height="32" rx="1.5" fill="#d7dde8" {...OL} /><rect x="-8" y="-10" width="16" height="4" rx="2" fill="#7a4f2e" {...OL} /><rect x="-2" y="-6" width="4" height="10" fill="#a8483a" /></g>
    case 'trophy': return <g transform="translate(89 108)"><path d="M-8 -22 H8 V-14 Q8 -6 0 -5 Q-8 -6 -8 -14Z" fill="#f2c230" {...OL} /><path d="M-8 -20 Q-14 -20 -13 -14 Q-12 -10 -8 -10 M8 -20 Q14 -20 13 -14 Q12 -10 8 -10" fill="none" stroke="#c9961a" strokeWidth="1.6" /><rect x="-2" y="-5" width="4" height="5" fill="#c9961a" /><rect x="-6" y="0" width="12" height="4" rx="1.5" fill="#f2c230" {...OL} /></g>
    default: return null
  }
}

function bgArt(id: string, uid: string): ReactNode {
  const grad = (a: string, b: string) => <><defs><linearGradient id={`${uid}k`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={a} /><stop offset="1" stopColor={b} /></linearGradient></defs><rect width="120" height="170" rx="14" fill={`url(#${uid}k)`} /></>
  switch (id) {
    case 'mint': return <rect width="120" height="170" rx="14" fill="#cdeedd" />
    case 'peach': return <rect width="120" height="170" rx="14" fill="#fddcc8" />
    case 'sky': return <>{grad('#9fd4ff', '#e6f4ff')}<ellipse cx="30" cy="30" rx="16" ry="6" fill="#fff" opacity=".9" /><ellipse cx="92" cy="50" rx="14" ry="5" fill="#fff" opacity=".8" /></>
    case 'sunset': return <>{grad('#ff9a8b', '#ffd9a0')}<circle cx="90" cy="120" r="20" fill="#ffe9a8" opacity=".9" /></>
    case 'meadow': return <>{grad('#bfe8ff', '#e8f7d8')}<path d="M0 140 Q30 126 60 138 T120 134 V170 H0Z" fill="#8fd18b" /><path d="M0 154 Q40 144 120 152 V170 H0Z" fill="#6cbf7a" /></>
    case 'night': return <>{grad('#1d1b4a', '#4a3a8a')}{[[14, 20], [40, 12], [96, 24], [80, 54], [20, 66], [106, 80], [50, 40]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="1.4" fill="#fff" />)}<circle cx="96" cy="26" r="9" fill="#fff6c9" /><circle cx="100" cy="23" r="8" fill="#2b2a62" opacity=".0" /></>
    case 'beach': return <>{grad('#9fe0ff', '#e6f6ff')}<rect y="110" width="120" height="30" fill="#4fb8e0" /><path d="M0 134 Q30 124 60 134 T120 132 V170 H0Z" fill="#f6e2b0" /><circle cx="24" cy="30" r="10" fill="#ffe27a" /></>
    case 'sakura': return <>{grad('#ffe0ec', '#fff4f8')}{[[18, 24], [86, 40], [30, 100], [100, 120], [60, 14], [12, 140]].map(([x, y]) => <path key={`${x}${y}`} transform={`translate(${x} ${y}) scale(.8)`} d={HEART} fill="#ff9cc0" />)}</>
    case 'library': return <><rect width="120" height="170" rx="14" fill="#c99d6b" />{[0, 1, 2].map(r => <g key={r}><rect x="6" y={20 + r * 44} width="108" height="3" fill="#7a4f2e" />{Array.from({ length: 9 }, (_, i) => <rect key={i} x={10 + i * 11.4} y={4 + r * 44 + (i % 3) * 3} width="8" height={16 - (i % 3) * 3} fill={['#e2574c', '#4f8cf0', '#5cbf7a', '#ffd54a', '#8a6cf0'][(i + r) % 5]} />)}</g>)}<rect y="130" width="120" height="40" rx="14" fill="#7a4f2e" opacity=".35" /></>
    case 'space': return <>{grad('#0b0a1f', '#2b1a5c')}{[[12, 18], [40, 40], [100, 16], [82, 64], [22, 90], [108, 110], [56, 130], [90, 150]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="1.3" fill="#fff" />)}<circle cx="90" cy="38" r="12" fill="#8a6cf0" /><ellipse cx="90" cy="38" rx="19" ry="4" fill="none" stroke="#ffd54a" strokeWidth="1.6" /></>
    case 'neon': return <>{grad('#1a1033', '#3a1a5a')}{[[8, 90, 22], [34, 70, 40], [62, 82, 28], [88, 60, 48]].map(([x, y, h]) => <rect key={String(x)} x={x} y={y} width="22" height={h + 40} fill="#241548" stroke="#ff4dd2" strokeWidth="1.2" />)}<path d="M0 156 H120" stroke="#4dd2ff" strokeWidth="2" /></>
    case 'aurora': return <>{grad('#0c1f3a', '#16486a')}<path d="M-4 60 Q30 20 60 60 T124 40 V80 Q90 100 60 76 T-4 90Z" fill="#5cffc0" opacity=".45" /><path d="M-4 90 Q30 56 60 90 T124 76 V104 Q90 120 60 100 T-4 116Z" fill="#a78bfa" opacity=".4" />{[[16, 16], [100, 12], [70, 30]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="1.2" fill="#fff" />)}</>
    default: return null
  }
}

const CSS = `.av-bob{animation:av-bob 3.2s ease-in-out infinite}.av-eyes{transform-box:fill-box;transform-origin:center;animation:av-blink 5s infinite}
@keyframes av-nod{0%,100%{transform:translateY(0)}50%{transform:translateY(1.6px)}}@keyframes av-write{0%,100%{transform:rotate(-8deg)}50%{transform:rotate(10deg)}}@keyframes av-think{0%,100%{opacity:.15;transform:translateY(2px)}50%{opacity:1;transform:translateY(-2px)}}@keyframes av-hop{0%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}}@keyframes av-page{0%,70%,100%{transform:scaleX(1)}85%{transform:scaleX(.15)}}
.av-nod{animation:av-nod 3.4s ease-in-out infinite}.av-write{transform-box:fill-box;transform-origin:50% 100%;animation:av-write .9s ease-in-out infinite}.av-think{animation:av-think 2.6s ease-in-out infinite}.av-hop{animation:av-hop .7s ease-in-out infinite}.av-page{transform-box:fill-box;transform-origin:0 50%;animation:av-page 6s ease-in-out infinite}
@keyframes av-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-2px)}}@keyframes av-blink{0%,93%,100%{transform:scaleY(1)}96%{transform:scaleY(.1)}}
.av-mochi [stroke-width="1.4"]{stroke-width:1.5px;stroke-opacity:.3}.av-chibi [stroke-width="1.4"]{stroke-width:2px;stroke-opacity:.62}
@media (prefers-reduced-motion:reduce){.av-bob,.av-eyes{animation:none}}`

function Eyes({ mochi, femme }: { mochi: boolean; femme: boolean }) {
  if (mochi) return <g className="av-eyes">{[47, 73].map(x => <g key={x}><circle cx={x} cy="42" r="3.6" fill={INK} /><circle cx={x + 1.2} cy="40.6" r="1.3" fill="#fff" /><circle cx={x - 1} cy="43.4" r=".6" fill="#fff" />
    {femme && <path d={x < 60 ? `M${x - 3} 39.4 l-2.6 -1.6` : `M${x + 3} 39.4 l2.6 -1.6`} stroke={INK} strokeWidth="1.1" strokeLinecap="round" />}</g>)}</g>
  return <g className="av-eyes">{[50, 70].map(x => <g key={x}><ellipse cx={x} cy="40" rx="4.1" ry="5.8" fill={INK} /><ellipse cx={x} cy="42" rx="2.6" ry="3" fill="#6b4ea8" opacity=".55" /><circle cx={x + 1.5} cy="37.6" r="1.7" fill="#fff" /><circle cx={x - 1.4} cy="42.6" r=".8" fill="#fff" />
    {femme && <path d={x < 60 ? `M${x - 3.8} 35.6 l-3.4 -2.2` : `M${x + 3.8} 35.6 l3.4 -2.2`} stroke={INK} strokeWidth="1.2" strokeLinecap="round" fill="none" />}</g>)}</g>
}
function Mouth({ mochi }: { mochi: boolean }) {
  if (mochi) return <path d="M56.2 50.2 q1.9 2.6 3.8 0 q1.9 2.6 3.8 0" fill="none" stroke={INK} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  return <path d="M54 51 Q60 57 66 51" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" />
}

export default function AvatarArt({ cfg, size = 160, bg = true, animate = true, label = 'Your avatar', pose = 'idle' }: { pose?: 'idle' | 'study' | 'cheer'; cfg: Partial<AvatarCfg>; size?: number | string; bg?: boolean; animate?: boolean; label?: string }) {
  const uid = useId().replace(/[^a-z0-9]/gi, ''), reduced = useReducedMotion(), a = sanitizeAvatar(cfg)
  const top = TOPS.find(t => t.id === a.top) ?? TOPS[0], bottom = BOTTOMS.find(b => b.id === a.bottom) ?? BOTTOMS[0], shoe = SHOES.find(s => s.id === a.shoes) ?? SHOES[0]
  const { body, sleeves } = topArt(top, uid), hair = hairParts(a.hair, a.hairColor), skin = a.skin
  const alive = animate && !reduced, mochi = a.style === 'mochi', femme = a.body === 'femme'
  const sy = mochi ? 0.68 : 0.86, bodyScaleX = (femme ? 0.97 : 1.02) * (mochi ? 0.8 : 0.86)
  const bodyTf = `translate(60 160) scale(${bodyScaleX} ${sy}) translate(-60 -160)`
  const topY = 160 - sy * 92
  const hs = mochi ? 1.42 : 1.25, headTf = `translate(0 ${topY + 2.5 - 62 - 2 * hs}) translate(60 62) scale(${hs}) translate(-60 -62)`
  const study = pose === 'study'
  const bookArt = <g>
    <path d="M32 99 L60 103 L88 99 V124 L60 128 L32 124Z" fill="#8a5a3a" {...OL} />
    <path d="M60 102 L35 98 V121 L60 125Z" fill="#fffdf6" {...OL} /><g className={alive ? 'av-page' : undefined}><path d="M60 102 L85 98 V121 L60 125Z" fill="#fff8e8" {...OL} /></g>
    <path d="M40 104 L56 107 M40 110 L56 113 M40 116 L56 119 M64 107 L80 104 M64 113 L80 110" stroke="#9aa3b8" strokeWidth="1.3" strokeLinecap="round" />
    <circle cx="33" cy="108" r="6.5" fill={skin} {...OL} />
    <g className={alive ? 'av-write' : undefined}><circle cx="87" cy="108" r="6.5" fill={skin} {...OL} /><path d="M87 108 L97 92" stroke="#f2c230" strokeWidth="3.2" strokeLinecap="round" /><path d="M87 108 L85.6 110.2" stroke={INK} strokeWidth="2" strokeLinecap="round" /><path d="M97 92 L98.4 89.8" stroke="#f08ac0" strokeWidth="3.2" strokeLinecap="round" /></g></g>
  const hTf = study ? `translate(0 3) ${headTf}` : headTf
  const vh = study ? 176 : 204
  return <svg viewBox={`0 -34 120 ${vh}`} width={size} height={typeof size === 'number' ? size * vh / 120 : 'auto'} style={typeof size === 'number' ? undefined : { aspectRatio: `120 / ${vh}` }} role="img" aria-label={label} className={`block ${mochi ? 'av-mochi' : 'av-chibi'}`}>
    <style>{CSS}</style>
    {bg && <><clipPath id={`${uid}c`}><rect y="-34" width="120" height={vh} rx="16" /></clipPath><g clipPath={`url(#${uid}c)`}><g transform="translate(0 -34) scale(1 1.2)">{bgArt(a.bg, uid)}</g></g></>}
    <g className={alive ? (pose === 'cheer' ? 'av-hop' : study ? undefined : 'av-bob') : undefined}>
      <g className={alive && study ? 'av-nod' : undefined}><g transform={hTf}>{hair.back}</g></g>
      <g transform={bodyTf}>
        {backArt(a.back)}
        {bottomArt(bottom, skin, uid)}{shoeArt(shoe)}
        <rect x="24" y="70" width="14" height="38" rx="6" fill={skin} {...OL} /><rect x="82" y="70" width="14" height="38" rx="6" fill={skin} {...OL} />
        <circle cx="31" cy="109" r="6.5" fill={skin} {...OL} /><circle cx="89" cy="109" r="6.5" fill={skin} {...OL} />
        <rect x="53" y="58" width="14" height="14" fill={skin} />
        {body}{sleeves}
        {study ? bookArt : heldArt(a.held)}
      </g>
      <g className={alive && study ? 'av-nod' : undefined}><g transform={hTf}>
        <g fill={skin} {...OL}><rect x="36" y="14" width="48" height="48" rx={mochi ? 23 : 18} /></g>
        <ellipse cx="46" cy="22" rx="7" ry="3.2" fill="#fff" opacity={mochi ? 0.4 : 0.28} transform="rotate(-20 46 22)" />
        {hair.front}
        <g transform={study ? 'translate(0 3.2)' : undefined}><Eyes mochi={mochi} femme={femme} /></g>
        <Mouth mochi={mochi} />
        {mochi ? <><ellipse cx="41" cy="49" rx="5" ry="3" fill="#ff8fb0" opacity=".5" /><ellipse cx="79" cy="49" rx="5" ry="3" fill="#ff8fb0" opacity=".5" /></> : a.face === 'blush' ? faceArt('blush') : null}
        {a.face !== 'blush' && faceArt(a.face)}
        {hatArt(a.hat)}
      </g></g>
    </g>
    {study && <g className={alive ? 'av-think' : undefined} fill="none" stroke="currentColor" opacity=".75" style={{ color: INK }}><circle cx="96" cy="-2" r="1.6" fill="currentColor" /><circle cx="101" cy="-9" r="2.4" fill="currentColor" /><text x="104" y="-14" fontSize="13" fontWeight="800" fill="currentColor" stroke="none" fontFamily="var(--font-display)">?</text></g>}
  </svg>
}
