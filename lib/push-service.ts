"use client"

class PushService {
  async subscribeToPushNotifications() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.warn("[v0] Push notifications not supported")
      return
    }

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (!subscription) {
        console.log("[v0] No push subscription found, creating new one")
      }

      return subscription
    } catch (error) {
      console.error("[v0] Failed to setup push notifications:", error)
    }
  }

  async sendNotification(title: string, options: NotificationOptions = {}) {
    if ("Notification" in window && Notification.permission === "granted") {
      const registration = await navigator.serviceWorker.ready
      await registration.showNotification(title, {
        badge: "/icon.svg",
        icon: "/icon.svg",
        ...options,
      })
    }
  }

  async playNotificationSound() {
    try {
      const audio = new Audio("/notification-sound.mp3")
      await audio.play()
    } catch (error) {
      console.log("[v0] Could not play notification sound:", error)
    }
  }

  async vibrateDevice(pattern: number | number[] = [200, 100, 200]) {
    if ("vibrate" in navigator) {
      navigator.vibrate(pattern)
    }
  }
}

export const pushService = new PushService()
