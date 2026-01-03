// app/api/push/send/route.ts
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { 
      patientId,
      title,
      body: message,
      url = "/notifications",
      type = "general"
    } = body

    // Validate
    if (!patientId || !title) {
      return NextResponse.json(
        { error: "patientId and title are required" },
        { status: 400 }
      )
    }

    console.log(`📤 Doctor → Patient ${patientId}: "${title}"`)

    // Store in database
    const supabase = await createClient()
    
    await supabase.from("notifications").insert({
      title: title,
      message: message || title,
      notification_type: type,
      user_id: patientId,
      data: {
        url: url,
        type: type,
        patientId: patientId,
        timestamp: new Date().toISOString()
      },
      is_read: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      message: "Notification stored successfully"
    })

  } catch (error: any) {
    console.error("Error:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}