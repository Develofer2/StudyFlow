import { openDB, type IDBPDatabase } from 'idb'

export const COLLECTIONS = ['subjects', 'tasks', 'sessions', 'notes', 'decks', 'cards', 'quizzes', 'attempts', 'exams', 'achievements', 'reviews', 'presets', 'rewards', 'trees'] as const
export type CollectionName = (typeof COLLECTIONS)[number]
export const DB_VERSION = 2
type AnyDB = IDBPDatabase<any>

/** Versioned migrations: add a `case` per new version; never edit an old one. */
export function upgrade(db: IDBPDatabase<any>, oldVersion: number, tx: any) {
  if (oldVersion < 1) {
    for (const name of COLLECTIONS) {
      const s = db.createObjectStore(name, { keyPath: 'id' })
      s.createIndex('updatedAt', 'updatedAt')
      if (name === 'tasks') { s.createIndex('status', 'status'); s.createIndex('subjectId', 'subjectId') }
      if (name === 'sessions') { s.createIndex('startedAt', 'startedAt'); s.createIndex('subjectId', 'subjectId'); s.createIndex('taskId', 'taskId') }
      if (name === 'cards') { s.createIndex('deckId', 'deckId'); s.createIndex('dueAt', 'dueAt') }
    }
    db.createObjectStore('kv')
  }
  if (oldVersion < 2) {
    for (const name of ['rewards', 'trees']) {
      if (db.objectStoreNames.contains(name)) continue
      const s = db.createObjectStore(name, { keyPath: 'id' }); s.createIndex('updatedAt', 'updatedAt')
      if (name === 'rewards') s.createIndex('day', 'day')
      if (name === 'trees') { s.createIndex('sessionId', 'sessionId'); s.createIndex('day', 'day') }
    }
  }
  void tx
}
let dbp: Promise<AnyDB> | null = null
export function getDb(name = 'studyflow-db'): Promise<AnyDB> {
  if (!dbp) dbp = openDB<any>(name, DB_VERSION, { upgrade }) as Promise<AnyDB>
  return dbp
}
export function resetDbHandle() { dbp = null }
export function describeStorageError(e: unknown): string {
  const n = (e as { name?: string })?.name
  if (n === 'QuotaExceededError') return 'Your browser storage is full. Export a backup and free some space, then try again.'
  if (n === 'SecurityError' || n === 'InvalidStateError') return 'Your browser is blocking local storage (private mode?). Changes will be lost when you close this tab.'
  return 'A change could not be saved to this device. Please try again; export a backup if it keeps happening.'
}
