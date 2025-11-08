// Service Worker for PWA
const CACHE_NAME = 'pitchivo-v2'
const STATIC_CACHE = 'pitchivo-static-v2'
const DYNAMIC_CACHE = 'pitchivo-dynamic-v2'

const STATIC_ASSETS = [
  '/manifest.json',
  '/web-app-manifest-192x192.png',
  '/web-app-manifest-512x512.png',
  '/favicon.ico',
]

// Install event
self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.error('Failed to cache assets:', err)
      })
    })
  )
})

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
            .map((name) => caches.delete(name))
        )
      })
    ])
  )
})

// Fetch event - Network first, cache fallback
self.addEventListener('fetch', (event) => {
  const method = event.request.method
  
  // Skip caching for POST, PUT, DELETE, PATCH requests
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    event.respondWith(fetch(event.request))
    return
  }
  
  // Skip caching for same-origin requests to avoid CSS/JS issues
  if (event.request.url.startsWith(self.location.origin)) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request)
      })
    )
  } else {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return (
          response ||
          fetch(event.request).then((fetchResponse) => {
            // Only cache GET requests with successful responses
            if (method === 'GET' && fetchResponse.ok) {
              return caches.open(DYNAMIC_CACHE).then((cache) => {
                cache.put(event.request, fetchResponse.clone())
                return fetchResponse
              })
            }
            return fetchResponse
          })
        )
      })
    )
  }
})

