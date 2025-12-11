"use client"

import type React from "react"

import { useEffect, useState } from "react"

export function PushNotificationProvider({ children }: { children: React.ReactNode }) {
  const [hasPermission, setHasPermission] = useState(false)

  useEffect(() => {
    // Check if notifications are available and get permission status
    if ("Notification" in window) {
      setHasPermission(Notification.permission === "granted")

      // Listen for service worker messages (push notifications)
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.addEventListener("message", (event) => {
          if (event.data && event.data.type === "NOTIFICATION_RECEIVED") {
            // Handle notification received
            console.log("Notification received:", event.data)
          }
        })
      }
    }
  }, [])

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      alert("This browser does not support notifications")
      return
    }

    if (Notification.permission === "granted") {
      setHasPermission(true)
      return
    }

    const permission = await Notification.requestPermission()
    if (permission === "granted") {
      setHasPermission(true)

      // Subscribe to push notifications
      try {
        const registration = await navigator.serviceWorker?.ready
        if (registration) {
          console.log("Ready to receive push notifications")
        }
      } catch (error) {
        console.error("Failed to subscribe to notifications:", error)
      }
    }
  }

  return (
    <>
      {children}
      {/* Make notification request available globally */}
      <div
        style={{ display: "none" }}
        data-notification-handler={JSON.stringify({ hasPermission, requestNotificationPermission })}
      >
        {/* Hidden component to provide notification functionality */}
      </div>
    </>
  )
}

// Hook to use notification functionality
export function useNotifications() {
  const [hasPermission, setHasPermission] = useState(false)

  useEffect(() => {
    if ("Notification" in window) {
      setHasPermission(Notification.permission === "granted")
    }
  }, [])

  const requestPermission = async () => {
    if (!("Notification" in window)) {
      return false
    }

    if (Notification.permission === "granted") {
      setHasPermission(true)
      return true
    }

    const permission = await Notification.requestPermission()
    if (permission === "granted") {
      setHasPermission(true)
      return true
    }

    return false
  }

  const sendNotification = (title: string, options?: NotificationOptions) => {
    if (hasPermission && "Notification" in window) {
      new Notification(title, {
        icon: "/icon.svg",
        badge: "/icon-light-32x32.png",
        ...options,
      })
    }
  }

  return { hasPermission, requestPermission, sendNotification }
}
