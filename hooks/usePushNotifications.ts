"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"

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

    const response = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: userData.user.id,
        subscription: subscription,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Erro ao salvar subscription")
    }
  }

  const deleteSubscription = async (subscription: PushSubscription) => {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) return

    const response = await fetch(`/api/push/subscribe?userId=${userData.user.id}`, {
      method: "DELETE",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Erro ao deletar subscription")
    }
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
