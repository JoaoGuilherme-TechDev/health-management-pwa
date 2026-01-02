import { createClient } from "@/lib/supabase/server"
import webPush from "web-push"
import { NextResponse } from "next/server"

// Configure web-push with your VAPID keys
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY!

webPush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL || "your-email@example.com"}`,
  vapidPublicKey,
  vapidPrivateKey
)

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get notification data from request
    const body = await request.json()
    const { title, body: message, icon, badge, tag, data, userId } = body

    let subscriptions: any[] = []

    if (userId) {
      // Send to specific user
      const { data: userSubscriptions } = await supabase
        .from("push_subscriptions")
        .select("*")
        .eq("user_id", userId)
      
      if (userSubscriptions) {
        subscriptions = userSubscriptions
      }
    } else {
      // Send to all users (or filter based on notification type)
      const { data: allSubscriptions } = await supabase
        .from("push_subscriptions")
        .select("*")
      
      if (allSubscriptions) {
        subscriptions = allSubscriptions
      }
    }

    // Send push notification to each subscription
    const results = await Promise.allSettled(
      subscriptions.map(async (subscription) => {
        try {
          // Convert stored subscription to web-push format
          const pushSubscription = {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth
            }
          }

          const payload = JSON.stringify({
            title: title || "HealthCare+",
            body: message,
            icon: icon || "/icon-light-32x32.png",
            badge: badge || "/badge-72x72.png",
            tag: tag || Date.now().toString(),
            data: data || {},
            timestamp: new Date().toISOString()
          })

          await webPush.sendNotification(pushSubscription, payload)
          return { success: true, endpoint: subscription.endpoint }
        } catch (error: any) {
          console.error("Failed to send to subscription:", subscription.endpoint, error)
          
          // If subscription is invalid, remove it from database
          if (error.statusCode === 410 || error.statusCode === 404) {
            await supabase
              .from("push_subscriptions")
              .delete()
              .eq("endpoint", subscription.endpoint)
          }
          
          return { success: false, endpoint: subscription.endpoint, error: error.message }
        }
      })
    )

    const successful = results.filter(r => r.status === "fulfilled" && r.value.success).length
    const failed = results.filter(r => r.status === "rejected" || !r.value?.success).length

    return NextResponse.json({
      success: true,
      message: `Push notifications sent: ${successful} successful, ${failed} failed`,
      details: results.map(r => r.status === "fulfilled" ? r.value : r.reason)
    })

  } catch (error: any) {
    console.error("Error sending push notifications:", error)
    return NextResponse.json(
      { error: "Failed to send push notifications", details: error.message },
      { status: 500 }
    )
  }
}