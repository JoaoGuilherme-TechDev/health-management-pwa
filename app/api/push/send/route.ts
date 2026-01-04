import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import webPush from "web-push"

// Configure web-push
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY!

if (!vapidPublicKey || !vapidPrivateKey) {
  throw new Error("Missing VAPID keys. Check your environment variables.")
}

webPush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL || "your-email@example.com"}`,
  vapidPublicKey,
  vapidPrivateKey,
)

export async function POST(request: Request) {
  try {
    console.log("📱 [PUSH API] Received request")

    const body = await request.json()
    const { patientId, title, body: message, url = "/notifications", type = "general" } = body

    // Validate
    if (!patientId || !title) {
      return NextResponse.json({ error: "patientId and title are required" }, { status: 400 })
    }

    console.log(`📤 [PUSH API] Sending: "${title}" to patient ${patientId}`)

    // Get Supabase client
    const supabase = await createClient()

    // Get patient's push subscriptions
    const { data: subscriptions, error: queryError } = await supabase
      .from("push_subscriptions")
      .select("subscription")
      .eq("user_id", patientId)

    if (queryError) {
      console.error("❌ [PUSH API] Error fetching subscriptions:", queryError)
      return NextResponse.json({ error: "Failed to fetch subscriptions" }, { status: 500 })
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log("⚠️ [PUSH API] No subscriptions found")
      return NextResponse.json({
        success: false,
        message: "Patient has no push subscriptions",
        suggestion: "Ask the patient to enable push notifications",
      })
    }

    console.log(`📨 [PUSH API] Found ${subscriptions.length} subscription(s)`)

    // Send to each subscription
    const results = []
    for (const subscriptionRecord of subscriptions) {
      try {
        let pushSubscription = subscriptionRecord.subscription

        // Parse if it's a string
        if (typeof pushSubscription === "string") {
          pushSubscription = JSON.parse(pushSubscription)
        }

        // Validate subscription has required fields
        if (!pushSubscription?.endpoint || !pushSubscription?.keys?.p256dh || !pushSubscription?.keys?.auth) {
          console.warn(`⚠️ [PUSH API] Invalid subscription format:`, pushSubscription)
          results.push({ success: false, endpoint: pushSubscription?.endpoint, error: "Invalid subscription format" })
          continue
        }

        const payload = JSON.stringify({
          title,
          body: message || title,
          icon: "/icon-light-32x32.png",
          badge: "/badge-72x72.png",
          tag: `push-${Date.now()}`,
          data: {
            url,
            type,
            patientId,
            timestamp: new Date().toISOString(),
          },
        })

        await webPush.sendNotification(pushSubscription, payload)
        results.push({ success: true, endpoint: pushSubscription.endpoint })
      } catch (error: any) {
        console.error(`❌ [PUSH API] Failed for subscription:`, error.message)
        results.push({ success: false, error: error.message })
      }
    }

    const successful = results.filter((r) => r.success).length
    const failed = results.length - successful

    console.log(`📊 [PUSH API] Results: ${successful} sent, ${failed} failed`)

    return NextResponse.json({
      success: true,
      message: `Push notifications sent: ${successful} successful, ${failed} failed`,
      results,
    })
  } catch (error: any) {
    console.error("🚨 [PUSH API] Error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error.message,
      },
      { status: 500 },
    )
  }
}
