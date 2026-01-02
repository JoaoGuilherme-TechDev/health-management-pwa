// app/patient/prescriptions/page.tsx
"use client"

import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, Calendar, ExternalLink } from "lucide-react"
import { formatBrasiliaDate } from "@/lib/timezone"
import { Badge } from "@/components/ui/badge"

interface Prescription {
  id: string
  patient_id: string
  doctor_id: string
  title: string
  description: string | null
  prescription_file_url: string
  valid_until: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    let isMounted = true
    const channels: any[] = []

    const loadPrescriptions = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          if (isMounted) setLoading(false)
          return
        }

        console.log("[v0] Loading prescriptions for user:", user.id)

        const { data, error } = await supabase
          .from("medical_prescriptions")
          .select("*")
          .eq("patient_id", user.id)
          .order("created_at", { ascending: false })

        if (isMounted) {
          if (error) {
            console.error("[v0] Error loading prescriptions:", error)
            setPrescriptions([])
          } else {
            setPrescriptions(data || [])
          }
          setLoading(false)
        }
      } catch (error: any) {
        console.error("[v0] Unexpected error:", error)
        if (isMounted) {
          setPrescriptions([])
          setLoading(false)
        }
      }
    }

    loadPrescriptions()

    // Setup real-time subscription
    const setupRealtime = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user || !isMounted) return

      const channel = supabase
        .channel(`patient-prescriptions-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "medical_prescriptions",
            filter: `patient_id=eq.${user.id}`,
          },
          () => {
            console.log("[v0] Prescription changed, reloading...")
            if (isMounted) loadPrescriptions()
          },
        )
        .subscribe((status) => {
          console.log("[v0] Prescription subscription status:", status)
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

  const isPrescriptionValid = (validUntil: string | null) => {
    if (!validUntil) return true
    const expiryDate = new Date(validUntil)
    const today = new Date()
    return expiryDate >= today
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Carregando receitas médicas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Receitas Médicas</h1>
          <p className="text-muted-foreground mt-1">Visualize suas receitas médicas</p>
        </div>

        {prescriptions.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Nenhuma Receita Médica ainda</h3>
              <p className="text-muted-foreground">As receitas médicas serão adicionadas aqui pelo seu médico</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {prescriptions.map((pres) => {
              const isValid = isPrescriptionValid(pres.valid_until)

              return (
                <Card key={pres.id} className="hover:border-primary transition-colors">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">{pres.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={isValid ? "default" : "destructive"}>
                              {isValid ? "Válida" : "Expirada"}
                            </Badge>
                            {!isValid && (
                              <span className="text-xs text-destructive">• Esta receita não é mais válida</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {pres.description && <p className="text-sm text-muted-foreground">{pres.description}</p>}

                      <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                        {/* Link do Documento */}
                        {pres.prescription_file_url && (
                          <a
                            href={pres.prescription_file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg hover:bg-green-100 dark:hover:bg-green-900 transition-colors"
                          >
                            <ExternalLink className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-green-900 dark:text-green-100">
                                Ver Documento da Receita
                              </p>
                              <p className="text-xs text-green-700 dark:text-green-300">
                                Clique para abrir ou baixar o arquivo da receita
                              </p>
                            </div>
                          </a>
                        )}
                      </div>

                      {pres.valid_until && (
                        <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-950 rounded-lg">
                          <Calendar className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                              {isValid ? "Válida até" : "Expirou em"}
                            </p>
                            <p className="text-xs text-amber-700 dark:text-amber-300">
                              {formatBrasiliaDate(pres.valid_until, "date")}
                            </p>
                          </div>
                        </div>
                      )}

                      {pres.notes && (
                        <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Observações:</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{pres.notes}</p>
                        </div>
                      )}

                      <div className="pt-3 border-t text-xs text-muted-foreground">
                        <p>Prescrito em: {formatBrasiliaDate(pres.created_at, "date")}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
