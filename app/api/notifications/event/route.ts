import { NextResponse } from "next/server"
import { pool } from "@/lib/db"

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

    // Get user_ids for these notifications to verify ownership/linking
    const res = await pool.query(
        `SELECT id, user_id FROM notifications WHERE id = ANY($1::uuid[])`,
        [ids]
    );
    const notifications = res.rows;

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
      .filter((row: null) => row !== null)

    if (!rows.length) {
      return NextResponse.json({ success: true })
    }

    // Bulk Insert
    // Construct values string ($1, $2, $3), ($4, $5, $6), ...
    const values: any[] = [];
    const placeholders: string[] = [];
    let p = 1;

    for (const row of rows) {
        placeholders.push(`($${p++}, $${p++}, $${p++})`);
        values.push(row.user_id, row.event_type, JSON.stringify(row.payload));
    }

    await pool.query(
        `INSERT INTO notification_event_logs (user_id, event_type, payload) VALUES ${placeholders.join(', ')}`,
        values
    );

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Event log error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
