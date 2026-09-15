import { NextResponse } from 'next/server';
import { discoverDthOperator, fetchDthPlans } from '@/app/lib/planapi';
import { authenticateProviderRequest, authRequiredResponse, rateLimitResponse } from '@/app/lib/provider-security';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const user = await authenticateProviderRequest(request);
  if (!user) return authRequiredResponse();
  const limited = rateLimitResponse(user.id, 'dth-plans');
  if (limited) return limited;
  try {
    const body = await request.json();
    const dthNumber = typeof body?.dthNumber === 'string' ? body.dthNumber : '';
    const detected = await discoverDthOperator(dthNumber);
    const plans = await fetchDthPlans(detected.operatorCode);
    return NextResponse.json({ ...detected, plans });
  } catch (error) {
    const message = error instanceof Error && error.message === 'INVALID_DTH_NUMBER' ? 'Enter a valid DTH subscriber/customer ID.' : 'DTH plans are temporarily unavailable.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
