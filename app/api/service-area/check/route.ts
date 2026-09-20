import { NextResponse } from 'next/server';
import { evaluateJagtialServiceArea } from '@/app/lib/service-area';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const numberFrom = (value: unknown) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const latitude = numberFrom(body.latitude);
  const longitude = numberFrom(body.longitude);

  if (
    latitude === null || longitude === null
    || latitude < -90 || latitude > 90
    || longitude < -180 || longitude > 180
  ) {
    return NextResponse.json(
      {
        status: 'SERVICE_AREA_UNAVAILABLE',
        serviceable: false,
        message: 'Choose a valid map pin so we can check delivery availability.',
      },
      { status: 400 },
    );
  }

  const status = evaluateJagtialServiceArea(latitude, longitude);

  if (status === 'ELIGIBLE') {
    return NextResponse.json({
      status,
      serviceable: true,
      message: 'Delivery is available at this location.',
    });
  }

  if (status === 'OUTSIDE_SERVICE_AREA') {
    return NextResponse.json({
      status,
      serviceable: false,
      message: 'Physical delivery is not available here yet. Zeshu currently delivers eligible physical products only inside the Jagtial service area.',
    });
  }

  return NextResponse.json({
    status: 'SERVICE_AREA_UNAVAILABLE',
    serviceable: false,
    message: 'We could not verify this delivery location. Move the pin and try again.',
  });
}
