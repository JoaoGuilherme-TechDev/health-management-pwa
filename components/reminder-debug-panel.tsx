"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function ReminderDebugPanel({ userId }: { userId: string }) {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [lastExecution, setLastExecution] = useState<any>(null)
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  async function loadStats() {
    setLoading(true)
    try {
      const { data: reminders } = await supabase.from("reminders").select("id").eq("user_id", userId)
      const { data: executions } = await supabase
        .from("reminder_executions")
        .select("*")
        .eq("status", "success")
        .gte("execution_time", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order("execution_time", { ascending: false })
        .limit(1)

      const { data: notifications } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

      setStats({
        totalReminders: reminders?.length || 0,
        recentNotifications: notifications?.length || 0,
        lastExecutionTime: executions?.[0]?.execution_time,
      })
      setLastExecution(executions?.[0])
    } catch (error) {
      console.error("Error loading stats:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
    const interval = setInterval(loadStats, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [userId])

  if (!stats) return null

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardHeader>
        <CardTitle className="text-sm">Reminder System Status</CardTitle>
        <CardDescription>Real-time monitoring</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription className="text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-semibold">{stats.totalReminders}</p>
                <p className="text-muted-foreground">Active Reminders</p>
              </div>
              <div>
                <p className="font-semibold">{stats.recentNotifications}</p>
                <p className="text-muted-foreground">Last 24h Notifications</p>
              </div>
            </div>
            {lastExecution && (
              <div className="mt-3 text-xs text-muted-foreground">
                Last cron execution: {new Date(lastExecution.execution_time).toLocaleString()}
              </div>
            )}
          </AlertDescription>
        </Alert>
        <Button onClick={loadStats} disabled={loading} variant="outline" size="sm" className="w-full bg-transparent">
          {loading ? "Refreshing..." : "Refresh Stats"}
        </Button>
      </CardContent>
    </Card>
  )
}
