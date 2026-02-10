import { NextResponse } from "next/server"
import { pool } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const { user_id } = await request.json()

    if (!user_id) {
      return NextResponse.json({ error: "Missing user_id" }, { status: 400 })
    }

    await pool.query('UPDATE notifications SET is_read = true WHERE user_id = $1', [user_id]);

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Mark all read error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
