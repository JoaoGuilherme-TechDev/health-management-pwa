"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Dumbbell, TrendingUp, Calendar, AlertCircle } from "lucide-react"
import { formatBrasiliaDate } from "@/lib/timezone"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ActivityRecord {
  id: string
  user_id: string
  activity_type: string
  duration_minutes: number
  intensity: "low" | "moderate" | "high"
  calories_burned?: number
  heart_rate_avg?: number
  notes?: string
  recorded_at: string
}

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  const loadActivities = async (id: string) => {
    try {
      setError(null)
      const supabase = createClient()

      const { data, error: fetchError } = await supabase
        .from("activity_records")
        .select("*")
        .eq("user_id", id)
        .order("recorded_at", { ascending: false })
        .limit(100)

      if (fetchError) {
        console.error("[v0] Error loading activities:", fetchError)
        setError(`Erro ao carregar atividades: ${fetchError.message}`)
        return
      }

      setActivities(data || [])
    } catch (err) {
      console.error("[v0] Unexpected error loading activities:", err)
      setError("Erro inesperado ao carregar atividades")
    }
  }

  useEffect(() => {
    const initialize = async () => {
      const supabase = createClient()
      const { data } = await supabase.auth.getUser()

      if (!data.user) {
        setError("Usuário não autenticado")
        setLoading(false)
        return
      }

      setUserId(data.user.id)
      await loadActivities(data.user.id)

      // Subscribe to real-time changes
      const channel = supabase
        .channel(`activity-${data.user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "activity_records",
            filter: `user_id=eq.${data.user.id}`,
          },
          () => {
            console.log("[v0] Activity records updated")
            loadActivities(data.user.id)
          },
        )
        .subscribe()

      setLoading(false)

      return () => {
        supabase.removeChannel(channel)
      }
    }

    const cleanup = initialize()
    return () => {
      cleanup?.then((fn) => fn?.())
    }
  }, [])

  const calculateStats = () => {
    const totalDuration = activities.reduce((sum, a) => sum + a.duration_minutes, 0)
    const totalCalories = activities.reduce((sum, a) => sum + (a.calories_burned || 0), 0)
    const avgHeartRate =
      activities.length > 0
        ? Math.round(
            activities.filter((a) => a.heart_rate_avg).reduce((sum, a) => sum + (a.heart_rate_avg || 0), 0) /
              activities.filter((a) => a.heart_rate_avg).length,
          )
        : 0

    return { totalDuration, totalCalories, avgHeartRate, activityCount: activities.length }
  }

  const getIntensityColor = (intensity: "low" | "moderate" | "high") => {
    switch (intensity) {
      case "low":
        return "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200"
      case "moderate":
        return "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-200"
      case "high":
        return "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200"
      default:
        return "bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-200"
    }
  }

  const getIntensityLabel = (intensity: "low" | "moderate" | "high") => {
    switch (intensity) {
      case "low":
        return "Baixa"
      case "moderate":
        return "Moderada"
      case "high":
        return "Alta"
      default:
        return intensity
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4" />
        <p className="text-muted-foreground">Carregando seus registros de atividade...</p>
      </div>
    )
  }

  const stats = calculateStats()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Rastreamento de Atividades</h1>
        <p className="text-muted-foreground mt-2">Monitore seus exercícios e atividades físicas</p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatCard title="Total de Atividades" value={stats.activityCount} icon={Dumbbell} />
        <StatCard title="Minutos de Exercício" value={stats.totalDuration} suffix=" min" icon={Calendar} color="blue" />
        <StatCard
          title="Calorias Queimadas"
          value={stats.totalCalories}
          suffix=" kcal"
          icon={TrendingUp}
          color="green"
        />
        <StatCard title="FC Média" value={stats.avgHeartRate} suffix=" bpm" icon={Dumbbell} color="red" />
      </div>

      {/* Activities List */}
      {activities.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <Dumbbell className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Nenhuma atividade registrada</h3>
            <p className="text-muted-foreground">Seus exercícios aparecerão aqui quando registrados</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <Card key={activity.id} className="hover:border-primary transition-colors">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-foreground">{activity.activity_type}</h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getIntensityColor(activity.intensity)}`}
                      >
                        {getIntensityLabel(activity.intensity)}
                      </span>
                    </div>

                    <p className="text-sm text-muted-foreground mb-3">
                      {formatBrasiliaDate(activity.recorded_at, "date")} às{" "}
                      {formatBrasiliaDate(activity.recorded_at, "time")}
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Duração</p>
                        <p className="font-semibold text-foreground">{activity.duration_minutes} min</p>
                      </div>

                      {activity.calories_burned && (
                        <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
                          <p className="text-xs text-orange-700 dark:text-orange-200 mb-1">Calorias</p>
                          <p className="font-semibold text-orange-900 dark:text-orange-100">
                            {activity.calories_burned} kcal
                          </p>
                        </div>
                      )}

                      {activity.heart_rate_avg && (
                        <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
                          <p className="text-xs text-red-700 dark:text-red-200 mb-1">FC Média</p>
                          <p className="font-semibold text-red-900 dark:text-red-100">{activity.heart_rate_avg} bpm</p>
                        </div>
                      )}
                    </div>

                    {activity.notes && (
                      <p className="text-sm text-muted-foreground italic mt-3">Notas: {activity.notes}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

interface StatCardProps {
  title: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  suffix?: string
  color?: "default" | "blue" | "green" | "red"
}

function StatCard({ title, value, icon: Icon, suffix = "", color = "default" }: StatCardProps) {
  const colorClasses = {
    default: "bg-primary/10 text-primary",
    blue: "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400",
    green: "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400",
    red: "bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400",
  }

  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs md:text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl md:text-3xl font-bold text-foreground mt-1">
              {value}
              <span className="text-sm text-muted-foreground ml-1">{suffix}</span>
            </p>
          </div>
          <div className={`p-2 md:p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon className="h-5 w-5 md:h-6 md:w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
