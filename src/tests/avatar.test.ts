import { it, expect } from 'vitest'
import { ALL_PARTS, BOTTOMS, DEFAULT_AVATAR, SHOES, TOPS, cheap, fits, PARTS, SLOTS, partKey, sanitizeAvatar, surprise } from '@/domain/avatar'
import { ownedIds } from '@/domain/growth'

it('part ids are unique per slot and defaults are free', () => {
  for (const s of SLOTS) { const ids = PARTS[s].map(p => p.id); expect(new Set(ids).size).toBe(ids.length) }
  for (const s of SLOTS) { const d = DEFAULT_AVATAR[s]; if (d) expect(PARTS[s].find(p => p.id === d)?.cost).toBe(0) }
  expect(ALL_PARTS.filter(x => x.part.cost > 0).length).toBeGreaterThan(50)
})
it('free parts are owned from the start, paid ones are not', () => {
  const o = ownedIds([])
  expect(o.has(partKey('top', 'tee-blue'))).toBe(true)
  expect(o.has(partKey('hat', 'crown'))).toBe(false)
})
it('surprise only uses owned parts; sanitize repairs bad data', () => {
  const o = ownedIds([])
  for (let i = 0; i < 30; i++) { const a = surprise(o, DEFAULT_AVATAR); for (const s of SLOTS) if (a[s]) expect(o.has(partKey(s, a[s]))).toBe(true) }
  expect(sanitizeAvatar({ top: 'nope', hair: 'zzz' }).top).toBe(DEFAULT_AVATAR.top)
})

it('every clothing slot has at least 3 free items per body, with cute, cool and classic styles', () => {
  for (const list of [TOPS, BOTTOMS, SHOES]) for (const body of ['masc', 'femme'] as const) {
    const free = list.filter(p => p.cost === 0 && fits(p, body))
    expect(free.length).toBeGreaterThanOrEqual(5)
    expect(free.filter(p => p.g !== 'u').length).toBeGreaterThanOrEqual(3)
    expect(new Set(free.map(p => p.v)).size).toBeGreaterThanOrEqual(2)
    expect(free.some(p => p.v === 'cute')).toBe(true)
    expect(list.filter(p => p.cost > 0 && fits(p, body)).length).toBeGreaterThanOrEqual(6)
  }
  expect(TOPS.filter(p => p.cost === 0 && p.v === 'cool' && fits(p, 'masc')).length).toBeGreaterThan(0)
})
it('prices are lowered but never free by accident', () => {
  expect(cheap(0)).toBe(0); expect(cheap(100)).toBe(45); expect(cheap(10)).toBe(5)
})
