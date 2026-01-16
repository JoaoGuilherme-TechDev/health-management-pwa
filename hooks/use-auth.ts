"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export function useAuth() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    let isMounted = true

    const persistSession = (session: any) => {
      if (typeof window === "undefined" || !session?.user) return

      const payload = {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        user_id: session.user.id,
        expires_at: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : undefined,
      }

      window.localStorage.setItem("healthcare_session", JSON.stringify(payload))
    }

    const initAuth = async () => {
      try {
        if (typeof window !== "undefined") {
          const stored = window.localStorage.getItem("healthcare_session")
          if (stored) {
            try {
              const parsed = JSON.parse(stored)

              if (parsed?.refresh_token) {
                const { data, error } = await supabase.auth.setSession({
                  access_token: parsed.access_token,
                  refresh_token: parsed.refresh_token,
                })

                if (!isMounted) return

                if (!error && data.session?.user) {
                  setUser(data.session.user)
                  persistSession(data.session)
                  setLoading(false)
                  return
                }
              }
            } catch {
            }
          }
        }

        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!isMounted) return

        if (session?.user) {
          setUser(session.user)
          persistSession(session)
          setLoading(false)
          return
        }
      } catch {
      }

      if (!isMounted) return
      setLoading(false)
    }

    initAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return

      if (session?.user) {
        setUser(session.user)
        persistSession(session)
      } else if (event === "SIGNED_OUT") {
        setUser(null)
        if (typeof window !== "undefined") {
          window.localStorage.removeItem("healthcare_session")
        }
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  return { user, loading }
}
