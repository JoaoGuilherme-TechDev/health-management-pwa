import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST() {
  const supabase = await createClient()

  try {
    const now = new Date()
    const today = now.toISOString().split("T")[0]

    const { data: medications } = await supabase
      .from("medications")
      .select("*")
      .or(`end_date.is.null,end_date.gte.${today}`)
      .lte("start_date", today)

    if (!medications || medications.length === 0) {
      return NextResponse.json({ message: "Nenhum medicamento ativo" })
    }

    console.log("[v0] Criando lembretes para", medications.length, "medicamentos")

    for (const med of medications) {
      const last12Hours = new Date(now.getTime() - 12 * 60 * 60 * 1000)

      const { data: existingNotif } = await supabase
        .from("notifications")
        .select("id")
        .eq("user_id", med.user_id)
        .eq("notification_type", "medication_reminder")
        .gte("created_at", last12Hours.toISOString())
        .ilike("message", `%${med.name}%`)
        .maybeSingle()

      if (!existingNotif) {
        await supabase.from("notifications").insert({
          user_id: med.user_id,
          title: "Lembrete de Medicamento",
          message: `Hora de tomar: ${med.name} (${med.dosage}) - ${med.frequency}`,
          notification_type: "medication_reminder",
          action_url: "/patient/medications",
        })

        console.log("[v0] Lembrete de medicamento criado para paciente", med.user_id, "- Med:", med.name)
      } else {
        console.log("[v0] Lembrete já existe para", med.name)
      }
    }

    return NextResponse.json({ message: "Lembretes de medicamento processados", count: medications.length })
  } catch (error) {
    console.error("[v0] Erro ao criar lembretes de medicamento:", error)
    return NextResponse.json({ error: "Falha ao criar lembretes de medicamento" }, { status: 500 })
  }
}
