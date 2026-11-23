import { NextResponse } from 'next/server';
import { fetchBbpsBillInfo, fetchElectricityOperators } from '@/app/lib/planapi';
import { authenticateProviderRequest, authRequiredResponse, rateLimitResponse } from '@/app/lib/provider-security';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const user = await authenticateProviderRequest(request);
  if (!user) return authRequiredResponse();
  const limited = rateLimitResponse(user.id, 'electricity-biller-info');
  if (limited) return limited;
  try {
    const body = await request.json();
    const operatorCode = typeof body?.operatorCode === 'string' ? body.operatorCode.trim() : '';
    const operators = await fetchElectricityOperators();
    if (!operators.some((operator) => operator.operatorCode === operatorCode)) return NextResponse.json({ error: 'Electricity provider is unavailable.' }, { status: 400 });
    return NextResponse.json(await fetchBbpsBillInfo(operatorCode));
  } catch { return NextResponse.json({ error: 'Electricity provider metadata is temporarily unavailable.' }, { status: 503 }); }
}
