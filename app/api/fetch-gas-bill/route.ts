import { NextResponse } from 'next/server';
import { authenticateProviderRequest, authRequiredResponse, rateLimitResponse } from '@/app/lib/provider-security';
import { getPlanApiCredentials, planApiTimeoutSignal } from '@/app/lib/planapi-config';

export async function GET(request: Request) {
  const user = await authenticateProviderRequest(request);
  if (!user) return authRequiredResponse();
  const limited = rateLimitResponse(user.id, 'fetch-gas-bill');
  if (limited) return limited;
  const { searchParams } = new URL(request.url);
  const consumerNo = searchParams.get('consumerNo');
  const operatorCode = searchParams.get('operatorCode');

  const validIdentifier = (value: string, maxLength: number) => /^[A-Za-z0-9][A-Za-z0-9._/-]{0,79}$/.test(value) && value.length <= maxLength;
  if (!consumerNo || !operatorCode || !validIdentifier(consumerNo, 80) || !validIdentifier(operatorCode, 40)) {
    return NextResponse.json({ 
      success: false, 
      message: "Please provide both Consumer Number and Operator" 
    }, { status: 400 });
  }

  try {
    const { memberId, password } = getPlanApiCredentials();
    // Build the query parameters securely
    const params = new URLSearchParams({
      apimember_id: memberId,
      api_password: password,
      ConsumerNo: consumerNo,
      operator_code: operatorCode
    });

    // Make the request to PlanAPI
    const apiUrl = `https://planapi.in/api/Mobile/GasInfoFetch?${params.toString()}`;
    const res = await fetch(apiUrl, { signal: planApiTimeoutSignal(), cache: 'no-store' });
    
    // 🔍 THE SHIELD: Prevent crashes by reading text instead of forcing JSON
    const rawText = await res.text();
    
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      // If PlanAPI sends a 404 HTML page, this safely catches it!
      if (process.env.NODE_ENV === 'development') console.error("Gas provider returned a non-JSON response.");
      return NextResponse.json({ 
        success: false, 
        message: "Unable to fetch bill details right now. Please try again." 
      }, { status: 400 });
    }

    // Handle their specific response format
    if (data.ERROR === "0" && data.STATUS === "1") {
      return NextResponse.json({ 
        success: true, 
        bill: data.BILLDEATILS, // Grabbing the misspelled object
        message: "Bill details fetched successfully." 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        message: "Unable to fetch bill details right now. Please try again." 
      }, { status: 400 });
    }

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'unknown error';
    if (process.env.NODE_ENV === 'development' && message !== 'PLANAPI_NOT_CONFIGURED') console.error('Gas provider request failed:', message);
    if (message === 'PLANAPI_NOT_CONFIGURED') return NextResponse.json({ success: false, message: 'Gas bill service is temporarily unavailable.' }, { status: 503 });
    return NextResponse.json({ 
      success: false, 
      message: "Unable to fetch bill details right now. Please try again." 
    }, { status: 502 });
  }
}
export const dynamic = 'force-dynamic';
