// Register service worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then((registration) => {
        console.log("Service Worker registered:", registration)
      })
      .catch((error) => {
        console.log("Service Worker registration failed:", error)
      })
  })

  // Check for updates periodically
  setInterval(() => {
    navigator.serviceWorker.getRegistration().then((registration) => {
      if (registration) {
        registration.update()
      }
    })
  }, 60000) // Check every minute
}

// Request notification permission
if ("Notification" in window && Notification.permission === "default") {
  // Don't auto-request, but make it easy to enable
  console.log("Notifications available but not yet enabled")
}
