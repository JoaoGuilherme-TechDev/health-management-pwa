"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export function useAuth() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    const initAuth = async () => {
      const { data } = await supabase.auth.getUser()
      if (data.user) {
        setUser(data.user)
        setLoading(false)
        return
      }

      try {
        if (typeof window !== "undefined") {
          const stored = window.localStorage.getItem("healthcare_session")
          if (stored) {
            const parsed = JSON.parse(stored)

            if (!parsed?.refresh_token) {
              setLoading(false)
              return
            }

            if (parsed.expires_at) {
              const expiresAt = new Date(parsed.expires_at).getTime()
              if (Number.isFinite(expiresAt) && expiresAt < Date.now()) {
                setLoading(false)
                return
              }
            }

            const { data: sessionData } = await supabase.auth.setSession({
              access_token: parsed.access_token,
              refresh_token: parsed.refresh_token,
            })

            if (sessionData.user) {
              setUser(sessionData.user)
              setLoading(false)
              return
            }
          }
        }
      } catch {
      }

      const { data: finalData } = await supabase.auth.getUser()
      if (finalData.user) {
        setUser(finalData.user)
      }
      setLoading(false)
    }

    initAuth()
  }, [])

  return { user, loading }
}
