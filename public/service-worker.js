const CACHE_NAME = "healthcare-v1"
const urlsToCache = ["/", "/offline.html"]

// Install event - cache files
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting()),
  )
})

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName)
            }
          }),
        )
      })
      .then(() => self.clients.claim()),
  )
})

// Fetch event - serve from cache, fallback to network
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return
  }

  event.respondWith(
    caches
      .match(event.request)
      .then((response) => response || fetch(event.request))
      .catch(() => caches.match("/offline.html")),
  )
})

// PUSH NOTIFICATIONS HANDLERS
self.addEventListener("push", (event) => {
  console.log("Push event received:", event)

  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch (err) {
    console.error("Failed to parse push data:", err)
    data = {
      title: "HealthCare+",
      body: "Nova notificação",
      icon: "/icon-light-32x32.png",
    }
  }

  const options = {
    body: data.body || "Nova atualização disponível",
    icon: data.icon || "/icon-light-32x32.png",
    badge: "/badge-72x72.png",
    vibrate: [200, 100, 200],
    data: {
      url: data.url || "/",
      id: data.id || Date.now().toString(),
      type: data.type || "general",
    },
    tag: data.tag || "healthcare-notification",
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || [],
  }

  event.waitUntil(self.registration.showNotification(data.title || "HealthCare+", options))
})

self.addEventListener("notificationclick", (event) => {
  console.log("Notification clicked:", event.notification)

  event.notification.close()

  const urlToOpen = event.notification.data?.url || "/"

  event.waitUntil(
    clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url === urlToOpen && "focus" in client) {
            return client.focus()
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen)
        }
      }),
  )
})

self.addEventListener("pushsubscriptionchange", (event) => {
  console.log("Push subscription changed:", event)
  event.waitUntil(
    self.registration.pushManager
      .subscribe(event.oldSubscription.options)
      .then((subscription) => {
        console.log("Resubscribed after change:", subscription)
        // Enviar nova subscription para o servidor
        return fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(subscription),
        })
      }),
  )
})