export async function GET() {
  const swCode = `
'use strict';

const CACHE_NAME = 'healthcare-app-v1';
const STATIC_ASSETS = [
  '/',
  '/app.js',
  '/offline.html'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        console.log('[SW] Some assets could not be cached');
      });
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
  self.clients.claim();
});

// Push notification event
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const options = {
    body: data.body || 'Nova notificação',
    icon: data.icon || '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: data.tag || 'notification',
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || [],
    data: data.data || {},
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Healthcare App', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return clients.openWindow('/');
    })
  );
});

// Message event - for client to SW communication
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch event - network-first strategy for API calls, cache-first for assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  if (url.pathname.startsWith('/api/')) {
    // Network first for API calls
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(event.request))
    );
  } else {
    // Cache first for other requests
    event.respondWith(
      caches.match(event.request)
        .then((response) => response || fetch(event.request))
        .catch(() => new Response('Offline', { status: 503 }))
    );
  }
});

if ("serviceWorker" in navigator) {
  const SW_CONFIG = {
    scope: "/",
    updateInterval: 1000 * 60 * 60,
    debug: true,
  }

  const registerServiceWorker = async () => {
    try {
      console.log("[SW] Starting service worker registration...")

      const registration = await navigator.serviceWorker.register("/api/sw", {
        scope: SW_CONFIG.scope,
        updateViaCache: "none",
      })

      console.log(\`✅ Service Worker registered with scope: \${registration.scope}\`)

      if (registration.installing) {
        console.log("[SW] Service worker installing...")
        registration.installing.addEventListener("statechange", (event) => {
          console.log(\`[SW] State changed to: \${event.target.state}\`)
        })
      } else if (registration.waiting) {
        console.log("[SW] Service worker waiting to activate")
      } else if (registration.active) {
        console.log("[SW] Service worker active and ready")
      }

      setupUpdateChecks(registration)
      setupMessageListener()

      setInterval(() => {
        registration.update()
      }, SW_CONFIG.updateInterval)

      return registration
    } catch (error) {
      console.error("❌ Failed to register Service Worker:", error)
      throw error
    }
  }

  const setupUpdateChecks = (registration) => {
    registration.addEventListener("updatefound", () => {
      const newWorker = registration.installing
      console.log("[SW] Update found, new worker installing...")

      newWorker.addEventListener("statechange", () => {
        console.log(\`[SW] New worker state: \${newWorker.state}\`)

        if (newWorker.state === "installed") {
          if (navigator.serviceWorker.controller) {
            console.log("🔄 New version available! Showing update prompt...")
            showUpdateNotification(registration)
          } else {
            console.log("✅ Content is cached for offline use.")
          }
        }
      })
    })

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      console.log("[SW] Controller changed")
    })
  }

  const setupMessageListener = () => {
    navigator.serviceWorker.addEventListener("message", (event) => {
      const { type, data } = event.data || {}

      switch (type) {
        case "NEW_NOTIFICATION":
          console.log("[SW] New notification:", data)
          window.dispatchEvent(new CustomEvent("new-notification", { detail: data }))
          break

        case "UPDATE_AVAILABLE":
          console.log("[SW] Update available:", data)
          break

        default:
          console.log("[SW] Message received:", event.data)
      }
    })

    navigator.serviceWorker.addEventListener("error", (event) => {
      console.error("[SW] Service worker error:", event.error || event.message)
    })
  }

  const urlBase64ToUint8Array = (base64String) => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
    const rawData = atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  const showUpdateNotification = (registration) => {
    if (window.confirm("Nova versão disponível! Deseja atualizar agora?")) {
      if (registration.waiting) {
        registration.waiting.postMessage({ type: "SKIP_WAITING" })
      }
    }
  }

  registerServiceWorker().catch(console.error)

  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.ready
      window.serviceWorkerRegistration = registration
      console.log("[SW] Service worker initialization complete")
    } catch (error) {
      console.error("[SW] Initialization failed:", error)
    }
  })

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      navigator.serviceWorker.ready.then((registration) => {
        registration.update()
      })
    }
  })

  window.checkForUpdates = async () => {
    try {
      const registration = await navigator.serviceWorker.ready
      await registration.update()
      console.log("[SW] Manual update check completed")
    } catch (error) {
      console.error("[SW] Manual update check failed:", error)
    }
  }

  window.unregisterServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.ready
      await registration.unregister()
      console.log("[SW] Service worker unregistered")
    } catch (error) {
      console.error("[SW] Failed to unregister:", error)
    }
  }
} else {
  console.warn("⚠️ Service Worker not supported in this browser")
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    checkForUpdates: window.checkForUpdates,
    unregisterServiceWorker: window.unregisterServiceWorker,
  }
}
`

  return new Response(swCode, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Service-Worker-Allowed": "/",
    },
  })
}
