import { NextResponse } from "next/server"

// This API route should be called by a cron job daily (e.g., Vercel Cron)
// Configure in vercel.json:
// {
//   "crons": [
//     {
//       "path": "/api/cron/daily-reminders",
//       "schedule": "0 9 * * *"
//     }
//   ]
// }

export async function GET(request: Request) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    console.log("[v0] Running daily reminders cron job...")

    // Call medication reminders API
    const medResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/notifications/create-medication-reminders`,
      {
        method: "POST",
      },
    )
    const medResult = await medResponse.json()
    console.log("[v0] Medication reminders result:", medResult)

    // Call appointment reminders API
    const apptResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/notifications/create-appointment-reminders`,
      {
        method: "POST",
      },
    )
    const apptResult = await apptResponse.json()
    console.log("[v0] Appointment reminders result:", apptResult)

    return NextResponse.json({
      success: true,
      medication_reminders: medResult,
      appointment_reminders: apptResult,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[v0] Error in daily reminders cron:", error)
    return NextResponse.json({ error: "Failed to create reminders", details: error }, { status: 500 })
  }
}
