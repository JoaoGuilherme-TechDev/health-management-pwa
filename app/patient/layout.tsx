"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Heart, Home, Pill, Calendar, Settings, UtensilsCrossed, Activity, Bell, Dumbbell,  FileText, LogOut } from "lucide-react"
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
      <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between">
          <Link href="/patient" className="flex items-center gap-2">
            <Heart className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            <span className="text-base sm:text-xl font-bold text-foreground">HealthCare+</span>
          </Link>
          <Button onClick={handleLogout} variant="destructive" className="gap-2">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </nav>

      <div className="flex">
        <aside className="hidden md:flex w-64 border-r border-border bg-muted/30 flex-col">
          <nav className="flex-1 space-y-2 p-6">
            <NavLink href="/patient" icon={Home} label="Painel" />
            <NavLink href="/patient/medications" icon={Pill} label="Medicamentos" />
            <NavLink href="/patient/appointments" icon={Calendar} label="Consultas" />
            <NavLink href="/patient/prescriptions" icon={FileText} label="Receitas Médicas" />
            <NavLink href="/patient/diet" icon={UtensilsCrossed} label="Dieta" />
            <NavLink href="/patient/supplements" icon={Dumbbell} label="Suplementos" />
            <NavLink href="/patient/evolution" icon={Activity} label="Evolução Física" />
            <NavLink href="/patient/settings" icon={Settings} label="Configurações" />
          </nav>
        </aside>

        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur shadow-lg">
          <nav className="flex items-center overflow-x-auto no-scrollbar mobile-scroll px-2 py-2">
            <MobileNavLink href="/patient" icon={Home} label="Início" />
            <MobileNavLink href="/patient/medications" icon={Pill} label="Remédios" />
            <MobileNavLink href="/patient/appointments" icon={Calendar} label="Consultas" />
            <MobileNavLink href="/patient/prescriptions" icon={FileText} label="Receitas Médicas" />
            <MobileNavLink href="/patient/diet" icon={UtensilsCrossed} label="Dieta" />
            <MobileNavLink href="/patient/supplements" icon={Dumbbell} label="Suplementos" />
            <MobileNavLink href="/patient/evolution" icon={Activity} label="Evolução" />
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
      className="shrink-0 flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-17.5 text-muted-foreground hover:text-foreground transition-colors active:bg-muted/50 rounded-lg"

    >
      <Icon className="h-5 w-5" />
      <span className="text-[10px] font-medium text-center leading-tight">{label}</span>
    </Link>
  )
}
