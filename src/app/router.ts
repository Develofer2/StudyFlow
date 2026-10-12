import { useSyncExternalStore } from 'react'
export interface Route { path: string; params: URLSearchParams }
const parse = (): Route => { const h = location.hash.replace(/^#\/?/, ''); const [path, q] = h.split('?'); return { path: path || 'home', params: new URLSearchParams(q ?? '') } }
let cur = parse(); let key = location.hash
const subs = new Set<() => void>()
addEventListener('hashchange', () => { cur = parse(); key = location.hash; subs.forEach(s => s()) })
export const useRoute = (): Route => { useSyncExternalStore(l => { subs.add(l); return () => { subs.delete(l) } }, () => key); return cur }
export function go(path: string, params?: Record<string, string>) { location.hash = '/' + path + (params ? '?' + new URLSearchParams(params).toString() : '') }
