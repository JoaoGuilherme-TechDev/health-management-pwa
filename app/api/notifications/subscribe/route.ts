import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { authAdapter } from '@/lib/auth-local';

export async function POST(request: Request) {
  try {
    const subscription = await request.json();
    const { data } = await authAdapter.getUser();
    
    if (!data.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await pool.query(
      `INSERT INTO push_subscriptions (user_id, subscription)
       VALUES ($1, $2)
       ON CONFLICT (user_id, subscription) DO NOTHING`,
      [data.user.id, subscription]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Subscribe error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
