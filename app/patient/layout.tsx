"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Heart, Home, Pill, Calendar, Bell, Settings, UtensilsCrossed, Activity } from "lucide-react"
import Link from "next/link"

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const [isSignedIn, setIsSignedIn] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      console.log("[v0] Patient Layout - Usuário:", user?.id)

      if (!user) {
        router.push("/auth/login")
        return
      }

      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

      console.log("[v0] Patient Layout - Perfil encontrado:", profile)
      console.log("[v0] Patient Layout - Role:", profile?.role)

      if (profile?.role === "admin") {
        console.log("[v0] Patient Layout - É admin, redirecionando para /admin")
        router.push("/admin")
        return
      }

      console.log("[v0] Patient Layout - É paciente, autorizando acesso")
      setIsSignedIn(true)
      setIsLoading(false)
    }

    checkAuth()
  }, [router])

  useEffect(() => {
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data?.type === "PLAY_ALARM") {
          console.log("[v0] Reproduzindo alarme para:", event.data.medication)
          playMedicationAlarm()
        }
      })
    }
  }, [])

  const playMedicationAlarm = () => {
    try {
      // Criar contexto de áudio
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

      // Criar oscilador para som de alarme
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      // Configurar som de alarme (frequência alta e intermitente)
      oscillator.type = "sine"
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime) // Lá5 (880 Hz)

      // Padrão de volume: crescente e decrescente
      gainNode.gain.setValueAtTime(0, audioContext.currentTime)
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.1)
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.5)

      // Tocar o som
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.5)

      // Repetir 3 vezes
      setTimeout(() => {
        const osc2 = audioContext.createOscillator()
        const gain2 = audioContext.createGain()
        osc2.connect(gain2)
        gain2.connect(audioContext.destination)
        osc2.type = "sine"
        osc2.frequency.setValueAtTime(880, audioContext.currentTime)
        gain2.gain.setValueAtTime(0, audioContext.currentTime)
        gain2.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.1)
        gain2.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.5)
        osc2.start(audioContext.currentTime)
        osc2.stop(audioContext.currentTime + 0.5)
      }, 600)

      setTimeout(() => {
        const osc3 = audioContext.createOscillator()
        const gain3 = audioContext.createGain()
        osc3.connect(gain3)
        gain3.connect(audioContext.destination)
        osc3.type = "sine"
        osc3.frequency.setValueAtTime(880, audioContext.currentTime)
        gain3.gain.setValueAtTime(0, audioContext.currentTime)
        gain3.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.1)
        gain3.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.5)
        osc3.start(audioContext.currentTime)
        osc3.stop(audioContext.currentTime + 0.5)
      }, 1200)

      console.log("[v0] Alarme de medicamento tocado com sucesso")
    } catch (error) {
      console.error("[v0] Erro ao reproduzir alarme:", error)
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Heart className="h-8 w-8 animate-pulse text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!isSignedIn) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation - Mobile optimized */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between">
          <Link href="/patient" className="flex items-center gap-2">
            <Heart className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            <span className="text-base sm:text-xl font-bold text-foreground">HealthCare+</span>
          </Link>
        </div>
      </nav>

      <div className="flex">
        <aside className="hidden md:flex w-64 border-r border-border bg-muted/30 flex-col">
          <nav className="flex-1 space-y-2 p-6">
            <NavLink href="/patient" icon={Home} label="Painel" />
            <NavLink href="/patient/medications" icon={Pill} label="Medicamentos" />
            <NavLink href="/patient/diet" icon={UtensilsCrossed} label="Dieta" />
            <NavLink href="/patient/supplements" icon={Pill} label="Suplementos" />
            <NavLink href="/patient/evolution" icon={Activity} label="Evolução Física" />
            <NavLink href="/patient/appointments" icon={Calendar} label="Consultas" />
            <NavLink href="/patient/notifications" icon={Bell} label="Notificações" />
            <NavLink href="/patient/settings" icon={Settings} label="Configurações" />
          </nav>
        </aside>

        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur shadow-lg">
          <nav className="flex items-center overflow-x-auto no-scrollbar mobile-scroll px-2 py-2">
            <MobileNavLink href="/patient" icon={Home} label="Início" />
            <MobileNavLink href="/patient/medications" icon={Pill} label="Remédios" />
            <MobileNavLink href="/patient/diet" icon={UtensilsCrossed} label="Dieta" />
            <MobileNavLink href="/patient/supplements" icon={Pill} label="Suplem" />
            <MobileNavLink href="/patient/evolution" icon={Activity} label="Evolução" />
            <MobileNavLink href="/patient/appointments" icon={Calendar} label="Consultas" />
            <MobileNavLink href="/patient/notifications" icon={Bell} label="Avisos" />
            <MobileNavLink href="/patient/settings" icon={Settings} label="Config" />
          </nav>
        </div>

        {/* Main Content - Mobile optimized padding */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 pb-20 md:pb-6">{children}</main>
      </div>
    </div>
  )
}

function NavLink({ href, icon: Icon, label }: { href: string; icon: any; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
    >
      <Icon className="h-5 w-5" />
      {label}
    </Link>
  )
}

function MobileNavLink({ href, icon: Icon, label }: { href: string; icon: any; label: string }) {
  return (
    <Link
      href={href}
      className="flex-shrink-0 flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-[70px] text-muted-foreground hover:text-foreground transition-colors active:bg-muted/50 rounded-lg"
    >
      <Icon className="h-5 w-5" />
      <span className="text-[10px] font-medium text-center leading-tight">{label}</span>
    </Link>
  )
}
