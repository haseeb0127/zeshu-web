import { NextResponse } from 'next/server';
import { fetchElectricityOperators } from '@/app/lib/planapi';
import { authenticateProviderRequest, authRequiredResponse, rateLimitResponse } from '@/app/lib/provider-security';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const user = await authenticateProviderRequest(request);
  if (!user) return authRequiredResponse();
  const limited = rateLimitResponse(user.id, 'electricity-operators');
  if (limited) return limited;
  try { return NextResponse.json({ operators: await fetchElectricityOperators() }); }
  catch { return NextResponse.json({ error: 'Electricity providers are temporarily unavailable.' }, { status: 503 }); }
}
