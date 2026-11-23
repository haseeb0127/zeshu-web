import { NextResponse } from 'next/server';
import { fetchBbpsBillInfoForBroadband, fetchBroadbandInfo, fetchBroadbandOperators, validateBroadbandIdentifier } from '@/app/lib/planapi';
import { authenticateProviderRequest, authRequiredResponse, rateLimitResponse } from '@/app/lib/provider-security';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const user = await authenticateProviderRequest(request);
  if (!user) return authRequiredResponse();
  const limited = rateLimitResponse(user.id, 'broadband-fetch-info');
  if (limited) return limited;
  try {
    const body = await request.json();
    const operatorCode = typeof body?.operatorCode === 'string' ? body.operatorCode.trim() : '';
    const consumerNumber = typeof body?.consumerNumber === 'string' ? body.consumerNumber : '';
    const operators = await fetchBroadbandOperators();
    if (!operators.some((operator) => operator.operatorCode === operatorCode)) return NextResponse.json({ error: 'Broadband provider is unavailable.' }, { status: 400 });
    const metadata = await fetchBbpsBillInfoForBroadband(operatorCode);
    if (!metadata.billFetchAvailable) return NextResponse.json({ error: 'Bill lookup is currently unavailable for this provider.' }, { status: 400 });
    if (metadata.fields.length !== 1) return NextResponse.json({ error: 'This broadband provider requires additional verification details that Zeshu does not support yet.' }, { status: 400 });
    const validatedConsumerNumber = validateBroadbandIdentifier(consumerNumber, metadata.fields[0]);
    const info = await fetchBroadbandInfo(operatorCode, validatedConsumerNumber);
    return NextResponse.json({ operatorCode, info });
  } catch (error) {
    const message = error instanceof Error && error.message === 'INVALID_BROADBAND_INPUT' ? 'Enter a valid broadband customer/subscriber number.' : error instanceof Error && error.message.includes('additional verification') ? 'This broadband provider requires additional verification details that Zeshu does not support yet.' : error instanceof Error && error.message.includes('No broadband') ? 'No broadband details were found for these details.' : "We couldn't fetch this broadband bill. Check the details and try again.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
