// HealthCare+ Service Worker
// Version: 1.0.0 - Keep it simple, working version
console.log('[Service Worker] Loading service worker...')

// Install event
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing...')
  self.skipWaiting()
})

// Activate event
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating...')
  event.waitUntil(clients.claim())
})

// Push event handler - SIMPLE VERSION
self.addEventListener('push', event => {
  console.log('[Service Worker] Push event received')
  
  if (!event.data) {
    console.log('[Service Worker] No data in push event')
    return
  }

  let data
  try {
    data = event.data.json()
    console.log('[Service Worker] Push data:', data)
  } catch (error) {
    console.log('[Service Worker] Error parsing push data:', error)
    // Fallback
    data = {
      title: 'HealthCare+',
      body: event.data.text() || 'Nova notificação',
      icon: '/icon-light-32x32.png'
    }
  }

  const options = {
    body: data.body || 'Nova notificação',
    icon: data.icon || '/icon-light-32x32.png',
    badge: data.badge || '/icon-light-32x32.png',
    tag: data.tag || 'healthcare-notification',
    data: {
      ...data.data,
      url: data.url || '/patient/notifications'
    },
    requireInteraction: true,
    vibrate: [100, 50, 100],
    timestamp: Date.now(),
    actions: [
      { action: 'open', title: 'Ver Detalhes' },
      { action: 'close', title: 'Fechar' }
    ]
  }

  console.log('[Service Worker] Showing notification:', data.title || 'HealthCare+')
  
  event.waitUntil(
    self.registration.showNotification(
      data.title || 'HealthCare+', 
      options
    )
  )
})

// Notification click handler
self.addEventListener('notificationclick', event => {
  console.log('[Service Worker] Notification clicked')
  
  event.notification.close()

  if (event.action === 'close') {
    return
  }

  const urlToOpen = event.notification.data?.url || '/patient/notifications'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(windowClients => {
        // Check if there's already a window/tab open
        for (const client of windowClients) {
          const clientUrl = new URL(client.url).pathname
          if (clientUrl === urlToOpen && 'focus' in client) {
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