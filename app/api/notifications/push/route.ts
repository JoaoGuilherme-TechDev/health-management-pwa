import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { user_id, title, message, notification_type, url } = await request.json()

    if (!user_id || !title || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()

    const { error: dbError } = await supabase.from("notifications").insert({
      user_id,
      title,
      message,
      notification_type: notification_type || "info",
      is_read: false,
    })

    if (dbError) {
      console.error("[v0] Error creating notification:", dbError)
      return NextResponse.json({ error: "Failed to create notification" }, { status: 500 })
    }

    // For now, we create in-app notification that user will see
    // To enable real push notifications, you need to:
    // 1. Set up VAPID keys
    // 2. Subscribe user's browser to push notifications
    // 3. Store subscription in database
    // 4. Use web-push library to send notifications

    return NextResponse.json({
      success: true,
      message: "Notification created successfully",
    })
  } catch (error) {
    console.error("[v0] Push notification error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
