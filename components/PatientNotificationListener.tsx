// components/PatientNotificationListener.tsx
"use client"

import { useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

export function PatientNotificationListener() {
  useEffect(() => {
    const supabase = createClient()
    
    // Check if we're the patient
    const checkAndListen = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      // Subscribe to new notifications for this user
      const channel = supabase
        .channel(`patient-notifications-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          async (payload) => {
            console.log("📬 Patient received new notification:", payload.new)
            
            // Show notification
            await showNotification(payload.new)
          }
        )
        .subscribe()
      
      return () => {
        supabase.removeChannel(channel)
      }
    }
    
    checkAndListen()
  }, [])
  
  return null
}

async function showNotification(notification: any) {
  try {
    if (Notification.permission !== "granted") return
    if (!('serviceWorker' in navigator)) return
    
    const registration = await navigator.serviceWorker.ready
    
    await registration.showNotification(notification.title, {
      body: notification.message || notification.title,
      icon: "/icon-light-32x32.png",
      badge: "/badge-72x72.png",
      tag: `patient-realtime-${Date.now()}`,
      requireInteraction: true,
      data: {
        type: notification.notification_type || notification.type,
        url: notification.data?.url || "patient/notifications",
        notificationId: notification.id
      }
    })
  } catch (error) {
    console.error("Error showing patient notification:", error)
  }
}
