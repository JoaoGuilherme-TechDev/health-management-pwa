"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LogOut, Bell, BellOff, BellRing, TestTube, AlertCircle } from "lucide-react"
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
  const [selectedTab, setSelectedTab] = useState<"personal" | "health">("personal")

  const [preferences, setPreferences] = useState({
    language: "pt-BR",
    theme: "auto" as "auto" | "light" | "dark",
    emailDigest: "weekly" as "daily" | "weekly" | "monthly",
    dataSharing: false,
  })

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const authRes = await fetch('/api/auth/me')
        if (!authRes.ok) {
          router.push("/login")
          return
        }
        const { user } = await authRes.json()

        const res = await fetch(`/api/data?table=profiles&match_key=id&match_value=${user.id}`)
        if (res.ok) {
          const data = await res.json()
          if (data && data.length > 0) {
            setProfile(data[0])
          }
        }
      } catch (error) {
        console.error("Error loading profile:", error)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()


    // Verificar contexto seguro
    const hostname = window.location.hostname
    const isLocalhost =
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("10.0.") ||
      hostname.startsWith("172.16.")
    const isHttps = window.location.protocol === "https:"


    // Avisar se estiver em contexto inseguro
    const isPublicIp =
      /^\d+\.\d+\.\d+\.\d+$/.test(hostname) &&
      !hostname.startsWith("192.168.") &&
      !hostname.startsWith("10.0.") &&
      !hostname.startsWith("172.16.")

    if (isPublicIp && window.location.protocol === "http:") {
      console.warn("⚠️ AVISO: Service Workers não funcionam com IPs públicos em HTTP")
      console.warn("   Acesse por http://localhost:3000 para notificações funcionarem")
    }
  }, [router])



  const handleSave = async () => {
    if (!profile) return

    setSaving(true)

    try {
      // Salvar perfil
      const res = await fetch('/api/data', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: 'profiles',
          id: profile.id,
          data: profile
        })
      })

      if (res.ok) {
        alert("Configurações salvas com sucesso!")
      } else {
        throw new Error("Failed to update profile")
      }
    } catch (error) {
      console.error("Erro ao salvar:", error)
      alert("Erro ao salvar configurações")
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    await fetch('/api/auth/signout', { method: 'POST' })
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("healthcare_session")
    }
    router.push("/login")
  }

  // Função corrigida para retornar Uint8Array
  const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }

    return outputArray
  }


  if (loading) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <div className="text-center py-12">Carregando configurações...</div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <div className="text-center py-12">Perfil não encontrado</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Configurações do Perfil</h1>
        <p className="text-muted-foreground mt-1">Gerencie suas informações pessoais, saúde e preferências</p>
      </div>

      {/* Tabs for better organization */}
      <div className="border-b border-border">
        <div className="flex gap-0">
          <button
            onClick={() => setSelectedTab("personal")}
            className={`pb-3 px-4 font-medium text-sm transition-colors ${
              selectedTab === "personal"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Pessoal
          </button>
          <button
            onClick={() => setSelectedTab("health")}
            className={`pb-3 px-4 font-medium text-sm transition-colors ${
              selectedTab === "health"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Saúde
          </button>
        </div>
      </div>

      {/* Personal Information Tab */}
      {selectedTab === "personal" && (
        <Card>
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
            <CardDescription>Atualize suas informações básicas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nome</Label>
                <Input
                  id="firstName"
                  value={profile?.first_name || ""}
                  onChange={(e) => setProfile({ ...profile!, first_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Sobrenome</Label>
                <Input
                  id="lastName"
                  value={profile?.last_name || ""}
                  onChange={(e) => setProfile({ ...profile!, last_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" value={profile?.email || ""} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={profile?.phone || ""}
                  onChange={(e) => setProfile({ ...profile!, phone: e.target.value })}
                  placeholder="+55 (11) 9XXXX-XXXX"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Health Information Tab */}
      {selectedTab === "health" && (
        <Card>
          <CardHeader>
            <CardTitle>Informações de Saúde</CardTitle>
            <CardDescription>Detalhes de saúde importantes para seu cuidado</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dob">Data de Nascimento</Label>
                <Input
                  id="dob"
                  type="date"
                  value={profile?.date_of_birth || ""}
                  onChange={(e) => setProfile({ ...profile!, date_of_birth: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="allergies">Alergias</Label>
                <Input
                  id="allergies"
                  value={profile?.allergies || ""}
                  onChange={(e) => setProfile({ ...profile!, allergies: e.target.value })}
                  placeholder="Liste quaisquer alergias conhecidas..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="insurance">Plano de Saúde</Label>
                <Input
                  id="insurance"
                  value={profile?.insurance_provider || ""}
                  onChange={(e) => setProfile({ ...profile!, insurance_provider: e.target.value })}
                  placeholder="Ex: Unimed, Bradesco Saúde"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="insuranceId">Número do Plano</Label>
                <Input
                  id="insuranceId"
                  value={profile?.insurance_id || ""}
                  onChange={(e) => setProfile({ ...profile!, insurance_id: e.target.value })}
                  placeholder="Número de matrícula"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergency">Contato de Emergência</Label>
                <Input
                  id="emergency"
                  value={profile?.emergency_contact || ""}
                  onChange={(e) => setProfile({ ...profile!, emergency_contact: e.target.value })}
                  placeholder="Nome e telefone"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save and Logout Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? "Salvando..." : "Salvar Alterações"}
        </Button>
        <Button onClick={handleLogout} disabled={loggingOut} variant="outline" className="gap-2 bg-transparent">
          <LogOut className="h-4 w-4" />
          {loggingOut ? "Saindo..." : "Sair da Conta"}
        </Button>
      </div>
    </div>
  </div>
  )
}
