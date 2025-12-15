"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { ChevronLeft, Eye, EyeOff } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error

      console.log("[v0] Usuário logado:", data.user.id)

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single()

      console.log("[v0] Perfil encontrado:", profile)

      if (profileError) {
        console.error("[v0] Erro ao buscar perfil:", profileError)
        throw new Error("Erro ao buscar perfil do usuário")
      }

      const userRole = profile?.role || "patient"
      console.log("[v0] Role do usuário:", userRole)

      if (userRole === "admin") {
        console.log("[v0] Redirecionando para /admin")
        window.location.href = "/admin"
      } else {
        console.log("[v0] Redirecionando para /patient")
        window.location.href = "/patient"
      }
    } catch (error: unknown) {
      console.error("[v0] Erro no login:", error)
      setError(error instanceof Error ? error.message : "Ocorreu um erro")
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/")}
          className="mb-6 flex items-center gap-2 -ml-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar
        </Button>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2 text-center">
            <h1 className="text-2xl font-bold">HealthCare+</h1>
            <p className="text-sm text-muted-foreground">Sua Saúde, Nossa Prioridade</p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Entrar</CardTitle>
              <CardDescription>Digite seu email e senha para acessar sua conta</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin}>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="voce@exemplo.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Senha</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Entrando..." : "Entrar"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
