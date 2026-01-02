"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

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
  e.preventDefault()
  setError(null)
  setLoading(true)

  try {
    console.log("[v0] Criando paciente...")
    const supabase = createClient()

    // Check if email exists
    const { data: existingUser } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", formData.email)
      .single()

    if (existingUser) {
      throw new Error("Este email já está registrado no sistema")
    }

    // Create user with signup (will send confirmation email)
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          role: "patient"
        },
      },
    })

    if (signUpError) {
      let errorMessage = signUpError.message
      if (signUpError.message.includes("User already registered")) {
        errorMessage = "Este email já está registrado no sistema"
      } else if (signUpError.message.includes("Password should be at least")) {
        errorMessage = "A senha deve ter pelo menos 6 caracteres"
      } else if (signUpError.message.includes("Invalid email")) {
        errorMessage = "Email inválido"
      }
      throw new Error(errorMessage)
    }

    if (!authData.user) {
      throw new Error("Falha ao criar usuário")
    }

    // Wait and update profile
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
      console.warn("[v0] Aviso ao atualizar perfil:", updateError)
      // Continue anyway - the trigger should have created it
    }

    // Success
    setFormData({ firstName: "", lastName: "", email: "", password: "" })
    onOpenChange(false)
    onPatientCreated()
    
    alert(`Paciente "${formData.firstName} ${formData.lastName}" criado!\n\nO paciente receberá um email para confirmar a conta.\n\nApós confirmar, pode fazer login com:\nEmail: ${formData.email}\nSenha: ${formData.password}`)

  } catch (err) {
    console.error("[v0] Erro:", err)
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
          <DialogDescription>
            Adicionar um novo paciente ao sistema. O paciente poderá fazer login imediatamente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Nome *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Sobrenome *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              disabled={loading}
              placeholder="paciente@exemplo.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha Temporária *</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              disabled={loading}
              minLength={6}
              placeholder="Mínimo 6 caracteres"
            />
            <p className="text-xs text-muted-foreground">
              O paciente poderá alterar esta senha no primeiro acesso.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 justify-end pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                "Criar Paciente"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
