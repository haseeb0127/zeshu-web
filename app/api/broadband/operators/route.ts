import { NextResponse } from 'next/server';
import { fetchBroadbandOperators } from '@/app/lib/planapi';
import { authenticateProviderRequest, authRequiredResponse, rateLimitResponse } from '@/app/lib/provider-security';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const user = await authenticateProviderRequest(request);
  if (!user) return authRequiredResponse();
  const limited = rateLimitResponse(user.id, 'broadband-operators');
  if (limited) return limited;
  try { return NextResponse.json({ operators: await fetchBroadbandOperators() }); }
  catch { return NextResponse.json({ error: 'Broadband providers are temporarily unavailable.' }, { status: 503 }); }
}
