import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import webpush from "web-push"

// Configurar web-push
if (process.env.VAPID_PRIVATE_KEY && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:example@example.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  )
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const body = await request.json()
    const { userId, subscription } = body

    console.log("[v0] [SUBSCRIBE API] Received subscription for user:", userId)

    if (!userId) {
      console.error("[v0] [SUBSCRIBE API] userId is missing")
      return NextResponse.json({ error: "userId é obrigatório" }, { status: 400 })
    }

    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      console.error("[v0] [SUBSCRIBE API] Subscription inválida:", subscription)
      return NextResponse.json({ error: "Subscription inválida" }, { status: 400 })
    }

    console.log("[v0] [SUBSCRIBE API] Saving subscription:", subscription.endpoint)

    const { data, error } = await supabase.from("push_subscriptions").upsert(
      {
        user_id: userId,
        subscription: subscription, // Store the entire subscription object as JSONB
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      },
    )

    if (error) {
      console.error("[v0] [SUBSCRIBE API] Database error:", error)
      return NextResponse.json({ error: "Erro ao salvar subscription" }, { status: 500 })
    }

    console.log("[v0] [SUBSCRIBE API] Subscription saved successfully")
    return NextResponse.json({ success: true, message: "Subscription salva com sucesso" })
  } catch (error) {
    console.error("[v0] [SUBSCRIBE API] Error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
