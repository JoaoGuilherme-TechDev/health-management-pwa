"use client"

import { useEffect, useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import type { RealtimeChannel } from "@supabase/supabase-js"

export function useRealtime<T>(table: string, userId: string | undefined, initialData: T[] = []) {
  const [data, setData] = useState<T[]>(initialData)
  const [loading, setLoading] = useState(true)
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    const supabase = createClient()

    const fetchData = async () => {
      try {
        setLoading(true)
        const { data: fetchedData, error } = await supabase
          .from(table)
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })

        if (error) throw error
        setData(fetchedData || [])
      } catch (error) {
        console.error(`[v0] Error fetching ${table}:`, error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Subscribe to real-time changes
    const channel = supabase
      .channel(`${table}-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: table,
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log(`[v0] ${table} change detected:`, payload.eventType)
          fetchData()
        },
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [table, userId])

  return { data, loading }
}
