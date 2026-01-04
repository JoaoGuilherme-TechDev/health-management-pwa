"use client"

// Utility function to convert base64 to Uint8Array
function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray as BufferSource
}

export async function registerServiceWorker() {
  if (typeof window === "undefined") return
  if (!("serviceWorker" in navigator)) return
  if (!("PushManager" in window)) return

  try {
    console.log("[v0] Registering service worker from /sw.js")
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
      updateViaCache: "none",
    })
    console.log("[v0] Service worker registered successfully")
    return registration
  } catch (error) {
    console.error("[v0] Failed to register service worker:", error)
    return null
  }
}

export async function subscribeToPushNotifications(userId: string) {
  if (typeof window === "undefined") return
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return

  try {
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!vapidPublicKey) {
      console.error("[v0] VAPID public key not found")
      return
    }

    // Request notification permission
    const permission = await Notification.requestPermission()
    if (permission !== "granted") {
      console.log("[v0] Notification permission denied")
      return
    }

    // Register service worker
    const registration = await navigator.serviceWorker.ready
    if (!registration) {
      console.error("[v0] Service worker not ready")
      return
    }

    // Subscribe to push notifications
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    })

    console.log("[v0] User subscribed to push notifications")

    // Send subscription to server
    const response = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        subscription: JSON.parse(JSON.stringify(subscription)),
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to save subscription")
    }

    return subscription
  } catch (error) {
    console.error("[v0] Error subscribing to push notifications:", error)
  }
}
