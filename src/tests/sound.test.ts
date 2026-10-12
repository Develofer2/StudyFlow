import { describe, expect, it } from 'vitest'
import { activeIds, autoAction, mixVolumes, sleepFade } from '@/services/sound/logic'
import { defaultPrefs } from '@/data/defaults'

const sp = (o = {}) => ({ ...defaultPrefs().sound, mix: { rain: true, fire: true }, ...o })
describe('sound logic', () => {
  it('mix volumes: muted is silent, larger mix is not louder overall', () => {
    expect(mixVolumes(['rain'], 0.8, true).rain).toBe(0)
    const one = mixVolumes(['a'], 1, false).a, four = mixVolumes(['a', 'b', 'c', 'd'], 1, false).a
    expect(one).toBe(1); expect(four).toBeCloseTo(0.5); expect(mixVolumes([], 1, false)).toEqual({})
    expect(mixVolumes(['a'], 5, false).a).toBe(1)
  })
  it('activeIds drops unknown and disabled', () => expect(activeIds({ rain: true, nope: true, wind: false })).toEqual(['rain']))
  it('sleep fade is flat then linear then done', () => {
    const total = 10 * 60000
    expect(sleepFade(total, 0).gain).toBe(1)
    expect(sleepFade(total, total - 15000).gain).toBeCloseTo(0.5)
    expect(sleepFade(total, total).done).toBe(true)
    expect(sleepFade(0, 99).done).toBe(false)
    expect(sleepFade(10000, 5000).gain).toBeCloseTo(0.5)
  })
  it('auto: never without gesture or when off', () => {
    expect(autoAction(sp({ auto: 'focus-only' }), { phase: 'focus', status: 'running' }, false).kind).toBe('none')
    expect(autoAction(sp({ auto: 'off' }), { phase: 'focus', status: 'running' }, true).kind).toBe('none')
  })
  it('auto: focus plays mix; break depends on mode; pause stops', () => {
    expect(autoAction(sp({ auto: 'focus-only' }), { phase: 'focus', status: 'running' }, true)).toEqual({ kind: 'play', ids: ['rain', 'fire'], as: 'focus' })
    expect(autoAction(sp({ auto: 'focus-only' }), { phase: 'short_break', status: 'running' }, true).kind).toBe('stop')
    expect(autoAction(sp({ auto: 'focus-and-break', breakSound: 'ocean' }), { phase: 'long_break', status: 'running' }, true)).toEqual({ kind: 'play', ids: ['ocean'], as: 'break' })
    expect(autoAction(sp({ auto: 'focus-and-break', breakSound: '' }), { phase: 'short_break', status: 'running' }, true).kind).toBe('stop')
    expect(autoAction(sp({ auto: 'focus-only' }), { phase: 'focus', status: 'paused' }, true).kind).toBe('stop')
  })
})
