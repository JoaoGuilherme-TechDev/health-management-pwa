"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Analytics } from "@vercel/analytics/next"


import { NotificationPermissionManager } from "@/components/NotificationPermissionManager"
import { useMedicationReminders } from "@/hooks/use-medication-reminders"

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const [isClient, setIsClient] = useState(false)

  // Initialize medication reminders
  useMedicationReminders()

  useEffect(() => {
    setIsClient(true)
  }, [])

  return (
    <body className="font-sans antialiased">
      {children}
      <Analytics />
      <NotificationPermissionManager />
    </body>
  )
}
