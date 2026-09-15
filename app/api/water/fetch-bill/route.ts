import { NextResponse } from 'next/server';
import { fetchWaterBillerInfo, fetchWaterBill, fetchWaterOperators, validateWaterIdentifier } from '@/app/lib/planapi';
import { authenticateProviderRequest, authRequiredResponse, rateLimitResponse } from '@/app/lib/provider-security';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const user = await authenticateProviderRequest(request);
  if (!user) return authRequiredResponse();
  const limited = rateLimitResponse(user.id, 'water-fetch-bill');
  if (limited) return limited;
  try {
    const body = await request.json();
    const operatorCode = typeof body?.operatorCode === 'string' ? body.operatorCode.trim() : '';
    const billNumber = typeof body?.billNumber === 'string' ? body.billNumber : '';
    const operators = await fetchWaterOperators();
    if (!operators.some((operator) => operator.operatorCode === operatorCode)) return NextResponse.json({ error: 'Water provider is unavailable.' }, { status: 400 });
    const metadata = await fetchWaterBillerInfo(operatorCode);
    if (!metadata.billFetchAvailable) return NextResponse.json({ error: 'Bill lookup is currently unavailable for this provider.' }, { status: 400 });
    if (metadata.fields.length !== 1) return NextResponse.json({ error: 'This water provider requires additional verification details that Zeshu does not support yet.' }, { status: 400 });
    const field = metadata.fields[0];
    const validatedBillNumber = validateWaterIdentifier(billNumber, field);
    const bill = await fetchWaterBill(operatorCode, validatedBillNumber);
    return NextResponse.json({ operatorCode, bill });
  } catch (error) {
    const message = error instanceof Error && error.message === 'INVALID_WATER_INPUT' ? 'Enter a valid water account/bill number.' : error instanceof Error && error.message.includes('additional verification') ? 'This water provider requires additional verification details that Zeshu does not support yet.' : error instanceof Error && error.message.includes('No water bill') ? 'No water bill details were found for these details.' : "We couldn't fetch this water bill. Check the details and try again.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
