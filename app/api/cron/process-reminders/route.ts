
import { NextResponse } from 'next/server';
import { processRemindersAndPush } from '@/lib/reminder-processor';

export async function GET(request: Request) {
  try {
    const results = await processRemindersAndPush();
    return NextResponse.json(results);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
