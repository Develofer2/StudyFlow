import { it, expect } from 'vitest'
import { COMPANIONS, STYLES, cursorImage, cursorCss, cursorLayers, migrateCursor } from '@/domain/cursors'
const ok = (u: string, id: string) => expect(new DOMParser().parseFromString(decodeURIComponent(u.split(',')[1]), 'image/svg+xml').querySelector('parsererror'), id).toBeNull()
it('every style and companion renders valid svg', () => {
  for (const s of STYLES) for (const c of ['none', ...COMPANIONS.map(x => x.id)]) for (const p of [false, true]) {
    ok(cursorImage({ arrow: s.id, companion: c }, p), s.id + c)
    const l = cursorLayers({ arrow: s.id, companion: c }, p, 32); ok(l.tip, s.id); if (l.head) ok(l.head, c)
  }
  expect(cursorCss({ arrow: 'g-blade', companion: 'capybara' }, 'large')).toContain('html[data-cursor]')
}, 60000)
it('ids are unique', () => { expect(new Set(STYLES.map(s => s.id)).size).toBe(STYLES.length); expect(new Set(COMPANIONS.map(s => s.id)).size).toBe(COMPANIONS.length) })
it('migrates old single-id prefs', () => {
  expect(migrateCursor({ id: 'cat' })).toEqual({ arrow: 'classic', companion: 'cat' })
  expect(migrateCursor({ id: 'px-pink' })).toEqual({ arrow: 'px-pink', companion: 'none' })
  expect(migrateCursor({ id: 'sm-kawaii' })).toEqual({ arrow: 'an-kawaii', companion: 'none' })
  expect(migrateCursor({ arrow: 'g-blade', companion: 'duck' })).toEqual({ arrow: 'g-blade', companion: 'duck' })
})
