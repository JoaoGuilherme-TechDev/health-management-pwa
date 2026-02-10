import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import webpush from 'web-push';

export async function GET() {
  try {
    // 1. Fetch pending notifications from queue
    const queueRes = await pool.query(`
      SELECT q.id, q.user_id, q.title, q.message, q.notification_id, n.notification_type
      FROM push_queue q
      LEFT JOIN notifications n ON q.notification_id = n.id
      LIMIT 50
    `);
    
    if (queueRes.rows.length === 0) {
      return NextResponse.json({ message: 'No pending notifications' });
    }

    const vapidEmail = 'mailto:admin@healthcare.app';
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

    if (!vapidPublicKey || !vapidPrivateKey) {
      return NextResponse.json({ error: 'Missing VAPID keys' }, { status: 500 });
    }

    webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);

    const results = [];

    for (const item of queueRes.rows) {
      // 2. Get subscriptions for user
      const subRes = await pool.query('SELECT subscription FROM push_subscriptions WHERE user_id = $1', [item.user_id]);
      
      if (subRes.rows.length === 0) {
        // No subscription, just remove from queue
        await pool.query('DELETE FROM push_queue WHERE id = $1', [item.id]);
        continue;
      }

      const payload = JSON.stringify({
        title: item.title,
        message: item.message,
        url: '/',
        tag: item.notification_id,
        data: {
             id: item.notification_id,
             type: item.notification_type
        }
      });

      // 3. Send to all user subscriptions
      const sendPromises = subRes.rows.map(async (row) => {
        try {
          await webpush.sendNotification(row.subscription, payload);
          return { success: true };
        } catch (err: any) {
          if (err.statusCode === 410 || err.statusCode === 404) {
             // Subscription expired, remove it
             await pool.query('DELETE FROM push_subscriptions WHERE user_id = $1 AND subscription::text = $2', [item.user_id, JSON.stringify(row.subscription)]);
          }
          return { success: false, error: err };
        }
      });

      await Promise.all(sendPromises);

      // 4. Remove from queue
      await pool.query('DELETE FROM push_queue WHERE id = $1', [item.id]);
      results.push({ id: item.id, status: 'processed' });
    }

    return NextResponse.json({ success: true, processed: results.length });
  } catch (error: any) {
    console.error('Push processing error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
