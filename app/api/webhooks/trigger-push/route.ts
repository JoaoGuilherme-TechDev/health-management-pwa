import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    // Payload from Database Webhook: { type: 'INSERT', table: 'notifications', record: { ... }, schema: 'public' }
    
    const { record } = payload;
    
    if (!record || !record.user_id) {
      return NextResponse.json({ message: 'No user_id in record' }, { status: 200 });
    }

    // Fetch subscriptions
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', record.user_id);

    if (error) {
      console.error('Error fetching subscriptions:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

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

    const isMedication = record.notification_type === 'medication_reminder';

    const notificationPayload = JSON.stringify({
      title: record.title,
      message: record.message,
      tag: record.notification_type,
      url: '/', // Or specific URL based on type
      vibrate: isMedication ? [200, 100, 200, 100, 200] : undefined,
      requireInteraction: isMedication ? true : undefined,
      data: record,
      actions: isMedication
        ? [
            { action: 'snooze', title: 'Soneca 15m' },
            { action: 'dismiss', title: 'Marcar como Lido' },
          ]
        : [],
    });

    const results = await Promise.all(
      subscriptions.map(async (sub: any) => {
        try {
          await webpush.sendNotification(sub.subscription, notificationPayload);
          
          // Log success
          await supabase
            .from('notification_event_logs')
            .insert({
              user_id: record.user_id,
              event_type: 'push_delivery_success',
              payload: { notification_id: record.id, notification_type: record.notification_type },
            });
            
          return { success: true };
        } catch (err: any) {
          console.error('Failed to send push:', err);
          
          // Log failure
          await supabase
            .from('notification_event_logs')
            .insert({
              user_id: record.user_id,
              event_type: 'push_delivery_failed',
              payload: { notification_id: record.id, error: String(err) },
            });
            
          // If subscription is invalid (410 Gone), remove it
          if (err.statusCode === 410 || err.statusCode === 404) {
             await supabase
              .from('push_subscriptions')
              .delete()
              .eq('subscription', sub.subscription); // JSON containment match might be tricky, but assuming exact match works or use ID if available
              // Better to delete by matching the whole JSON object if possible, or we need an ID on push_subscriptions
          }
          
          return { success: false, error: err };
        }
      })
    );

    // Update delivered_at if at least one success
    const anySuccess = results.some((r) => r.success);
    if (anySuccess) {
      await supabase
        .from('notifications')
        .update({ delivered_at: new Date().toISOString() })
        .eq('id', record.id);
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
