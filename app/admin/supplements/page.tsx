"use client"

import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Trash2, Edit2, Plus } from "lucide-react"
import SupplementForm from "@/components/supplement-form"

export default function SupplementsPage() {
  const [supplements, setSupplements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingSupplement, setEditingSupplement] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    loadSupplements()
  }, [])

  const loadSupplements = async () => {
    const { data, error } = await supabase.from("supplements").select("*").order("created_at", { ascending: false })
    if (!error) {
      setSupplements(data || [])
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this supplement?")) {
      await supabase.from("supplements").delete().eq("id", id)
      loadSupplements()
    }
  }

  if (loading) return <div className="text-center py-12">Loading supplements...</div>

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Manage Supplements</h1>
          <p className="text-muted-foreground mt-2">Add, edit, or delete recommended supplements</p>
        </div>
        <Button
          onClick={() => {
            setEditingSupplement(null)
            setShowForm(!showForm)
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Supplement
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
                  <p className="text-sm font-medium text-foreground">Dosage: {supplement.dosage}</p>
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
            <p className="text-muted-foreground mb-4">No supplements yet. Create your first one!</p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Supplement
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
