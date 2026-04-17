import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Read the incoming request from your frontend
    const body = await request.json();
    const { action, upiId, mobileNo, name } = body;

    if (!action) {
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
        if (!upiId) return NextResponse.json({ success: false, message: "UpiId required" });
        endpoint = 'VPA_Info';
        formData.append('UpiId', upiId);
        break;

      case 'upi_verification':
        if (!upiId) return NextResponse.json({ success: false, message: "UpiId required" });
        endpoint = 'UpiVerification';
        formData.append('UpiId', upiId);
        break;

      case 'upi_validate':
        if (!upiId || !name) return NextResponse.json({ success: false, message: "UpiId and Name required" });
        endpoint = 'UPI_Validate';
        formData.append('UpiId', upiId);
        formData.append('Name', name);
        break;

      case 'mobile_to_vpa':
        if (!mobileNo) return NextResponse.json({ success: false, message: "MobileNo required" });
        endpoint = 'MobileNoToVPA';
        formData.append('MobileNo', mobileNo);
        break;

      case 'mobile_to_multiple_upi':
        if (!mobileNo) return NextResponse.json({ success: false, message: "MobileNo required" });
        endpoint = 'MobileToMultipleUPI';
        formData.append('MobileNo', mobileNo);
        break;

      case 'find_upi_by_mobile':
        if (!mobileNo) return NextResponse.json({ success: false, message: "MobileNo required" });
        endpoint = 'FindUpiAndNameByMobileNo';
        formData.append('MobileNo', mobileNo);
        break;

      default:
        return NextResponse.json({ success: false, message: "Invalid UPI action requested" }, { status: 400 });
    }

    const apiUrl = `https://planapi.in/Api/Ekyc/${endpoint}`;
    console.log(`📡 [UPI SWITCHBOARD] Calling ${endpoint}...`);

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
      console.error("PlanAPI sent HTML instead of JSON:", rawText.substring(0, 200));
      return NextResponse.json({ 
        success: false, 
        message: `API HTML Error. PlanAPI says: ${rawText.substring(0, 100)}` 
      }, { status: 400 });
    }

    // 6. Handle Response (PlanAPI treats 100, 200, and 211 as successful wallet debits)
    const successCodes = [100, 200, 211];
    
    if (successCodes.includes(data.Errorcode)) {
      console.log(`✅ [${endpoint}] Fetch Successful!`);
      return NextResponse.json({ 
        success: true, 
        data: data.data || data, // Handle different nested structures
        message: data.Message || data.msg || "Success"
      });
    } else {
      console.log(`❌ [${endpoint}] Fetch Failed:`, data.Message || data.msg);
      return NextResponse.json({ 
        success: false, 
        message: data.Message || data.msg || "Could not fetch UPI details. Please check the ID/Number." 
      }, { status: 400 });
    }

  } catch (error: any) {
    console.error("Critical UPI API Error:", error);
    return NextResponse.json({ 
      success: false, 
      message: `CRASH REPORT: ${error.message || "Unknown Network Error"}` 
    }, { status: 500 });
  }
}