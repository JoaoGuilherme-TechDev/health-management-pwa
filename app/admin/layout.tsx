"use client"

import type React from "react"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Heart, LogOut, Home, Users, Settings, Utensils, Pill, Bell, Dumbbell } from "lucide-react"
import { Logo } from "@/components/logo"
import Link from "next/link"
import { ModeToggle } from "@/components/mode-toggle"
import { useAuth } from "@/hooks/use-auth"


export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const [checkingRole, setCheckingRole] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      if (authLoading) return

      if (!user) {
        router.push("/login")
        return
      }

      // Check if user is admin
      try {
        const res = await fetch(`/api/data?table=profiles&match_key=id&match_value=${user.id}`)
        if (res.ok) {
          const data = await res.json()
          const profile = Array.isArray(data) ? data[0] : data
          
          if (profile?.role !== "admin") {
            router.push("/patient")
            return
          }
        }
      } catch (e) {
        console.error("Role check error", e)
      }

      setCheckingRole(false)
    }

    checkAuth()
  }, [router, user, authLoading])

  const handleLogout = async () => {
    await fetch('/api/auth/signout', { method: 'POST' })
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("er_session")
    }
    router.push("/")
  }

  if (authLoading || checkingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Heart className="h-8 w-8 animate-pulse text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verificando acesso...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Top Navigation - Mobile optimized */}
      <nav className="border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2">
            <Logo className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="text-base sm:text-xl font-bold text-foreground font-logo">Dra. Estefânia Rappelli Admin</span>
          </Link>
          <div className="flex items-center gap-2">
            <ModeToggle />
            <Button onClick={handleLogout} variant="destructive" className="gap-2">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>

      <div className="flex flex-1">
        {/* Sidebar - Desktop only */}
        <aside className="hidden md:flex w-64 border-r border-border bg-muted/30 flex-col">
          <nav className="flex-1 space-y-2 p-6">
            <NavLink href="/admin" icon={Home} label="Painel" />
            <NavLink href="/admin/patients" icon={Users} label="Pacientes" />
            <NavLink href="/admin/recipes" icon={Utensils} label="Recomendações Receitas" />
            <NavLink href="/admin/supplements" icon={Dumbbell} label="Recomendações Suplementos" />
            <NavLink href="/admin/settings" icon={Settings} label="Configurações" />
          </nav>
        </aside>

        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/98 backdrop-blur-md shadow-lg safe-area-bottom">
          <nav className="flex items-center justify-between overflow-x-auto no-scrollbar mobile-scroll px-2 py-2">
            <MobileNavLink href="/admin" icon={Home} label="Painel" />
            <MobileNavLink href="/admin/patients" icon={Users} label="Pacientes" />
            <MobileNavLink href="/admin/recipes" icon={Utensils} label="Receitas" />
            <MobileNavLink href="/admin/supplements" icon={Dumbbell} label="Suplementos" />
            <MobileNavLink href="/admin/settings" icon={Settings} label="Configurações" />
          </nav>
        </div>

        {/* Main Content - Mobile optimized padding with safe area */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 pb-24 md:pb-6 max-w-full overflow-x-hidden overflow-y-auto">{children}</main>
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
      className="shrink-0 flex flex-col items-center justify-center gap-1 px-3 py-2.5 min-w-16 text-muted-foreground hover:text-foreground transition-colors active:bg-accent/20 rounded-lg touch-manipulation"
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span className="text-[10px] font-medium text-center leading-tight whitespace-nowrap">{label}</span>
    </Link>
  )
}
