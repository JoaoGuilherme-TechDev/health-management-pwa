"use client"

import type React from "react"
import { startMedicationReminderCheck, stopMedicationReminderCheck } from "@/lib/medication-reminder-client"
import { useEffect, useState } from "react"
import { Analytics } from "@vercel/analytics/next"

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/api/sw", {
          scope: "/",
        })
        .then((registration) => {
          console.log("[v0] Service Worker registered successfully")
        })
        .catch((error) => {
          console.error("[v0] Failed to register Service Worker:", error)
        })
    }

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }

    startMedicationReminderCheck()

    return () => {
      stopMedicationReminderCheck()
    }
  }, [])

  return (
    <body className="font-sans antialiased">
      {children}
      <Analytics />
    </body>
  )
}
