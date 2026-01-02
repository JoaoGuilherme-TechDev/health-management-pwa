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
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
          console.log('✅ Service Worker registered with scope:', registration.scope)
        })
        .catch(error => {
          console.error('❌ Service Worker registration failed:', error)
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
