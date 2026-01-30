/**
 * Service Worker for Film Simulator PWA
 * Handles caching for offline support
 */

const CACHE_NAME = 'film-simulator-v36';
const LUT_CACHE_NAME = 'film-simulator-luts-v1';

// Core app files to cache immediately
const CORE_ASSETS = [
    '/',
    '/index.html',
    '/css/style.css?v=36',
    '/js/app.js?v=36',
    '/js/filmProfiles.js?v=36',
    '/js/grainGenerator.js?v=36',
    '/js/lutParser.js?v=36',
    '/js/imageProcessor.js?v=36',
    '/js/imageWorker.js?v=36',
    '/manifest.json'
];

// Install event - cache core assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Caching core assets');
                return cache.addAll(CORE_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME && name !== LUT_CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Handle LUT files specially - cache them for offline use
    if (url.hostname === 'raw.githubusercontent.com' && url.pathname.includes('.cube')) {
        event.respondWith(
            caches.open(LUT_CACHE_NAME).then((cache) => {
                return cache.match(event.request).then((response) => {
                    if (response) {
                        return response;
                    }
                    return fetch(event.request).then((networkResponse) => {
                        // Cache the LUT file for future use
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    });
                });
            })
        );
        return;
    }

    // For same-origin requests, use network-first strategy for HTML/CSS/JS
    if (url.origin === location.origin) {
        event.respondWith(
            fetch(event.request).then((networkResponse) => {
                // Cache the fresh response
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, networkResponse.clone());
                });
                return networkResponse;
            }).catch(() => {
                // Network failed, try cache
                return caches.match(event.request);
            })
        );
        return;
    }

    // For other requests, network first
    event.respondWith(
        fetch(event.request).catch(() => caches.match(event.request))
    );
});

// Handle messages from the app
self.addEventListener('message', (event) => {
    if (event.data === 'skipWaiting') {
        self.skipWaiting();
    }
});
