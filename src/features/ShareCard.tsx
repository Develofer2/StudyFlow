import { useEffect, useMemo, useRef, useState } from 'react'
import { Copy, Download, Share2 } from 'lucide-react'
import type { Achievement } from '@/types'
import { useCollection, usePrefs, setPrefs } from '@/data/store'
import { Button, Card, Switch, useToast } from '@/components/ui'
import { useStats } from '@/hooks/useStats'
import { addDays } from '@/domain/time'
import { fmtDuration } from '@/domain/time'
import { isCompletedFocus, sessionsIn } from '@/domain/stats'

const SIZE = 1080
type Line = { label: string; value: string }
const css = (n: string) => getComputedStyle(document.documentElement).getPropertyValue(n).trim()

function draw(c: HTMLCanvasElement, title: string, lines: Line[]) {
  const g = c.getContext('2d'); if (!g) return
  const [bg, surface, text, muted, primary, primaryFg, border] = ['--bg', '--surface', '--text', '--muted', '--primary', '--primary-fg', '--border'].map(css)
  c.width = c.height = SIZE
  g.fillStyle = bg; g.fillRect(0, 0, SIZE, SIZE)
  g.fillStyle = surface; g.strokeStyle = border; g.lineWidth = 3
  g.beginPath(); g.roundRect(60, 60, SIZE - 120, SIZE - 120, 48); g.fill(); g.stroke()
  g.fillStyle = primary; g.beginPath(); g.roundRect(120, 120, 72, 72, 20); g.fill()
  g.fillStyle = primaryFg; g.font = '700 48px Fraunces, Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('S', 156, 158)
  g.textAlign = 'left'; g.fillStyle = muted; g.font = '700 34px Nunito, system-ui, sans-serif'; g.fillText('StudyFlow', 214, 158)
  g.textBaseline = 'alphabetic'; g.fillStyle = text; g.font = '600 88px Fraunces, Georgia, serif'
  let t = title; while (g.measureText(t).width > SIZE - 240 && t.length > 4) t = t.slice(0, -2)
  g.fillText(t === title ? t : t + '…', 120, 330)
  const rows = lines.slice(0, 5), gap = Math.min(150, 560 / Math.max(1, rows.length))
  rows.forEach((l, i) => {
    const y = 470 + i * gap
    g.fillStyle = muted; g.font = '700 32px Nunito, system-ui, sans-serif'; g.fillText(l.label.toUpperCase(), 120, y)
    g.fillStyle = primary; g.font = '600 76px Fraunces, Georgia, serif'; g.fillText(l.value, 120, y + 74)
  })
  g.fillStyle = muted; g.font = '600 28px Nunito, system-ui, sans-serif'; g.fillText('Made with StudyFlow', 120, SIZE - 120)
}

export default function ShareCard() {
  const p = usePrefs(), f = p.shareFields, toast = useToast(), s = useStats(), earned = useCollection<Achievement>('achievements')
  const ref = useRef<HTMLCanvasElement>(null); const [fontsReady, setFontsReady] = useState(0)
  const week = useMemo(() => sessionsIn(s.sessions, { from: s.weekStart, to: addDays(s.weekStart, 6) }, p.timezone), [s.sessions, s.weekStart, p.timezone])
  const lines: Line[] = []
  if (f.minutes) lines.push({ label: 'Focus time this week', value: fmtDuration(s.weekSeconds) })
  if (f.sessions) lines.push({ label: 'Sessions finished', value: String(week.filter(isCompletedFocus).length) })
  if (f.streak) lines.push({ label: 'Day streak', value: String(s.current) })
  if (f.badges) lines.push({ label: 'Badges earned', value: String(earned.length) })
  const name = f.name ? p.displayName.trim() : ''
  const title = name ? `${name}'s study week` : 'My study week'
  const text = [title, ...lines.map(l => `${l.label}: ${l.value}`), 'via StudyFlow'].join('\n')
  const key = JSON.stringify([title, lines])

  useEffect(() => { void document.fonts?.load('600 40px Fraunces').then(() => document.fonts.load('700 20px Nunito')).then(() => setFontsReady(n => n + 1)).catch(() => {}) }, [])
  useEffect(() => { if (ref.current) draw(ref.current, title, lines) }, [key, fontsReady, p.themeId, p.appearance, p.accent]) // eslint-disable-line react-hooks/exhaustive-deps

  const blob = () => new Promise<Blob | null>(r => ref.current?.toBlob(r, 'image/png') ?? r(null))
  const save = (b: Blob) => { const u = URL.createObjectURL(b), a = document.createElement('a'); a.href = u; a.download = 'studyflow-week.png'; a.click(); setTimeout(() => URL.revokeObjectURL(u), 1000) }
  const share = async () => {
    const b = await blob(); if (!b) return toast('Could not create the image', 'err')
    const file = new File([b], 'studyflow-week.png', { type: 'image/png' })
    if (navigator.canShare?.({ files: [file] })) { try { await navigator.share({ files: [file], text }); return } catch (e) { if ((e as Error).name === 'AbortError') return } }
    save(b); toast('Sharing is not available here, so the image was downloaded')
  }
  const copy = async () => { try { await navigator.clipboard.writeText(text); toast('Copied to clipboard') } catch { toast('Could not copy. Select the text below instead.', 'err') } }
  const set = (k: keyof typeof f) => (v: boolean) => void setPrefs({ shareFields: { ...f, [k]: v } })
  const none = !lines.length

  return <Card className="space-y-4"><div><h2 className="font-display text-xl font-semibold">Share your week</h2>
    <p className="text-sm text-muted">Creates an image on this device. Only what you switch on below is included. Notes, subject names and your AI key are never shared.</p></div>
    <div className="grid gap-5 md:grid-cols-[minmax(0,320px)_1fr]">
      <div><canvas ref={ref} width={SIZE} height={SIZE} role="img" aria-label={`Share card preview. ${text.replace(/\n/g, '. ')}`} className="aspect-square w-full max-w-sm rounded-xl border hairline" />
        {none && <p className="mt-2 text-sm text-warn">Switch on at least one item to create a card.</p>}</div>
      <div className="space-y-1"><Switch label="Focus minutes" checked={f.minutes} onChange={set('minutes')} /><Switch label="Sessions finished" checked={f.sessions} onChange={set('sessions')} /><Switch label="Streak" checked={f.streak} onChange={set('streak')} />
        <Switch label="Badge count" checked={f.badges} onChange={set('badges')} /><Switch label="My name" hint={p.displayName.trim() ? undefined : 'Add your name in Settings > Profile first'} checked={f.name} onChange={set('name')} />
        <div className="flex flex-wrap gap-2 pt-3"><Button variant="primary" disabled={none} onClick={share}><Share2 size={18} />Share image</Button>
          <Button disabled={none} onClick={async () => { const b = await blob(); if (b) { save(b); toast('Image downloaded') } }}><Download size={18} />Download PNG</Button>
          <Button disabled={none} onClick={copy}><Copy size={18} />Copy text</Button></div></div></div></Card>
}
