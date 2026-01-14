import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import webpush from "web-push"

// Initialize web-push with your keys
// Note: These env vars must be set in your deployment platform (Vercel, etc.)
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_CONTACT_EMAIL || "admin@example.com"}`,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
}

export async function POST(request: Request) {
  try {
    // 1. Authenticate the request
    // Check for a shared secret to ensure the request is coming from our database webhook
    const authHeader = request.headers.get("Authorization")
    if (process.env.WEBHOOK_SECRET && authHeader !== `Bearer ${process.env.WEBHOOK_SECRET}`) {
      console.warn("Unauthorized attempt to access push API")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 2. Parse payload
    const body = await request.json()
    // Supabase webhook payload structure: { type, table, record, schema, old_record }
    const { record } = body 
    
    // Support both webhook payload and direct call
    const notification = record || body

    if (!notification || !notification.user_id) {
      return NextResponse.json({ error: "Invalid payload: user_id missing" }, { status: 400 })
    }

    // 3. Initialize Supabase Admin client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 4. Fetch user subscriptions
    const { data: subscriptions, error } = await supabase
      .from("push_subscriptions")
      .select("id, subscription")
      .eq("user_id", notification.user_id)

    if (error) {
      console.error("Error fetching subscriptions:", error)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    if (!subscriptions || subscriptions.length === 0) {
      // No subscriptions is not an error, just nothing to do
      return NextResponse.json({ message: "No subscriptions found for user" })
    }

    // 5. Prepare notification payload
    const payload = JSON.stringify({
      title: notification.title,
      body: notification.message,
      icon: "/icon.png", // Ensure this exists in public/
      badge: "/icon.png",
      tag: notification.notification_type || "general",
      url: notification.action_url || "/",
      data: {
        id: notification.id,
        related_id: notification.related_id,
        type: notification.notification_type
      }
    })

    // 6. Send notifications to all user devices
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(sub.subscription, payload)
          return { success: true, id: sub.id }
        } catch (err: any) {
          if (err.statusCode === 410 || err.statusCode === 404) {
            // Subscription is dead (expired or unsubscribed), remove it from DB
            console.log(`Removing dead subscription: ${sub.id}`)
            await supabase
              .from("push_subscriptions")
              .delete()
              .eq("id", sub.id)
          }
          throw err
        }
      })
    )

    const successCount = results.filter((r) => r.status === "fulfilled").length
    const failureCount = results.filter((r) => r.status === "rejected").length

    return NextResponse.json({ 
      success: true, 
      sent: successCount, 
      failed: failureCount 
    })

  } catch (error) {
    console.error("Error processing push notification:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
