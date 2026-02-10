"use client"

class PushService {
  async subscribeToPushNotifications(userId?: string) {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.warn("[v0] Push notifications not supported")
      return
    }

    try {
      const registration = await navigator.serviceWorker.ready
      
      // Use the public key from env
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) return;

      const options = {
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidKey)
      }

      const subscription = await registration.pushManager.subscribe(options)

      if (userId && subscription) {
        await this.saveSubscription(userId, subscription)
      }

      return subscription
    } catch (error) {
      console.error("[v0] Failed to setup push notifications:", error)
    }
  }

  private async saveSubscription(userId: string, subscription: PushSubscription) {
    try {
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON())
      });
    } catch (error) {
      console.error("[v0] Failed to save push subscription:", error)
    }
  }

  private urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
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

  async playNotificationSound(volume = 1.0) {
    try {
      const audio = new Audio("/notification-sound.mp3")
      audio.volume = Math.max(0, Math.min(1, volume))
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
