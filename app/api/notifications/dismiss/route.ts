import { NextResponse } from "next/server"
import { pool } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 })
    }

    await pool.query('UPDATE notifications SET is_read = true WHERE id = $1', [id]);

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Dismiss error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
