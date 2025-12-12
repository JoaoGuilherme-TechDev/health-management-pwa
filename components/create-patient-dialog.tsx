"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface CreatePatientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPatientCreated: () => void
}

export function CreatePatientDialog({ open, onOpenChange, onPatientCreated }: CreatePatientDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    setError(null)
    setLoading(true)

    try {
      console.log("[v0] Criando paciente...")
      const supabase = createClient()

      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
          },
        },
      })

      if (signUpError) {
        console.error("[v0] Erro no signup:", signUpError)
        throw new Error(signUpError.message)
      }

      if (!authData.user) {
        throw new Error("Falha ao criar usuário")
      }

      console.log("[v0] Usuário criado:", authData.user.id)

      await new Promise((resolve) => setTimeout(resolve, 1000))

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          role: "patient",
        })
        .eq("id", authData.user.id)

      if (updateError) {
        console.error("[v0] Erro ao atualizar perfil:", updateError)
      } else {
        console.log("[v0] Perfil atualizado com sucesso")
      }

      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
      })
      onOpenChange(false)
      onPatientCreated()
    } catch (err) {
      console.error("[v0] Erro ao criar paciente:", err)
      setError(err instanceof Error ? err.message : "Falha ao criar paciente")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Novo Paciente</DialogTitle>
          <DialogDescription>Adicionar um novo paciente ao sistema</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Nome</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Sobrenome</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={6}
            />
          </div>

          {error && <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{error}</div>}

          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Criando..." : "Criar Paciente"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
