/**
 * Service Worker for Film Simulator PWA
 * Handles caching for offline support
 */

const CACHE_NAME = 'film-simulator-v52';
const LUT_CACHE_NAME = 'film-simulator-luts-v1';

// Core app files to cache immediately
const CORE_ASSETS = [
    './',
    './index.html',
    './css/style.css',
    './js/app.js',
    './js/filmProfiles.js',
    './js/grainGenerator.js',
    './js/lutParser.js',
    './js/imageProcessor.js',
    './js/imageWorker.js',
    './manifest.json',
    './assets/icons/icon.svg',
    './assets/icons/apple-touch-icon.png'
];

// Install event - cache core assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Caching core assets');
                return cache.addAll(CORE_ASSETS);
            })
            .then(() => self.skipWaiting()) // Activate immediately
    );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME && cacheName !== LUT_CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim()) // Take control immediately
    );
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // For LUT files, use cache-first strategy (they don't change)
    if (url.pathname.endsWith('.cube')) {
        event.respondWith(
            caches.open(LUT_CACHE_NAME).then((cache) => {
                return cache.match(event.request).then((response) => {
                    if (response) {
                        return response;
                    }
                    return fetch(event.request).then((networkResponse) => {
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    });
                });
            })
        );
        return;
    }

    // For app files, use network-first strategy (for quick updates)
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Cache the new version
                if (response.ok) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            })
            .catch(() => {
                // Offline - use cache
                return caches.match(event.request);
            })
    );
});
