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
    // Service worker is registered via /register-sw.js
  }, [])

  return (
    <body className="font-sans antialiased">
      {children}
      <Analytics />
      {isClient && <Script src="/register-sw.js" strategy="afterInteractive" />}
    </body>
  )
}
