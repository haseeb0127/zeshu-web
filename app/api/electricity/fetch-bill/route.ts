import { NextResponse } from 'next/server';
import { fetchBbpsBillInfo, fetchElectricityBill, fetchElectricityOperators } from '@/app/lib/planapi';
import { authenticateProviderRequest, authRequiredResponse, rateLimitResponse } from '@/app/lib/provider-security';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const user = await authenticateProviderRequest(request);
  if (!user) return authRequiredResponse();
  const limited = rateLimitResponse(user.id, 'electricity-fetch-bill');
  if (limited) return limited;
  try {
    const body = await request.json();
    const operatorCode = typeof body?.operatorCode === 'string' ? body.operatorCode.trim() : '';
    const billNumber = typeof body?.billNumber === 'string' ? body.billNumber.trim() : '';
    if (!/^[A-Za-z0-9][A-Za-z0-9._/-]{0,79}$/.test(billNumber)) return NextResponse.json({ error: 'Enter a valid electricity consumer/bill number.' }, { status: 400 });
    const operators = await fetchElectricityOperators();
    if (!operators.some((operator) => operator.operatorCode === operatorCode)) return NextResponse.json({ error: 'Electricity provider is unavailable.' }, { status: 400 });
    const metadata = await fetchBbpsBillInfo(operatorCode);
    if (!metadata.billFetchAvailable) return NextResponse.json({ error: 'Bill lookup is currently unavailable for this provider.' }, { status: 400 });
    if (metadata.fields.length !== 1) return NextResponse.json({ error: 'This provider requires additional verification details that Zeshu does not support yet.' }, { status: 400 });
    const field = metadata.fields[0];
    if ((field.fieldType === 'NUMERIC' && !/^\d+$/.test(billNumber)) || (field.minLength !== null && billNumber.length < field.minLength) || (field.maxLength !== null && billNumber.length > field.maxLength)) return NextResponse.json({ error: 'Enter a valid electricity consumer/bill number.' }, { status: 400 });
    const bill = await fetchElectricityBill(operatorCode, billNumber, {});
    return NextResponse.json({ operatorCode, bill });
  } catch (error) {
    const message = error instanceof Error && error.message === 'INVALID_ELECTRICITY_INPUT' ? 'Enter a valid electricity consumer/bill number.' : "We couldn't fetch this electricity bill. Check the details and try again.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
