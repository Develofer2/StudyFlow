import { useEffect } from 'react'
import { Pause, Play, Volume2, VolumeX } from 'lucide-react'
import { Button, Card, Segmented, Select, Switch, cx } from '@/components/ui'
import { setPrefs, usePrefs, useTimerSnapshot } from '@/data/store'
import { soundEngine } from '@/services/sound/engine'
import { SOUNDS, activeIds, autoAction, fmtCountdown } from '@/services/sound/logic'
import { useSyncExternalStore } from 'react'

export const useSoundState = () => useSyncExternalStore(soundEngine.subscribe, soundEngine.getState)

/** Reacts to timer phase/status; mount once (SoundPanel does). Idempotent, and never plays before a user gesture. */
export function useSoundAutomation() {
  const { sound } = usePrefs(), t = useTimerSnapshot(), st = useSoundState()
  const mixKey = activeIds(sound.mix).join(',')
  useEffect(() => {
    const a = autoAction(sound, t, st.unlocked)
    if (a.kind === 'play') { if (a.ids.join(',') !== st.active.join(',') || !st.playing) soundEngine.setActive(a.ids, 'auto') }
    else if (a.kind === 'stop' && st.playing && st.source === 'auto') soundEngine.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t.phase, t.status, sound.auto, sound.breakSound, mixKey, st.unlocked])
}

export default function SoundPanel() {
  const { sound } = usePrefs(), st = useSoundState()
  useSoundAutomation()
  const ids = activeIds(sound.mix), mixKey = ids.join(',')
  const patch = (p: Partial<typeof sound>) => setPrefs(x => ({ ...x, sound: { ...x.sound, ...p } }))
  useEffect(() => { soundEngine.setVolume(sound.volume, sound.muted) }, [sound.volume, sound.muted, st.unlocked])
  useEffect(() => { if (st.playing && st.source === 'manual') soundEngine.setActive(ids, 'manual') }, [mixKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const play = async () => {
    await soundEngine.unlock()
    soundEngine.setVolume(sound.volume, sound.muted)
    const use = ids.length ? ids : ['brown']
    if (!ids.length) patch({ mix: { ...sound.mix, brown: true } })
    soundEngine.setActive(use, 'manual'); soundEngine.startSleep(sound.sleepMinutes)
  }
  const toggle = (id: string) => patch({ mix: { ...sound.mix, [id]: !sound.mix[id] } })
  const suspended = st.unlocked && st.ctx === 'suspended'

  return <Card aria-labelledby="snd-h" className="space-y-4">
    <div><h2 id="snd-h" className="font-display text-xl font-semibold">Ambient sound</h2>
      <p className="text-sm text-muted">These sounds are generated on your device with the Web Audio API. They are not recordings, so they work offline and may sound simpler than studio ambience.</p></div>
    <div className="flex flex-wrap items-center gap-2">
      {st.playing ? <Button variant="primary" onClick={() => soundEngine.stop()}><Pause size={18} aria-hidden />Stop</Button>
        : <Button variant="primary" onClick={play} disabled={st.ctx === 'unsupported'}><Play size={18} aria-hidden />Play</Button>}
      {st.playing && suspended && <Button onClick={() => soundEngine.resume()}>Resume audio</Button>}
      <p role="status" aria-live="polite" className="text-sm text-muted">{st.ctx === 'unsupported' ? 'Audio is not supported in this browser.' : st.playing ? (suspended ? 'Audio is paused by the browser. Press Resume audio.' : `Playing: ${st.active.length} sound${st.active.length === 1 ? '' : 's'}`) : 'Stopped'}</p>
    </div>
    <div role="group" aria-label="Sounds to mix" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {SOUNDS.map(s => <button key={s.id} type="button" aria-pressed={!!sound.mix[s.id]} onClick={() => toggle(s.id)}
        className={cx('min-h-11 rounded-[calc(var(--radius)*.7)] border hairline px-3 text-sm font-bold transition', sound.mix[s.id] ? 'bg-brand text-brand-fg' : 'bg-surface2 text-ink hover:brightness-95')}>{s.label}</button>)}
    </div>
    <div className="flex items-center gap-3">
      <button type="button" aria-label={sound.muted ? 'Unmute' : 'Mute'} aria-pressed={sound.muted} onClick={() => patch({ muted: !sound.muted })} className="grid size-11 shrink-0 place-items-center rounded-full border hairline bg-surface2">
        {sound.muted ? <VolumeX size={18} aria-hidden /> : <Volume2 size={18} aria-hidden />}</button>
      <label className="flex min-w-0 flex-1 items-center gap-3 text-sm font-bold">Volume
        <input type="range" min={0} max={1} step={0.01} value={sound.volume} onChange={e => patch({ volume: Number(e.target.value) })} className="h-11 min-w-0 flex-1 accent-brand" aria-valuetext={`${Math.round(sound.volume * 100)} percent`} /></label>
    </div>
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="block space-y-1.5 text-sm font-bold">Sleep timer
        <Select value={sound.sleepMinutes} onChange={e => { const m = Number(e.target.value); patch({ sleepMinutes: m }); if (st.playing) soundEngine.startSleep(m) }}>
          {[0, 15, 30, 45, 60, 90].map(m => <option key={m} value={m}>{m ? `${m} minutes` : 'Off'}</option>)}</Select></label>
      <div className="flex items-end text-sm" role="timer" aria-label="Sleep timer countdown">
        {st.sleepEndsAt ? <span className="font-bold tabular-nums">Fades out and stops in {fmtCountdown(st.sleepRemainingMs)}</span> : <span className="text-muted">Sleep timer not running. It starts when you press Play.</span>}</div>
    </div>
    <div className="space-y-3 border-t hairline pt-4">
      <div className="space-y-1.5"><span className="block text-sm font-bold">Automatic sound with the timer</span>
        <Segmented label="Automatic sound" value={sound.auto} onChange={auto => patch({ auto })} options={[{ value: 'off', label: 'Off' }, { value: 'focus-only', label: 'Focus only' }, { value: 'focus-and-break', label: 'Focus and break' }]} /></div>
      {sound.auto === 'focus-and-break' && <label className="block space-y-1.5 text-sm font-bold">Break sound
        <Select value={sound.breakSound} onChange={e => patch({ breakSound: e.target.value })}><option value="">Silence</option>{SOUNDS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}</Select></label>}
      <p className="text-sm text-muted">Browsers block sound until you interact with the page, so automatic sound only works after you press Play once in this session. It never starts by itself before that.</p>
    </div>
  </Card>
}
