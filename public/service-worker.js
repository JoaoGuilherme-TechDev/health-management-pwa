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
    icon: data.icon || "/icon-light-32x32.png",
    badge: "/badge-72x72.png",
    tag: data.tag || "notification",
    data: data.data || {},
    actions: data.actions || [],
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  const urlToOpen = new URL("/", self.location.origin).href

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
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
