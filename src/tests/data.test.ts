import { beforeAll, describe, expect, it } from 'vitest'
import { initStore, put, getAll, remove, getPrefs, setPrefs, getAiKey, setAiKey, clearAllData } from '@/data/store'
import { buildExport, parseImport, applyMerge, applyReplace } from '@/services/dataio'
import { reviewCard, newCard } from '@/services/app'
import type { Flashcard, Subject } from '@/types'

beforeAll(async () => { await initStore() })

describe('store + persistence', () => {
  it('creates, updates and removes records', async () => {
    const s = await put('subjects', { name: 'Math', color: '#123456', icon: 'book', examDates: [] } as Partial<Subject>)
    expect(s.id).toBeTruthy(); expect(getAll('subjects')).toHaveLength(1)
    await put('subjects', { ...s, name: 'Maths' }); expect(getAll<Subject>('subjects')[0].name).toBe('Maths')
    await remove('subjects', s.id); expect(getAll('subjects')).toHaveLength(0)
  })
  it('review card changes due date and logs the review', async () => {
    const c = await put('cards', newCard('deck1', 'Q', 'A') as Partial<Flashcard>)
    await reviewCard(c as Flashcard, 'good')
    const after = getAll<Flashcard>('cards').find(x => x.id === c.id)!
    expect(after.intervalDays).toBe(1); expect(after.dueAt).toBeTruthy(); expect(getAll('reviews').length).toBe(1)
  })
  it('AI key is stored separately and never exported', async () => {
    await setAiKey('SECRET-KEY-123'); expect(await getAiKey()).toBe('SECRET-KEY-123')
    expect(JSON.stringify(buildExport())).not.toContain('SECRET-KEY-123')
    await setAiKey(''); expect(await getAiKey()).toBe('')
  })
})

describe('export / import', () => {
  it('round-trips, detects duplicates on merge, replaces', async () => {
    await put('subjects', { name: 'Bio', color: '#111111', icon: 'book', examDates: [] } as Partial<Subject>)
    const text = JSON.stringify(buildExport()); const pv = parseImport(text)
    expect(pv.ok).toBe(true); expect(pv.counts.subjects?.duplicates).toBe(1)
    await applyMerge(pv); expect(getAll('subjects')).toHaveLength(1)
    await clearAllData(); expect(getAll('subjects')).toHaveLength(0)
    await applyReplace(parseImport(text)); expect(getAll('subjects')).toHaveLength(1)
  })
  it('rejects malformed, wrong-shape and future-version files', () => {
    expect(parseImport('not json').ok).toBe(false); expect(parseImport('[]').ok).toBe(false)
    expect(parseImport(JSON.stringify({ app: 'studyflow', version: 999, data: {} })).ok).toBe(false)
  })
  it('counts invalid records instead of importing them', () => {
    const ex = buildExport() as any; ex.data.subjects = [{ nope: true }]; const pv = parseImport(JSON.stringify(ex))
    expect(pv.counts.subjects?.invalid).toBe(1)
  })
  it('prefs persist', async () => { await setPrefs({ displayName: 'Sam' }); expect(getPrefs().displayName).toBe('Sam') })
})
