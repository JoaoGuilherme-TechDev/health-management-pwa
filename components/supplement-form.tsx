"use client"

  import type React from "react"

  import { createClient } from "@/lib/supabase/client"
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
  const supabase = createClient()

    const handleImageUpload = async (file: File) => {
      const timestamp = Date.now()
      const path = `supplements/${timestamp}-${file.name}`
      const { data, error } = await supabase.storage.from("supplements").upload(path, file)
      if (!error && data) {
        const { data: urlData } = supabase.storage.from("supplements").getPublicUrl(path)
        setFormData({ ...formData, image_url: urlData.publicUrl })
      }
      const handleImageUpload = async (file: File) => {
    // ... keep existing image upload logic (bucket name can stay as "supplements")
    const timestamp = Date.now()
    const path = `supplements/${timestamp}-${file.name}`
    const { data, error } = await supabase.storage.from("supplements").upload(path, file)
    if (!error && data) {
      const { data: urlData } = supabase.storage.from("supplements").getPublicUrl(path)
      setFormData({ ...formData, image_url: urlData.publicUrl })
    }
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

    let result
    if (supplement?.id) {
      result = await supabase
        .from("supplement_catalog")  // CORRECT TABLE NAME
        .update(payload)
        .eq("id", supplement.id)
        .select()
    } else {
      result = await supabase
        .from("supplement_catalog")  // CORRECT TABLE NAME
        .insert([payload])
        .select()
    }

    console.log("Supabase response:", result)

    if (result.error) {
      console.error("Error:", result.error)
      alert(`Erro ao salvar suplemento: ${result.error.message}`)
    } else {
      alert(supplement ? "Suplemento atualizado!" : "Suplemento adicionado!")
      setFormData({
        name: "",
        benefit: "",
        dosage: "",
        image_url: "",
      })
      onSuccess()
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
