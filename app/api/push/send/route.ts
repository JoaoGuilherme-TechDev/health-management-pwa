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

export async function POST(request: Request) {
  try {
    console.log("📱 [PUSH API] Received doctor's push request")
    
    const body = await request.json()
    const { 
      patientId,
      title,
      body: message,
      url = "/notifications",
      type = "general",
      doctorId
    } = body

    // Validate - must have patientId
    if (!patientId || !title) {
      return NextResponse.json(
        { error: "patientId and title are required" },
        { status: 400 }
      )
    }

    console.log(`📤 [PUSH API] Doctor ${doctorId || 'unknown'} → Patient ${patientId}: "${title}"`)

    // Get Supabase client
    const supabase = await createClient()

    // Verify doctor is authenticated (optional but recommended)
    if (doctorId) {
      const { data: doctorProfile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", doctorId)
        .single()
      
      if (doctorProfile?.role !== "doctor" && doctorProfile?.role !== "admin") {
        console.error("❌ [PUSH API] Unauthorized: Only doctors can send push notifications")
        return NextResponse.json(
          { error: "Apenas médicos podem enviar notificações" },
          { status: 403 }
        )
      }
    }

    // Get patient's push subscriptions
    const { data: subscriptions, error: queryError } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", patientId) // ONLY for the patient
      .not("endpoint", "is", null)

    if (queryError) {
      console.error("❌ [PUSH API] Error fetching patient subscriptions:", queryError)
      return NextResponse.json(
        { error: "Failed to fetch patient's subscriptions" },
        { status: 500 }
      )
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log("⚠️ [PUSH API] Patient has no push subscriptions")
      return NextResponse.json({
        success: false,
        message: "Paciente não tem notificações push ativadas",
        suggestion: "Peça ao paciente para ativar notificações em Configurações"
      })
    }

    console.log(`📨 [PUSH API] Found ${subscriptions.length} subscription(s) for patient`)

    // Send to each of patient's subscriptions
    const results = []
    for (const subscription of subscriptions) {
      try {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth
          }
        }

        const payload = JSON.stringify({
          title,
          body: message || title,
          icon: "/icon-light-32x32.png",
          badge: "/badge-72x72.png",
          tag: `doctor-push-${Date.now()}`,
          data: {
            url,
            type,
            patientId,
            doctorId,
            fromDoctor: true,
            timestamp: new Date().toISOString()
          }
        })

        await webPush.sendNotification(pushSubscription, payload)
        results.push({ success: true, endpoint: subscription.endpoint })
        
      } catch (error: any) {
        console.error(`❌ [PUSH API] Failed for endpoint:`, error.message)
        results.push({ success: false, endpoint: subscription.endpoint, error: error.message })
      }
    }

    const successful = results.filter(r => r.success).length
    const failed = results.length - successful

    console.log(`📊 [PUSH API] Results: ${successful} sent, ${failed} failed`)

    return NextResponse.json({
      success: true,
      message: `Notificações enviadas ao paciente: ${successful} bem-sucedidas, ${failed} falhas`,
      results
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