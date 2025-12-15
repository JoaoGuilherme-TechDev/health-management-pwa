import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const supabase = await createClient()

  const { user_id, title, message, notification_type } = await request.json()

  if (!user_id || !title || !message || !notification_type) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  try {
    const { data, error } = await supabase.from("notifications").insert({
      user_id,
      title,
      message,
      notification_type,
    })

    if (error) throw error

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Error creating notification:", error)
    return NextResponse.json({ error: "Failed to create notification" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  const supabase = await createClient()

  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("user_id")

  if (!userId) {
    return NextResponse.json({ error: "Missing user_id" }, { status: 400 })
  }

  try {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) throw error

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const supabase = await createClient()

  const { searchParams } = new URL(request.url)
  const notificationId = searchParams.get("id")

  if (!notificationId) {
    return NextResponse.json({ error: "Missing notification id" }, { status: 400 })
  }

  try {
    const { error } = await supabase.from("notifications").delete().eq("id", notificationId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting notification:", error)
    return NextResponse.json({ error: "Failed to delete notification" }, { status: 500 })
  }
}
