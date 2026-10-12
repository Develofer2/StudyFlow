import { useEffect, useState } from 'react'
import { getPrefs, setPrefs } from '@/data/store'
import { THEMES, safeAccent, readableOn, tokensFor, type Tokens } from '@/domain/themes'

export function useOnline() {
  const [on, setOn] = useState(navigator.onLine)
  useEffect(() => { const u = () => setOn(true), d = () => setOn(false); addEventListener('online', u); addEventListener('offline', d); return () => { removeEventListener('online', u); removeEventListener('offline', d) } }, [])
  return on
}
export function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || import.meta.hot) return
  const reg = () => { navigator.serviceWorker.register(`${import.meta.env.BASE_URL}service-worker.js`).catch(() => {}) }
  if (document.readyState === 'complete') reg(); else addEventListener('load', reg)
}
export const systemDark = () => matchMedia('(prefers-color-scheme: dark)').matches
export function resolveMode(): 'light' | 'dark' {
  const p = getPrefs(); const th = THEMES.find(t => t.id === p.themeId) ?? THEMES[0]
  return p.appearance === 'system' ? (systemDark() ? 'dark' : 'light') : p.appearance
  void th
}
const VARS: Record<keyof Tokens, string> = { bg: '--bg', surface: '--surface', surface2: '--surface-2', text: '--text', muted: '--muted', border: '--border', primary: '--primary', primaryFg: '--primary-fg', success: '--success', warning: '--warning', danger: '--danger' }
/** Applies the active theme + customisation as CSS variables on <html>. */
export function applyTheme() {
  const p = getPrefs(); const th = THEMES.find(t => t.id === p.themeId) ?? THEMES[0]
  const mode = p.appearance === 'system' ? (systemDark() ? 'dark' : 'light') : p.appearance
  const tk = { ...tokensFor(th, mode) }
  if (p.accent) { tk.primary = safeAccent(p.accent, tk.bg); tk.primaryFg = readableOn(tk.primary) }
  const r = document.documentElement
  for (const k of Object.keys(VARS) as (keyof Tokens)[]) r.style.setProperty(VARS[k], tk[k])
  r.style.setProperty('--radius', `${p.radius}px`)
  r.style.setProperty('--glow', String(p.glow))
  r.style.fontSize = `${16 * p.fontScale}px`
  r.dataset.mode = mode; r.dataset.theme = th.id; r.dataset.density = p.density; r.dataset.motion = p.motion
  r.style.colorScheme = mode
  const warm = p.eveningWarm && (new Date().getHours() >= 20 || new Date().getHours() < 6)
  r.style.setProperty('--warm-overlay', warm ? '0.10' : '0')
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', tk.bg)
}
export function bootTheme() {
  try { const ls = JSON.parse(localStorage.getItem('studyflow:prefs') || '{}'); const th = THEMES.find(t => t.id === ls.themeId) ?? THEMES[0]
    const mode = ls.appearance === 'dark' || ls.appearance === 'light' ? ls.appearance : systemDark() ? 'dark' : 'light'; const tk = tokensFor(th, mode)
    document.documentElement.style.setProperty('--bg', tk.bg); document.documentElement.style.setProperty('--text', tk.text) } catch {}
}
export async function requestNotifications(): Promise<'granted' | 'denied' | 'default' | 'unsupported'> {
  if (!('Notification' in window)) return 'unsupported'
  return Notification.permission === 'default' ? await Notification.requestPermission() : Notification.permission
}
export const notificationStatus = () => ('Notification' in window ? Notification.permission : 'unsupported')
export function notify(title: string, body: string) {
  if ('Notification' in window && Notification.permission === 'granted') { try { new Notification(title, { body, icon: `${import.meta.env.BASE_URL}icons/icon.svg`, silent: true }) } catch {} }
}
let ctx: AudioContext | null = null
export function chime() {
  try {
    ctx ??= new AudioContext(); const t = ctx.currentTime
    ;[660, 880].forEach((f, i) => { const o = ctx!.createOscillator(), g = ctx!.createGain(); o.frequency.value = f; o.connect(g); g.connect(ctx!.destination); g.gain.setValueAtTime(0.0001, t + i * 0.22); g.gain.exponentialRampToValueAtTime(0.12, t + i * 0.22 + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.22 + 0.5); o.start(t + i * 0.22); o.stop(t + i * 0.22 + 0.55) })
  } catch {}
}
export { setPrefs }
