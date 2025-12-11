const CACHE_NAME = "healthcare-v1"
const urlsToCache = [
  "/",
  "/offline",
  "/patient",
  "/patient/medications",
  "/patient/health-metrics",
  "/patient/appointments",
  "/patient/notifications",
]

// Install service worker
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache).catch((error) => {
        console.log("Cache addAll error:", error)
      })
    }),
  )
  self.skipWaiting()
})

// Activate service worker
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        }),
      )
    }),
  )
  self.clients.claim()
})

// Fetch event - Network first strategy for API calls, Cache first for assets
self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== "GET") {
    return
  }

  // API calls - network first
  if (url.pathname.startsWith("/api")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clonedResponse = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clonedResponse)
          })
          return response
        })
        .catch(() => {
          return caches.match(request)
        }),
    )
    return
  }

  // Static assets - cache first
  event.respondWith(
    caches
      .match(request)
      .then((response) => {
        if (response) {
          return response
        }

        return fetch(request).then((response) => {
          if (!response || response.status !== 200) {
            return response
          }

          const clonedResponse = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clonedResponse)
          })

          return response
        })
      })
      .catch(() => {
        return new Response("Offline - Resource not available", {
          status: 503,
          statusText: "Service Unavailable",
        })
      }),
  )
})

// Handle push notifications
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {}
  const title = data.title || "HealthCare+"
  const options = {
    body: data.message || "You have a new notification",
    icon: "/icon.svg",
    badge: "/icon-light-32x32.png",
    tag: data.type || "notification",
    requireInteraction: data.requireInteraction || false,
    actions: [
      {
        action: "open",
        title: "View",
      },
      {
        action: "close",
        title: "Dismiss",
      },
    ],
    data: {
      url: data.url || "/patient",
      type: data.type,
    },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  if (event.action === "close") {
    return
  }

  const urlToOpen = event.notification.data.url || "/patient"

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
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

// Handle notification close
self.addEventListener("notificationclose", (event) => {
  console.log("Notification closed:", event.notification.tag)
})

// Background sync for offline medication logging
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-medications") {
    event.waitUntil(syncMedications())
  }
})

async function syncMedications() {
  try {
    const db = await openIndexedDB()
    const pendingMeds = await getPendingMedications(db)

    for (const med of pendingMeds) {
      try {
        await fetch("/api/medications/log", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(med),
        })
        await removePendingMedication(db, med.id)
      } catch (error) {
        console.error("Failed to sync medication:", error)
      }
    }
  } catch (error) {
    console.error("Sync failed:", error)
  }
}

function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("HealthCareDB", 1)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

function getPendingMedications(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("pending_medications", "readonly")
    const store = tx.objectStore("pending_medications")
    const request = store.getAll()
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

function removePendingMedication(db, id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("pending_medications", "readwrite")
    const store = tx.objectStore("pending_medications")
    const request = store.delete(id)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}
