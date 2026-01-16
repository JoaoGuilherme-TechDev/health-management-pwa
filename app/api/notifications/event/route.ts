import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const events = Array.isArray(body.events) ? body.events : []

    if (!events.length) {
      return NextResponse.json({ success: true })
    }

    const ids = Array.from(
      new Set(
        events
          .map((e: any) => e.notificationId)
          .filter((id: unknown): id is string => typeof id === "string"),
      ),
    )

    if (!ids.length) {
      return NextResponse.json({ success: true })
    }

    const { data: notifications, error: notificationsError } = await supabase
      .from("notifications")
      .select("id, user_id")
      .in("id", ids)

    if (notificationsError) {
      return NextResponse.json({ error: notificationsError.message }, { status: 500 })
    }

    const map = new Map<string, string>()
    for (const row of notifications || []) {
      if (row.id && row.user_id) {
        map.set(row.id as string, row.user_id as string)
      }
    }

    const rows = events
      .map((e: any) => {
        const id = typeof e.notificationId === "string" ? e.notificationId : null
        const eventType = typeof e.eventType === "string" ? e.eventType : null
        if (!id || !eventType) return null
        const userId = map.get(id)
        if (!userId) return null
        return {
          user_id: userId,
          event_type: eventType,
          payload: {
            notification_id: id,
            source: "client",
          },
        }
      })
      .filter((row: null) => row !== null) as {
      user_id: string
      event_type: string
      payload: Record<string, unknown>
    }[]

    if (!rows.length) {
      return NextResponse.json({ success: true })
    }

    const { error } = await supabase.from("notification_event_logs").insert(rows)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

