"use client"

import type React from "react"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Heart,
  Home,
  Pill,
  Calendar,
  Settings,
  UtensilsCrossed,
  Activity,
  Bell,
  Dumbbell,
  FileText,
  LogOut,
} from "lucide-react"
import { Logo } from "@/components/logo"
import Link from "next/link"
import { NotificationCenter } from "@/components/notification-center"
import { useAuth } from "@/hooks/use-auth"
import { ModeToggle } from "@/components/mode-toggle"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function PatientLayout({ children }: { children: React.ReactNode }) {
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

      try {
        const res = await fetch(`/api/data?table=profiles&match_key=id&match_value=${user.id}`)
        if (res.ok) {
          const data = await res.json()
          const profile = Array.isArray(data) ? data[0] : data
          
          if (profile?.role === "admin") {
            router.push("/admin")
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
          <p className="text-muted-foreground">Carregando...</p>
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
          <Link href="/patient" className="flex items-center gap-2">
            <Logo className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="text-base sm:text-xl font-bold text-foreground font-logo">Dra. Estefânia Rappelli</span>
          </Link>
          <div className="flex items-center gap-6" >
            <NotificationCenter/>
            <ModeToggle />
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="gap-2">
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Sair</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Tem certeza que deseja sair?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Você precisará fazer login novamente para acessar sua conta.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleLogout} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Sair
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden md:flex w-64 border-r border-border bg-muted/30 flex-col overflow-y-auto">
          <nav className="flex-1 space-y-2 p-6">
            <NavLink href="/patient" icon={Home} label="Painel" />
            <NavLink href="/patient/medications" icon={Pill} label="Medicamentos" />
            <NavLink href="/patient/appointments" icon={Calendar} label="Consultas" />
            <NavLink href="/patient/prescriptions" icon={FileText} label="Receitas Médicas" />
            <NavLink href="/patient/diet" icon={UtensilsCrossed} label="Dieta" />
            <NavLink href="/patient/evolution" icon={Activity} label="Evolução" />
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
            <MobileNavLink href="/patient/evolution" icon={Activity} label="Evolução" />
            <MobileNavLink href="/patient/settings" icon={Settings} label="Config" />
          </nav>
        </div>

        {/* Main Content - Mobile optimized padding */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 pb-20 md:pb-6 overflow-y-auto">{children}</main>
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
