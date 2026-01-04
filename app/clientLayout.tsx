"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Analytics } from "@vercel/analytics/next"
import { PushNotificationManager } from "@/components/push-notification-manager"

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  return (
    <body className="font-sans antialiased">
      {children}
      <Analytics />
      {isClient && <PushNotificationManager />}
    </body>
  )
}
