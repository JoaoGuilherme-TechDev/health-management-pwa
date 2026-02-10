import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { pool } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    // Payload from Database Webhook: { type: 'INSERT', table: 'notifications', record: { ... }, schema: 'public' }
    
    const { record } = payload;
    
    if (!record || !record.user_id) {
      return NextResponse.json({ message: 'No user_id in record' }, { status: 200 });
    }

    if (record.id) {
      const res = await pool.query('SELECT delivered_at FROM notifications WHERE id = $1', [record.id]);
      const existing = res.rows[0];

      if (existing && existing.delivered_at) {
        return NextResponse.json({ message: 'Notification already delivered' }, { status: 200 });
      }
    }

    // Fetch subscriptions
    const subsRes = await pool.query('SELECT subscription FROM push_subscriptions WHERE user_id = $1', [record.user_id]);
    const subscriptions = subsRes.rows;

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ message: 'No subscriptions found' }, { status: 200 });
    }

    // VAPID keys
    const vapidEmail = 'mailto:admin@healthcare.app';
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error('Missing VAPID keys');
      return NextResponse.json({ error: 'Missing VAPID keys' }, { status: 500 });
    }

    webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);

    const notificationType: string = record.notification_type || record.type || 'info';
    const isMedication = notificationType === 'medication_reminder';

    const actions =
      isMedication
        ? [
            { action: 'dismiss', title: 'Marcar como Lido' },
          ]
        : [];

    const notificationPayload = JSON.stringify({
      title: record.title,
      message: record.message,
      tag: record.id || notificationType,
      url: '/',
      vibrate: isMedication ? [200, 100, 200, 100, 200] : [200, 100, 200],
      requireInteraction: isMedication,
      data: {
        ...record,
        id: record.id,
      },
      actions,
    });

    const results = await Promise.all(
      subscriptions.map(async (sub: any) => {
        try {
          await webpush.sendNotification(sub.subscription, notificationPayload);
          
          // Log success
          await pool.query(
            `INSERT INTO notification_event_logs (user_id, event_type, payload) VALUES ($1, $2, $3)`,
            [record.user_id, 'push_delivery_success', { notification_id: record.id, notification_type: record.notification_type }]
          );
            
          return { success: true };
        } catch (err: any) {
          console.error('Failed to send push:', err);
          
          // Log failure
          await pool.query(
            `INSERT INTO notification_event_logs (user_id, event_type, payload) VALUES ($1, $2, $3)`,
            [record.user_id, 'push_delivery_failed', { notification_id: record.id, error: String(err) }]
          );
            
          // If subscription is invalid (410 Gone), remove it
          if (err.statusCode === 410 || err.statusCode === 404) {
             // Delete by subscription JSON content matching
             // This is tricky in SQL if subscription is JSONB.
             // Assuming sub.subscription is the JSON object.
             // We can cast to text or use containment.
             await pool.query(
                `DELETE FROM push_subscriptions WHERE subscription::text = $1::text`,
                [JSON.stringify(sub.subscription)]
             );
          }
          
          return { success: false, error: err };
        }
      })
    );

    const anySuccess = results.some((r: { success: boolean }) => r.success);
    if (anySuccess) {
      await pool.query(
        'UPDATE notifications SET delivered_at = NOW() WHERE id = $1',
        [record.id]
      );
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
