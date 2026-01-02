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

// Define TypeScript interfaces
interface PushSubscriptionData {
  endpoint: string
  p256dh: string
  auth: string
  user_id: string
  created_at: string
  updated_at: string
}

interface PushNotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  data?: Record<string, any>
  requireInteraction?: boolean
  silent?: boolean
}

interface SendPushRequest {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  data?: Record<string, any>
  userId?: string
  notificationType?: string
}

export async function POST(request: Request) {
  try {
    console.log("📱 Received push notification request")
    
    // Get request body
    let body: SendPushRequest
    try {
      body = await request.json()
    } catch (error) {
      console.error("❌ Invalid JSON in request body")
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      )
    }

    const { 
      title, 
      body: message, 
      icon = "/icon-light-32x32.png",
      badge = "/badge-72x72.png",
      tag = `notification-${Date.now()}`,
      data = {},
      userId,
      notificationType
    } = body

    // Validate required fields
    if (!title || !message) {
      return NextResponse.json(
        { error: "Title and body are required" },
        { status: 400 }
      )
    }

    console.log(`📤 Preparing to send: "${title}"`)
    console.log(`   Target user: ${userId || "ALL users"}`)
    console.log(`   Notification type: ${notificationType || "general"}`)

    // Create Supabase client
    const supabase = await createClient()
    console.log("✅ Supabase client created")

    // Get user subscriptions
    let query = supabase
      .from("push_subscriptions")
      .select("*")
      .not("endpoint", "is", null)
      .not("p256dh", "is", null)
      .not("auth", "is", null)

    // Filter by user if specified
    if (userId) {
      query = query.eq("user_id", userId)
      console.log(`   Filtering by user_id: ${userId}`)
    }

    const { data: subscriptions, error: queryError } = await query

    if (queryError) {
      console.error("❌ Error fetching subscriptions:", queryError)
      return NextResponse.json(
        { 
          error: "Failed to fetch push subscriptions",
          details: queryError.message 
        },
        { status: 500 }
      )
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log("⚠️ No active push subscriptions found")
      return NextResponse.json(
        { 
          error: "No active push subscriptions found",
          userId,
          suggestion: userId ? 
            "The specified user hasn't enabled push notifications yet." :
            "No users have enabled push notifications."
        },
        { status: 404 }
      )
    }

    console.log(`📨 Found ${subscriptions.length} subscription(s)`)

    // Prepare notification payload
    const payload: PushNotificationPayload = {
      title,
      body: message,
      icon,
      badge,
      tag,
      data: {
        ...data,
        notificationId: tag,
        type: notificationType,
        timestamp: new Date().toISOString(),
        url: data.url || "/notifications"
      },
      requireInteraction: false,
      silent: false
    }

    // Send to each subscription
    const results = await Promise.allSettled(
      subscriptions.map(async (subscription: PushSubscriptionData) => {
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

          console.log(`   Sending to: ${subscription.endpoint.substring(0, 50)}...`)

          // Send via web-push
          const result = await webPush.sendNotification(
            pushSubscription,
            payloadString
          )

          console.log(`   ✅ Sent to ${subscription.user_id}`)

          return {
            success: true,
            userId: subscription.user_id,
            endpoint: subscription.endpoint,
            status: result.statusCode
          }
        } catch (error: any) {
          console.error(`   ❌ Failed for ${subscription.user_id}:`, error.message)

          // Check if subscription is invalid
          const isInvalid = error.statusCode === 410 || 
                           error.statusCode === 404 || 
                           error.message.includes("expired") ||
                           error.message.includes("not valid")

          if (isInvalid) {
            console.log(`   🗑️ Removing invalid subscription for ${subscription.user_id}`)
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
            statusCode: error.statusCode,
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

    console.log(`📊 Results: ${successful} sent, ${failed} failed`)

    // Format response
    const formattedResults = results.map((result: any) => {
      if (result.status === "fulfilled") {
        return result.value
      } else {
        return {
          success: false,
          error: result.reason?.message || "Unknown error"
        }
      }
    })

    // Store notification in database (for notification center)
    try {
      await supabase.from("notifications").insert({
        title,
        body: message,
        type: notificationType || "general",
        data: payload.data,
        created_at: new Date().toISOString()
      })
      console.log("📝 Notification saved to database")
    } catch (dbError) {
      console.error("Failed to save notification to database:", dbError)
      // Continue even if this fails
    }

    return NextResponse.json({
      success: true,
      message: `Push notifications sent: ${successful} successful, ${failed} failed`,
      total: subscriptions.length,
      sent: successful,
      failed: failed,
      results: formattedResults,
      notification: {
        title,
        body: message,
        type: notificationType,
        id: tag
      }
    })

  } catch (error: any) {
    console.error("🚨 Critical error in push/send route:", error)
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

// Also add GET endpoint for testing
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    
    const query = supabase
      .from("push_subscriptions")
      .select("*")

    if (userId) {
      query.eq("user_id", userId)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch subscriptions" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      count: data?.length || 0,
      subscriptions: data
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}