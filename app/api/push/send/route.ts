// app/api/push/send/route.ts
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import webpush from 'web-push'

// Configure VAPID keys
const vapidKeys = {
  publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  privateKey: process.env.VAPID_PRIVATE_KEY!
}

if (!vapidKeys.publicKey || !vapidKeys.privateKey) {
  console.error("❌ VAPID keys are not configured!")
}

if (vapidKeys.publicKey && vapidKeys.privateKey) {
  webpush.setVapidDetails(
    'mailto:your-email@example.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
  )
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const { patientId, title, body: messageBody, url, type } = body
    
    console.log("📨 Push API: Received request for patient:", patientId)
    console.log("📝 Details:", { title, messageBody, url, type })
    
    // Check if VAPID keys are configured
    if (!vapidKeys.publicKey || !vapidKeys.privateKey) {
      console.log("⚠️ VAPID keys not configured, skipping push notification")
      return NextResponse.json({
        message: 'Push notifications not configured (missing VAPID keys)',
        skipped: true,
        reason: 'VAPID keys not configured'
      })
    }
    
    // Get patient's push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', patientId)
    
    if (subError) {
      console.error("❌ Error fetching subscriptions:", subError)
      return NextResponse.json(
        { error: 'Error fetching push subscriptions' },
        { status: 500 }
      )
    }
    
    if (!subscriptions || subscriptions.length === 0) {
      console.log("📭 No push subscriptions found for user:", patientId)
      return NextResponse.json({
        message: 'No push subscriptions found for this user',
        skipped: true,
        reason: 'No subscriptions'
      })
    }
    
    console.log(`📱 Found ${subscriptions.length} subscription(s) for user ${patientId}`)
    
    // Send to all subscriptions
    const results = await Promise.allSettled(
      subscriptions.map(async (subscription) => {
        try {
          const pushSubscription = {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh_key,
              auth: subscription.auth_key
            }
          }
          
          const payload = JSON.stringify({
            title,
            body: messageBody,
            url: url || '/patient',
            type,
            icon: '/icon-192x192.png',
            badge: '/badge-72x72.png',
            timestamp: Date.now()
          })
          
          console.log("📤 Sending push to endpoint:", subscription.endpoint.substring(0, 50) + "...")
          await webpush.sendNotification(pushSubscription, payload)
          
          console.log("✅ Successfully sent to:", subscription.endpoint.substring(0, 50) + "...")
          return { 
            success: true, 
            endpoint: subscription.endpoint,
            message: 'Notification sent'
          }
        } catch (error: any) {
          console.error('❌ Error sending to subscription:', error)
          
          // Delete invalid subscriptions (Gone status)
          if (error.statusCode === 410) {
            console.log("🗑️ Deleting expired subscription:", subscription.endpoint.substring(0, 50) + "...")
            await supabase
              .from('push_subscriptions')
              .delete()
              .eq('endpoint', subscription.endpoint)
          }
          
          return { 
            success: false, 
            endpoint: subscription.endpoint, 
            error: error.message 
          }
        }
      })
    )
    
    const successful = results.filter((r): r is PromiseFulfilledResult<any> => 
      r.status === 'fulfilled' && r.value.success
    ).length
    
    console.log(`🎯 Successfully sent to ${successful}/${subscriptions.length} devices`)
    
    return NextResponse.json({
      message: `Notifications sent to ${successful}/${subscriptions.length} devices`,
      total: subscriptions.length,
      successful,
      failed: subscriptions.length - successful,
      results: results.map(r => r.status === 'fulfilled' ? r.value : r.reason)
    })
    
  } catch (error: any) {
    console.error('💥 Error in push send API:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}