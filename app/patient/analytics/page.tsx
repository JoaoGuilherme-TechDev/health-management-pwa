"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { TrendingUp, Heart, Flame, Activity, Target } from "lucide-react"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"

interface AnalyticsData {
  weightData: Array<{ date: string; weight: number }>
  calorieData: Array<{ date: string; calories: number }>
  activityData: Array<{ date: string; duration: number; intensity: string }>
  heartRateData: Array<{ date: string; avgHeartRate: number }>
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    weightData: [],
    calorieData: [],
    activityData: [],
    heartRateData: [],
  })
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<"week" | "month" | "all">("month")
  const [userId, setUserId] = useState<string | null>(null)

  const loadAnalytics = async (id: string) => {
    try {
      const supabase = createClient()
      const daysToFetch = timeRange === "week" ? 7 : timeRange === "month" ? 30 : 365
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - daysToFetch)

      // Fetch physical evolution data for weight
      const { data: evolutionData } = await supabase
        .from("physical_evolution")
        .select("measured_at, weight")
        .eq("user_id", id)
        .gte("measured_at", startDate.toISOString())
        .order("measured_at", { ascending: true })

      // Fetch nutrition logs for calories
      const { data: nutritionData } = await supabase
        .from("nutrition_logs")
        .select("logged_at, calories")
        .eq("user_id", id)
        .gte("logged_at", startDate.toISOString())

      // Fetch activity records
      const { data: activityData } = await supabase
        .from("activity_records")
        .select("recorded_at, duration_minutes, intensity, heart_rate_avg")
        .eq("user_id", id)
        .gte("recorded_at", startDate.toISOString())
        .order("recorded_at", { ascending: true })

      // Process weight data
      const weightMap = new Map()
      ;(evolutionData || []).forEach((record: any) => {
        const date = new Date(record.measured_at).toLocaleDateString("pt-BR")
        if (!weightMap.has(date)) {
          weightMap.set(date, record.weight)
        }
      })

      // Process calorie data by day
      const calorieMap = new Map()
      ;(nutritionData || []).forEach((record: any) => {
        const date = new Date(record.logged_at).toLocaleDateString("pt-BR")
        const existing = calorieMap.get(date) || 0
        calorieMap.set(date, existing + (record.calories || 0))
      })

      // Process activity and heart rate data
      const activityMap = new Map()
      const heartRateMap = new Map()
      ;(activityData || []).forEach((record: any) => {
        const date = new Date(record.recorded_at).toLocaleDateString("pt-BR")

        const existingActivity = activityMap.get(date) || { duration: 0, intensities: [] }
        existingActivity.duration += record.duration_minutes || 0
        if (record.intensity) existingActivity.intensities.push(record.intensity)
        activityMap.set(date, existingActivity)

        if (record.heart_rate_avg) {
          const existing = heartRateMap.get(date) || { rates: [], count: 0 }
          existing.rates.push(record.heart_rate_avg)
          existing.count += 1
          heartRateMap.set(date, existing)
        }
      })

      setAnalytics({
        weightData: Array.from(weightMap, ([date, weight]) => ({ date, weight })),
        calorieData: Array.from(calorieMap, ([date, calories]) => ({ date, calories })),
        activityData: Array.from(activityMap, ([date, data]) => ({
          date,
          duration: Math.round(data.duration / 5) * 5, // Round to nearest 5
          intensity: data.intensities[0] || "unknown",
        })),
        heartRateData: Array.from(heartRateMap, ([date, data]) => ({
          date,
          avgHeartRate: Math.round(data.rates.reduce((a: number, b: number) => a + b, 0) / data.count),
        })),
      })
    } catch (error) {
      console.error("[v0] Error loading analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const initialize = async () => {
      const supabase = createClient()
      const { data } = await supabase.auth.getUser()

      if (!data.user) {
        setLoading(false)
        return
      }

      setUserId(data.user.id)
      await loadAnalytics(data.user.id)
    }

    initialize()
  }, [timeRange])

  const chartConfig = {
    weight: {
      label: "Peso (kg)",
      color: "hsl(var(--primary))",
    },
    calories: {
      label: "Calorias (kcal)",
      color: "hsl(var(--primary))",
    },
    duration: {
      label: "Duração (min)",
      color: "hsl(var(--primary))",
    },
    avgHeartRate: {
      label: "FC Média (bpm)",
      color: "hsl(var(--destructive))",
    },
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4" />
        <p className="text-muted-foreground">Carregando seus dados analíticos...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Análise de Progresso</h1>
        <p className="text-muted-foreground mt-2">Visualize sua evolução de saúde ao longo do tempo</p>
      </div>

      {/* Time Range Selector */}
      <div className="flex gap-2">
        {(["week", "month", "all"] as const).map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              timeRange === range
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {range === "week" ? "Última Semana" : range === "month" ? "Último Mês" : "Todos os Registros"}
          </button>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryStat title="Atividades" value={analytics.activityData.length} icon={Activity} color="blue" />
        <SummaryStat
          title="Dias com Exercício"
          value={analytics.activityData.filter((d) => d.duration > 0).length}
          icon={TrendingUp}
          color="green"
        />
        <SummaryStat
          title="Média Calórica"
          value={
            analytics.calorieData.length > 0
              ? Math.round(analytics.calorieData.reduce((sum, d) => sum + d.calories, 0) / analytics.calorieData.length)
              : 0
          }
          suffix="kcal"
          icon={Flame}
          color="orange"
        />
        <SummaryStat
          title="FC Média"
          value={
            analytics.heartRateData.length > 0
              ? Math.round(
                  analytics.heartRateData.reduce((sum, d) => sum + d.avgHeartRate, 0) / analytics.heartRateData.length,
                )
              : 0
          }
          suffix="bpm"
          icon={Heart}
          color="red"
        />
      </div>

      {/* Charts */}
      <div className="space-y-6">
        {/* Weight Chart */}
        {analytics.weightData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Evolução de Peso
              </CardTitle>
              <CardDescription>Seu peso ao longo do tempo</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig}>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.weightData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="weight" stroke="hsl(var(--primary))" strokeWidth={2} dot />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {/* Calorie Chart */}
        {analytics.calorieData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame className="h-5 w-5" />
                Ingestão Calórica
              </CardTitle>
              <CardDescription>Suas calorias diárias registradas</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.calorieData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="calories" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {/* Activity Duration Chart */}
        {analytics.activityData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Duração de Exercícios
              </CardTitle>
              <CardDescription>Tempo total de exercício por dia</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.activityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="duration" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {/* Heart Rate Chart */}
        {analytics.heartRateData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Frequência Cardíaca Média
              </CardTitle>
              <CardDescription>Sua frequência cardíaca ao longo do tempo</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig}>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.heartRateData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="avgHeartRate" stroke="hsl(var(--destructive))" strokeWidth={2} dot />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* No Data Message */}
      {analytics.weightData.length === 0 &&
        analytics.calorieData.length === 0 &&
        analytics.activityData.length === 0 &&
        analytics.heartRateData.length === 0 && (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum dado disponível</h3>
              <p className="text-muted-foreground">
                Comece a registrar suas atividades, refeições e medições para ver seu progresso aqui
              </p>
            </CardContent>
          </Card>
        )}
    </div>
  )
}

interface SummaryStatProps {
  title: string
  value: number
  suffix?: string
  icon: React.ComponentType<{ className?: string }>
  color: "blue" | "green" | "orange" | "red"
}

function SummaryStat({ title, value, suffix = "", icon: Icon, color }: SummaryStatProps) {
  const colorClasses = {
    blue: "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400",
    green: "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400",
    orange: "bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400",
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
              {suffix && <span className="text-sm text-muted-foreground ml-1">{suffix}</span>}
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
