"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Analytics } from "@vercel/analytics/next"
import Script from "next/script"

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
        .register("/api/service-worker", {
          scope: "/",
        })
        .then((registration) => {
          console.log("[v0] Service Worker registered with scope:", registration.scope)
        })
        .catch((error) => {
          console.error("[v0] Failed to register Service Worker:", error)
        })
    }
  }, [])

  return (
    <body className="font-sans antialiased">
      {children}
      <Analytics />
      {isClient && <Script src="/register-sw.js" strategy="afterInteractive" />}
    </body>
  )
}
