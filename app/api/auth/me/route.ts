import { NextResponse } from 'next/server';
import { authAdapter } from '@/lib/auth-local';

export async function GET() {
  try {
    const { data, error } = await authAdapter.getUser();
    if (error) {
      return NextResponse.json({ user: null }, { status: 401 });
    }
    return NextResponse.json({ user: data.user });
  } catch (error) {
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
