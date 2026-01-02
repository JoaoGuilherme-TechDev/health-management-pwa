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
  vapidPrivateKey
)

interface PushSubscriptionData {
  endpoint: string
  p256dh: string
  auth: string
  user_id: string
  created_at: string
  updated_at: string
}

interface SendPushRequest {
  title: string
  body?: string
  url?: string
  type?: "prescription" | "appointment" | "diet" | "medication" | "supplement" | "general" | "evolution"
  patientId: string
  notificationType?: string
}

export async function POST(request: Request) {
  try {
    console.log("📱 [PUSH] Received push notification request")
    
    // Get request body
    let body: SendPushRequest
    try {
      body = await request.json()
    } catch (error) {
      console.error("❌ [PUSH] Invalid JSON in request body")
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      )
    }

    const { 
      title, 
      body: message, 
      url = "/notifications",
      type = "general",
      patientId,
      notificationType = type
    } = body

    // Validate required fields
    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      )
    }

    if (!patientId) {
      return NextResponse.json(
        { error: "patientId is required" },
        { status: 400 }
      )
    }

    console.log(`📤 [PUSH] Preparing to send: "${title}"`)
    console.log(`   Target patient: ${patientId}`)
    console.log(`   Type: ${notificationType}`)

    // Create Supabase client
    const supabase = await createClient()
    console.log("✅ [PUSH] Supabase client created")

    // Get patient's subscriptions - USING patientId AS user_id
    const { data: subscriptions, error: queryError } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", patientId)
      .not("endpoint", "is", null)
      .not("p256dh", "is", null)
      .not("auth", "is", null)

    if (queryError) {
      console.error("❌ [PUSH] Error fetching subscriptions:", queryError)
      return NextResponse.json(
        { 
          error: "Failed to fetch push subscriptions",
          details: queryError.message 
        },
        { status: 500 }
      )
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log("⚠️ [PUSH] No active push subscriptions found for patient")
      return NextResponse.json(
        { 
          error: "No active push subscriptions found",
          patientId,
          suggestion: "The patient hasn't enabled push notifications yet."
        },
        { status: 404 }
      )
    }

    console.log(`📨 [PUSH] Found ${subscriptions.length} subscription(s) for patient ${patientId}`)

    // Prepare notification payload
    const tag = `push-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const payload = {
      title,
      body: message || title, // Use title as body if no message
      icon: "/icon-light-32x32.png",
      badge: "/badge-72x72.png",
      tag: tag,
      data: {
        url: url,
        type: notificationType,
        patientId: patientId,
        timestamp: new Date().toISOString(),
        source: "doctor-push"
      },
      requireInteraction: true,
      silent: false,
      timestamp: Date.now()
    }

    // Send to each subscription
    const results = await Promise.allSettled(
      (subscriptions as PushSubscriptionData[]).map(async (subscription) => {
        try {
          const pushSubscription = {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth
            }
          }

          // Stringify payload
          const payloadString = JSON.stringify(payload)

          console.log(`   📤 [PUSH] Sending to patient ${subscription.user_id}`)

          // Send via web-push
          await webPush.sendNotification(
            pushSubscription,
            payloadString,
            {
              TTL: 604800, // 7 days in seconds
              urgency: 'high'
            }
          )

          console.log(`   ✅ [PUSH] Success for patient ${subscription.user_id}`)
          return {
            success: true,
            userId: subscription.user_id,
            endpoint: subscription.endpoint
          }
        } catch (error: any) {
          console.error(`   ❌ [PUSH] Failed for patient ${subscription.user_id}:`, error.message)

          // Check if subscription is invalid
          const isInvalid = error.statusCode === 410 || 
                           error.statusCode === 404 || 
                           error.message.includes("expired") ||
                           error.message.includes("not valid")

          if (isInvalid) {
            console.log(`   🗑️ [PUSH] Removing invalid subscription for ${subscription.user_id}`)
            try {
              await supabase
                .from("push_subscriptions")
                .delete()
                .eq("endpoint", subscription.endpoint)
            } catch (deleteError) {
              console.error("   Failed to remove subscription:", deleteError)
            }
          }

          return {
            success: false,
            userId: subscription.user_id,
            endpoint: subscription.endpoint,
            error: error.message,
            shouldRemove: isInvalid
          }
        }
      })
    )

    // Calculate statistics
    const successful = results.filter((r: any) => 
      r.status === "fulfilled" && r.value.success
    ).length
    const failed = results.length - successful

    console.log(`📊 [PUSH] Results: ${successful} sent, ${failed} failed`)

    // Store notification in database (for notification center) - match your Notification type
    try {
      await supabase.from("notifications").insert({
        title: title,
        message: message || title,
        notification_type: notificationType,
        user_id: patientId,
        data: payload.data,
        is_read: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      console.log("📝 [PUSH] Notification saved to database")
    } catch (dbError: any) {
      console.error("[PUSH] Failed to save notification to database:", dbError.message)
      // Continue even if this fails
    }

    return NextResponse.json({
      success: true,
      message: `Push notifications sent: ${successful} successful, ${failed} failed`,
      total: subscriptions.length,
      sent: successful,
      failed: failed,
      notification: {
        title,
        body: message || title,
        type: notificationType,
        patientId: patientId
      }
    })

  } catch (error: any) {
    console.error("🚨 [PUSH] Critical error in push/send route:", error)
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}