import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import webpush from "web-push"

// Generate VAPID keys with: npx web-push generate-vapid-keys
const vapidKeys = {
  publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "",
  privateKey: process.env.VAPID_PRIVATE_KEY || "",
}

if (vapidKeys.publicKey && vapidKeys.privateKey) {
  webpush.setVapidDetails("mailto:admin@healthcare.com", vapidKeys.publicKey, vapidKeys.privateKey)
}

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
      return NextResponse.json({ error: dbError.message }, { status: 400 })
    }

    try {
      // Get user's push subscriptions from database
      const { data: subscriptions } = await supabase
        .from("push_subscriptions")
        .select("subscription")
        .eq("user_id", user_id)

      if (subscriptions && subscriptions.length > 0) {
        const payload = JSON.stringify({
          title,
          message,
          url: url || "/patient",
          type: notification_type,
        })

        // Send push notification to all user's devices
        for (const sub of subscriptions) {
          try {
            await webpush.sendNotification(sub.subscription, payload)
          } catch (pushError: any) {
            console.error("[v0] Failed to send push to device:", pushError)
            // Remove invalid subscription
            if (pushError.statusCode === 410 || pushError.statusCode === 404) {
              await supabase.from("push_subscriptions").delete().eq("subscription", sub.subscription)
            }
          }
        }
      }
    } catch (pushError) {
      console.error("[v0] Push notification error:", pushError)
      // Don't fail the request if push fails
    }

    return NextResponse.json({
      success: true,
      message: "Notification sent successfully",
    })
  } catch (error) {
    console.error("[v0] Push notification error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
