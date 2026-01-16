"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"

export default function AdminSettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [formData, setFormData] = useState({
    doctor_full_name: "",
    doctor_crm: "",
    doctor_specialization: "",
    doctor_registration_state: "",
    professional_address: "",
    professional_phone: "",
  })

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push("/auth/login")
      return
    }

    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single()

    if (data) {
      setProfile(data)
      setFormData({
        doctor_full_name: data.doctor_full_name || "",
        doctor_crm: data.doctor_crm || "",
        doctor_specialization: data.doctor_specialization || "",
        doctor_registration_state: data.doctor_registration_state || "",
        professional_address: data.professional_address || "",
        professional_phone: data.professional_phone || "",
      })
    }
    setLoading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { error } = await supabase.from("profiles").update(formData).eq("id", user.id)

    if (error) {
      alert("Erro ao salvar: " + error.message)
    } else {
      alert("Informações salvas com sucesso!")
      loadProfile()
    }
    setSaving(false)
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("healthcare_session")
    }
    router.push("/auth/login")
  }

  if (loading) return <div>Carregando...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Configurações do Médico</h1>
        <p className="text-muted-foreground mt-1">Gerencie suas informações profissionais e legais</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações Profissionais</CardTitle>
          <CardDescription>Dados obrigatórios para exercício da medicina no Brasil</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="doctor_full_name">Nome Completo *</Label>
              <Input
                id="doctor_full_name"
                value={formData.doctor_full_name}
                onChange={(e) => setFormData({ ...formData, doctor_full_name: e.target.value })}
                placeholder="Dr. João Silva Santos"
              />
            </div>
            <div>
              <Label htmlFor="doctor_crm">CRM (Registro Profissional) *</Label>
              <Input
                id="doctor_crm"
                value={formData.doctor_crm}
                onChange={(e) => setFormData({ ...formData, doctor_crm: e.target.value })}
                placeholder="CRM/SP 123456"
              />
            </div>
            <div>
              <Label htmlFor="doctor_specialization">Especialização</Label>
              <Input
                id="doctor_specialization"
                value={formData.doctor_specialization}
                onChange={(e) => setFormData({ ...formData, doctor_specialization: e.target.value })}
                placeholder="Nutrição Esportiva"
              />
            </div>
            <div>
              <Label htmlFor="doctor_registration_state">Estado de Registro do CRM *</Label>
              <Input
                id="doctor_registration_state"
                value={formData.doctor_registration_state}
                onChange={(e) => setFormData({ ...formData, doctor_registration_state: e.target.value })}
                placeholder="SP"
                maxLength={2}
              />
            </div>
            <div>
              <Label htmlFor="professional_phone">Telefone Profissional</Label>
              <Input
                id="professional_phone"
                value={formData.professional_phone}
                onChange={(e) => setFormData({ ...formData, professional_phone: e.target.value })}
                placeholder="(11) 98765-4321"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="professional_address">Endereço do Consultório</Label>
            <Textarea
              id="professional_address"
              value={formData.professional_address}
              onChange={(e) => setFormData({ ...formData, professional_address: e.target.value })}
              placeholder="Rua Exemplo, 123 - Bairro - Cidade/Estado"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Sistema</CardTitle>
          <CardDescription>Status atual do sistema</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border border-border bg-muted/30">
              <p className="text-sm text-muted-foreground mb-1">Versão do Sistema</p>
              <p className="font-medium text-foreground">1.0.0</p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-muted/30">
              <p className="text-sm text-muted-foreground mb-1">Última Atualização</p>
              <p className="font-medium text-foreground">{new Date().toLocaleDateString("pt-BR")}</p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-muted/30">
              <p className="text-sm text-muted-foreground mb-1">Status do Banco</p>
              <p className="font-medium text-green-600 dark:text-green-400">Conectado</p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-muted/30">
              <p className="text-sm text-muted-foreground mb-1">Status da API</p>
              <p className="font-medium text-green-600 dark:text-green-400">Operacional</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
          <CardDescription>Ações irreversíveis que afetam sua sessão</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleLogout} disabled={loggingOut} variant="destructive" className="gap-2">
            <LogOut className="h-4 w-4" />
            {loggingOut ? "Saindo..." : "Sair da Conta"}
          </Button>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
        {saving ? "Salvando..." : "Salvar Configurações"}
      </Button>
    </div>
  )
}
