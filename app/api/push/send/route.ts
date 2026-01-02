import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import webPush from "web-push"

// Check VAPID keys
if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
  console.error("❌ VAPID keys missing in environment")
}

// Only configure if keys exist
if (process.env.VAPID_PRIVATE_KEY) {
  webPush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL || "test@example.com"}`,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY
  )
}

export async function POST(request: Request) {
  try {
    console.log("📱 [PUSH API] Received request")
    
    let body
    try {
      body = await request.json()
      console.log("   Body:", body)
    } catch (e) {
      return NextResponse.json(
        { error: "Invalid JSON" },
        { status: 400 }
      )
    }

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
        { error: "Missing patientId or title" },
        { status: 400 }
      )
    }

    console.log(`📤 [PUSH API] Target: patient ${patientId}`)
    console.log(`   Title: "${title}"`)
    console.log(`   Message: "${message || title}"`)

    // Get Supabase client
    const supabase = await createClient()

    // Check if patient exists
    const { data: patient, error: patientError } = await supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .eq("id", patientId)
      .single()

    if (patientError || !patient) {
      console.error("❌ [PUSH API] Patient not found:", patientError)
      return NextResponse.json(
        { error: "Patient not found" },
        { status: 404 }
      )
    }

    console.log(`   Patient: ${patient.first_name} ${patient.last_name}`)

    // Get patient's push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", patientId)
      .not("endpoint", "is", null)

    if (subError) {
      console.error("❌ [PUSH API] Error fetching subscriptions:", subError)
      return NextResponse.json(
        { error: "Failed to fetch subscriptions" },
        { status: 500 }
      )
    }

    console.log(`📨 [PUSH API] Found ${subscriptions?.length || 0} subscription(s)`)

    // If no subscriptions, just return success (notification is stored in DB)
    if (!subscriptions || subscriptions.length === 0) {
      console.log("⚠️ [PUSH API] No push subscriptions - notification stored in DB only")
      return NextResponse.json({
        success: true,
        message: "Notification stored (patient has no push subscriptions)",
        storedInDB: true
      })
    }

    // Check if VAPID is configured
    if (!process.env.VAPID_PRIVATE_KEY) {
      console.error("❌ [PUSH API] VAPID private key not configured")
      return NextResponse.json({
        success: false,
        message: "Push notifications not configured on server"
      })
    }

    // Prepare payload
    const payload = {
      title,
      body: message || title,
      icon: "/icon-light-32x32.png",
      badge: "/badge-72x72.png",
      tag: `push-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      data: {
        url,
        type,
        patientId,
        timestamp: new Date().toISOString()
      },
      requireInteraction: false
    }

    // Send to each subscription
    const results = []
    let sentCount = 0
    
    for (const subscription of subscriptions) {
      try {
        console.log(`   📤 Sending to: ${subscription.endpoint?.substring(0, 60)}...`)
        
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth
          }
        }

        await webPush.sendNotification(pushSubscription, JSON.stringify(payload))
        
        sentCount++
        results.push({ success: true, endpoint: subscription.endpoint })
        console.log(`   ✅ Sent`)
        
      } catch (error: any) {
        console.error(`   ❌ Failed:`, error.message)
        results.push({ success: false, endpoint: subscription.endpoint, error: error.message })
        
        // If subscription is invalid, delete it
        if (error.statusCode === 410 || error.message.includes("expired")) {
          console.log(`   🗑️ Removing invalid subscription`)
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("endpoint", subscription.endpoint)
        }
      }
    }

    console.log(`📊 [PUSH API] Completed: ${sentCount}/${subscriptions.length} sent`)

    return NextResponse.json({
      success: true,
      message: `Push notifications sent: ${sentCount} successful, ${subscriptions.length - sentCount} failed`,
      sent: sentCount,
      total: subscriptions.length,
      results
    })

  } catch (error: any) {
    console.error("🚨 [PUSH API] Unexpected error:", error)
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: error.message
      },
      { status: 500 }
    )
  }
}