import { NextResponse } from 'next/server';
import { authenticateProviderRequest, authRequiredResponse, rateLimitResponse } from '@/app/lib/provider-security';

export async function POST(request: Request) {
  try {
    const user = await authenticateProviderRequest(request);
    if (!user) return authRequiredResponse();
    const limited = rateLimitResponse(user.id, 'upi-tools');
    if (limited) return limited;
    // Read the incoming request from your frontend
    const body = await request.json();
    const { action, upiId, mobileNo, name } = body;

    if (!action || typeof action !== 'string' || action.length > 40) {
      return NextResponse.json({ success: false, message: "Action type is required" }, { status: 400 });
    }

    // 1. Build the Secure Headers (Requires the TokenID you added to Vercel earlier!)
    const headers = {
      'TokenID': process.env.PLAN_API_TOKEN_ID || '',
      'ApiUserID': process.env.PLAN_API_USER_ID || '',
      'ApiPassword': process.env.PLAN_API_PASSWORD || '',
      'Content-Type': 'application/x-www-form-urlencoded'
    };

    // 2. Build the Body Data (PlanAPI requires URL-encoded format for POST requests)
    const formData = new URLSearchParams();
    formData.append('ApiMode', '1'); // 1 = Live Mode

    let endpoint = '';

    // 3. The UPI Switchboard: Route to the correct PlanAPI EKYC endpoint
    switch (action) {
      case 'vpa_info':
        if (!upiId || typeof upiId !== 'string' || upiId.length > 120) return NextResponse.json({ success: false, message: "UpiId required" }, { status: 400 });
        endpoint = 'VPA_Info';
        formData.append('UpiId', upiId);
        break;

      case 'upi_verification':
        if (!upiId || typeof upiId !== 'string' || upiId.length > 120) return NextResponse.json({ success: false, message: "UpiId required" }, { status: 400 });
        endpoint = 'UpiVerification';
        formData.append('UpiId', upiId);
        break;

      case 'upi_validate':
        if (!upiId || typeof upiId !== 'string' || upiId.length > 120 || !name || typeof name !== 'string' || name.length > 120) return NextResponse.json({ success: false, message: "UpiId and Name required" }, { status: 400 });
        endpoint = 'UPI_Validate';
        formData.append('UpiId', upiId);
        formData.append('Name', name);
        break;

      case 'mobile_to_vpa':
        if (!mobileNo || typeof mobileNo !== 'string' || mobileNo.length > 30) return NextResponse.json({ success: false, message: "MobileNo required" }, { status: 400 });
        endpoint = 'MobileNoToVPA';
        formData.append('MobileNo', mobileNo);
        break;

      case 'mobile_to_multiple_upi':
        if (!mobileNo || typeof mobileNo !== 'string' || mobileNo.length > 30) return NextResponse.json({ success: false, message: "MobileNo required" }, { status: 400 });
        endpoint = 'MobileToMultipleUPI';
        formData.append('MobileNo', mobileNo);
        break;

      case 'find_upi_by_mobile':
        if (!mobileNo || typeof mobileNo !== 'string' || mobileNo.length > 30) return NextResponse.json({ success: false, message: "MobileNo required" }, { status: 400 });
        endpoint = 'FindUpiAndNameByMobileNo';
        formData.append('MobileNo', mobileNo);
        break;

      default:
        return NextResponse.json({ success: false, message: "Invalid UPI action requested" }, { status: 400 });
    }

    const apiUrl = `https://planapi.in/Api/Ekyc/${endpoint}`;
    // 4. Fetch from PlanAPI
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: headers,
      body: formData.toString()
    });

    // 5. THE ARMOR SHIELD: Prevent HTML 404 crashes
    const rawText = await res.text();
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      if (process.env.NODE_ENV === 'development') console.error('UPI provider returned a non-JSON response.');
      return NextResponse.json({ 
        success: false, 
        message: "Unable to verify UPI details right now. Please try again." 
      }, { status: 400 });
    }

    // 6. Handle Response (PlanAPI treats 100, 200, and 211 as successful wallet debits)
    const successCodes = [100, 200, 211];
    
    if (successCodes.includes(data.Errorcode)) {
      return NextResponse.json({ 
        success: true, 
        data: data.data || data, // Handle different nested structures
        message: "UPI details fetched successfully."
      });
    } else {
      if (process.env.NODE_ENV === 'development') console.info('UPI provider request completed without success.', { endpoint });
      return NextResponse.json({ 
        success: false, 
        message: "Unable to verify UPI details right now. Please try again." 
      }, { status: 400 });
    }

  } catch (error: unknown) {
    if (process.env.NODE_ENV === 'development') console.error('UPI provider request failed:', error instanceof Error ? error.message : 'unknown error');
    return NextResponse.json({ success: false, message: "Unable to verify UPI details right now. Please try again." }, { status: 500 });
  }
}
