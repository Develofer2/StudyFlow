import { Check, MousePointer2 } from 'lucide-react'
import { Card, Segmented, Switch, cx } from '@/components/ui'
import { setPrefs, usePrefs } from '@/data/store'
import { useState, type ReactNode } from 'react'
import { COMPANIONS, COMPANION_GROUPS, STYLES, STYLE_GROUPS, companionOf, cursorImage, styleOf, type CompanionGroup, type StyleGroup } from '@/domain/cursors'
import { useDesktopPointer } from '@/app/useCursor'

const TIPS = [
  'Custom cursors only appear with a mouse or trackpad. Phones and tablets use touch, so nothing changes there.',
  'Mix and match: pick an arrow style (colours, anime, games, creative) and a companion, or choose No companion for just the arrow. Tools like swords, pencils and wands click with their tip; the book clicks at its top-left corner; the crosshair clicks at its centre.',
  'Buttons, links and tabs show the same cursor with a small yellow sparkle, so you can tell what is clickable.',
  'Text fields keep the normal text cursor so typing and selecting stay precise.',
  'Live cursor: the arrow tip is always exactly where you click while the character trails behind. It is hidden over text fields so typing stays clear, and it stands still if you use reduced motion.',
  'Classic mode changes your real system cursor, so it is the smoothest and works across the whole page. Arrow styles are best for that.',
  'Use Large if the cursor is hard to spot on a big or high-resolution screen.',
  'Your browser shows its own cursor over the address bar, tabs and some pop-ups. That is a browser rule.',
  'Cursors are drawn on this device only. Nothing is downloaded, tracked or sent anywhere.',
  'Turn the switch off any time to go back to your normal system cursor. If a cursor ever looks wrong, switching it off is the quick fix.',
]

const Chip = ({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) => <button type="button" aria-pressed={on} onClick={onClick} className={cx('min-h-9 rounded-full border px-3 text-sm font-semibold transition', on ? 'border-brand bg-brand/10 text-ink' : 'hairline text-muted hover:bg-surface2')}>{children}</button>
const Grid = ({ children }: { children: ReactNode }) => <ul role="radiogroup" className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">{children}</ul>
const Tile = ({ on, name, blurb, img, onPick }: { on: boolean; name: string; blurb: string; img: string; onPick: () => void }) => <li><button role="radio" aria-checked={on} onClick={onPick}
  className={cx('relative flex min-h-[104px] w-full flex-col items-center justify-center gap-1 rounded-card border-2 bg-surface p-2 text-center transition hover:bg-surface2', on ? 'border-brand' : 'border-transparent hairline')}>
  <img src={img} alt="" width={48} height={48} className="pointer-events-none" /><span className="text-sm font-bold">{name}</span><span className="text-xs leading-tight text-muted">{blurb}</span>
  {on && <Check size={16} className="absolute right-2 top-2 text-brand" aria-hidden />}</button></li>

export default function CursorSection() {
  const [tab, setTab] = useState<'arrow' | 'companion'>('arrow'), [sg, setSg] = useState<StyleGroup>('colors'), [cg, setCg] = useState<CompanionGroup>('animals')
  const { cursor } = usePrefs(), desktop = useDesktopPointer()
  const set = (patch: Partial<typeof cursor>) => setPrefs(s => ({ ...s, cursor: { ...s.cursor, ...patch } }))
  return <Card className="space-y-4">
    <div className="flex items-center gap-2"><MousePointer2 size={20} className="text-brand" /><h2 className="font-display text-xl font-semibold">Custom cursor</h2></div>
    {!desktop && <p role="status" className="rounded-lg bg-surface2 p-3 text-sm text-muted">This device uses touch, so custom cursors are not shown here. Your choice is saved and will apply when you use a mouse or trackpad.</p>}
    <Switch label="Use a custom cursor" hint="Desktop only. Off by default, so your system cursor stays unless you choose otherwise." checked={cursor.on} onChange={v => set({ on: v })} />
    <div><p className="mb-1.5 text-sm font-bold">Cursor type</p>
      <Segmented<'image' | 'live'> label="Cursor type" value={cursor.mode} onChange={v => set({ mode: v })} options={[{ value: 'image', label: 'Classic' }, { value: 'live', label: 'Live (follows you)' }]} />
      <p className="mt-1.5 text-sm text-muted">{cursor.mode === 'live' ? 'Replaces your system cursor with a character that glides after your mouse, tilts as you move and squishes when you click.' : 'Swaps your system cursor for a picture. Works everywhere on the page and uses no extra power.'}</p></div>
    <div className={cx('space-y-4 transition', !cursor.on && 'opacity-60')}>
      <div className="flex items-center gap-3 rounded-card bg-surface2 p-3">
        <img src={cursorImage(cursor, false, 64)} alt="" width={64} height={64} className="shrink-0" />
        <div className="min-w-0 text-sm"><p className="font-bold">Your cursor</p><p className="text-muted">{styleOf(cursor.arrow).name}{companionOf(cursor.companion) ? ` + ${companionOf(cursor.companion)!.name}` : ' (no companion)'}. Mix any arrow style with any companion.</p></div>
      </div>
      <div role="tablist" aria-label="Cursor options" className="flex gap-1 rounded-full bg-surface2 p-1">
        {([['arrow', 'Arrow style'], ['companion', 'Companion']] as const).map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
          className={cx('min-h-10 flex-1 rounded-full px-3 text-sm font-bold transition', tab === k ? 'bg-brand text-brand-fg' : 'text-muted hover:text-ink')}>{l}</button>)}
      </div>
      {tab === 'arrow' ? <div className="space-y-3">
        <div role="group" aria-label="Style category" className="flex flex-wrap gap-1.5">{STYLE_GROUPS.map(g => <Chip key={g.id} on={sg === g.id} onClick={() => setSg(g.id)}>{g.label}</Chip>)}</div>
        <Grid>{STYLES.filter(x => x.group === sg).map(x => <Tile key={x.id} on={cursor.arrow === x.id} name={x.name} blurb={x.blurb} img={cursorImage({ arrow: x.id, companion: 'none' }, false, 48)} onPick={() => set({ arrow: x.id, on: true })} />)}</Grid>
      </div> : <div className="space-y-3">
        <div role="group" aria-label="Companion category" className="flex flex-wrap gap-1.5">
          <Chip on={cursor.companion === 'none'} onClick={() => set({ companion: 'none', on: true })}>No companion</Chip>
          {COMPANION_GROUPS.map(g => <Chip key={g.id} on={cg === g.id} onClick={() => setCg(g.id)}>{g.label}</Chip>)}</div>
        <Grid>{COMPANIONS.filter(x => x.group === cg).map(x => <Tile key={x.id} on={cursor.companion === x.id} name={x.name} blurb={x.blurb} img={cursorImage({ arrow: cursor.arrow, companion: x.id }, false, 48)} onPick={() => set({ companion: x.id, on: true })} />)}</Grid>
      </div>}
      <div className="flex flex-wrap items-center gap-4"><div><p className="mb-1.5 text-sm font-bold">Size</p>
        <Segmented<'normal' | 'large'> label="Cursor size" value={cursor.size} onChange={v => set({ size: v })} options={[{ value: 'normal', label: 'Normal' }, { value: 'large', label: 'Large' }]} /></div>
        <div className="flex flex-1 flex-wrap items-center gap-2 rounded-card border border-dashed border-line p-3"><span className="text-sm font-bold">Try it here</span>
          <button type="button" className="min-h-10 rounded-full bg-brand px-4 text-sm font-bold text-brand-fg">Button</button>
          <input aria-label="Try typing" placeholder="Type here" className="min-h-10 min-w-0 flex-1 rounded-lg border hairline bg-bg px-3 text-sm" /></div></div>
    </div>
    <details className="rounded-card border hairline bg-surface2 p-3"><summary className="min-h-10 cursor-pointer text-[15px] font-bold leading-10">Cursor guide</summary>
      <ol className="mt-2 list-decimal space-y-2 pl-5 text-[15px] text-muted">{TIPS.map(t => <li key={t}>{t}</li>)}</ol></details>
  </Card>
}
