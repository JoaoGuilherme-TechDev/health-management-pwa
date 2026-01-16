"use client"

import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Clock } from "lucide-react"
import { formatBrasiliaDateAppointment } from "@/lib/timezone"

interface Appointment {
  id: string
  title: string
  appointment_type: string
  description: string | null
  scheduled_at: string
  status: string
  location: string | null
  notes: string | null
  doctor_name: string | null
  doctor_crm: string | null
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    let isMounted = true
    const channels: any[] = []

    const loadAppointments = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      console.log("[v0] Loading appointments for user:", user.id)

      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("user_id", user.id)
        .order("scheduled_at", { ascending: true })

      if (isMounted) {
        if (!error && data) {
          setAppointments(data)
        }
        setLoading(false)
      }
    }

    loadAppointments()

    const setupRealtime = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user || !isMounted) return

      const channel = supabase
        .channel(`appointments-patient-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "appointments",
            filter: `patient_id=eq.${user.id}`,
          },
          () => {
            console.log("[v0] Appointment changed, reloading...")
            if (isMounted) loadAppointments()
          },
        )
        .subscribe((status) => {
          console.log("[v0] Subscription status:", status)
        })

      channels.push(channel)
    }

    setupRealtime()

    return () => {
      isMounted = false
      channels.forEach((channel) => {
        supabase.removeChannel(channel)
      })
    }
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      case "completed":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      case "cancelled":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      case "no_show":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "scheduled":
        return "Agendada"
      case "completed":
        return "Concluída"
      case "cancelled":
        return "Cancelada"
      case "no_show":
        return "Não presente"
      default:
        return status
    }
  }

  if (loading) {
    return <div className="text-center py-12">Carregando consultas...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Consultas</h1>
        <p className="text-muted-foreground mt-1">Visualize suas consultas médicas agendadas</p>
      </div>

      {appointments.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Nenhuma consulta agendada</h3>
            <p className="text-muted-foreground">Seu médico agendará consultas para você</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {appointments.map((appointment) => (
            <Card key={appointment.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{appointment.title}</CardTitle>
                    <CardDescription className="mt-1">{appointment.appointment_type}</CardDescription>
                    {appointment.doctor_name && (
                      <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                        <span>Dr(a). {appointment.doctor_name}</span>
                        {appointment.doctor_crm && <span>• CRM {appointment.doctor_crm}</span>}
                      </div>
                    )}
                  </div>
                  <Badge className={getStatusColor(appointment.status)}>{getStatusText(appointment.status)}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>
                    Consulta Agendada para {formatBrasiliaDateAppointment(appointment.scheduled_at, "date")} às{" "}
                    {formatBrasiliaDateAppointment(appointment.scheduled_at, "time")}
                  </span>
                </div>
                {appointment.location && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{appointment.location}</span>
                  </div>
                )}
                {appointment.description && (
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground">{appointment.description}</p>
                  </div>
                )}
                {appointment.notes && (
                  <div className="pt-2 border-t">
                    <p className="text-sm font-medium text-foreground mb-1">Observações:</p>
                    <p className="text-sm text-muted-foreground">{appointment.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
