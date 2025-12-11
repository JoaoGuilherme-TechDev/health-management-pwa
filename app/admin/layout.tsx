"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Heart, LogOut, Home, Users, TrendingUp, AlertCircle, Settings } from "lucide-react"
import Link from "next/link"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      console.log("[v0] Admin Layout - Usuário:", user?.id)

      if (!user) {
        router.push("/auth/login")
        return
      }

      // Check if user is admin
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

      console.log("[v0] Admin Layout - Perfil encontrado:", profile)
      console.log("[v0] Admin Layout - Role:", profile?.role)

      if (profile?.role !== "admin") {
        console.log("[v0] Admin Layout - Não é admin, redirecionando para /patient")
        router.push("/patient")
        return
      }

      console.log("[v0] Admin Layout - É admin, autorizando acesso")
      setIsAuthorized(true)
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
          <p className="text-muted-foreground">Verificando acesso...</p>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-foreground">HealthCare+ Admin</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden md:flex w-64 border-r border-border bg-muted/30 flex-col">
          <nav className="flex-1 space-y-2 p-6">
            <NavLink href="/admin" icon={Home} label="Painel" />
            <NavLink href="/admin/patients" icon={Users} label="Pacientes" />
            <NavLink href="/admin/health-metrics" icon={TrendingUp} label="Métricas de Saúde" />
            <NavLink href="/admin/alerts" icon={AlertCircle} label="Alertas de Saúde" />
            <NavLink href="/admin/settings" icon={Settings} label="Configurações" />
          </nav>
        </aside>

        {/* Mobile Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-background/95 backdrop-blur">
          <nav className="flex items-center justify-around p-3">
            <MobileNavLink href="/admin" icon={Home} />
            <MobileNavLink href="/admin/patients" icon={Users} />
            <MobileNavLink href="/admin/health-metrics" icon={TrendingUp} />
            <MobileNavLink href="/admin/alerts" icon={AlertCircle} />
            <MobileNavLink href="/admin/settings" icon={Settings} />
          </nav>
        </div>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 md:pb-6">{children}</main>
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

function MobileNavLink({ href, icon: Icon }: { href: string; icon: any }) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-1 px-3 py-2 text-muted-foreground hover:text-foreground transition-colors"
    >
      <Icon className="h-5 w-5" />
    </Link>
  )
}
