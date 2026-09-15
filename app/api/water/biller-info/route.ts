import { NextResponse } from 'next/server';
import { fetchWaterBillerInfo, fetchWaterOperators } from '@/app/lib/planapi';
import { authenticateProviderRequest, authRequiredResponse, rateLimitResponse } from '@/app/lib/provider-security';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const user = await authenticateProviderRequest(request);
  if (!user) return authRequiredResponse();
  const limited = rateLimitResponse(user.id, 'water-biller-info');
  if (limited) return limited;
  try {
    const body = await request.json();
    const operatorCode = typeof body?.operatorCode === 'string' ? body.operatorCode.trim() : '';
    const operators = await fetchWaterOperators();
    if (!operators.some((operator) => operator.operatorCode === operatorCode)) return NextResponse.json({ error: 'Water provider is unavailable.' }, { status: 400 });
    return NextResponse.json(await fetchWaterBillerInfo(operatorCode));
  } catch { return NextResponse.json({ error: 'Water provider metadata is temporarily unavailable.' }, { status: 503 }); }
}
