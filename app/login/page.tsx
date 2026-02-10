"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { ChevronLeft, Eye, EyeOff } from "lucide-react"
import { Logo } from "@/components/logo"
import { ModeToggle } from "@/components/mode-toggle"
import { useAuth } from "@/hooks/use-auth"

export default function LoginPage() {
  const { user, loading: authLoading } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const redirectIfLoggedIn = async () => {
      if (authLoading) return

      if (user) {
        router.replace("/patient")
      }
    }

    redirectIfLoggedIn()
  }, [user, authLoading, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Erro ao realizar login")
      }

      console.log("[v0] Usuário logado:", data.user.id)

      // Refresh page or redirect based on role
      const userRole = data.user.role || "patient"
      console.log("[v0] Role do usuário:", userRole)

      if (userRole === "admin") {
        console.log("[v0] Redirecionando para /admin")
        router.push("/admin")
      } else {
        console.log("[v0] Redirecionando para /patient")
        router.push("/patient")
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
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/")}
            className="flex items-center gap-2 -ml-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Voltar
          </Button>
          <ModeToggle />
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2 text-center items-center">
            <Logo className="h-16 w-16 mb-2" />
            <h1 className="text-2xl font-bold font-logo">Dra. Estefânia Rappelli</h1>
            <p className="text-sm text-muted-foreground">Nutrologia e Performance</p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Entrar</CardTitle>
              <CardDescription>
                Digite seu email abaixo para entrar na sua conta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin}>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="m@example.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <div className="flex items-center">
                      <Label htmlFor="password">Senha</Label>
                      {/* <a
                        href="#"
                        className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                      >
                        Esqueceu sua senha?
                      </a> */}
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>
                  {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Entrando..." : "Entrar"}
                  </Button>
                </div>
                {/* <div className="mt-4 text-center text-sm">
                  Não tem uma conta?{" "}
                  <a href="#" className="underline underline-offset-4">
                    Cadastre-se
                  </a>
                </div> */}
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
