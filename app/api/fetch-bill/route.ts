import { NextResponse } from 'next/server';

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
  const { searchParams } = new URL(request.url);
  const service = searchParams.get('service');
  const number = searchParams.get('number');
  const operatorCode = searchParams.get('operatorCode');

  if (!service || !number || !operatorCode) {
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
        message: `API HTML Error. Raw Data: ${rawText.substring(0, 100)}` 
      }, { status: 400 });
    }

    if (data.ERROR === "0" && data.STATUS === "1") {
      return NextResponse.json({ 
        success: true, 
        bill: data.BILLDEATILS || data.DATA || null,
        message: data.MESSAGE 
      });
    } else {
      // This will capture the EXACT PlanAPI complaint ("Invalid Operator", etc.)
      return NextResponse.json({ 
        success: false, 
        message: `PlanAPI Refused: ${data.MESSAGE} (You sent Code: ${operatorCode})` 
      }, { status: 400 });
    }

  } catch (error: any) {
    // 🚨 If the Vercel server drops connection, show the real crash reason
    return NextResponse.json({ 
      success: false, 
      message: `CRASH REPORT: ${error.message || "Unknown Network Error"}` 
    }, { status: 500 });
  }
}
export const dynamic = 'force-dynamic';