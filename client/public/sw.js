const CACHE_NAME = 'divyanshi-solar-v2';
const STATIC_ASSETS = [
  '/',
  '/favicon.png',
  '/manifest.json'
];

const CACHE_STRATEGIES = {
  networkFirst: ['api'],
  cacheFirst: ['fonts.googleapis.com', 'fonts.gstatic.com', '.png', '.jpg', '.svg', '.ico'],
  staleWhileRevalidate: ['.js', '.css']
};

const SKIP_CACHE_PATTERNS = [
  '/api/commissions',
  '/api/customers',
  '/api/dashboard',
  '/api/earnings',
  '/api/payouts',
  '/api/wallet',
  '/api/referrals',
  '/api/leaderboard',
  '/api/orders'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  if (url.pathname.startsWith('/api')) {
    const shouldSkipCache = SKIP_CACHE_PATTERNS.some(pattern => 
      url.pathname.includes(pattern)
    );
    
    if (shouldSkipCache) {
      event.respondWith(networkOnly(request));
    } else {
      event.respondWith(networkFirst(request));
    }
    return;
  }

  if (isCacheFirst(url.href)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  event.respondWith(staleWhileRevalidate(request));
});

function isCacheFirst(url) {
  return CACHE_STRATEGIES.cacheFirst.some(pattern => url.includes(pattern));
}

async function networkOnly(request) {
  try {
    return await fetch(request);
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Offline', offline: true }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) return cachedResponse;
    return new Response(JSON.stringify({ error: 'Offline', offline: true }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) return cachedResponse;
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return new Response('', { status: 404 });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await caches.match(request);
  
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => cachedResponse);

  return cachedResponse || fetchPromise;
}

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
