"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Trash2, Edit2, Plus, Dumbbell } from "lucide-react"
import SupplementForm from "@/components/supplement-form"

export default function SupplementsPage() {
  const [supplements, setSupplements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingSupplement, setEditingSupplement] = useState<any>(null)

  useEffect(() => {
    loadSupplements()
  }, [])

  const loadSupplements = async () => {
    try {
      const res = await fetch("/api/data?table=supplement_catalog")
      if (res.ok) {
        const data = await res.json()
        setSupplements(data || [])
      }
    } catch (error) {
      console.error("Error loading supplements:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza de que deseja excluir este suplemento?")) {
      try {
        await fetch(`/api/data?table=supplement_catalog&match_key=id&match_value=${id}`, {
          method: 'DELETE'
        })
        loadSupplements()
      } catch (error) {
        console.error("Error deleting supplement:", error)
        alert("Erro ao excluir suplemento")
      }
    }
  }

  if (loading) return <div className="text-center py-12">Carregando suplementos...</div>

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gerenciar Suplementos</h1>
          <p className="text-muted-foreground mt-2">Adicione, edite ou exclua suplementos recomendados</p>
        </div>
        <Button
          onClick={() => {
            setEditingSupplement(null)
            setShowForm(!showForm)
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Suplemento
        </Button>
      </div>

      {showForm && (
        <SupplementForm
          supplement={editingSupplement}
          onSuccess={() => {
            setShowForm(false)
            setEditingSupplement(null)
            loadSupplements()
          }}
          onCancel={() => {
            setShowForm(false)
            setEditingSupplement(null)
          }}
        />
      )}

      <div className="grid gap-6">
        {supplements.map((supplement) => (
          <Card key={supplement.id}>
            <CardContent className="pt-6">
              <div className="flex gap-6">
                {supplement.image_url && (
                  <img
                    src={supplement.image_url || "/placeholder.svg"}
                    alt={supplement.name}
                    className="w-32 h-32 object-cover rounded-lg"
                  />
                )}
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-foreground mb-2">{supplement.name}</h3>
                  <p className="text-muted-foreground mb-4">{supplement.benefit}</p>
                  <p className="text-sm font-medium text-foreground">Dosagem: {supplement.dosage}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingSupplement(supplement)
                      setShowForm(true)
                    }}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(supplement.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {supplements.length === 0 && !showForm && (
        <Card>
          <CardContent className="pt-12 text-center">
            <Dumbbell className="h-12 w-12 text-foreground inline-block mr-2" />
            <p className="text-muted-foreground mb-4">Ainda não há suplementos. Crie o primeiro!</p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Suplemento
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
