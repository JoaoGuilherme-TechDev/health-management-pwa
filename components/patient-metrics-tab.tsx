"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { Plus, Activity, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function PatientMetricsTab({ patientId }: { patientId: string }) {
  const [metrics, setMetrics] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [formData, setFormData] = useState({
    metric_type: "",
    value: "",
    unit: "",
    notes: "",
  })

  const metricTypes = [
    { value: "blood_pressure", label: "Pressão Arterial", unit: "mmHg" },
    { value: "heart_rate", label: "Frequência Cardíaca", unit: "bpm" },
    { value: "temperature", label: "Temperatura", unit: "°C" },
    { value: "blood_glucose", label: "Glicemia", unit: "mg/dL" },
    { value: "weight", label: "Peso", unit: "kg" },
    { value: "height", label: "Altura", unit: "cm" },
    { value: "oxygen_saturation", label: "Saturação de Oxigênio", unit: "%" },
  ]

  useEffect(() => {
    loadMetrics()
  }, [patientId])

  const loadMetrics = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("health_metrics")
      .select("*")
      .eq("user_id", patientId)
      .order("recorded_at", { ascending: false })

    setMetrics(data || [])
    setLoading(false)
  }

  const handleAdd = async () => {
    const supabase = createClient()
    await supabase.from("health_metrics").insert({
      user_id: patientId,
      ...formData,
    })

    setShowDialog(false)
    setFormData({
      metric_type: "",
      value: "",
      unit: "",
      notes: "",
    })
    loadMetrics()
  }

  const handleDelete = async (id: string) => {
    const supabase = createClient()
    await supabase.from("health_metrics").delete().eq("id", id)
    loadMetrics()
  }

  const getMetricLabel = (type: string) => {
    return metricTypes.find((m) => m.value === type)?.label || type
  }

  if (loading) return <div>Carregando métricas...</div>

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Métricas de Saúde</CardTitle>
            <Button onClick={() => setShowDialog(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Adicionar Métrica
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {metrics.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma métrica registrada ainda</p>
            </div>
          ) : (
            <div className="space-y-4">
              {metrics.map((metric) => (
                <div key={metric.id} className="p-4 rounded-lg border border-border bg-card">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground text-lg">{getMetricLabel(metric.metric_type)}</h4>
                      <p className="text-2xl font-bold text-primary mt-2">
                        {metric.value} {metric.unit}
                      </p>
                      {metric.notes && <p className="text-sm text-muted-foreground mt-2">{metric.notes}</p>}
                      <p className="text-xs text-muted-foreground mt-3">
                        {new Date(metric.recorded_at).toLocaleString("pt-BR")}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(metric.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Métrica de Saúde</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tipo de Métrica *</Label>
              <Select
                value={formData.metric_type}
                onValueChange={(value) => {
                  const metric = metricTypes.find((m) => m.value === value)
                  setFormData({ ...formData, metric_type: value, unit: metric?.unit || "" })
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {metricTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Valor *</Label>
                <Input value={formData.value} onChange={(e) => setFormData({ ...formData, value: e.target.value })} />
              </div>
              <div>
                <Label>Unidade *</Label>
                <Input value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAdd} disabled={!formData.metric_type || !formData.value || !formData.unit}>
                Adicionar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
