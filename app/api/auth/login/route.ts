import { NextResponse } from 'next/server';
import { authAdapter } from '@/lib/auth-local';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    const { user, error } = await authAdapter.signIn(email, password);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
