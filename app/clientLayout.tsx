"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Analytics } from "@vercel/analytics/next"
import { NotificationPermissionManager } from "@/components/NotificationPermissionManager"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const [isClient, setIsClient] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()



  useEffect(() => {
    const checkSession = async () => {
      try {
        const supabase = createClient()
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session) {
          console.log("[v0] Sessão persistente encontrada para usuário:", session.user.id)
          // User is logged in, no need to redirect to login
        }
      } catch (error) {
        console.error("[v0] Erro ao verificar sessão:", error)
      } finally {
        setIsLoading(false)
        setIsClient(true)
      }
    }

    checkSession()
  }, [])

  if (isLoading) {
    return null // Don't render anything while checking session
  }

  return (
    <body className="font-sans antialiased">
      {children}
      <Analytics />
      <NotificationPermissionManager />
    </body>
  )
}
