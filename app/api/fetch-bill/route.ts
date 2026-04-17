import { NextResponse } from 'next/server';

// 🚀 THE SWITCHBOARD: Maps our frontend 'service' to PlanAPI's specific requirements
const SERVICE_API_MAP: Record<string, { endpoint: string; numberParam: string }> = {
  electricity: { endpoint: 'ElectricityBillFetch', numberParam: 'bill_number' },
  fastag:      { endpoint: 'FastagInfoFetch',      numberParam: 'VehicleNo' },
  gas:         { endpoint: 'GasPipeInfoFetch',     numberParam: 'ConsumerNo' },
  
  // ✅ FIXED: LPG now correctly routes to the Universal BBPS BillCheck endpoint!
  lpg:         { endpoint: 'BillCheck',            numberParam: 'Accountno' },
  
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

  // 1. Basic Validation
  if (!service || !number || !operatorCode) {
    return NextResponse.json({ 
      success: false, 
      message: "Missing required fields: service, number, or operatorCode." 
    }, { status: 400 });
  }

  // 2. Identify the correct PlanAPI endpoint
  const apiConfig = SERVICE_API_MAP[service] || { endpoint: 'BillCheck', numberParam: 'Accountno' };

  try {
    console.log(`📡 [API SWITCHBOARD] Routing ${service.toUpperCase()} request to ${apiConfig.endpoint}...`);

    // 3. Build the secure request parameters
    const params = new URLSearchParams({
      apimember_id: process.env.PLAN_API_USER_ID || '',
      api_password: process.env.PLAN_API_PASSWORD || '',
      operator_code: operatorCode,
    });

    // Dynamically inject the correct parameter name for the account number
    params.append(apiConfig.numberParam, number);

    // 4. Fetch from PlanAPI
    const apiUrl = `https://planapi.in/api/Mobile/${apiConfig.endpoint}?${params.toString()}`;
    const res = await fetch(apiUrl);
    const data = await res.json();

    // 5. Handle the Response
    if (data.ERROR === "0" && data.STATUS === "1") {
      console.log(`✅ [${service.toUpperCase()}] Bill Fetch Successful!`);
      
      return NextResponse.json({ 
        success: true, 
        bill: data.BILLDEATILS || data.DATA || null,
        message: data.MESSAGE 
      });
    } else {
      console.log(`❌ [${service.toUpperCase()}] Fetch Failed:`, data.MESSAGE);
      return NextResponse.json({ 
        success: false, 
        message: data.MESSAGE || "Could not fetch bill details. Please check your number." 
      }, { status: 400 });
    }

  } catch (error) {
    console.error(`🚨 Critical Error in ${service} fetch:`, error);
    return NextResponse.json({ 
      success: false, 
      message: "Internal Server Error while communicating with the billing provider." 
    }, { status: 500 });
  }
}
export const dynamic = 'force-dynamic';