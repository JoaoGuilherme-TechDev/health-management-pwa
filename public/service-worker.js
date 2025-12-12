const CACHE_NAME = "healthcare-v1"
const urlsToCache = [
  "/",
  "/offline",
  "/patient",
  "/patient/medications",
  "/patient/appointments",
  "/patient/notifications",
]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache).catch((error) => {
        console.log("Erro ao adicionar ao cache:", error)
      })
    }),
  )
  self.skipWaiting()
})

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

self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  if (request.method !== "GET") {
    return
  }

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
        return new Response("Offline - Recurso não disponível", {
          status: 503,
          statusText: "Serviço Indisponível",
        })
      }),
  )
})

self.addEventListener("push", (event) => {
  console.log("[Service Worker] Notificação push recebida")

  const data = event.data ? event.data.json() : {}
  const title = data.title || "HealthCare+"

  const isMedicationReminder = data.type === "medication_reminder"

  const options = {
    body: data.message || "Você tem uma nova notificação",
    icon: "/icon.svg",
    badge: "/icon-light-32x32.png",
    tag: isMedicationReminder ? `medication-${Date.now()}` : data.type || "notification",
    requireInteraction: isMedicationReminder ? true : data.requireInteraction || false, // Notificação persistente para medicamentos
    vibrate: isMedicationReminder ? [500, 200, 500, 200, 500] : [200, 100, 200], // Vibração mais intensa para medicamentos
    silent: false, // Garantir que o som toque
    renotify: true, // Permitir re-notificar mesmo com a mesma tag
    actions: [
      {
        action: "open",
        title: "Visualizar",
      },
      {
        action: "close",
        title: "Dispensar",
      },
    ],
    data: {
      url: data.url || "/patient",
      type: data.type,
      timestamp: Date.now(),
    },
  }

  event.waitUntil(
    self.registration
      .showNotification(title, options)
      .then(() => {
        console.log("[Service Worker] Notificação exibida com sucesso")

        if (isMedicationReminder) {
          // Tentar reproduzir som via clients
          self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
            clientList.forEach((client) => {
              client.postMessage({
                type: "PLAY_ALARM",
                medication: data.message,
              })
            })
          })
        }
      })
      .catch((error) => {
        console.error("[Service Worker] Erro ao exibir notificação:", error)
      }),
  )
})

self.addEventListener("notificationclick", (event) => {
  console.log("[Service Worker] Notificação clicada")
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

self.addEventListener("notificationclose", (event) => {
  console.log("Notificação fechada:", event.notification.tag)
})

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
        console.error("Falha ao sincronizar medicamento:", error)
      }
    }
  } catch (error) {
    console.error("Sincronização falhou:", error)
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
