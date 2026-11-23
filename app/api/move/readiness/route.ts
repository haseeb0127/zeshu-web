import { NextResponse } from 'next/server';
import { getMoveServiceReadiness } from '@/app/lib/move-readiness';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(
    {
      services: getMoveServiceReadiness(),
      customer_booking_enabled: false,
      note: 'Move & Travel remains discovery-only until each provider and compliance gate is verified.',
    },
    {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    },
  );
}
