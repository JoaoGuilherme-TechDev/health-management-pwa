// app/clientLayout.tsx
"use client"

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
    
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/service-worker.js")
          .then((registration) => {
            console.log("Service Worker registrado com escopo:", registration.scope)
          })
          .catch((error) => {
            console.error("Falha ao registrar Service Worker:", error)
          })
      })
    }
  }, [])

  return (
    <body className="font-sans antialiased">
      {children}
      <Analytics />
      {isClient && (
        <Script src="/register-sw.js" strategy="afterInteractive" />
      )}
    </body>
  )
}