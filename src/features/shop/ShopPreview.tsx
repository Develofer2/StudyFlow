import type { CatalogItem } from '@/domain/catalog'
import type { BuddyKind } from '@/types'
import TreeArt from '../forest/TreeArt'
import DecorArt from '../forest/DecorArt'
import BuddyAvatar from '../buddy/BuddyAvatar'
import EnvScene from '../env/EnvScene'

const star = (r: number) => Array.from({ length: 10 }, (_, i) => { const a = (Math.PI * i) / 5 - Math.PI / 2, d = i % 2 ? r * 0.45 : r; return `${(Math.cos(a) * d).toFixed(2)},${(Math.sin(a) * d).toFixed(2)}` }).join(' ')
const P = [[22, 18, 20], [58, 10, -30], [96, 24, 50], [40, 46, -10], [78, 52, 35], [14, 60, 70], [104, 62, -45], [60, 30, 15]] as const

function SkinArt({ id }: { id: string }) {
  if (id === 'skin-leaf') return <svg viewBox="0 0 100 100" className="h-full max-h-28 w-full" aria-hidden>{Array.from({ length: 16 }, (_, i) => { const a = (i / 16) * 360, on = i < 10
    return <path key={i} transform={`rotate(${a} 50 50) translate(50 12)`} d="M0 0 C6 6 6 16 0 22 C-6 16 -6 6 0 0Z" fill={on ? 'var(--primary)' : 'var(--border)'} opacity={on ? 0.9 : 0.6} /> })}<text x="50" y="57" textAnchor="middle" fontSize="16" fontWeight="700" fill="currentColor">18:42</text></svg>
  if (id === 'skin-moon') return <svg viewBox="0 0 100 100" className="h-full max-h-28 w-full" aria-hidden><circle cx="50" cy="50" r="36" fill="var(--border)" opacity=".55" /><path d="M50 14 A36 36 0 1 1 50 86 A24 36 0 1 0 50 14Z" fill="#f4e4a6" /><circle cx="40" cy="38" r="4" fill="#e3cf88" /><circle cx="60" cy="66" r="3" fill="#e3cf88" /></svg>
  return <svg viewBox="0 0 100 100" className="h-full max-h-28 w-full" aria-hidden><circle cx="50" cy="50" r="36" fill="none" stroke="var(--border)" strokeWidth="9" /><circle cx="50" cy="50" r="36" fill="none" stroke="var(--primary)" strokeWidth="9" strokeLinecap="round" strokeDasharray="150 226" transform="rotate(-90 50 50)" /><text x="50" y="57" textAnchor="middle" fontSize="16" fontWeight="700" fill="currentColor">18:42</text></svg>
}
function FxArt({ id }: { id: string }) {
  const stars = id === 'fx-stars'
  return <svg viewBox="0 0 120 76" className="h-full max-h-28 w-full" aria-hidden>{P.map(([x, y, r], i) => stars
    ? <polygon key={i} transform={`translate(${x} ${y}) rotate(${r})`} points={star(i % 3 ? 7 : 10)} fill={i % 2 ? '#f6c453' : '#ffe08a'} />
    : <path key={i} transform={`translate(${x} ${y}) rotate(${r}) scale(${i % 3 ? 1 : 1.3})`} d="M0 -7 C6 -6 7 3 0 8 C-7 3 -6 -6 0 -7Z" fill={i % 2 ? '#ffb3cd' : '#ff8fb5'} />)}</svg>
}

export default function ShopPreview({ it }: { it: CatalogItem }) {
  const box = 'relative grid h-32 w-full place-items-center overflow-hidden rounded-t-card bg-surface2'
  if (it.kind === 'environment') return <div className="h-32 w-full overflow-hidden rounded-t-card"><EnvScene id={it.id} progress={0.5} running={false} reduced decorative className="!h-full !w-full !rounded-none !border-0 [&_svg]:!h-full" /></div>
  if (it.kind === 'species') return <div className={box}><TreeArt species={it.id} stage={4} season="summer" size={96} still /></div>
  if (it.kind === 'decoration') return <div className={box}><DecorArt id={it.id} size={96} /></div>
  if (it.kind === 'buddy') return <div className={box}><BuddyAvatar kind={it.id.slice(6) as BuddyKind} size={104} /></div>
  if (it.kind === 'outfit') return <div className={box}><BuddyAvatar kind="cat" size={108} outfit={it.slot ? { [it.slot]: it.id } : {}} /></div>
  if (it.kind === 'timer-skin') return <div className={`${box} p-2`}><SkinArt id={it.id} /></div>
  return <div className={`${box} p-2`}><FxArt id={it.id} /></div>
}
