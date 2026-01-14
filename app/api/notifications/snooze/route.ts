import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { id, type, minutes, userId } = await request.json()

    if (!id || !userId) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    if (type === "medication") {
        // id is likely the medication_id or notification_id. 
        // If it comes from push, we need to know what ID it is.
        // Assuming 'related_id' is passed as 'id' for medication snooze
        
        const until = new Date(Date.now() + (minutes || 15) * 60 * 1000).toISOString()
        
        const { error } = await supabase
          .from("medication_reminders")
          .update({ snoozed_until: until })
          .eq("user_id", userId)
          .eq("medication_id", id)

        if (error) throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Snooze error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
