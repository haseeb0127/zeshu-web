import { NextResponse } from 'next/server';
import { discoverPlans } from '@/app/lib/planapi';
import { authenticateProviderRequest, authRequiredResponse, rateLimitResponse } from '@/app/lib/provider-security';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const user = await authenticateProviderRequest(request);
  if (!user) return authRequiredResponse();
  const limited = rateLimitResponse(user.id, 'recharge-plans');
  if (limited) return limited;

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ message: 'Invalid request.' }, { status: 400 }); }
  const mobileValue = typeof body === 'object' && body !== null && 'mobile' in body
    ? (body as { mobile?: unknown }).mobile
    : null;
  const mobile = typeof mobileValue === 'string' ? mobileValue.replace(/\D/g, '') : '';
  if (!/^[6-9]\d{9}$/.test(mobile)) return NextResponse.json({ message: 'Enter a valid 10-digit Indian mobile number.' }, { status: 400 });
  try {
    const result = await discoverPlans(mobile);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (process.env.NODE_ENV === 'development' && message !== 'PLANAPI_NOT_CONFIGURED') console.error('Plan discovery failed:', message);
    if (message === 'PLANAPI_NOT_CONFIGURED') return NextResponse.json({ message: 'Recharge plans are temporarily unavailable.' }, { status: 503 });
    if (message === 'INVALID_MOBILE') return NextResponse.json({ message: 'Enter a valid 10-digit Indian mobile number.' }, { status: 400 });
    return NextResponse.json({ message: 'Recharge plans are temporarily unavailable.' }, { status: 502 });
  }
}
