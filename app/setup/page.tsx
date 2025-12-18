"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function SetupPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [adminCreated, setAdminCreated] = useState(false)
  const [adminCredentials, setAdminCredentials] = useState<{
    email: string
    password: string
  } | null>(null)

  useEffect(() => {
    // Check if admin already exists
    checkAdminExists()
  }, [])

  const checkAdminExists = async () => {
    try {
      const supabase = createClient()
      const { data } = await supabase.from("profiles").select("id").eq("role", "admin").limit(1)

      if (data && data.length > 0) {
        // Admin exists, redirect to login
        setTimeout(() => {
          router.push("/auth/login")
        }, 2000)
      }
    } catch (err) {
      console.error("Erro ao verificar admin:", err)
    }
  }

  const handleCreateAdmin = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/setup/create-admin", {
        method: "POST",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Falha ao criar admin")
      }

      const data = await response.json()
      console.log("[v0] Admin criado:", data)

      setAdminCredentials({
        email: data.email,
        password: data.password,
      })
      setAdminCreated(true)

      // Redirect after 5 seconds
      setTimeout(() => {
        router.push("/auth/login")
      }, 5000)
    } catch (err) {
      console.error("[v0] Erro ao criar admin:", err)
      setError(err instanceof Error ? err.message : "Ocorreu um erro")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Configuração Healthcare+</CardTitle>
          <CardDescription>Inicialize sua conta de administrador</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {adminCreated && adminCredentials ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-3">✓ Conta Admin Criada com Sucesso!</h3>
                <div className="space-y-2 text-sm text-green-800">
                  <p>
                    <strong>Email:</strong>{" "}
                    <code className="bg-white px-2 py-1 rounded border border-green-300">{adminCredentials.email}</code>
                  </p>
                  <p>
                    <strong>Senha:</strong>{" "}
                    <code className="bg-white px-2 py-1 rounded border border-green-300">
                      {adminCredentials.password}
                    </code>
                  </p>
                </div>
                <p className="text-xs text-green-700 mt-3">
                  ⚠️ Salve estas credenciais com segurança. Você será redirecionado para o login em breve.
                </p>
              </div>
              <Button disabled className="w-full bg-transparent" variant="outline">
                Redirecionando para login...
              </Button>
            </div>
          ) : error ? (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-900 mb-2">Erro</h3>
                <p className="text-sm text-red-800">{error}</p>
              </div>
              <Button onClick={() => setError(null)} className="w-full">
                Tentar Novamente
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Clique no botão abaixo para criar sua conta de administrador e inicializar o sistema.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
                <strong>Credenciais Padrão do Admin:</strong>
                <br />
                Email: admin@example.com
                <br />
                Senha: Admin123456!
              </div>
              <Button onClick={handleCreateAdmin} disabled={isLoading} className="w-full" size="lg">
                {isLoading ? "Criando Admin..." : "Criar Conta Admin"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
