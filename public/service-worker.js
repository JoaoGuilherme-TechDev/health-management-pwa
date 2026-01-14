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
    tag: data.tag || "notification",
    icon: "/icon.svg",
    badge: "/icon.svg",
    vibrate: data.vibrate || [200, 100, 200],
    data: data,
    actions: data.actions || []
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  const { action, notification } = event
  const data = notification.data || {}

  if (action === "snooze") {
    event.waitUntil(
      fetch('/api/notifications/snooze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: data.related_id, 
          type: data.type,
          minutes: 15,
          userId: data.user_id 
        })
      })
    )
  } else if (action === "dismiss") {
    event.waitUntil(
      fetch('/api/notifications/dismiss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: data.id })
      })
    )
  } else {
    // Default click: open app
    event.waitUntil(
      self.clients.matchAll({ type: "window" }).then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            return client.focus()
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(data.url || "/")
        }
      })
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
