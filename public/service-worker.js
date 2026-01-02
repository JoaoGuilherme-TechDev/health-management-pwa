// Listen for push events
self.addEventListener('push', function(event) {
  if (!event.data) return

  try {
    const data = event.data.json()
    
    const options = {
      body: data.body || 'Nova notificação',
      icon: data.icon || '/icon-light-32x32.png',
      badge: data.badge || '/badge-72x72.png',
      tag: data.tag || 'default-tag',
      data: data.data || {},
      timestamp: data.timestamp || Date.now(),
      actions: data.actions || [],
      requireInteraction: data.requireInteraction || false,
      vibrate: data.vibrate || [200, 100, 200],
      silent: data.silent || false
    }

    event.waitUntil(
      self.registration.showNotification(data.title || 'HealthCare+', options)
    )
  } catch (error) {
    console.error('Error parsing push data:', error)
    
    // Fallback to default notification
    event.waitUntil(
      self.registration.showNotification('HealthCare+', {
        body: 'Você tem uma nova notificação',
        icon: '/icon-light-32x32.png',
        badge: '/badge-72x72.png',
        tag: 'fallback'
      })
    )
  }
})

// Handle notification clicks
self.addEventListener('notificationclick', function(event) {
  event.notification.close()

  const urlToOpen = event.notification.data?.url || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(windowClients) {
        // Check if there's already a window/tab open with the target URL
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i]
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus()
          }
        }
        // If not, open a new window/tab
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen)
        }
      })
  )
})

// Handle notification close
self.addEventListener('notificationclose', function(event) {
  // You can log analytics here if needed
  console.log('Notification closed:', event.notification.tag)
})

// Handle push subscription change
self.addEventListener('pushsubscriptionchange', function(event) {
  event.waitUntil(
    self.registration.pushManager.subscribe(event.oldSubscription.options)
      .then(function(subscription) {
        // Send the new subscription to your server
        return fetch('/api/push/update-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            oldEndpoint: event.oldSubscription.endpoint,
            newSubscription: subscription.toJSON()
          })
        })
      })
  )
})

// Service worker installation
self.addEventListener('install', function(event) {
  console.log('Service Worker installing')
  self.skipWaiting() // Activate immediately
})

self.addEventListener('activate', function(event) {
  console.log('Service Worker activating')
  event.waitUntil(clients.claim())
})