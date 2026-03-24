// Service Worker for caching static assets
const CACHE_NAME = 'steamscout-v1.0.0';
const STATIC_CACHE = 'steamscout-static-v1.0.0';
const API_CACHE = 'steamscout-api-v1.0.0';

// Files to cache immediately
const STATIC_FILES = [
    '/',
    '/index.html',
    '/styles.css',
    '/script.js',
    '/config.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-solid-900.woff2'
];

// Install event - cache static files
self.addEventListener('install', event => {
    console.log('Service Worker: Installing...');
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('Service Worker: Caching static files');
                return cache.addAll(STATIC_FILES);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('Service Worker: Activating...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== STATIC_CACHE && cacheName !== API_CACHE) {
                        console.log('Service Worker: Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // Handle API requests with network-first strategy
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            caches.open(API_CACHE).then(cache => {
                return fetch(event.request)
                    .then(response => {
                        // Cache successful API responses for 5 minutes
                        if (response.status === 200) {
                            cache.put(event.request, response.clone());
                        }
                        return response;
                    })
                    .catch(() => {
                        // Return cached version if network fails
                        return cache.match(event.request);
                    });
            })
        );
        return;
    }

    // Handle static files with cache-first strategy
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }

                return fetch(event.request).then(response => {
                    // Don't cache non-successful responses
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // Cache the fetched response
                    const responseToCache = response.clone();
                    caches.open(STATIC_CACHE).then(cache => {
                        cache.put(event.request, responseToCache);
                    });

                    return response;
                });
            })
    );
});