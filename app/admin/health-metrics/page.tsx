"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp } from "lucide-react"

export default function HealthMetricsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Health Metrics</h1>
        <p className="text-muted-foreground mt-1">Monitor and analyze patient health data</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Metrics Overview</CardTitle>
          <CardDescription>System-wide health metrics analysis</CardDescription>
        </CardHeader>
        <CardContent className="pt-12 pb-12 text-center">
          <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Analytics Coming Soon</h3>
          <p className="text-muted-foreground">Advanced metrics and analytics will be available here</p>
        </CardContent>
      </Card>
    </div>
  )
}
