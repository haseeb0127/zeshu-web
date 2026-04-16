import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // 'action' tells the API which specific EKYC tool to use
    // 'query' is the UPI ID or Mobile Number
    // 'name' is only used for the 'upi_validate' action
    const { action, query, name } = body; 

    let endpoint = '';
    const params = new URLSearchParams();
    params.append('ApiMode', '1'); // 1 = Live Mode

    // 🚀 THE MEGA UPI SWITCHBOARD 🚀
    switch (action) {
      case 'vpa_info':
        // Returns BankName, TPAP (PhonePe/Gpay), etc.
        endpoint = 'VPA_Info';
        params.append('UpiId', query);
        break;

      case 'upi_verify':
        // Returns Name and IsAccountExist status
        endpoint = 'UpiVerification';
        params.append('UpiId', query);
        break;

      case 'upi_validate':
        // Validates if a specific Name matches the UPI ID
        if (!name) return NextResponse.json({ success: false, message: 'Name is required for validation' }, { status: 400 });
        endpoint = 'UPI_Validate';
        params.append('UpiId', query);
        params.append('Name', name);
        break;

      case 'mobile_to_vpa':
        // Confirms if mobile is linked and returns single UPI ID
        endpoint = 'MobileNoToVPA'; // Note: This one uses lower case /api/ in the docs, but fetch is case-insensitive usually.
        params.append('MobileNo', query);
        break;

      case 'mobile_to_multiple_upi':
        // Returns an array of ALL UPI IDs linked to a number
        endpoint = 'MobileToMultipleUPI';
        params.append('MobileNo', query);
        break;

      case 'find_upi_by_mobile':
        // Returns Name and Account Exist status via Mobile Number
        endpoint = 'FindUpiAndNameByMobileNo';
        params.append('MobileNo', query);
        break;

      default:
        return NextResponse.json({ success: false, message: 'Invalid action provided' }, { status: 400 });
    }

    console.log(`📡 [UPI TOOLS] Executing ${endpoint} for: ${query}`);

    // Make the secure request to PlanAPI E-KYC server
    const res = await fetch(`https://planapi.in/Api/Ekyc/${endpoint}`, {
      method: 'POST',
      headers: {
        'TokenID': process.env.PLAN_API_TOKEN_ID || '', 
        'ApiUserID': process.env.PLAN_API_USER_ID || '',
        'ApiPassword': process.env.PLAN_API_PASSWORD || '',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    const data = await res.json();

    // PlanAPI says 100, 200, or 211 are all "Success" codes for E-KYC
    if (data.Errorcode === 100 || data.Errorcode === 200 || data.Errorcode === 211) {
      console.log(`✅ [UPI TOOLS] Success! Endpoint: ${endpoint}`);
      return NextResponse.json({ success: true, data: data.data || data, action });
    } else {
      console.log(`❌ [UPI TOOLS] Failed:`, data);
      return NextResponse.json({ 
        success: false, 
        message: data.Message || data.msg || 'Verification failed. Please check the details.' 
      }, { status: 400 });
    }

  } catch (error) {
    console.error(`🚨 Critical Error in UPI Tools:`, error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
export const dynamic = 'force-dynamic';