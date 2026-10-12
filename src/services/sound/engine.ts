// Original ambience synthesized on-device with Web Audio (no audio files). Looped pre-generated buffers + filters + gain LFOs; sparse events via setTimeout.
import { mixVolumes, sleepFade } from './logic'

export interface SoundState { unlocked: boolean; playing: boolean; ctx: 'none' | 'running' | 'suspended' | 'unsupported'; active: string[]; sleepEndsAt?: number; sleepRemainingMs: number; source: 'manual' | 'auto' }
type Voice = { out: AudioNode; stop: () => void }
type Ctx = AudioContext
const rnd = (a: number, b: number) => a + Math.random() * (b - a)

function noiseBuf(ctx: Ctx, kind: 'white' | 'brown', secs = 4) {
  const len = Math.floor(ctx.sampleRate * secs), n = 2000, buf = ctx.createBuffer(1, len, ctx.sampleRate)
  const tmp = new Float32Array(len + n)
  let last = 0
  for (let i = 0; i < tmp.length; i++) {
    const w = Math.random() * 2 - 1
    if (kind === 'white') tmp[i] = w * 0.5
    else { last = (last + 0.02 * w) / 1.02; tmp[i] = last * 3.2 }
  }
  // crossfade the head into the extra tail so the loop point is continuous
  for (let i = 0; i < n; i++) { const t = i / n; tmp[i] = tmp[i] * t + tmp[len + i] * (1 - t) }
  buf.copyToChannel(tmp.subarray(0, len), 0)
  return buf
}

export class SoundEngine {
  private ctx?: Ctx; private master?: GainNode; private bufs: Partial<Record<'white' | 'brown', AudioBuffer>> = {}
  private chans = new Map<string, { gain: GainNode; voice: Voice }>()
  private subs = new Set<() => void>(); private sleepTimer?: ReturnType<typeof setInterval>
  private volume = 0.5; private muted = false; private sleepTotal = 0; private sleepStart = 0; private sleepGain = 1
  private state: SoundState = { unlocked: false, playing: false, ctx: 'none', active: [], sleepRemainingMs: 0, source: 'manual' }
  subscribe = (l: () => void) => { this.subs.add(l); return () => { this.subs.delete(l) } }
  getState = () => this.state
  private set(p: Partial<SoundState>) { this.state = { ...this.state, ...p }; this.subs.forEach(l => l()) }
  get supported() { return typeof window !== 'undefined' && !!(window.AudioContext || (window as any).webkitAudioContext) }

  /** Must be called from a user gesture (click). Creates/resumes the AudioContext. */
  async unlock() {
    if (!this.supported) { this.set({ ctx: 'unsupported' }); return false }
    if (!this.ctx) {
      const C = window.AudioContext || (window as any).webkitAudioContext
      this.ctx = new C() as Ctx
      this.master = this.ctx.createGain(); this.master.connect(this.ctx.destination)
      this.ctx.onstatechange = () => this.set({ ctx: this.ctx!.state === 'running' ? 'running' : 'suspended' })
      this.applyMaster()
    }
    try { await this.ctx.resume() } catch { /* autoplay policy: stays suspended until next gesture */ }
    this.set({ unlocked: true, ctx: this.ctx.state === 'running' ? 'running' : 'suspended' })
    return this.ctx.state === 'running'
  }
  private applyMaster() {
    if (!this.master || !this.ctx) return
    const g = this.muted ? 0 : this.volume ** 2 * this.sleepGain
    this.master.gain.setTargetAtTime(g, this.ctx.currentTime, 0.05)
  }
  setVolume(v: number, muted: boolean) { this.volume = v; this.muted = muted; this.applyMaster() }

  /** Make exactly `ids` audible (others fade out). Per-sound level is balanced by count. */
  setActive(ids: string[], source: 'manual' | 'auto' = 'manual') {
    if (!this.ctx || !this.master || !this.state.unlocked) return
    const ctx = this.ctx, t = ctx.currentTime, levels = mixVolumes(ids, 1, false)
    for (const [id, ch] of this.chans) if (!ids.includes(id)) {
      ch.gain.gain.setTargetAtTime(0, t, 0.25); this.chans.delete(id)
      setTimeout(() => { ch.voice.stop(); ch.gain.disconnect() }, 1500)
    }
    for (const id of ids) {
      const ex = this.chans.get(id)
      if (ex) { ex.gain.gain.setTargetAtTime(levels[id], t, 0.2); continue }
      const voice = this.build(id); if (!voice) continue
      const gain = ctx.createGain(); gain.gain.value = 0; voice.out.connect(gain); gain.connect(this.master)
      gain.gain.setTargetAtTime(levels[id], t, 0.4); this.chans.set(id, { gain, voice })
    }
    this.set({ playing: ids.length > 0, active: [...this.chans.keys()], source })
    if (!ids.length) this.cancelSleep()
  }
  stop(fadeMs = 400) {
    this.cancelSleep(); const ids = this.state.active
    if (this.ctx && ids.length) this.master?.gain.setTargetAtTime(0, this.ctx.currentTime, fadeMs / 3000)
    setTimeout(() => { this.setActive([]); this.sleepGain = 1; this.applyMaster() }, fadeMs)
    this.set({ playing: false })
  }
  async pause() { try { await this.ctx?.suspend() } catch {} }
  async resume() { try { await this.ctx?.resume() } catch {} }

  startSleep(minutes: number) {
    this.cancelSleep(); if (minutes <= 0) return
    this.sleepTotal = minutes * 60000; this.sleepStart = Date.now()
    const tick = () => {
      const f = sleepFade(this.sleepTotal, Date.now() - this.sleepStart)
      this.sleepGain = f.gain; this.applyMaster()
      if (f.done) { this.cancelSleep(); this.setActive([]); this.sleepGain = 1; this.applyMaster() } else this.set({ sleepRemainingMs: f.remainingMs })
    }
    this.set({ sleepEndsAt: this.sleepStart + this.sleepTotal, sleepRemainingMs: this.sleepTotal })
    this.sleepTimer = setInterval(tick, 1000)
  }
  cancelSleep() {
    if (this.sleepTimer) clearInterval(this.sleepTimer)
    this.sleepTimer = undefined; this.sleepGain = 1; this.applyMaster()
    if (this.state.sleepEndsAt) this.set({ sleepEndsAt: undefined, sleepRemainingMs: 0 })
  }

  private buf(kind: 'white' | 'brown') { return (this.bufs[kind] ??= noiseBuf(this.ctx!, kind)) }
  private src(kind: 'white' | 'brown') { const s = this.ctx!.createBufferSource(); s.buffer = this.buf(kind); s.loop = true; s.start(0, rnd(0, 3)); return s }
  private filt(type: BiquadFilterType, f: number, q = 0.7) { const b = this.ctx!.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; return b }
  private gain(v: number) { const g = this.ctx!.createGain(); g.gain.value = v; return g }
  /** Slow LFO modulating an AudioParam: base value +- depth. */
  private lfo(param: AudioParam, hz: number, depth: number, nodes: AudioScheduledSourceNode[]) {
    const o = this.ctx!.createOscillator(), g = this.gain(depth); o.frequency.value = hz; o.connect(g); g.connect(param); o.start(); nodes.push(o)
  }
  /** Random sparse events; returns canceller. */
  private every(minMs: number, maxMs: number, fn: () => void) {
    let t: ReturnType<typeof setTimeout>, dead = false
    const go = () => { t = setTimeout(() => { if (dead) return; if (this.ctx?.state === 'running') fn(); go() }, rnd(minMs, maxMs)) }
    go(); return () => { dead = true; clearTimeout(t) }
  }
  private burst(out: AudioNode, o: { f: number; q?: number; type?: BiquadFilterType; dur: number; peak: number; attack?: number }) {
    const ctx = this.ctx!, t = ctx.currentTime, s = ctx.createBufferSource(); s.buffer = this.buf('white')
    const f = this.filt(o.type ?? 'bandpass', o.f, o.q ?? 1), g = this.gain(0), a = o.attack ?? 0.002
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(o.peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur)
    s.connect(f); f.connect(g); g.connect(out); s.start(t, rnd(0, 3), o.dur + 0.05)
  }
  private chirp(out: AudioNode) {
    const ctx = this.ctx!, t0 = ctx.currentTime, base = rnd(2200, 4200), n = Math.floor(rnd(2, 5))
    for (let i = 0; i < n; i++) {
      const t = t0 + i * 0.13, o = ctx.createOscillator(), g = this.gain(0)
      o.type = 'sine'; o.frequency.setValueAtTime(base * rnd(0.9, 1.1), t); o.frequency.exponentialRampToValueAtTime(base * rnd(1.2, 1.5), t + 0.09)
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.05, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.1)
      o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.12)
    }
  }

  private build(id: string): Voice | undefined {
    const nodes: AudioScheduledSourceNode[] = [], cancels: (() => void)[] = []
    const out = this.gain(1)
    const chain = (kind: 'white' | 'brown', fs: AudioNode[], level: number) => { const s = this.src(kind); nodes.push(s); let n: AudioNode = s; for (const f of fs) { n.connect(f); n = f } const g = this.gain(level); n.connect(g); g.connect(out); return g }
    switch (id) {
      case 'white': chain('white', [this.filt('lowpass', 12000)], 0.5); break
      case 'brown': chain('brown', [], 0.9); break
      case 'rain':
        chain('white', [this.filt('highpass', 700), this.filt('lowpass', 9000)], 0.35)
        cancels.push(this.every(60, 260, () => this.burst(out, { f: rnd(2500, 7000), q: 4, dur: rnd(0.02, 0.05), peak: rnd(0.04, 0.14) })))
        break
      case 'fire':
        chain('brown', [this.filt('lowpass', 260)], 1.1)
        cancels.push(this.every(90, 900, () => this.burst(out, { f: rnd(1200, 5000), q: 0.8, type: 'highpass', dur: rnd(0.006, 0.03), peak: rnd(0.1, 0.45) })))
        break
      case 'forest': {
        const g = chain('white', [this.filt('bandpass', 520, 0.4)], 0.5); this.lfo(g.gain, 0.07, 0.2, nodes)
        cancels.push(this.every(2500, 8000, () => this.chirp(out)))
        break
      }
      case 'ocean': {
        const g = chain('brown', [this.filt('lowpass', 900)], 0.55); this.lfo(g.gain, 0.09, 0.45, nodes)
        const h = chain('white', [this.filt('bandpass', 1800, 0.5)], 0.08); this.lfo(h.gain, 0.09, 0.07, nodes)
        break
      }
      case 'wind': {
        const f = this.filt('bandpass', 450, 1.2); chain('white', [f], 0.7); this.lfo(f.frequency, 0.11, 220, nodes)
        break
      }
      case 'library':
        chain('brown', [this.filt('lowpass', 320)], 0.18)
        cancels.push(this.every(7000, 20000, () => this.burst(out, { f: 3200, q: 0.8, dur: 0.35, peak: 0.07, attack: 0.12 })))
        cancels.push(this.every(5000, 15000, () => this.burst(out, { f: 1800, q: 6, dur: 0.02, peak: 0.12 })))
        break
      default: return undefined
    }
    return { out, stop: () => { cancels.forEach(c => c()); nodes.forEach(n => { try { n.stop() } catch {} }); out.disconnect() } }
  }
}
export const soundEngine = new SoundEngine()
