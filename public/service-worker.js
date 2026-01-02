// Enhanced service worker with deduplication
const NOTIFICATION_TAG_PREFIX = 'notification-'

self.addEventListener('push', async function(event) {
  console.log('[Service Worker] Push Received')
  
  try {
    let data = {}
    
    if (event.data) {
      try {
        data = event.data.json()
        console.log('[Service Worker] Push data:', data)
      } catch (e) {
        console.log('[Service Worker] Push data is not JSON, using text')
        data = {
          title: 'HealthCare+',
          body: event.data.text() || 'Nova notificação',
          icon: '/icon-light-32x32.png'
        }
      }
    }

    // Check if we already have a notification with this tag
    const notifications = await self.registration.getNotifications({
      tag: data.tag || 'default'
    })
    
    // If duplicate found, update it instead of creating new
    if (notifications.length > 0) {
      console.log('[Service Worker] Duplicate notification found, updating')
      notifications[0].close()
    }

    const options = {
      body: data.body || 'Nova notificação',
      icon: data.icon || '/icon-light-32x32.png',
      badge: data.badge || '/badge-72x72.png',
      tag: data.tag || `notification-${Date.now()}`,
      data: data.data || {},
      timestamp: data.timestamp ? new Date(data.timestamp).getTime() : Date.now(),
      requireInteraction: data.requireInteraction || false,
      silent: data.silent || false,
      vibrate: data.vibrate || [200, 100, 200],
      actions: data.actions || []
    }

    console.log('[Service Worker] Showing notification with tag:', options.tag)
    
    event.waitUntil(
      self.registration.showNotification(
        data.title || 'HealthCare+', 
        options
      )
    )

    // Send analytics or update badge
    if (self.clients && self.clients.matchAll) {
      const allClients = await self.clients.matchAll()
      allClients.forEach(client => {
        client.postMessage({
          type: 'NOTIFICATION_RECEIVED',
          data: data
        })
      })
    }

  } catch (error) {
    console.error('[Service Worker] Error handling push:', error)
    
    // Fallback notification
    event.waitUntil(
      self.registration.showNotification('HealthCare+', {
        body: 'Você tem uma nova notificação',
        icon: '/icon-light-32x32.png',
        tag: `fallback-${Date.now()}`,
        requireInteraction: true
      })
    )
  }
})

// Handle notification click
self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification clicked:', event.notification.tag)
  
  event.notification.close()

  const urlToOpen = event.notification.data?.url || '/notifications'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(windowClients) {
        // Check if there's already a window/tab open
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i]
          if (client.url.includes(urlToOpen) && 'focus' in client) {
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