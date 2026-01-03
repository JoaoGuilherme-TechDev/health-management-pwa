export async function showSimpleNotification(title: string, options: NotificationOptions = {}) {
  try {
    // Try service worker first
    if ("serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready
        await registration.showNotification(title, {
          badge: "/badge-72x72.png",
          icon: "/icon-light-32x32.png",
          ...options,
        })
        return
      } catch (swError) {
        console.log("[Notification] Service worker not available, using direct notification")
      }
    }

    // Fallback: Use Notification API directly
    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification(title, {
          badge: "/badge-72x72.png",
          icon: "/icon-light-32x32.png",
          ...options,
        })
      }
    }
  } catch (error) {
    console.error("Error showing notification:", error)
  }
}
