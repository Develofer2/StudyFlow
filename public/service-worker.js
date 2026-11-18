const VERSION = 'studyflow-v1'
const SHELL = ['./', './manifest.webmanifest', './favicon.svg']
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())) })
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())) })
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url)
  if (req.method !== 'GET' || url.origin !== location.origin) return
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(VERSION).then(x => x.put('./', c)); return r }).catch(() => caches.match('./')))
    return
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => { if (r.ok) { const c = r.clone(); caches.open(VERSION).then(x => x.put(req, c)) } return r })))
})
