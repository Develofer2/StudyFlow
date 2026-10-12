import { describe, expect, it } from 'vitest'
import { DEFAULT_ENV, ENV_IDS, ENV_INFO, envInfo, envProgressVisual, isOwnedEnv, shouldAnimate } from '@/domain/env'
import { ENVIRONMENTS } from '@/domain/catalog'

describe('env domain', () => {
  it('ids match the catalog', () => { expect([...ENV_IDS].sort()).toEqual(ENVIRONMENTS.map(e => e.id).sort()) })
  it('every env has an anchor and aria label', () => {
    for (const id of ENV_IDS) { const i = ENV_INFO[id]; expect(i.aria.length).toBeGreaterThan(20); expect(i.anchor.x).toBeGreaterThan(0); expect(i.anchor.y).toBeLessThanOrEqual(100) }
  })
  it('falls back to the default for unknown ids', () => { expect(envInfo('nope')).toBe(ENV_INFO[DEFAULT_ENV]) })
  it('clamps progress and maps stages', () => {
    expect(envProgressVisual(-1)).toMatchObject({ level: 0, stage: 0 }); expect(envProgressVisual(NaN).level).toBe(0)
    expect(envProgressVisual(2)).toMatchObject({ level: 1, stage: 3 }); expect(envProgressVisual(.5)).toMatchObject({ eased: .5, stage: 2 })
    expect(envProgressVisual(.3).eased).toBeLessThan(.3)
  })
  it('ownership requires a known id in the owned set', () => {
    expect(isOwnedEnv('night-sky', new Set(['night-sky']))).toBe(true)
    expect(isOwnedEnv('night-sky', new Set())).toBe(false); expect(isOwnedEnv('bogus', new Set(['bogus']))).toBe(false)
  })
  it('animates only when running, visible and motion allowed', () => {
    const ok = { running: true, reduced: false, staticBackground: false, hidden: false }
    expect(shouldAnimate(ok)).toBe(true)
    for (const k of ['reduced', 'staticBackground', 'hidden'] as const) expect(shouldAnimate({ ...ok, [k]: true })).toBe(false)
    expect(shouldAnimate({ ...ok, running: false })).toBe(false)
  })
})
