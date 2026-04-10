import { NextResponse } from 'next/server';
import { getCurrentPeriodStats } from '@/lib/stats';

export async function GET() {
  try {
    const stats = await getCurrentPeriodStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('API Error viewing stats:', error);
    return NextResponse.json({ total: 0, today: 0, thisWeek: 0 }, { status: 500 });
  }
}
