// public/service-worker.js
self.addEventListener('push', function(event) {
  console.log('Service Worker: Push received')
  
  if (!event.data) {
    console.error('Push event but no data')
    return
  }

  let data
  try {
    data = event.data.json()
    console.log('Push data:', data)
  } catch (error) {
    console.error('Error parsing push data:', error)
    return
  }

  const options = {
    body: data.body || 'Nova notificação',
    icon: data.icon || '/icon-192x192.png',
    badge: data.badge || '/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/',
      type: data.type || 'general',
      timestamp: data.timestamp || Date.now()
    },
    actions: [
      {
        action: 'open',
        title: 'Abrir'
      },
      {
        action: 'close',
        title: 'Fechar'
      }
    ]
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options).then(() => {
      console.log('Notification shown successfully')
    }).catch(error => {
      console.error('Error showing notification:', error)
    })
  )
})

self.addEventListener('notificationclick', function(event) {
  console.log('Notification click received', event.notification.data)
  
  event.notification.close()

  if (event.action === 'open') {
    const urlToOpen = event.notification.data.url || '/'
    
    event.waitUntil(
      clients.matchAll({ 
        type: 'window',
        includeUncontrolled: true 
      }).then(function(windowClients) {
        // Check if there is already a window/tab open with the target URL
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i]
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus()
          }
        }
        // If not, then open the target URL in a new window/tab
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen)
        }
      })
    )
  } else if (event.action === 'close') {
    // Do nothing, notification is already closed
    console.log('Notification closed by user')
  } else {
    // Default click action
    const urlToOpen = event.notification.data.url || '/'
    event.waitUntil(clients.openWindow(urlToOpen))
  }
})

// Handle push subscription
self.addEventListener('pushsubscriptionchange', function(event) {
  console.log('Push subscription changed')
  event.waitUntil(
    self.registration.pushManager.getSubscription().then(function(subscription) {
      if (subscription) {
        // Send new subscription to server
        return fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscription)
        })
      }
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