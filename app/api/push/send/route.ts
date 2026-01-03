import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// IMPORTANT: Don't import web-push here - it's server-side only
// We'll handle web-push in a separate function

export async function POST(request: Request) {
  try {
    console.log("📱 [PUSH API] Received push request")
    
    const body = await request.json()
    console.log("📦 Body:", body)

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

    console.log(`📤 [PUSH API] Sending: "${title}" to patient ${patientId}`)

    // Get Supabase client
    const supabase = await createClient()

    // Get patient's push subscriptions
    const { data: subscriptions, error: queryError } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", patientId)
      .not("endpoint", "is", null)

    if (queryError) {
      console.error("❌ [PUSH API] Error fetching subscriptions:", queryError)
      return NextResponse.json(
        { error: "Failed to fetch subscriptions" },
        { status: 500 }
      )
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log("⚠️ [PUSH API] Patient has no push subscriptions")
      return NextResponse.json({
        success: false,
        message: "Patient has no push subscriptions",
        suggestion: "Patient needs to enable push notifications in Settings"
      })
    }

    console.log(`📨 [PUSH API] Found ${subscriptions.length} subscription(s)`)

    // IMPORTANT: We need to use a server-side web-push
    // Create a server action or separate API route for web-push
    
    // Store notification in database
    await supabase.from("notifications").insert({
      title: title,
      message: message || title,
      notification_type: type,
      user_id: patientId,
      data: {
        url: url,
        type: type,
        patientId: patientId,
        timestamp: new Date().toISOString(),
        fromPushApi: true
      },
      is_read: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })

    console.log("💾 [PUSH API] Notification stored in database")

    // Return success even if we can't send push
    // The notification will appear in the notification center
    return NextResponse.json({
      success: true,
      message: "Notification stored in database",
      storedInDB: true,
      pushSubscriptions: subscriptions.length,
      note: "Push notifications require VAPID keys configured on server"
    })

  } catch (error: any) {
    console.error("🚨 [PUSH API] Error:", error)
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: error.message
      },
      { status: 500 }
    )
  }
}