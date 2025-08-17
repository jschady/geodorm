// Service Worker for Dorm Status PWA
const CACHE_NAME = 'dorm-status-v2'; // Incremented to force cache refresh
const STATIC_CACHE = 'dorm-status-static-v2'; // Incremented to force cache refresh

// Files to cache for offline functionality
const STATIC_FILES = [
  '/',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing');
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
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating');
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip Supabase API requests for real-time functionality
  if (event.request.url.includes('supabase.co')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version if available
        if (response) {
          console.log('Service Worker: Serving from cache', event.request.url);
          return response;
        }

        // Otherwise fetch from network
        return fetch(event.request)
          .then(response => {
            // Check if response is valid
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone response for caching
            const responseToCache = response.clone();
            
            // Cache the response for next time
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // If network fails and we're requesting the main page, serve offline page
            if (event.request.destination === 'document') {
              return caches.match('/') || new Response(
                `<!DOCTYPE html>
                <html>
                <head>
                  <title>Dorm Status - Offline</title>
                  <meta name="viewport" content="width=device-width, initial-scale=1">
                  <style>
                    body { 
                      font-family: system-ui, -apple-system, sans-serif; 
                      background: #111827; 
                      color: white; 
                      display: flex; 
                      align-items: center; 
                      justify-content: center; 
                      min-height: 100vh; 
                      margin: 0;
                      text-align: center;
                      padding: 2rem;
                    }
                    .offline-container { max-width: 400px; }
                    h1 { color: #fbbf24; margin-bottom: 1rem; }
                    p { color: #9ca3af; line-height: 1.5; }
                    .retry-btn {
                      background: #4f46e5;
                      color: white;
                      border: none;
                      padding: 0.75rem 1.5rem;
                      border-radius: 0.5rem;
                      cursor: pointer;
                      margin-top: 1rem;
                      font-size: 1rem;
                    }
                    .retry-btn:hover { background: #4338ca; }
                  </style>
                </head>
                <body>
                  <div class="offline-container">
                    <h1>You're Offline</h1>
                    <p>Dorm Status needs an internet connection to sync status updates in real-time.</p>
                    <p>Please check your connection and try again.</p>
                    <button class="retry-btn" onclick="window.location.reload()">Retry</button>
                  </div>
                </body>
                </html>`,
                { headers: { 'Content-Type': 'text/html' } }
              );
            }
          });
      })
  );
});

// Handle background sync for status updates (when back online)
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered');
  if (event.tag === 'status-update') {
    event.waitUntil(syncStatusUpdates());
  }
});

// Handle push notifications (for future use)
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push received');
  
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    vibrate: [200, 100, 200],
    data: data.data || {},
    actions: [
      {
        action: 'view',
        title: 'View Status',
        icon: '/icon-192x192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Dorm Status', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked');
  
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});

// Sync function for offline status updates
async function syncStatusUpdates() {
  try {
    // This would sync any pending status updates stored in IndexedDB
    console.log('Service Worker: Syncing status updates');
    // Implementation would depend on offline storage strategy
  } catch (error) {
    console.error('Service Worker: Sync failed', error);
  }
} 