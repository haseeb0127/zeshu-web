import { NextResponse } from 'next/server';
import { fetchFastagInfo } from '@/app/lib/planapi';
import { authenticateProviderRequest, authRequiredResponse, rateLimitResponse } from '@/app/lib/provider-security';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const user = await authenticateProviderRequest(request);
  if (!user) return authRequiredResponse();
  const limited = rateLimitResponse(user.id, 'fastag-fetch-info');
  if (limited) return limited;
  try {
    const body = await request.json();
    const operatorCode = typeof body?.operatorCode === 'string' ? body.operatorCode.trim() : '';
    const vehicleNumber = typeof body?.vehicleNumber === 'string' ? body.vehicleNumber : '';
    const info = await fetchFastagInfo(operatorCode, vehicleNumber);
    return NextResponse.json({ operatorCode, info });
  } catch (error) {
    const message = error instanceof Error && error.message === 'INVALID_VEHICLE_NUMBER' ? 'Enter a valid vehicle registration number.' : error instanceof Error && error.message.includes('No FASTag') ? 'No FASTag details were found for these details.' : "We couldn't fetch FASTag details. Check the provider and vehicle number and try again.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
