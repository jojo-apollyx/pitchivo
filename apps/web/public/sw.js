// Service Worker for Pitchivo PWA
const CACHE_VERSION = 'v8' // Bump this to force cache refresh (v8: exclude product pages with tokens from caching)
const STATIC_CACHE = `pitchivo-static-${CACHE_VERSION}`
const DYNAMIC_CACHE = `pitchivo-dynamic-${CACHE_VERSION}`
const IMAGE_CACHE = `pitchivo-images-${CACHE_VERSION}`

const STATIC_ASSETS = [
  '/manifest.json',
  '/web-app-manifest-192x192.png',
  '/web-app-manifest-512x512.png',
  '/favicon.ico',
]

// Routes that should NEVER be cached (auth, user data, dynamic pages, etc.)
const NEVER_CACHE = [
  '/auth/', // Auth callbacks
  '/rest/v1/user_profiles', // User profiles from Supabase
  '/rest/v1/organizations', // Organization data
  'supabase.co/auth/', // Supabase auth endpoints
  'supabase.co/rest/', // Supabase REST API
  '/storage/v1/object/sign', // Signed URLs
  '/dashboard/', // All dashboard pages (dynamic, user-specific data)
  '/api/', // All API routes (dynamic data)
  '/products/', // Product pages (dynamic access levels, tokens)
]

// Check if URL should never be cached
function shouldNeverCache(url) {
  const urlObj = new URL(url)
  
  // Check against patterns
  if (NEVER_CACHE.some(pattern => url.includes(pattern))) {
    return true
  }
  
  // Never cache URLs with tokens (product pages with access tokens)
  if (urlObj.searchParams.has('token')) {
    return true
  }
  
  // Never cache URLs with merchant parameter
  if (urlObj.searchParams.has('merchant')) {
    return true
  }
  
  // Skip if has auth-related parameters
  return url.includes('authorization') || // Skip if has auth header
         url.includes('access_token') || // Skip if has access token
         url.includes('refresh_token') // Skip if has refresh token
}

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        return Promise.allSettled(
          STATIC_ASSETS.map(asset => cache.add(asset))
        )
      })
      .then(() => self.skipWaiting())
      .catch((error) => {
        console.warn('Service worker install failed:', error)
        return self.skipWaiting()
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              // Delete all caches except current version
              return !cacheName.includes(CACHE_VERSION)
            })
            .map((cacheName) => caches.delete(cacheName))
        )
      })
      .then(() => self.clients.claim())
  )
})

// Fetch event - intelligent caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // NEVER cache auth/user data - always use network
  if (shouldNeverCache(request.url)) {
    event.respondWith(fetch(request))
    return
  }

  // Determine strategy based on request type
  const strategy = getCacheStrategy(request)
  event.respondWith(handleRequest(request, strategy))
})

// Determine cache strategy
function getCacheStrategy(request) {
  const url = new URL(request.url)
  const pathname = url.pathname

  // Static Next.js assets - cache first
  if (pathname.includes('/_next/static/')) {
    return 'cache-first'
  }

  // Images - cache first
  if (/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i.test(pathname)) {
    return 'cache-first'
  }

  // Fonts - cache first
  if (pathname.includes('/fonts/') || /\.(woff|woff2|ttf|eot)$/i.test(pathname)) {
    return 'cache-first'
  }

  // Everything else - network first (pages, API calls, etc.)
  return 'network-first'
}

// Handle request based on strategy
async function handleRequest(request, strategy) {
  switch (strategy) {
    case 'cache-first':
      return cacheFirst(request)
    case 'network-first':
    default:
      return networkFirst(request)
  }
}

// Cache first strategy
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    return cachedResponse
  }

  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cacheName = request.url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) 
        ? IMAGE_CACHE 
        : DYNAMIC_CACHE
      const cache = await caches.open(cacheName)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    console.warn('Fetch failed; returning offline page:', error)
    throw error
  }
}

// Network first strategy - always fetch fresh data
async function networkFirst(request) {
  const url = new URL(request.url)
  
  // For dashboard and API routes, always fetch fresh and never cache
  if (url.pathname.startsWith('/dashboard/') || url.pathname.startsWith('/api/')) {
    try {
      const networkResponse = await fetch(request, {
        cache: 'no-store', // Force no caching
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        }
      })
      return networkResponse
    } catch (error) {
      // For dashboard pages, don't fallback to cache - show error instead
      throw error
    }
  }
  
  // For other pages, use network-first with cache fallback
  try {
    const networkResponse = await fetch(request, {
      cache: 'no-store', // Force fresh fetch for product pages
    })
    
    // Only cache successful responses (but not dashboard/API/products)
    if (networkResponse.ok && 
        !url.pathname.startsWith('/dashboard/') && 
        !url.pathname.startsWith('/api/') &&
        !url.pathname.startsWith('/products/')) {
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    // Fallback to cache only for non-dynamic navigation requests
    // Never fallback for dashboard/API/products pages
    if (!url.pathname.startsWith('/dashboard/') && 
        !url.pathname.startsWith('/api/') &&
        !url.pathname.startsWith('/products/')) {
      const cachedResponse = await caches.match(request)
      if (cachedResponse) {
        return cachedResponse
      }
    }
    throw error
  }
}

