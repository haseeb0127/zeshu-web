import { NextResponse } from 'next/server';
import { discoverDthOperator, fetchDthInfo } from '@/app/lib/planapi';
import { authenticateProviderRequest, authRequiredResponse, rateLimitResponse } from '@/app/lib/provider-security';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const user = await authenticateProviderRequest(request);
  if (!user) return authRequiredResponse();
  const limited = rateLimitResponse(user.id, 'dth-info');
  if (limited) return limited;
  try {
    const body = await request.json();
    const dthNumber = typeof body?.dthNumber === 'string' ? body.dthNumber : '';
    const detected = await discoverDthOperator(dthNumber);
    const info = await fetchDthInfo(dthNumber, detected.operatorCode);
    return NextResponse.json({ operator: detected.operator, operatorCode: detected.operatorCode, info });
  } catch (error) {
    const message = error instanceof Error && error.message === 'INVALID_DTH_NUMBER' ? 'Enter a valid DTH subscriber/customer ID.' : 'Account details are temporarily unavailable.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
