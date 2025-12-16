import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { getCurrentBrasiliaTime } from "@/lib/timezone"

export async function POST() {
  const supabase = await createClient()

  try {
    const now = getCurrentBrasiliaTime()
    const today = now.toISOString().split("T")[0]

    const { data: medications, error: medicationsError } = await supabase
      .from("medications")
      .select("id, user_id, name, dosage, frequency, start_date, end_date")
      .eq("is_active", true)
      .or(`end_date.is.null,end_date.gte.${today}`)
      .lte("start_date", today)

    if (medicationsError) {
      console.error("[v0] Erro ao buscar medicamentos:", medicationsError)
      return NextResponse.json({ error: "Erro ao buscar medicamentos" }, { status: 500 })
    }

    if (!medications || medications.length === 0) {
      return NextResponse.json({ message: "Nenhum medicamento ativo" })
    }

    let remindersCreated = 0

    for (const med of medications) {
      const last12Hours = new Date(now.getTime() - 12 * 60 * 60 * 1000)

      const { data: existingReminder, error: checkError } = await supabase
        .from("notifications")
        .select("id")
        .eq("user_id", med.user_id)
        .eq("notification_type", "medication_reminder")
        .gte("created_at", last12Hours.toISOString())
        .ilike("message", `%${med.name}%`)
        .maybeSingle()

      if (checkError) {
        console.error("[v0] Erro ao verificar lembrete existente:", checkError)
        continue
      }

      if (!existingReminder) {
        const { error: insertError } = await supabase.from("notifications").insert({
          user_id: med.user_id,
          title: "Lembrete de Medicamento",
          message: `Hora de tomar: ${med.name} (${med.dosage}) - ${med.frequency}`,
          notification_type: "medication_reminder",
          action_url: "/patient/medications",
          read: false,
        })

        if (!insertError) {
          remindersCreated++
          console.log("[v0] Lembrete criado para:", med.name)
        }
      }
    }

    return NextResponse.json({
      message: "Lembretes de medicamento processados",
      count: medications.length,
      created: remindersCreated,
    })
  } catch (error) {
    console.error("[v0] Erro ao criar lembretes:", error)
    return NextResponse.json({ error: "Falha ao criar lembretes" }, { status: 500 })
  }
}
