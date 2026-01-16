const CACHE_NAME = 'healthcare-plus-v1';
const OFFLINE_URL = '/';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        OFFLINE_URL,
        '/manifest.json',
        '/icon.svg',
        '/apple-icon.png'
      ]);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Ignorar requisições que não sejam GET ou sejam para API/Next.js internals que não queremos cachear agressivamente
  if (event.request.method !== 'GET' || event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clonar a resposta para salvar no cache
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      })
      .catch(() => {
        // Se falhar (offline), tentar o cache
        return caches.match(event.request).then((response) => {
          if (response) {
            return response;
          }
          // Fallback para página offline se for navegação
          if (event.request.mode === 'navigate') {
            return caches.match(OFFLINE_URL);
          }
        });
      })
  );
});

// Service Worker
self.addEventListener("push", (event) => {
  if (!(self.Notification && self.Notification.permission === "granted")) {
    return
  }
  const data = event.data?.json() ?? {}
  const title = data.title || "HealthCare+"
  const message = data.message || "Nova notificação"
  
  const options = { 
    body: message, 
    tag: data.tag || data.id || "notification",
    icon: "/icon.svg",
    badge: "/icon.svg",
    vibrate: data.vibrate || [200, 100, 200],
    requireInteraction: data.requireInteraction ?? false,
    data: data,
    actions: data.actions || []
  }

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(title, options),
      (async () => {
        try {
          if (data && data.id) {
            await fetch("/api/notifications/event", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                events: [
                  {
                    notificationId: data.id,
                    eventType: "push_displayed",
                  },
                ],
              }),
            })
          }
        } catch (e) {
        }
      })(),
    ]),
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  const { action, notification } = event
  const data = notification.data || {}

  if (action === "dismiss") {
    event.waitUntil(
      fetch('/api/notifications/dismiss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: data.id })
      })
    )
  } else {
    event.waitUntil(
      Promise.all([
        self.clients.matchAll({ type: "window" }).then((clientList) => {
          for (const client of clientList) {
            if (client.url.includes(self.location.origin) && "focus" in client) {
              return client.focus()
            }
          }
          if (self.clients.openWindow) {
            return self.clients.openWindow(data.url || "/")
          }
        }),
        (async () => {
          try {
            if (data && data.id) {
              await fetch("/api/notifications/event", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  events: [
                    {
                      notificationId: data.id,
                      eventType: "push_clicked",
                    },
                  ],
                }),
              })
            }
          } catch (e) {
          }
        })(),
      ]),
    )
  }
})

self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    self.registration.pushManager.subscribe(event.oldSubscription.options).then((subscription) =>
      fetch("/api/push/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "update",
          subscription: subscription.toJSON(),
        }),
      }),
    ),
  )
})

self.addEventListener("message", (event) => {
  if (!event.data || event.data.type !== "SHOW_NOTIFICATION") return

  const { title, options } = event.data
  self.registration.showNotification(title, options)
})
