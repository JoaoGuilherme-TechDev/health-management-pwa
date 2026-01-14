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

      setupUpdateChecks(registration)
      setupMessageListener()

      setInterval(() => {
        registration.update()
      }, SW_CONFIG.updateInterval)

      return registration
    } catch (error) {
      console.error("❌ Failed to register Service Worker:", error)
      throw error
    }
  }

  const setupUpdateChecks = (registration) => {
    registration.addEventListener("updatefound", () => {
      const newWorker = registration.installing
      console.log("[SW] Update found, new worker installing...")

      newWorker.addEventListener("statechange", () => {
        console.log(`[SW] New worker state: ${newWorker.state}`)

        if (newWorker.state === "installed") {
          if (navigator.serviceWorker.controller) {
            console.log("🔄 New version available! Showing update prompt...")
            showUpdateNotification(registration)
          } else {
            console.log("✅ Content is cached for offline use.")
          }
        }
      })
    })

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      console.log("[SW] Controller changed")
    })
  }

  const setupMessageListener = () => {
    navigator.serviceWorker.addEventListener("message", (event) => {
      const { type, data } = event.data || {}

      switch (type) {
        case "NEW_NOTIFICATION":
          console.log("[SW] New notification:", data)
          window.dispatchEvent(new CustomEvent("new-notification", { detail: data }))
          break

        case "UPDATE_AVAILABLE":
          console.log("[SW] Update available:", data)
          break

        default:
          console.log("[SW] Message received:", event.data)
      }
    })

    navigator.serviceWorker.addEventListener("error", (event) => {
      console.error("[SW] Service worker error:", event.error || event.message)
    })
  }

  const urlBase64ToUint8Array = (base64String) => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
    const rawData = atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  const showUpdateNotification = (registration) => {
    if (window.confirm("Nova versão disponível! Deseja atualizar agora?")) {
      if (registration.waiting) {
        registration.waiting.postMessage({ type: "SKIP_WAITING" })
      }
    }
  }

  registerServiceWorker().catch(console.error)

  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.ready
      window.serviceWorkerRegistration = registration
      console.log("[SW] Service worker initialization complete")
    } catch (error) {
      console.error("[SW] Initialization failed:", error)
    }
  })

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      navigator.serviceWorker.ready.then((registration) => {
        registration.update()
      })
    }
  })

  window.checkForUpdates = async () => {
    try {
      const registration = await navigator.serviceWorker.ready
      await registration.update()
      console.log("[SW] Manual update check completed")
    } catch (error) {
      console.error("[SW] Manual update check failed:", error)
    }
  }

  window.unregisterServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.ready
      await registration.unregister()
      console.log("[SW] Service worker unregistered")
    } catch (error) {
      console.error("[SW] Failed to unregister:", error)
    }
  }
} else {
  console.warn("⚠️ Service Worker not supported in this browser")
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    checkForUpdates: window.checkForUpdates,
    unregisterServiceWorker: window.unregisterServiceWorker,
  }
}
