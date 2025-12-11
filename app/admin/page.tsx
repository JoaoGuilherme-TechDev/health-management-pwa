"use client"

import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Activity, AlertCircle, TrendingUp } from "lucide-react"

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalMedications: 0,
    recentMetrics: 0,
    pendingAlerts: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      const supabase = createClient()

      // Get patient count
      const { count: patientCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact" })
        .eq("role", "patient")

      // Get medication count
      const { count: medCount } = await supabase
        .from("medications")
        .select("*", { count: "exact" })
        .eq("is_active", true)

      // Get recent metrics
      const { count: metricCount } = await supabase
        .from("health_metrics")
        .select("*", { count: "exact" })
        .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

      setStats({
        totalPatients: patientCount || 0,
        totalMedications: medCount || 0,
        recentMetrics: metricCount || 0,
        pendingAlerts: 0,
      })

      setLoading(false)
    }

    loadStats()
  }, [])

  if (loading) {
    return <div className="text-center py-12">Loading dashboard...</div>
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">Monitor system activity and manage healthcare operations</p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Patients" value={stats.totalPatients} icon={Users} />
        <StatCard title="Active Medications" value={stats.totalMedications} icon={Activity} />
        <StatCard title="Metrics (7 days)" value={stats.recentMetrics} icon={TrendingUp} />
        <StatCard title="Health Alerts" value={stats.pendingAlerts} icon={AlertCircle} />
      </div>

      {/* System Overview */}
      <Card>
        <CardHeader>
          <CardTitle>System Overview</CardTitle>
          <CardDescription>Key metrics and system status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">Recent Activity</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                  <span className="text-sm text-muted-foreground">Last 24 hours</span>
                  <span className="font-semibold text-foreground">Active</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                  <span className="text-sm text-muted-foreground">Data sync status</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">Synced</span>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">Quick Stats</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                  <span className="text-sm text-muted-foreground">Avg. metrics per patient</span>
                  <span className="font-semibold text-foreground">
                    {stats.totalPatients > 0 ? (stats.recentMetrics / stats.totalPatients).toFixed(1) : 0}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                  <span className="text-sm text-muted-foreground">Medications per patient</span>
                  <span className="font-semibold text-foreground">
                    {stats.totalPatients > 0 ? (stats.totalMedications / stats.totalPatients).toFixed(1) : 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Patients */}
      <Card>
        <CardHeader>
          <CardTitle>Management Actions</CardTitle>
          <CardDescription>Quick access to common admin functions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4">
            <a
              href="/admin/patients"
              className="p-4 rounded-lg border border-border hover:border-primary transition-colors cursor-pointer"
            >
              <Users className="h-6 w-6 text-primary mb-2" />
              <h3 className="font-semibold text-foreground mb-1">Manage Patients</h3>
              <p className="text-sm text-muted-foreground">View and manage all patient accounts</p>
            </a>
            <a
              href="/admin/health-metrics"
              className="p-4 rounded-lg border border-border hover:border-primary transition-colors cursor-pointer"
            >
              <TrendingUp className="h-6 w-6 text-primary mb-2" />
              <h3 className="font-semibold text-foreground mb-1">Health Metrics</h3>
              <p className="text-sm text-muted-foreground">Review patient health data trends</p>
            </a>
            <a
              href="/admin/alerts"
              className="p-4 rounded-lg border border-border hover:border-primary transition-colors cursor-pointer"
            >
              <AlertCircle className="h-6 w-6 text-primary mb-2" />
              <h3 className="font-semibold text-foreground mb-1">Health Alerts</h3>
              <p className="text-sm text-muted-foreground">Monitor patient health alerts</p>
            </a>
            <a
              href="/admin/settings"
              className="p-4 rounded-lg border border-border hover:border-primary transition-colors cursor-pointer"
            >
              <Users className="h-6 w-6 text-primary mb-2" />
              <h3 className="font-semibold text-foreground mb-1">System Settings</h3>
              <p className="text-sm text-muted-foreground">Configure admin preferences</p>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ title, value, icon: Icon }: any) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground mt-2">{value}</p>
          </div>
          <div className="p-3 rounded-lg bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
