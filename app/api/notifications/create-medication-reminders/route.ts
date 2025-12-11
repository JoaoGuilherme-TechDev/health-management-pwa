import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST() {
  const supabase = await createClient()

  try {
    // Get all active medications
    const { data: medications } = await supabase.from("medications").select("*").eq("is_active", true)

    if (!medications || medications.length === 0) {
      return NextResponse.json({ message: "No active medications" })
    }

    console.log("[v0] Creating reminders for", medications.length, "medications")

    const today = new Date().toISOString().split("T")[0]
    const now = new Date()

    for (const med of medications) {
      // Check if notification already exists for today
      const { data: existingNotif } = await supabase
        .from("notifications")
        .select("id")
        .eq("user_id", med.user_id)
        .eq("notification_type", "medication_reminder")
        .gte("created_at", `${today}T00:00:00`)
        .like("message", `%${med.name}%`)
        .single()

      if (!existingNotif) {
        // Create notification for medication
        await supabase.from("notifications").insert({
          user_id: med.user_id,
          title: "Lembrete de Medicamento",
          message: `Hora de tomar: ${med.name} (${med.dosage}) - ${med.frequency}`,
          notification_type: "medication_reminder",
          action_url: "/patient/medications",
        })

        console.log("[v0] Created medication reminder for patient", med.user_id, "- Med:", med.name)
      }
    }

    return NextResponse.json({ message: "Medication reminders created successfully", count: medications.length })
  } catch (error) {
    console.error("[v0] Error creating medication reminders:", error)
    return NextResponse.json({ error: "Failed to create medication reminders" }, { status: 500 })
  }
}
