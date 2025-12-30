"use client"

import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    enabled: false,
    appointment_reminders: true,
    medication_reminders: true,
    lab_results: true,
    doctor_messages: true,
    promotions: false,
    silent_hours_start: "22:00",
    silent_hours_end: "07:00"
  })

  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default")
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [pushError, setPushError] = useState<string>("")

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
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission)
      
      // Verificar se está inscrito em push notifications
      checkPushSubscription()
    }
  }, [])

  const checkPushSubscription = async () => {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
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
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from("notification_settings")
          .upsert({
            user_id: user.id,
            ...notificationSettings,
            updated_at: new Date().toISOString()
          })
      }
      
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

  // Função para converter chave VAPID
  const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/')
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  const activatePushNotifications = async () => {
    setPushError("")
    
    // 1. Verificar suporte
    if (!('serviceWorker' in navigator)) {
      setPushError("Seu navegador não suporta Service Workers")
      return
    }

    if (!('PushManager' in window)) {
      setPushError("Seu navegador não suporta Push Notifications")
      return
    }

    // 2. Solicitar permissão
    console.log("Solicitando permissão para notificações...")
    const permission = await Notification.requestPermission()
    setNotificationPermission(permission)
    
    if (permission !== "granted") {
      setPushError(`Permissão ${permission}. Você precisa permitir notificações.`)
      return
    }

    console.log("✅ Permissão concedida para notificações")

    try {
      // 3. Registrar Service Worker (se não estiver)
      console.log("Registrando Service Worker...")
      let registration = await navigator.serviceWorker.getRegistration("/")
      
      if (!registration) {
        registration = await navigator.serviceWorker.register("/service-worker.js", {
          scope: "/",
        })
        console.log("✅ Service Worker registrado:", registration.scope)
      } else {
        console.log("✅ Service Worker já registrado:", registration.scope)
      }

      // 4. Aguardar Service Worker ficar pronto
      await navigator.serviceWorker.ready
      console.log("✅ Service Worker pronto")

      // 5. Verificar chave VAPID
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      console.log("Chave VAPID configurada?", !!vapidPublicKey)

      if (!vapidPublicKey) {
        setPushError("Chave VAPID não configurada no servidor")
        return
      }

      // 6. Converter chave VAPID
      let applicationServerKey: Uint8Array
      try {
        applicationServerKey = urlBase64ToUint8Array(vapidPublicKey)
        console.log("✅ Chave VAPID convertida")
      } catch (error) {
        setPushError("Erro ao converter chave VAPID: " + error.message)
        return
      }

      // 7. Verificar se já está inscrito
      const existingSubscription = await registration.pushManager.getSubscription()
      if (existingSubscription) {
        console.log("✅ Já está inscrito. Atualizando status...")
        setIsSubscribed(true)
        setNotificationSettings(prev => ({ ...prev, enabled: true }))
        alert("Notificações já estão ativadas!")
        return
      }

      // 8. Inscrever para Push Notifications
      console.log("Inscrevendo para Push Notifications...")
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      })

      console.log("✅ Inscrito com sucesso!")
      console.log("Endpoint:", subscription.endpoint.substring(0, 50) + "...")

      // 9. Salvar subscription no Supabase
      console.log("Salvando subscription no Supabase...")
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setPushError("Usuário não autenticado")
        return
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
        setPushError("Erro ao salvar configurações: " + error.message)
        return
      }

      // 10. Atualizar estado
      setIsSubscribed(true)
      setNotificationSettings(prev => ({ ...prev, enabled: true }))
      
      // 11. Mostrar notificação de teste
      console.log("Mostrando notificação de boas-vindas...")
      const welcomeNotification = new Notification("HealthCare+", {
        body: "Notificações ativadas com sucesso! Você receberá alertas importantes.",
        icon: "/icon-light-32x32.png",
        tag: "welcome-notification",
      })

      welcomeNotification.onclick = () => {
        console.log("Notificação clicada")
        welcomeNotification.close()
      }

      alert("✅ Notificações ativadas com sucesso!")
      console.log("🎉 Processo de ativação concluído com sucesso!")

    } catch (error: any) {
      console.error("❌ Erro detalhado ao ativar notificações:", error)
      setPushError("Erro: " + (error.message || "Falha ao ativar notificações"))
    }
  }

  const deactivatePushNotifications = async () => {
    setPushError("")
    
    try {
      // 1. Cancelar subscription
      if ('serviceWorker' in navigator && 'PushManager' in window) {
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
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("user_id", user.id)
      }

      // 3. Atualizar estado
      setIsSubscribed(false)
      setNotificationSettings(prev => ({ ...prev, enabled: false }))
      
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

      {/* CARD DE NOTIFICAÇÕES PUSH - CORRIGIDO */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellRing className="h-5 w-5" />
            Notificações Push
          </CardTitle>
          <CardDescription>
            Configure as notificações para receber lembretes e atualizações importantes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-foreground">Status das Notificações</h3>
                <p className="text-sm text-muted-foreground">
                  {notificationPermission === "granted" && isSubscribed
                    ? "✅ Ativas - Você receberá notificações mesmo com o app fechado"
                    : notificationPermission === "granted" && !isSubscribed
                    ? "⚠️ Permissão concedida, mas não inscrito"
                    : notificationPermission === "denied"
                    ? "❌ Permissão negada"
                    : "⏳ Aguardando sua decisão"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {notificationPermission === "granted" && isSubscribed ? (
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full flex items-center gap-1">
                    <Bell className="h-3 w-3" />
                    Ativo
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full flex items-center gap-1">
                    <BellOff className="h-3 w-3" />
                    Inativo
                  </span>
                )}
              </div>
            </div>

            {/* Botões principais */}
            <div className="space-y-3">
              {!isSubscribed ? (
                <Button 
                  onClick={activatePushNotifications}
                  className="w-full py-6"
                  size="lg"
                >
                  <Bell className="h-5 w-5 mr-2" />
                  Ativar Notificações Push
                </Button>
              ) : (
                <>
                  <Button 
                    onClick={deactivatePushNotifications}
                    variant="outline"
                    className="w-full py-6"
                    size="lg"
                  >
                    <BellOff className="h-5 w-5 mr-2" />
                    Desativar Notificações
                  </Button>
                  
                  <Button 
                    onClick={sendTestNotification}
                    disabled={testingNotification}
                    className="w-full"
                    variant="secondary"
                  >
                    <TestTube className="h-4 w-4 mr-2" />
                    {testingNotification ? "Enviando..." : "Enviar Notificação de Teste"}
                  </Button>
                </>
              )}
            </div>

            {/* Mensagem de erro */}
            {pushError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-800">{pushError}</p>
                </div>
              </div>
            )}

            {notificationPermission === "denied" && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                  <p className="text-sm text-yellow-800">
                    Você bloqueou as notificações. Para ativá-las, acesse as configurações do seu navegador.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Preferências (só aparecem se ativado) */}
          {isSubscribed && (
            <>
              <div className="space-y-4">
                <h3 className="font-medium text-foreground">Preferências de Notificação</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="appointment-reminders" className="cursor-pointer">
                      Lembretes de Consulta
                    </Label>
                    <input
                      id="appointment-reminders"
                      type="checkbox"
                      checked={notificationSettings.appointment_reminders}
                      onChange={(e) => setNotificationSettings({
                        ...notificationSettings,
                        appointment_reminders: e.target.checked
                      })}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="medication-reminders" className="cursor-pointer">
                      Lembretes de Medicamento
                    </Label>
                    <input
                      id="medication-reminders"
                      type="checkbox"
                      checked={notificationSettings.medication_reminders}
                      onChange={(e) => setNotificationSettings({
                        ...notificationSettings,
                        medication_reminders: e.target.checked
                      })}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="lab-results" className="cursor-pointer">
                      Resultados de Exames
                    </Label>
                    <input
                      id="lab-results"
                      type="checkbox"
                      checked={notificationSettings.lab_results}
                      onChange={(e) => setNotificationSettings({
                        ...notificationSettings,
                        lab_results: e.target.checked
                      })}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="doctor-messages" className="cursor-pointer">
                      Mensagens do Médico
                    </Label>
                    <input
                      id="doctor-messages"
                      type="checkbox"
                      checked={notificationSettings.doctor_messages}
                      onChange={(e) => setNotificationSettings({
                        ...notificationSettings,
                        doctor_messages: e.target.checked
                      })}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="promotions" className="cursor-pointer">
                      Promoções e Ofertas
                    </Label>
                    <input
                      id="promotions"
                      type="checkbox"
                      checked={notificationSettings.promotions}
                      onChange={(e) => setNotificationSettings({
                        ...notificationSettings,
                        promotions: e.target.checked
                      })}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium text-foreground">Horário Silencioso</h3>
                <p className="text-sm text-muted-foreground">
                  Configure horários em que não deseja receber notificações
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="silent-start">Início</Label>
                    <Input
                      id="silent-start"
                      type="time"
                      value={notificationSettings.silent_hours_start}
                      onChange={(e) => setNotificationSettings({
                        ...notificationSettings,
                        silent_hours_start: e.target.value
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="silent-end">Término</Label>
                    <Input
                      id="silent-end"
                      type="time"
                      value={notificationSettings.silent_hours_end}
                      onChange={(e) => setNotificationSettings({
                        ...notificationSettings,
                        silent_hours_end: e.target.value
                      })}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ... mantenha os outros cards (App, Logout, etc) ... */}

      <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
        {saving ? "Salvando..." : "Salvar Alterações"}
      </Button>
    </div>
  )
}