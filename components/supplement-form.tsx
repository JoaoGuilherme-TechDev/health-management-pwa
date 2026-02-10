"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { X } from "lucide-react"

interface SupplementFormProps {
  supplement?: any
  onSuccess: () => void
  onCancel: () => void
}

export default function SupplementForm({ supplement, onSuccess, onCancel }: SupplementFormProps) {
  const [formData, setFormData] = useState({
    name: supplement?.name || "",
    benefit: supplement?.benefit || "",
    dosage: supplement?.dosage || "",
    image_url: supplement?.image_url || "",
  })
  const [loading, setLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string>(supplement?.image_url || "")

  const handleImageUpload = async (file: File) => {
    try {
      const timestamp = Date.now()
      const path = `supplements/${timestamp}-${file.name}`
      
      const form = new FormData()
      form.append("file", file)
      form.append("bucket", "supplements")
      form.append("path", path)

      const res = await fetch("/api/upload", {
        method: "POST",
        body: form
      })
      
      const data = await res.json()

      if (res.ok && data.publicUrl) {
        setFormData({ ...formData, image_url: data.publicUrl })
        setImagePreview(data.publicUrl)
      } else {
        alert("Erro ao fazer upload da imagem: " + (data.error || "Erro desconhecido"))
      }
    } catch (err: any) {
      alert("Erro ao fazer upload: " + err.message)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const payload = {
      name: formData.name.trim(),
      benefit: formData.benefit.trim(),
      dosage: formData.dosage.trim(),
      image_url: formData.image_url || null,
    }

    console.log("Submitting to supplement_catalog:", payload)

    try {
      let res
      if (supplement?.id) {
        res = await fetch(`/api/data?table=supplement_catalog&match_key=id&match_value=${supplement.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
      } else {
        res = await fetch(`/api/data?table=supplement_catalog`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
      }

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro ao salvar")
      }

      alert(supplement ? "Suplemento atualizado!" : "Suplemento adicionado!")
      setFormData({
        name: "",
        benefit: "",
        dosage: "",
        image_url: "",
      })
      setImagePreview("")
      onSuccess()

    } catch (error: any) {
      console.error("Error:", error)
      alert(`Erro ao salvar suplemento: ${error.message}`)
    }

    setLoading(false)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>{supplement ? "Editar Suplemento" : "Adicionar Novo Suplemento"}</CardTitle>
        <button onClick={onCancel} className="p-1 hover:bg-muted rounded">
          <X className="h-5 w-5" />
        </button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">Nome</label>
            <Input
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nome do suplemento"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Benefício</label>
            <Input
              required
              value={formData.benefit}
              onChange={(e) => setFormData({ ...formData, benefit: e.target.value })}
              placeholder="Benefício para a saúde"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Dosagem</label>
            <Input
              required
              value={formData.dosage}
              onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
              placeholder="ex.: 1000mg diários"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Imagem do Suplemento</label>
            <div className="space-y-2">
              {imagePreview && (
                <div className="relative w-full h-32 bg-muted rounded-lg overflow-hidden">
                  <img src={imagePreview || "/placeholder.svg"} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleImageUpload(file)
                }}
                className="block w-full text-sm border border-border rounded-lg cursor-pointer bg-background"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : supplement ? "Atualizar Suplemento" : "Adicionar Suplemento"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
