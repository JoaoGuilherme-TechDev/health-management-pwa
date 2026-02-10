"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Analytics } from "@vercel/analytics/next"
import { PWAInstallPrompt } from "@/components/pwa-install-prompt"
import { ThemeProvider } from "@/components/theme-provider"

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
        .register("/service-worker.js", {
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
  }, [])

  return (
    <body className="font-sans antialiased">
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}
        <PWAInstallPrompt />
        <Analytics />
      </ThemeProvider>
    </body>
  )
}
