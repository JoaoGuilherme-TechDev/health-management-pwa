if ("serviceWorker" in navigator) {
  const SW_CONFIG = {
    scope: "/",
    updateInterval: 1000 * 60 * 60,
    debug: true,
  }

  const registerServiceWorker = async () => {
    try {
      console.log("[SW] Starting service worker registration...")

      const registration = await navigator.serviceWorker.register("/service-worker.js", {
        scope: SW_CONFIG.scope,
        updateViaCache: "none",
      })

      console.log(`✅ Service Worker registered with scope: ${registration.scope}`)

      if (registration.installing) {
        console.log("[SW] Service worker installing...")
        registration.installing.addEventListener("statechange", (event) => {
          console.log(`[SW] State changed to: ${event.target.state}`)
        })
      } else if (registration.waiting) {
        console.log("[SW] Service worker waiting to activate")
      } else if (registration.active) {
        console.log("[SW] Service worker active and ready")
      }

      window.serviceWorkerRegistration = registration
    } catch (error) {
      console.error("❌ Failed to register Service Worker:", error)
      console.log("[SW] Service worker not available, using direct notifications")
    }
  }

  registerServiceWorker()
} else {
  console.warn("⚠️ Service Worker not supported in this browser")
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    checkForUpdates: window.checkForUpdates,
    unregisterServiceWorker: window.unregisterServiceWorker,
  }
}
