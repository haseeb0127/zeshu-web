import { NextResponse } from 'next/server';
import { discoverDthOperator } from '@/app/lib/planapi';
import { authenticateProviderRequest, authRequiredResponse, rateLimitResponse } from '@/app/lib/provider-security';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const user = await authenticateProviderRequest(request);
  if (!user) return authRequiredResponse();
  const limited = rateLimitResponse(user.id, 'dth-operator');
  if (limited) return limited;
  try {
    const body = await request.json();
    const dthNumber = typeof body?.dthNumber === 'string' ? body.dthNumber : '';
    const result = await discoverDthOperator(dthNumber);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error && error.message === 'INVALID_DTH_NUMBER' ? 'Enter a valid DTH subscriber/customer ID.' : "We couldn't detect this DTH provider. Check the number and try again.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
