"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function ReminderManagement({ userId }: { userId: string }) {
  const [reminders, setReminders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    loadReminders()
  }, [userId])

  async function loadReminders() {
    try {
      const { data, error } = await supabase
        .from("reminders")
        .select("*, reminder_schedules(*)")
        .eq("user_id", userId)
        .eq("is_active", true)

      if (error) throw error
      setReminders(data || [])
    } catch (error) {
      console.error("Error loading reminders:", error)
    } finally {
      setLoading(false)
    }
  }

  async function toggleReminder(reminderId: string, isActive: boolean) {
    try {
      const { error } = await supabase.from("reminders").update({ is_active: !isActive }).eq("id", reminderId)

      if (error) throw error
      loadReminders()
    } catch (error) {
      console.error("Error toggling reminder:", error)
    }
  }

  if (loading) return <div>Loading reminders...</div>

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Reminders</CardTitle>
        <CardDescription>Manage your scheduled reminders</CardDescription>
      </CardHeader>
      <CardContent>
        {reminders.length === 0 ? (
          <p className="text-muted-foreground">No reminders configured yet</p>
        ) : (
          <div className="space-y-4">
            {reminders.map((reminder) => (
              <div key={reminder.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h3 className="font-medium">{reminder.title}</h3>
                  <p className="text-sm text-muted-foreground">{reminder.message}</p>
                  <div className="mt-2 flex gap-2">
                    <Badge variant="secondary">{reminder.reminder_type}</Badge>
                    {reminder.reminder_schedules?.scheduled_time && (
                      <Badge variant="outline">{reminder.reminder_schedules.scheduled_time}</Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant={reminder.is_active ? "default" : "outline"}
                  onClick={() => toggleReminder(reminder.id, reminder.is_active)}
                >
                  {reminder.is_active ? "Active" : "Inactive"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
