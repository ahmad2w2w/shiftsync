const CACHE = 'shiftsync-v2'
const ASSETS = ['/', '/index.html', '/offline.html', '/favicon.svg', '/manifest.webmanifest']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((response) => {
          if (response.ok && event.request.url.startsWith(self.location.origin)) {
            const clone = response.clone()
            caches.open(CACHE).then((cache) => cache.put(event.request, clone))
          }
          return response
        })
        .catch(async () => {
          if (cached) return cached
          if (event.request.mode === 'navigate') {
            const offline = await caches.match('/offline.html')
            if (offline) return offline
          }
          throw new Error('offline')
        })
      return cached || fetchPromise
    })
  )
})
