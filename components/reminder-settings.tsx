"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

export function ReminderSettings({ userId }: { userId: string }) {
  const [settings, setSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    loadSettings()
  }, [userId])

  async function loadSettings() {
    try {
      const { data, error } = await supabase.from("notification_settings").select("*").eq("user_id", userId).single()

      if (error && error.code !== "PGRST116") throw error
      setSettings(data || {})
    } catch (error) {
      console.error("Error loading settings:", error)
    } finally {
      setLoading(false)
    }
  }

  async function updateSetting(field: string, value: any) {
    try {
      const { error } = await supabase.from("notification_settings").upsert({
        user_id: userId,
        [field]: value,
      })

      if (error) throw error
      setSettings((prev: any) => ({ ...prev, [field]: value }))
    } catch (error) {
      console.error("Error updating setting:", error)
    }
  }

  if (loading) return <div>Loading settings...</div>

  return (
    <div className="space-y-6">
      {/* Notification Type Toggles */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Types</CardTitle>
          <CardDescription>Choose which reminders you want to receive</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="medication">Medication Reminders</Label>
            <Switch
              id="medication"
              checked={settings.enable_medication_notifications ?? true}
              onCheckedChange={(val) => updateSetting("enable_medication_notifications", val)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="appointment">Appointment Reminders</Label>
            <Switch
              id="appointment"
              checked={settings.enable_appointment_notifications ?? true}
              onCheckedChange={(val) => updateSetting("enable_appointment_notifications", val)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="diet">Diet Plan Notifications</Label>
            <Switch
              id="diet"
              checked={settings.enable_diet_notifications ?? true}
              onCheckedChange={(val) => updateSetting("enable_diet_notifications", val)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="supplement">Supplement Notifications</Label>
            <Switch
              id="supplement"
              checked={settings.enable_supplement_notifications ?? true}
              onCheckedChange={(val) => updateSetting("enable_supplement_notifications", val)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="prescription">Prescription Notifications</Label>
            <Switch
              id="prescription"
              checked={settings.enable_prescription_notifications ?? true}
              onCheckedChange={(val) => updateSetting("enable_prescription_notifications", val)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="evolution">Evolution Notifications</Label>
            <Switch
              id="evolution"
              checked={settings.enable_evolution_notifications ?? true}
              onCheckedChange={(val) => updateSetting("enable_evolution_notifications", val)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>Customize how you receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="sound">Sound</Label>
            <Switch
              id="sound"
              checked={settings.notification_sound ?? true}
              onCheckedChange={(val) => updateSetting("notification_sound", val)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="vibration">Vibration</Label>
            <Switch
              id="vibration"
              checked={settings.notification_vibration ?? true}
              onCheckedChange={(val) => updateSetting("notification_vibration", val)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card>
        <CardHeader>
          <CardTitle>Quiet Hours</CardTitle>
          <CardDescription>Pause notifications during specific times</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="quiet-hours">Enable Quiet Hours</Label>
            <Switch
              id="quiet-hours"
              checked={settings.quiet_hours_enabled ?? false}
              onCheckedChange={(val) => updateSetting("quiet_hours_enabled", val)}
            />
          </div>

          {settings.quiet_hours_enabled && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-time">Start Time</Label>
                <Input
                  id="start-time"
                  type="time"
                  value={settings.quiet_hours_start?.slice(0, 5) || ""}
                  onChange={(e) => updateSetting("quiet_hours_start", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="end-time">End Time</Label>
                <Input
                  id="end-time"
                  type="time"
                  value={settings.quiet_hours_end?.slice(0, 5) || ""}
                  onChange={(e) => updateSetting("quiet_hours_end", e.target.value)}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
