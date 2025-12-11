"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"

export default function AlertsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Health Alerts</h1>
        <p className="text-muted-foreground mt-1">Monitor critical patient health alerts</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Alerts</CardTitle>
          <CardDescription>Critical and warning-level alerts</CardDescription>
        </CardHeader>
        <CardContent className="pt-12 pb-12 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No active alerts</h3>
          <p className="text-muted-foreground">All patients are within normal health parameters</p>
        </CardContent>
      </Card>
    </div>
  )
}
