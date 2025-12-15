"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export function PushNotificationProvider({ children }: { children: React.ReactNode }) {
  const [hasPermission, setHasPermission] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)

  useEffect(() => {
    if ("Notification" in window && "serviceWorker" in navigator) {
      setHasPermission(Notification.permission === "granted")

      // Registrar service worker
      navigator.serviceWorker
        .register("/service-worker.js")
        .then((registration) => {
          console.log("[v0] Service Worker registrado com sucesso:", registration.scope)

          // Verificar se já está inscrito
          registration.pushManager.getSubscription().then((subscription) => {
            if (subscription) {
              console.log("[v0] Já inscrito em push notifications")
              setIsSubscribed(true)
            }
          })
        })
        .catch((error) => {
          console.error("[v0] Erro ao registrar Service Worker:", error)
        })

      // Escutar mensagens do service worker
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data?.type === "NOTIFICATION_CLICKED") {
          console.log("[v0] Notificação clicada:", event.data.url)
          if (event.data.url) {
            window.location.href = event.data.url
          }
        }
      })
    }
  }, [])

  const subscribeToNotifications = async () => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      alert("Seu navegador não suporta notificações push")
      return false
    }

    // Solicitar permissão
    const permission = await Notification.requestPermission()
    if (permission !== "granted") {
      alert("Permissão para notificações negada")
      return false
    }

    setHasPermission(true)

    try {
      const registration = await navigator.serviceWorker.ready

      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

      if (!vapidPublicKey) {
        console.error("[v0] NEXT_PUBLIC_VAPID_PUBLIC_KEY não configurada")
        alert("Erro de configuração: chaves VAPID não encontradas")
        return false
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      })

      console.log("[v0] Inscrito em push notifications:", subscription)

      // Salvar subscription no banco de dados
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { error } = await supabase.from("push_subscriptions").upsert({
          user_id: user.id,
          subscription: subscription.toJSON(),
          updated_at: new Date().toISOString(),
        })

        if (error) {
          console.error("[v0] Erro ao salvar subscription:", error)
        } else {
          console.log("[v0] Subscription salva com sucesso")
          setIsSubscribed(true)
        }
      }

      return true
    } catch (error) {
      console.error("[v0] Erro ao inscrever em notificações:", error)
      alert("Erro ao ativar notificações. Verifique as configurações.")
      return false
    }
  }

  return (
    <>
      {children}
      <div
        style={{ display: "none" }}
        data-notification-handler={JSON.stringify({
          hasPermission,
          isSubscribed,
          subscribeToNotifications,
        })}
      />
    </>
  )
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

// Hook para usar notificações
export function useNotifications() {
  const [hasPermission, setHasPermission] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)

  useEffect(() => {
    if ("Notification" in window) {
      setHasPermission(Notification.permission === "granted")
    }

    // Verificar se está inscrito
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.pushManager.getSubscription().then((subscription) => {
          setIsSubscribed(!!subscription)
        })
      })
    }
  }, [])

  const requestPermission = async () => {
    if (!("Notification" in window)) {
      return false
    }

    const permission = await Notification.requestPermission()
    if (permission === "granted") {
      setHasPermission(true)
      return true
    }

    return false
  }

  const sendNotification = (title: string, options?: NotificationOptions) => {
    if (hasPermission && "Notification" in window) {
      new Notification(title, {
        icon: "/icon.svg",
        badge: "/icon-light-32x32.png",
        ...options,
      })
    }
  }

  return { hasPermission, isSubscribed, requestPermission, sendNotification }
}
