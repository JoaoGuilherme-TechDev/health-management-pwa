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
  setPushError("");
  
  try {
    console.log("=== INICIANDO ATIVAÇÃO DE NOTIFICAÇÕES ===");
    console.log("1. Verificando ambiente...");
    console.log("URL:", window.location.href);
    console.log("Protocolo:", window.location.protocol);
    console.log("HTTPS?", window.location.protocol === 'https:');
    console.log("Localhost?", window.location.hostname.includes('localhost'));

    // Verificar se está em contexto seguro
    const isSecureContext = window.isSecureContext || 
                            window.location.protocol === 'https:' ||
                            window.location.hostname === 'localhost' ||
                            window.location.hostname === '127.0.0.1';
    
    console.log("Contexto seguro?", isSecureContext);

    if (!isSecureContext) {
      throw new Error("Contexto inseguro. Notificações push requerem HTTPS ou localhost.");
    }

    // 2. Verificar suporte
    console.log("2. Verificando suporte do navegador...");
    console.log("Service Worker suportado?", 'serviceWorker' in navigator);
    console.log("PushManager suportado?", 'PushManager' in window);
    console.log("Notification suportado?", 'Notification' in window);

    if (!('serviceWorker' in navigator)) {
      throw new Error("Service Workers não são suportados neste navegador. Tente atualizar ou usar Chrome/Firefox.");
    }

    if (!('PushManager' in window)) {
      throw new Error("Push Notifications não são suportados neste navegador.");
    }

    // 3. Solicitar permissão
    console.log("3. Solicitando permissão...");
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    console.log("Permissão:", permission);
    
    if (permission !== "granted") {
      throw new Error(`Permissão ${permission}. Você precisa permitir notificações.`);
    }

    // 4. Registrar Service Worker simples primeiro
    console.log("4. Registrando Service Worker...");
    
    // Verificar registros existentes
    const registrations = await navigator.serviceWorker.getRegistrations();
    console.log("Service Workers registrados:", registrations.length);
    
    for (const reg of registrations) {
      console.log("Unregistering:", reg.scope);
      await reg.unregister();
    }

    // Tentar registrar diferentes versões
    let registration;
    const swUrls = ['/sw.js', '/service-worker.js', 'sw.js', 'service-worker.js'];
    
    for (const swUrl of swUrls) {
      try {
        console.log(`Tentando registrar: ${swUrl}`);
        registration = await navigator.serviceWorker.register(swUrl, {
          scope: '/',
          updateViaCache: 'none'
        });
        console.log(`✅ Registrado com sucesso: ${swUrl}`);
        break;
      } catch (swError) {
        console.log(`❌ Falha ao registrar ${swUrl}:`, (swError as Error).message);
      }
    }

    if (!registration) {
      throw new Error("Não foi possível registrar nenhum Service Worker. Verifique se o arquivo existe em /public/");
    }

    console.log("Service Worker registrado:", {
      scope: registration.scope,
      state: registration.installing?.state || registration.waiting?.state || registration.active?.state
    });

    // Aguardar ativação
    await new Promise<void>((resolve, reject) => {
      if (registration.active) {
        resolve();
      } else if (registration.installing) {
        registration.installing.addEventListener('statechange', (e: Event) => {
          console.log("Estado do SW:", (e.target as ServiceWorker)?.state);
          if ((e.target as ServiceWorker)?.state === 'activated') {
            resolve();
          }
        });
      } else {
        setTimeout(resolve, 1000);
      }
    });

    console.log("5. Verificando chave VAPID...");
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    console.log("Chave VAPID presente?", !!vapidPublicKey);
    
    if (!vapidPublicKey) {
      // Para teste, use uma chave de teste
      console.warn("Usando chave VAPID de teste...");
      const TEST_PUBLIC_KEY = "BH5kTx..."; // Chave de teste - você pode gerar uma
      throw new Error("Chave VAPID não configurada. Configure NEXT_PUBLIC_VAPID_PUBLIC_KEY.");
    }

    // 5. Converter chave VAPID
    console.log("6. Convertendo chave VAPID...");
    const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
    console.log("Chave convertida, tamanho:", applicationServerKey.length);

    // 6. Verificar/substituir subscription existente
    console.log("7. Verificando inscrição existente...");
    let subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      console.log("Subscription encontrada, cancelando...");
      await subscription.unsubscribe();
    }

    // 7. Criar nova subscription
    console.log("8. Criando nova subscription...");
    try {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
      });
      console.log("✅ Subscription criada!");
      console.log("Endpoint:", subscription.endpoint);
    } catch (subscribeError: any) {
      console.error("Erro no subscribe:", (subscribeError as Error).message);
      throw new Error(`Falha ao criar subscription: ${(subscribeError as Error).message}`);
    }

    // 8. Salvar no Supabase
    console.log("9. Salvando no Supabase...");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("Usuário não autenticado");
    }

    const subscriptionJson = subscription.toJSON();
    const { error: supabaseError } = await supabase.from("push_subscriptions").upsert({
      user_id: user.id,
      endpoint: subscriptionJson.endpoint,
      p256dh: subscriptionJson.keys?.p256dh || null,
      auth: subscriptionJson.keys?.auth || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (supabaseError) {
      console.error("Erro Supabase:", (supabaseError as Error).message);
      throw new Error(`Erro ao salvar: ${(supabaseError as Error).message}`);
    }

    // 9. Atualizar estado
    console.log("10. Atualizando estado da UI...");
    setIsSubscribed(true);
    setNotificationSettings(prev => ({ ...prev, enabled: true }));

    // 10. Notificação de sucesso
    console.log("11. Mostrando notificação de sucesso...");
    if ('showNotification' in registration) {
      await registration.showNotification("HealthCare+", {
        body: "Notificações push ativadas com sucesso!",
        icon: "/icon-light-32x32.png",
        tag: "activation-success",
        requireInteraction: true,
      });
    } else {
      new Notification("HealthCare+", {
        body: "Notificações push ativadas com sucesso!",
        icon: "/icon-light-32x32.png",
      });
    }

    console.log("=== ATIVAÇÃO CONCLUÍDA COM SUCESSO ===");
    alert("✅ Notificações push ativadas com sucesso!");

  } catch (error: any) {
    console.error("=== ERRO NA ATIVAÇÃO ===", (error as Error).message);
    console.error("Stack:", error.stack);
    
    // Mensagem amigável
    let userMessage = (error as Error).message;
    
    if (error.message.includes('secure context')) {
      userMessage = "Contexto inseguro. Acesse via https://localhost:3000 (não use IP)";
    } else if (error.message.includes('Service Workers')) {
      userMessage = "Seu navegador não suporta notificações push. Tente usar Chrome ou Firefox atualizado.";
    } else if (error.message.includes('VAPID')) {
      userMessage = "Chave VAPID não configurada. Contate o administrador.";
    }
    
    setPushError(userMessage);
  }
};

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
      setPushError("Erro: " + (error as Error).message)
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
      setPushError("Erro ao enviar notificação: " + (error as Error).message)
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

      <Card>
        <CardHeader>
          <CardTitle>Configurações do App</CardTitle>
          <CardDescription>Configure preferências de PWA</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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