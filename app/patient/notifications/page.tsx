"use client"

import { NotificationCenter } from "@/components/notification-center"

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Notificações</h1>
        <p className="text-muted-foreground mt-2">Visualize e gerencie todas as suas notificações em um único lugar</p>
      </div>

      <div className="min-h-96 p-4 bg-muted/30 rounded-lg border border-border">
        <NotificationCenter />
      </div>
    </div>
  )
}
