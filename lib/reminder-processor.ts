import { pool } from '@/lib/db'
import webPush from 'web-push'

if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webPush.setVapidDetails(
    'mailto:admin@healthcare-plus.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
}

export async function processRemindersAndPush() {
  const results = {
    reminders_generated: false,
    push_notifications_sent: 0,
    errors: [] as string[],
  }

  try {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      await client.query('SELECT process_due_medication_reminders()')
      await client.query('SELECT process_due_appointment_reminders()')
      await client.query('COMMIT')
      results.reminders_generated = true
    } catch (e: any) {
      await client.query('ROLLBACK')
      results.errors.push(`Reminder generation failed: ${e.message}`)
    } finally {
      client.release()
    }

    // 2. Process Push Queue (Atomic Fetch & Lock)
    // We use UPDATE ... RETURNING to atomically claim tasks
    const pendingPush = await pool.query(`
      UPDATE push_queue 
      SET status = 'processing', last_attempt_at = NOW(), attempts = attempts + 1
      WHERE id IN (
        SELECT id FROM push_queue 
        WHERE status = 'pending' 
        OR (status = 'failed' AND attempts < 3 AND last_attempt_at < NOW() - INTERVAL '5 minutes')
        LIMIT 50
        FOR UPDATE SKIP LOCKED
      )
      RETURNING id, user_id, title, message, attempts
    `)

    for (const item of pendingPush.rows) {
      try {
        const subsRes = await pool.query(
          'SELECT subscription FROM push_subscriptions WHERE user_id = $1',
          [item.user_id],
        )

        if (subsRes.rows.length === 0) {
          await pool.query(
            "UPDATE push_queue SET status = 'failed', message = 'No subscription found' WHERE id = $1",
            [item.id],
          )
          continue
        }

        const sendPromises = subsRes.rows.map(async (subRow) => {
          const subscription = subRow.subscription
          try {
            await webPush.sendNotification(
              subscription,
              JSON.stringify({
                title: item.title,
                message: item.message,
                icon: '/icon.png',
                badge: '/badge.png',
                data: { url: '/', id: item.id },
              }),
            )
            return true
          } catch (err: any) {
            if (err.statusCode === 410 || err.statusCode === 404) {
              await pool.query(
                'DELETE FROM push_subscriptions WHERE user_id = $1 AND subscription::text = $2::text',
                [item.user_id, JSON.stringify(subscription)],
              )
            }
            // Don't throw here, just return false so we know this sub failed
            return false
          }
        })

        const outcomes = await Promise.all(sendPromises)
        const success = outcomes.some((result) => result === true)

        if (success) {
          await pool.query(
            "UPDATE push_queue SET status = 'sent' WHERE id = $1",
            [item.id],
          )
          results.push_notifications_sent++
        } else {
          throw new Error('All subscriptions failed')
        }
      } catch (err: any) {
        await pool.query(
          "UPDATE push_queue SET status = 'failed' WHERE id = $1",
          [item.id],
        )
      }
    }
  } catch (error: any) {
    results.errors.push(error.message)
  }

  return results
}
