"use client"

import { createClient } from "@/lib/supabase/client"
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

interface NotificationSettings {
  enabled: boolean
  appointment_reminders: boolean
  medication_reminders: boolean
  lab_results: boolean
  doctor_messages: boolean
  promotions: boolean
  silent_hours_start: string
  silent_hours_end: string
}

export default function SettingsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [testingNotification, setTestingNotification] = useState(false)
  const [selectedTab, setSelectedTab] = useState<"personal" | "health" | "notifications">("personal")

  const [preferences, setPreferences] = useState({
    language: "pt-BR",
    theme: "auto" as "auto" | "light" | "dark",
    emailDigest: "weekly" as "daily" | "weekly" | "monthly",
    dataSharing: false,
  })

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    enabled: false,
    appointment_reminders: true,
    medication_reminders: true,
    lab_results: true,
    doctor_messages: true,
    promotions: false,
    silent_hours_start: "22:00",
    silent_hours_end: "07:00",
  })

  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default")
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [pushError, setPushError] = useState<string>("")
  const [isSecureContext, setIsSecureContext] = useState(false)

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

          // Carregar configurações de notificação do perfil
          const { data: settings } = await supabase
            .from("notification_settings")
            .select("*")
            .eq("user_id", user.id)
            .single()

          if (settings) {
            setNotificationSettings(settings)
          }
        }
      }

      setLoading(false)
    }

    loadProfile()

    // Verificar permissão de notificação
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission)

      // Verificar se está inscrito em push notifications
      checkPushSubscription()
    }

    // Verificar contexto seguro
    const hostname = window.location.hostname
    const isLocalhost =
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("10.0.") ||
      hostname.startsWith("172.16.")
    const isHttps = window.location.protocol === "https:"

    setIsSecureContext(isHttps || isLocalhost)

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
  }, [])

  const checkPushSubscription = async () => {
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        return
      }

      // Primeiro, garantir que o service worker está registrado
      if (!navigator.serviceWorker.controller) {
        console.log("Service Worker não está registrado ainda")
        return
      }

      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      setIsSubscribed(!!subscription)

      if (subscription) {
        console.log("✅ Usuário já inscrito para push notifications")
        console.log("Endpoint:", subscription.endpoint.substring(0, 50) + "...")
      }
    } catch (error) {
      console.error("Erro ao verificar inscrição:", error)
    }
  }

  const handleSave = async () => {
    if (!profile) return

    setSaving(true)
    const supabase = createClient()

    try {
      // Salvar perfil
      await supabase.from("profiles").update(profile).eq("id", profile.id)

      // Salvar configurações de notificação
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        await supabase.from("notification_settings").upsert({
          user_id: user.id,
          ...notificationSettings,
          updated_at: new Date().toISOString(),
        })
      }

      // Salvar preferências
      await supabase.from("preferences").upsert({
        user_id: user!.id,
        ...preferences,
        updated_at: new Date().toISOString(),
      })

      alert("Configurações salvas com sucesso!")
    } catch (error) {
      console.error("Erro ao salvar:", error)
      alert("Erro ao salvar configurações")
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
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

  const activatePushNotifications = async () => {
    setPushError("")

    try {
      console.log("🔔 Iniciando ativação de notificações push...")

      // ===== VERIFICAÇÃO DE CONTEXTO SEGURO =====
      const hostname = window.location.hostname
      const protocol = window.location.protocol

      const isLocalhost =
        hostname === "localhost" ||
        hostname === "127.0.0.1" ||
        hostname.startsWith("192.168.") ||
        hostname.startsWith("10.0.") ||
        hostname.startsWith("172.16.")

      const isHttps = protocol === "https:"

      console.log("Contexto atual:", {
        hostname,
        protocol,
        isLocalhost,
        isHttps,
        isSecureContext: window.isSecureContext,
      })

      // Service Workers só funcionam em HTTPS ou localhost/private IP
      if (!isHttps && !isLocalhost) {
        const isPublicIp =
          /^\d+\.\d+\.\d+\.\d+$/.test(hostname) &&
          !hostname.startsWith("192.168.") &&
          !hostname.startsWith("10.0.") &&
          !hostname.startsWith("172.16.")

        if (isPublicIp) {
          const localhostUrl = `http://localhost:${window.location.port || 3000}`
          throw new Error(
            `Service Workers NÃO funcionam com IPs públicos em HTTP.\n\n` +
              `Você está acessando: http://${hostname}:${window.location.port || 3000}\n\n` +
              `Para notificações funcionarem:\n` +
              `1. Acesse por: ${localhostUrl}\n` +
              `2. Ou configure HTTPS no servidor\n` +
              `3. Ou use um nome de domínio local`,
          )
        }
      }

      // ===== VERIFICAÇÕES DE SUPORTE =====
      console.log("1. Verificando suporte do navegador...")

      if (!("serviceWorker" in navigator)) {
        // Diagnosticar o motivo
        const diagnostics = {
          isSecureContext: window.isSecureContext,
          userAgent: (navigator as any).userAgent,
          isPrivateMode:
            (navigator as any).userAgent.includes("Incognito") || (navigator as any).userAgent.includes("Private"),
        }
        console.log("Diagnóstico:", diagnostics)

        throw new Error(
          "Service Workers não são suportados neste contexto.\n" +
            "Possíveis causas:\n" +
            "• Navegador muito antigo\n" +
            "• Contexto inseguro (HTTP em IP público)\n" +
            "• Modo de navegação privada\n" +
            "• Extensões bloqueando\n\n" +
            "Tente:\n" +
            "• Usar Chrome/Firefox atualizado\n" +
            "• Acessar por http://localhost:3000\n" +
            "• Desativar modo privado\n" +
            "• Desativar extensões de bloqueio",
        )
      }

      if (!("PushManager" in window)) {
        throw new Error("Seu navegador não suporta Push Notifications")
      }

      // ===== SOLICITAR PERMISSÃO =====
      console.log("2. Solicitando permissão...")
      const permission = await Notification.requestPermission()
      setNotificationPermission(permission)

      if (permission !== "granted") {
        throw new Error(`Permissão ${permission}. Você precisa permitir notificações.`)
      }
      console.log("✅ Permissão concedida")

      // ===== REGISTRAR SERVICE WORKER =====
      console.log("3. Registrando Service Worker...")

      // Tentar diferentes caminhos
      const swPaths = ["/service-worker.js", "/sw.js"]
      let registration: ServiceWorkerRegistration | null = null
      let lastError: Error | null = null

      for (const swPath of swPaths) {
        try {
          console.log(`Tentando registrar: ${swPath}`)
          registration = await navigator.serviceWorker.register(swPath, {
            scope: "/",
            updateViaCache: "none",
          })
          console.log(`✅ Service Worker registrado: ${swPath}`)
          console.log("Scope:", registration.scope)
          break
        } catch (error: any) {
          console.log(`❌ Falha em ${swPath}:`, error.message)
          lastError = error
        }
      }

      if (!registration) {
        throw new Error(`Não foi possível registrar Service Worker.\n` + `Último erro: ${lastError?.message}`)
      }

      // Aguardar ativação
      await new Promise<void>((resolve) => {
        if (registration!.active) {
          resolve()
        } else if (registration!.installing) {
          registration!.installing.addEventListener("statechange", () => {
            if (registration!.active) {
              resolve()
            }
          })
        } else {
          setTimeout(resolve, 1000)
        }
      })

      console.log("4. Service Worker ativo e pronto")

      // ===== VERIFICAR E CONVERTER CHAVE VAPID =====
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

      if (!vapidPublicKey) {
        throw new Error("Chave VAPID não configurada. Configure NEXT_PUBLIC_VAPID_PUBLIC_KEY no .env.local")
      }

      console.log("5. Convertendo chave VAPID...")

      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey)
      console.log("✅ Chave convertida, tamanho:", applicationServerKey.length)

      // ===== VERIFICAR INSCRIÇÃO EXISTENTE =====
      console.log("6. Verificando inscrição existente...")
      let subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        console.log("✅ Já inscrito. Atualizando status...")
        setIsSubscribed(true)
        setNotificationSettings((prev) => ({ ...prev, enabled: true }))
        alert("Notificações já estão ativadas!")
        return
      }

      // ===== CRIAR NOVA INSCRIÇÃO =====
      console.log("7. Criando nova inscrição...")
      try {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey as BufferSource,
        })

        console.log("✅ Inscrito com sucesso!")
        console.log("Endpoint:", subscription.endpoint)

        const subscriptionJson = subscription.toJSON()
        console.log("Tem p256dh?", !!subscriptionJson.keys?.p256dh)
        console.log("Tem auth?", !!subscriptionJson.keys?.auth)
      } catch (subscribeError: any) {
        console.error("❌ Erro na inscrição:", subscribeError)

        console.log("applicationServerKey é Uint8Array?", applicationServerKey instanceof Uint8Array)
        console.log("applicationServerKey byteLength:", applicationServerKey.byteLength)

        throw new Error(`Falha ao criar inscrição: ${subscribeError.message}`)
      }

      // ===== SALVAR NO SUPABASE =====
      console.log("8. Salvando no Supabase...")
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("Usuário não autenticado")
      }

      const subscriptionJson = subscription.toJSON()

      const { error } = await supabase.from("push_subscriptions").upsert({
        user_id: user.id,
        endpoint: subscriptionJson.endpoint,
        p256dh: subscriptionJson.keys?.p256dh,
        auth: subscriptionJson.keys?.auth,
        expiration_time: subscriptionJson.expirationTime || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (error) {
        console.error("Erro ao salvar no Supabase:", error)
        throw new Error("Erro ao salvar: " + error.message)
      }

      // ===== ATUALIZAR ESTADO =====
      setIsSubscribed(true)
      setNotificationSettings((prev) => ({ ...prev, enabled: true }))

      // ===== NOTIFICAÇÃO DE SUCESSO =====
      console.log("9. Mostrando notificação de sucesso...")

      try {
        await registration.showNotification("HealthCare+", {
          body: "Notificações push ativadas com sucesso!",
          icon: "/icon-light-32x32.png",
          badge: "/badge-72x72.png",
          tag: "activation-success",
          requireInteraction: true,
        })
      } catch (notifError) {
        // Fallback
        new Notification("HealthCare+", {
          body: "Notificações ativadas com sucesso!",
          icon: "/icon-light-32x32.png",
        })
      }

      console.log("🎉 Processo concluído com sucesso!")
      alert("✅ Notificações push ativadas com sucesso!")
    } catch (error: any) {
      console.error("❌ Erro:", error)
      setPushError(error.message || "Erro ao ativar notificações")
    }
  }

  const deactivatePushNotifications = async () => {
    setPushError("")

    try {
      // 1. Cancelar subscription
      if ("serviceWorker" in navigator && "PushManager" in window) {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()

        if (subscription) {
          const unsubscribed = await subscription.unsubscribe()
          if (!unsubscribed) {
            console.warn("Não foi possível cancelar a subscription no navegador")
          }
        }
      }

      // 2. Remover do Supabase
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        await supabase.from("push_subscriptions").delete().eq("user_id", user.id)
      }

      // 3. Atualizar estado
      setIsSubscribed(false)
      setNotificationSettings((prev) => ({ ...prev, enabled: false }))

      alert("✅ Notificações desativadas com sucesso!")
    } catch (error: any) {
      console.error("Erro ao desativar notificações:", error)
      setPushError("Erro: " + error.message)
    }
  }

  const sendTestNotification = async () => {
    setTestingNotification(true)
    setPushError("")

    try {
      if (notificationPermission !== "granted") {
        alert("Permissão de notificação não concedida")
        return
      }

      const registration = await navigator.serviceWorker.ready

      await registration.showNotification("HealthCare+ - Notificação de Teste", {
        body: "Esta é uma notificação de teste! Se você vê isso, as notificações push estão funcionando corretamente.",
        icon: "/icon-light-32x32.png",
        badge: "/badge-72x72.png",
        tag: "test-notification",
        requireInteraction: true,
      })

      alert("✅ Notificação de teste enviada!")
    } catch (error: any) {
      console.error("Erro ao enviar notificação:", error)
      setPushError("Erro ao enviar notificação: " + error.message)
    } finally {
      setTestingNotification(false)
    }
  }

  // Botão de diagnóstico
  const runDiagnostics = () => {
    console.log("=== DIAGNÓSTICO COMPLETO ===")
    console.log("URL:", window.location.href)
    console.log("Hostname:", window.location.hostname)
    console.log("Protocol:", window.location.protocol)
    console.log("isSecureContext:", window.isSecureContext)
    console.log("User Agent:", navigator.userAgent)
    console.log("Service Worker in navigator:", "serviceWorker" in navigator)
    console.log("PushManager in window:", "PushManager" in window)
    console.log("Notification in window:", "Notification" in window)
    console.log("Notification.permission:", Notification.permission)
    console.log("isSubscribed:", isSubscribed)
    console.log("VAPID Key configured:", !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY)

    const hostname = window.location.hostname
    const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1"

    if (!isLocalhost && window.location.protocol !== "https:") {
      const localhostUrl = `http://localhost:${window.location.port || 3000}`
      alert(
        `Para notificações push funcionarem:\n\n` +
          `Acesse por: ${localhostUrl}\n\n` +
          `IPs públicos não suportam Service Workers em HTTP.`,
      )
    }
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
          <button
            onClick={() => setSelectedTab("notifications")}
            className={`pb-3 px-4 font-medium text-sm transition-colors ${
              selectedTab === "notifications"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Notificações
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
  )
}
