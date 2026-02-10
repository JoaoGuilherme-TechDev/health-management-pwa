import { NextResponse } from 'next/server';
import { authAdapter } from '@/lib/auth-local';

export async function POST() {
  await authAdapter.signOut();
  return NextResponse.json({ success: true });
}
