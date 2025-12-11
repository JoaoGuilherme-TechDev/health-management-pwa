"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Admin Settings</h1>
        <p className="text-muted-foreground mt-1">Configure system preferences and features</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Configure system notification settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="alert-notifications" className="font-normal">
              <span className="font-semibold text-foreground">Health Alert Notifications</span>
              <p className="text-sm text-muted-foreground mt-1">Receive notifications for critical patient alerts</p>
            </Label>
            <Switch id="alert-notifications" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="daily-report" className="font-normal">
              <span className="font-semibold text-foreground">Daily System Report</span>
              <p className="text-sm text-muted-foreground mt-1">Get daily summaries of system activity</p>
            </Label>
            <Switch id="daily-report" defaultChecked />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
          <CardDescription>Current system configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border border-border bg-muted/30">
              <p className="text-sm text-muted-foreground mb-1">System Version</p>
              <p className="font-medium text-foreground">1.0.0</p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-muted/30">
              <p className="text-sm text-muted-foreground mb-1">Last Updated</p>
              <p className="font-medium text-foreground">{new Date().toLocaleDateString()}</p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-muted/30">
              <p className="text-sm text-muted-foreground mb-1">Database Status</p>
              <p className="font-medium text-green-600 dark:text-green-400">Connected</p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-muted/30">
              <p className="text-sm text-muted-foreground mb-1">API Status</p>
              <p className="font-medium text-green-600 dark:text-green-400">Operational</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button variant="outline">Save Settings</Button>
    </div>
  )
}
