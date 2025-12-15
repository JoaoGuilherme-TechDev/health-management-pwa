"use client"

import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Pill } from "lucide-react"
import { formatBrasiliaDate } from "@/lib/timezone"

export default function PatientSupplementsPage() {
  const [supplements, setSupplements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadSupplements = async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const { data } = await supabase
        .from("patient_supplements")
        .select("*")
        .eq("patient_id", user.id)
        .order("created_at", { ascending: false })

      setSupplements(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    loadSupplements()

    const supabase = createClient()
    const channel = supabase
      .channel("supplements-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "patient_supplements" }, () => {
        loadSupplements()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  if (loading) {
    return <div className="text-center py-12">Carregando seus suplementos...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Meus Suplementos</h1>
        <p className="text-muted-foreground mt-2">Suplementos recomendados pelo seu médico</p>
      </div>

      {supplements.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <Pill className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum suplemento cadastrado</h3>
            <p className="text-muted-foreground">Seu médico ainda não recomendou suplementos para você</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {supplements.map((supp) => (
            <Card key={supp.id}>
              <CardHeader>
                <CardTitle className="text-lg">{supp.supplement_name}</CardTitle>
                {supp.doctor_name && (
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                    <span>Dr(a). {supp.doctor_name}</span>
                    {supp.doctor_crm && <span>• CRM {supp.doctor_crm}</span>}
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Dosagem</p>
                  <p className="text-base text-foreground">{supp.dosage}</p>
                </div>

                {supp.frequency && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Frequência</p>
                    <p className="text-base text-foreground">{supp.frequency}</p>
                  </div>
                )}

                {supp.timing && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Horário</p>
                    <p className="text-base text-foreground">{supp.timing}</p>
                  </div>
                )}

                {supp.reason && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Motivo</p>
                    <p className="text-sm text-foreground">{supp.reason}</p>
                  </div>
                )}

                {(supp.start_date || supp.end_date) && (
                  <div className="pt-2 border-t border-border">
                    {supp.start_date && (
                      <p className="text-xs text-muted-foreground">
                        Início: {formatBrasiliaDate(supp.start_date, "date")}
                      </p>
                    )}
                    {supp.end_date && (
                      <p className="text-xs text-muted-foreground">
                        Término: {formatBrasiliaDate(supp.end_date, "date")}
                      </p>
                    )}
                  </div>
                )}

                {supp.notes && <p className="text-xs text-muted-foreground italic mt-2">Obs: {supp.notes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
