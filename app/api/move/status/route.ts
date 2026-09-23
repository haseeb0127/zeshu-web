import { NextResponse } from 'next/server';
import { getMoveServiceReadiness } from '@/app/lib/move-readiness';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const readiness = getMoveServiceReadiness();
  return NextResponse.json({
    services: readiness,
    booking_available: false,
    support_available: true,
    note: 'Discovery and customer support are available. Booking/payment remains disabled until each service passes provider, transaction, refund, safety and compliance gates.',
  });
}
