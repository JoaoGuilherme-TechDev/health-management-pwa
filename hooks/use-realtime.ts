"use client"

import { useEffect, useState } from "react"

export function useRealtime<T>(table: string, userId: string | undefined, initialData: T[] = []) {
  const [data, setData] = useState<T[]>(initialData)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    const fetchData = async () => {
      try {
        setLoading(true)
        // Use our new generic data endpoint
        const res = await fetch(`/api/data?table=${table}`);
        if (!res.ok) throw new Error(res.statusText);
        
        const fetchedData = await res.json();
        setData(fetchedData || [])
      } catch (error) {
        console.error(`Error fetching ${table}:`, error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Polling fallback since we removed Realtime
    const interval = setInterval(fetchData, 15000); // Poll every 15s

    return () => clearInterval(interval);
  }, [table, userId])

  return { data, loading }
}
