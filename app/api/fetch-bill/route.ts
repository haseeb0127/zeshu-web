import { NextResponse } from 'next/server';
import { authenticateProviderRequest, authRequiredResponse, rateLimitResponse } from '@/app/lib/provider-security';

// 🚀 THE SWITCHBOARD
const SERVICE_API_MAP: Record<string, { endpoint: string; numberParam: string }> = {
  electricity: { endpoint: 'ElectricityBillFetch', numberParam: 'bill_number' },
  fastag:      { endpoint: 'FastagInfoFetch',      numberParam: 'VehicleNo' },
  gas:         { endpoint: 'GasPipeInfoFetch',     numberParam: 'ConsumerNo' },
  lpg:         { endpoint: 'GasInfoFetch',         numberParam: 'ConsumerNo' }, // Back to official endpoint
  water:       { endpoint: 'WaterInfoFetch',       numberParam: 'ConsumerNo' },
  broadband:   { endpoint: 'BroadbandInfoFetch',   numberParam: 'ConsumerNo' },
  emi:         { endpoint: 'EMIBillFetch',         numberParam: 'loan_number' },
  insurance:   { endpoint: 'InsuranceInfoFetch',   numberParam: 'PolicyNumber' },
  postpaid:    { endpoint: 'PostPaidInfoFetch',    numberParam: 'MobileNo' },
  landline:    { endpoint: 'PostPaidInfoFetch',    numberParam: 'MobileNo' },
  dth:         { endpoint: 'DTHINFOCheck',         numberParam: 'mobile_no' },
};

export async function GET(request: Request) {
  const user = await authenticateProviderRequest(request);
  if (!user) return authRequiredResponse();
  const limited = rateLimitResponse(user.id, 'fetch-bill');
  if (limited) return limited;
  const { searchParams } = new URL(request.url);
  const service = searchParams.get('service');
  const number = searchParams.get('number');
  const operatorCode = searchParams.get('operatorCode');

  const validIdentifier = (value: string, maxLength: number) => /^[A-Za-z0-9][A-Za-z0-9._/-]{0,79}$/.test(value) && value.length <= maxLength;
  if (!service || !SERVICE_API_MAP[service] || !number || !operatorCode || !validIdentifier(number, 80) || !validIdentifier(operatorCode, 40)) {
    return NextResponse.json({ success: false, message: "Missing required fields." }, { status: 400 });
  }

  const apiConfig = SERVICE_API_MAP[service] || { endpoint: 'BillCheck', numberParam: 'Accountno' };

  try {
    const params = new URLSearchParams({
      apimember_id: process.env.PLAN_API_USER_ID || '',
      api_password: process.env.PLAN_API_PASSWORD || '',
      operator_code: operatorCode,
    });
    params.append(apiConfig.numberParam, number);

    const apiUrl = `https://planapi.in/api/Mobile/${apiConfig.endpoint}?${params.toString()}`;
    const res = await fetch(apiUrl);
    
    // 🔍 THE SHIELD: Prevent crashes by reading text instead of forcing JSON
    const rawText = await res.text();
    
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      // If PlanAPI sends a 404 HTML page, this safely catches it!
      return NextResponse.json({ 
        success: false, 
        message: "Unable to fetch bill details right now. Please try again." 
      }, { status: 400 });
    }

    if (data.ERROR === "0" && data.STATUS === "1") {
      return NextResponse.json({ 
        success: true, 
        bill: data.BILLDEATILS || data.DATA || null,
        message: "Bill details fetched successfully." 
      });
    } else {
      // This will capture the EXACT PlanAPI complaint ("Invalid Operator", etc.)
      return NextResponse.json({ 
        success: false, 
        message: "Unable to fetch bill details right now. Please try again." 
      }, { status: 400 });
    }

  } catch (error: any) {
    // 🚨 If the Vercel server drops connection, show the real crash reason
    if (process.env.NODE_ENV === 'development') console.error('Bill provider request failed:', error?.message || 'unknown error');
    return NextResponse.json({ success: false, message: "Unable to fetch bill details right now. Please try again." }, { status: 500 });
  }
}
export const dynamic = 'force-dynamic';
