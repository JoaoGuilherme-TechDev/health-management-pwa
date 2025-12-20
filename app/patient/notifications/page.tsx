"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useNotifications } from "@/hooks/use-notifications"
import { NotificationsCenter } from "@/components/notifications-center"


export default function NotificationsPage() {
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const { notifications, loading: notificationsLoading, markAsRead, deleteNotification } = useNotifications(userId)

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUserId(user?.id || null)
      setLoading(false)
    }
    getUser()
  }, [supabase.auth])



  return (
    <div>
      <NotificationsCenter notifications={notifications} onMarkAsRead={markAsRead} onDelete={deleteNotification} loading={notificationsLoading} />
    </div>
  )
}