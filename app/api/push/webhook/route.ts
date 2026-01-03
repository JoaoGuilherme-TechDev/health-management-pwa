import { NextResponse } from "next/server"
import webPush from "web-push"

// Configure web-push
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY!

if (!vapidPublicKey || !vapidPrivateKey) {
  throw new Error("Missing VAPID keys")
}

webPush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL || "your-email@example.com"}`,
  vapidPublicKey,
  vapidPrivateKey
)

export async function POST(request: Request) {
  try {
    console.log("🔔 [WEBHOOK] Received web-push request")
    
    const { subscription, title, body, data } = await request.json()
    
    if (!subscription || !title) {
      return NextResponse.json(
        { error: "Subscription and title are required" },
        { status: 400 }
      )
    }

    console.log("📤 [WEBHOOK] Sending push to:", subscription.endpoint?.substring(0, 50) + "...")

    const payload = JSON.stringify({
      title,
      body: body || title,
      icon: "/icon-light-32x32.png",
      badge: "/badge-72x72.png",
      tag: `webhook-${Date.now()}`,
      data: data || {},
      requireInteraction: false,
      timestamp: Date.now()
    })

    try {
      await webPush.sendNotification(subscription, payload)
      console.log("✅ [WEBHOOK] Push sent successfully")
      
      return NextResponse.json({
        success: true,
        message: "Push notification sent"
      })
    } catch (error: any) {
      console.error("❌ [WEBHOOK] Web-push error:", error)
      return NextResponse.json({
        success: false,
        error: error.message,
        statusCode: error.statusCode
      })
    }

  } catch (error: any) {
    console.error("🚨 [WEBHOOK] Error:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}