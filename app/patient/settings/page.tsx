"use client"

import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useNotifications } from "@/components/push-notification-provider"
import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"

interface Profile {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  date_of_birth: string | null
  emergency_contact: string | null
  allergies: string | null
  insurance_provider: string | null
  insurance_id: string | null
}

export default function SettingsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const { hasPermission, requestPermission } = useNotifications()

  useEffect(() => {
    const loadProfile = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single()

        if (data) {
          setProfile(data)
        }
      }

      setLoading(false)
    }

    loadProfile()
  }, [])

  const handleSave = async () => {
    if (!profile) return

    setSaving(true)
    const supabase = createClient()

    await supabase.from("profiles").update(profile).eq("id", profile.id)

    setSaving(false)
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  if (loading) {
    return <div className="text-center py-12">Carregando configurações...</div>
  }

  if (!profile) {
    return <div className="text-center py-12">Perfil não encontrado</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Configurações do Perfil</h1>
        <p className="text-muted-foreground mt-1">Gerencie suas informações pessoais e de saúde</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações Pessoais</CardTitle>
          <CardDescription>Atualize suas informações básicas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="firstName">Nome</Label>
              <Input
                id="firstName"
                value={profile.first_name}
                onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Sobrenome</Label>
              <Input
                id="lastName"
                value={profile.last_name}
                onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" value={profile.email} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={profile.phone || ""}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dob">Data de Nascimento</Label>
              <Input
                id="dob"
                type="date"
                value={profile.date_of_birth || ""}
                onChange={(e) => setProfile({ ...profile, date_of_birth: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergency">Contato de Emergência</Label>
              <Input
                id="emergency"
                value={profile.emergency_contact || ""}
                onChange={(e) => setProfile({ ...profile, emergency_contact: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informações de Saúde</CardTitle>
          <CardDescription>Detalhes de saúde importantes para seu cuidado</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="allergies">Alergias</Label>
            <Textarea
              id="allergies"
              value={profile.allergies || ""}
              onChange={(e) => setProfile({ ...profile, allergies: e.target.value })}
              placeholder="Liste quaisquer alergias conhecidas..."
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="insurance">Plano de Saúde</Label>
              <Input
                id="insurance"
                value={profile.insurance_provider || ""}
                onChange={(e) => setProfile({ ...profile, insurance_provider: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="insuranceId">Número do Plano</Label>
              <Input
                id="insuranceId"
                value={profile.insurance_id || ""}
                onChange={(e) => setProfile({ ...profile, insurance_id: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configurações do App</CardTitle>
          <CardDescription>Configure preferências de PWA e notificações</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Notificações</h3>
            <div className="p-4 rounded-lg border border-border bg-muted/30">
              <p className="text-sm text-muted-foreground mb-3">
                {hasPermission
                  ? "Notificações estão ativadas. Você receberá alertas para medicamentos e consultas."
                  : "Ative as notificações para receber lembretes de medicamentos e alertas de saúde no seu dispositivo."}
              </p>
              {!hasPermission && (
                <Button onClick={requestPermission} variant="outline" className="w-full bg-transparent">
                  Ativar Notificações
                </Button>
              )}
              {hasPermission && <p className="text-xs text-green-600 dark:text-green-400">✓ Notificações ativadas</p>}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Instalar App</h3>
            <div className="p-4 rounded-lg border border-border bg-muted/30">
              <p className="text-sm text-muted-foreground mb-3">
                Instale o HealthCare+ como um app no seu dispositivo para acesso rápido e suporte offline.
              </p>
              <div className="text-xs text-muted-foreground space-y-2">
                <p>
                  <strong>Desktop:</strong> Procure pelo ícone de instalar na barra de endereços ou menu
                </p>
                <p>
                  <strong>Mobile:</strong> Toque no menu de compartilhamento e selecione "Adicionar à Tela Inicial"
                  (iOS) ou use as opções do menu (Android)
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Acesso Offline</h3>
            <div className="p-4 rounded-lg border border-border bg-muted/30">
              <p className="text-sm text-muted-foreground">
                O HealthCare+ funciona offline e sincronizará seus dados quando você voltar a ter conexão. Suas
                informações de saúde estão sempre disponíveis.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Sair da Conta</CardTitle>
          <CardDescription>Encerrar sua sessão neste dispositivo</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleLogout} disabled={loggingOut} variant="destructive" className="gap-2 w-full sm:w-auto">
            <LogOut className="h-4 w-4" />
            {loggingOut ? "Saindo..." : "Sair da Conta"}
          </Button>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
        {saving ? "Salvando..." : "Salvar Alterações"}
      </Button>
    </div>
  )
}
