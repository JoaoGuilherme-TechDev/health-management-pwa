import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const supabase = await createClient()

  try {
    // Get all active medications
    const { data: medications } = await supabase
      .from("medications")
      .select("id, user_id, name, frequency")
      .eq("is_active", true)

    if (!medications || medications.length === 0) {
      return NextResponse.json({ message: "No active medications" })
    }

    // Create reminders for today
    const today = new Date().toISOString().split("T")[0]

    for (const med of medications) {
      // Check if reminder already exists for today
      const { data: existingReminder } = await supabase
        .from("medication_reminders")
        .select("id")
        .eq("medication_id", med.id)
        .eq("reminder_date", today)
        .single()

      if (!existingReminder) {
        // Create reminder
        await supabase.from("medication_reminders").insert({
          medication_id: med.id,
          user_id: med.user_id,
          reminder_time: "09:00",
          reminder_date: today,
        })

        // Create notification
        await supabase.from("notifications").insert({
          user_id: med.user_id,
          title: `Time for ${med.name}`,
          message: `Remember to take your ${med.name} (${med.frequency})`,
          notification_type: "medication_reminder",
        })
      }
    }

    return NextResponse.json({ message: "Reminders created successfully" })
  } catch (error) {
    console.error("Error creating reminders:", error)
    return NextResponse.json({ error: "Failed to create reminders" }, { status: 500 })
  }
}
