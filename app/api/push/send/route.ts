"use client"

import { useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

export function RealTimeNotifications() {
  useEffect(() => {
    const setupRealTime = async () => {
      const supabase = createClient()
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      console.log("👤 Real-time notifications for user:", user.id)

      // Subscribe to new notifications for this user
      const channel = supabase
        .channel(`notifications-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          async (payload) => {
            console.log("📬 New notification received:", payload.new)
            
            // Show notification using service worker (like test button)
            await showNotification(payload.new)
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }

    setupRealTime()
  }, [])

  return null // This component doesn't render anything
}

// Function to show notification (same as test button)
async function showNotification(notification: any) {
  try {
    // Check if notifications are allowed
    if (Notification.permission !== "granted") return
    
    // Check if service worker is available
    if (!('serviceWorker' in navigator)) return
    
    const registration = await navigator.serviceWorker.ready
    
    // Show notification (EXACTLY like test button)
    await registration.showNotification(notification.title, {
      body: notification.message || notification.title,
      icon: "/icon-light-32x32.png",
      badge: "/badge-72x72.png",
      tag: `notification-${Date.now()}`,
      requireInteraction: true,
      data: {
        type: notification.notification_type || notification.type,
        url: notification.data?.url || "/notifications",
        notificationId: notification.id
      }
    })
    
    console.log("🔔 Real-time notification shown")
  } catch (error) {
    console.error("Error showing real-time notification:", error)
  }
}