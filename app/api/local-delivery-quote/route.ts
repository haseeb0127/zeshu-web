import { NextResponse } from 'next/server';
import { calculateLocalCheckoutPrice } from '../../lib/local-checkout-pricing';
import { evaluateJagtialServiceArea } from '../../lib/service-area';
import { getRuntimeEnvValue } from '../../lib/runtime-env';

export const dynamic = 'force-dynamic';

/**
 * Public advisory quote for UI only. The authenticated checkout independently
 * verifies saved address ownership, eligibility and pricing server-side.
 * No wallet/payment/seller data is accessed here.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Invalid quote request.' }, { status: 400 });
  const subtotal = Number(body.subtotal);
  if (!Number.isFinite(subtotal) || subtotal <= 0 || subtotal > 1_000_000) {
    return NextResponse.json({ error: 'Invalid basket amount.' }, { status: 400 });
  }
  const pilotEnabled = await getRuntimeEnvValue('ZESHU_LOCAL_PAID_DELIVERY_PILOT') === 'true';
  const latitude = typeof body.latitude === 'number' ? body.latitude : null;
  const longitude = typeof body.longitude === 'number' ? body.longitude : null;
  const quote = calculateLocalCheckoutPrice({ subtotal, pilotEnabled, latitude, longitude });
  if (pilotEnabled && quote.eligible && latitude !== null && longitude !== null
      && evaluateJagtialServiceArea(latitude, longitude) !== 'ELIGIBLE') {
    return NextResponse.json({
      ...quote, eligible: false, reason: 'OUTSIDE_PILOT_RADIUS',
      deliveryFee: 0, handlingFee: 0, totalBeforeRewards: null,
    }, { headers: { 'Cache-Control': 'no-store' } });
  }
  return NextResponse.json(quote, { headers: { 'Cache-Control': 'no-store' } });
}
