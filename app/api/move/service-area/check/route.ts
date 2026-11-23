import { NextResponse } from 'next/server';
import { evaluateTelanganaMoveArea } from '@/app/lib/move-service-area';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const numberFrom = (value: unknown) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const latitude = numberFrom(body.latitude);
  const longitude = numberFrom(body.longitude);
  const state = typeof body.state === 'string' ? body.state : '';

  if (latitude === null || longitude === null) {
    return NextResponse.json({
      status: 'UNAVAILABLE',
      serviceable: false,
      message: 'Choose a valid pickup or drop location.',
    }, { status: 400 });
  }

  const result = evaluateTelanganaMoveArea(latitude, longitude, state);

  if (result === 'ELIGIBLE') {
    return NextResponse.json({
      status: result,
      serviceable: true,
      message: 'This location is inside the Telangana Move & Courier footprint. Live service still depends on verified partner availability in this zone.',
    });
  }

  if (result === 'OUTSIDE_TELANGANA') {
    return NextResponse.json({
      status: result,
      serviceable: false,
      message: 'Zeshu Move & Courier is currently being prepared for Telangana. Choose a Telangana location.',
    });
  }

  return NextResponse.json({
    status: 'UNAVAILABLE',
    serviceable: false,
    message: 'We could not verify this location. Move the pin and try again.',
  }, { status: 400 });
}
