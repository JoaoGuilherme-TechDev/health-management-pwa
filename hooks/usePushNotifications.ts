"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"

interface PushSubscriptionData {
  endpoint: string
  expirationTime: number | null
  keys: {
    p256dh: string
    auth: string
  }
}

export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  // Verificar suporte
  useEffect(() => {
    if (typeof window !== "undefined") {
      const supported = "serviceWorker" in navigator && "PushManager" in window
      setIsSupported(supported)
      setPermission(Notification.permission)

      if (supported) {
        checkSubscription()
      }
    }
  }, [])

  const checkSubscription = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready
      const sub = await registration.pushManager.getSubscription()
      setSubscription(sub)
      setIsSubscribed(!!sub)
    } catch (error) {
      console.error("Error checking subscription:", error)
    }
  }, [])

  const subscribeUser = useCallback(async () => {
    setLoading(true)
    try {
      // Solicitar permissão
      const permissionResult = await Notification.requestPermission()
      setPermission(permissionResult)

      if (permissionResult !== "granted") {
        throw new Error("Permissão para notificações não concedida")
      }

      // Registrar service worker
      const registration = await navigator.serviceWorker.register("/service-worker.js", {
        scope: "/",
      })

      // Aguardar o service worker estar pronto
      await navigator.serviceWorker.ready

      // Obter chave pública VAPID
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidPublicKey) {
        throw new Error("Chave VAPID pública não configurada")
      }

      // Converter chave para Uint8Array
      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey)

      // Inscrever para push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as BufferSource,
      })

      setSubscription(subscription)
      setIsSubscribed(true)

      // Salvar subscription no Supabase
      await saveSubscription(subscription)

      console.log("Usuário inscrito com sucesso:", subscription)
      return subscription
    } catch (error) {
      console.error("Erro ao inscrever usuário:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const unsubscribeUser = useCallback(async () => {
    setLoading(true)
    try {
      if (!subscription) {
        throw new Error("Nenhuma subscription ativa")
      }

      // Cancelar subscription
      const unsubscribed = await subscription.unsubscribe()
      if (unsubscribed) {
        setSubscription(null)
        setIsSubscribed(false)

        // Remover do Supabase
        await deleteSubscription(subscription)
        console.log("Usuário desinscrito com sucesso")
      }
    } catch (error) {
      console.error("Erro ao desinscrever usuário:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [subscription])

  const saveSubscription = async (subscription: PushSubscription) => {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) {
      throw new Error("Usuário não autenticado")
    }

    const subscriptionData: PushSubscriptionData = {
      endpoint: subscription.endpoint,
      expirationTime: subscription.expirationTime,
      keys: {
        p256dh: arrayBufferToBase64(subscription.getKey("p256dh")!),
        auth: arrayBufferToBase64(subscription.getKey("auth")!),
      },
    }

    const { error } = await supabase.from("push_subscriptions").upsert({
      user_id: userData.user.id,
      endpoint: subscriptionData.endpoint,
      p256dh_key: subscriptionData.keys.p256dh,
      auth_key: subscriptionData.keys.auth,
      expiration_time: subscriptionData.expirationTime,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (error) throw error
  }

  const deleteSubscription = async (subscription: PushSubscription) => {
    const { error } = await supabase.from("push_subscriptions").delete().eq("endpoint", subscription.endpoint)
    if (error) throw error
  }

  // Helper functions
  const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
    const rawData = atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer)
    let binary = ""
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }

  return {
    isSupported,
    isSubscribed,
    subscription,
    permission,
    loading,
    subscribeUser,
    unsubscribeUser,
    checkSubscription,
  }
}
