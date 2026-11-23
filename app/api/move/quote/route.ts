import { NextResponse } from 'next/server';
import { evaluateTelanganaMoveArea } from '@/app/lib/move-service-area';
import { isMoveServiceCode, quoteMove, requireMoveUser } from '@/app/lib/move-matching-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const coord = (value: unknown, min: number, max: number) => {
  const n = Number(value);
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
};

export async function POST(request: Request) {
  const auth = await requireMoveUser(request);
  if (!auth.context) return auth.response!;

  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const serviceCode = typeof body.service_code === 'string' ? body.service_code.trim() : '';
  if (!isMoveServiceCode(serviceCode)) {
    return NextResponse.json({ error: 'Choose a supported Move service.' }, { status: 400 });
  }

  if (serviceCode === 'AUTO_DRIVER' || serviceCode === 'CAB_DRIVER') {
    return NextResponse.json({
      error: 'Passenger fare estimates will open with the compliant Telangana provider integration.',
      compliance_gate: true,
    }, { status: 409 });
  }

  const pickupLatitude = coord(body.pickup_latitude, -90, 90);
  const pickupLongitude = coord(body.pickup_longitude, -180, 180);
  const dropoffLatitude = coord(body.dropoff_latitude, -90, 90);
  const dropoffLongitude = coord(body.dropoff_longitude, -180, 180);

  if (pickupLatitude === null || pickupLongitude === null || dropoffLatitude === null || dropoffLongitude === null) {
    return NextResponse.json({ error: 'Choose valid pickup and drop locations.' }, { status: 400 });
  }

  const pickupArea = evaluateTelanganaMoveArea(pickupLatitude, pickupLongitude, body.pickup_state);
  const dropoffArea = evaluateTelanganaMoveArea(dropoffLatitude, dropoffLongitude, body.dropoff_state);
  if (pickupArea !== 'ELIGIBLE' || dropoffArea !== 'ELIGIBLE') {
    return NextResponse.json({ error: 'Pickup and drop must currently be inside Telangana.' }, { status: 400 });
  }

  const quote = await quoteMove(
    serviceCode,
    { latitude: pickupLatitude, longitude: pickupLongitude },
    { latitude: dropoffLatitude, longitude: dropoffLongitude },
  );

  return NextResponse.json({
    quote: {
      distance_km: quote.distanceKm,
      duration_minutes: quote.durationMinutes,
      fare: quote.quotedFare,
      driver_payout: quote.driverPayout,
      platform_fee: quote.platformFee,
      source: quote.source,
    },
  }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
}
