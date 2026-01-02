// HealthCare+ Service Worker - Push Notification Handler
console.log('[Service Worker] Loading push notification handler...')

self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push event received:', event)
  
  if (!event.data) {
    console.log('[Service Worker] No data in push event')
    return
  }

  try {
    let notificationData
    try {
      notificationData = event.data.json()
      console.log('[Service Worker] Push data (parsed):', notificationData)
    } catch (e) {
      console.log('[Service Worker] Could not parse push data as JSON, using text:', e)
      notificationData = {
        title: 'HealthCare+',
        body: event.data.text() || 'Nova notificação',
        icon: '/icon-light-32x32.png'
      }
    }

    // Generate unique tag to prevent duplicates
    const uniqueTag = notificationData.tag || 
      `${notificationData.type || 'general'}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Prepare notification options
    const options = {
      body: notificationData.body || 'Nova notificação',
      icon: notificationData.icon || '/icon-light-32x32.png',
      badge: notificationData.badge || '/badge-72x72.png',
      tag: uniqueTag,
      data: notificationData.data || {},
      timestamp: notificationData.timestamp || Date.now(),
      requireInteraction: notificationData.requireInteraction || false,
      silent: notificationData.silent || false,
      vibrate: notificationData.vibrate || [200, 100, 200],
      actions: notificationData.actions || [],
      renotify: false
    }

    console.log('[Service Worker] Showing notification:', {
      title: notificationData.title || 'HealthCare+',
      tag: options.tag,
      data: options.data
    })

    // Show the notification
    event.waitUntil(
      self.registration.showNotification(
        notificationData.title || 'HealthCare+', 
        options
      ).then(() => {
        console.log('[Service Worker] Notification shown successfully')
      }).catch(error => {
        console.error('[Service Worker] Error showing notification:', error)
      })
    )

  } catch (error) {
    console.error('[Service Worker] Error in push event handler:', error)
  }
})

// Notification click handler
self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification clicked:', event.notification.tag)
  
  event.notification.close()

  const urlToOpen = event.notification.data?.url || '/notifications'

  event.waitUntil(
    self.clients.matchAll({ 
      type: 'window', 
      includeUncontrolled: true 
    }).then(function(windowClients) {
      // Check if there's already a window/tab open with the URL
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i]
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          console.log('[Service Worker] Focusing existing client')
          return client.focus()
        }
      }
      
      // If not, open a new window/tab
      if (self.clients.openWindow) {
        console.log('[Service Worker] Opening new window to:', urlToOpen)
        return self.clients.openWindow(urlToOpen)
      }
    })
  )
})