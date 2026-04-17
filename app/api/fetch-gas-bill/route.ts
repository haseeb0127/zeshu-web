import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const consumerNo = searchParams.get('consumerNo');
  const operatorCode = searchParams.get('operatorCode');

  if (!consumerNo || !operatorCode) {
    return NextResponse.json({ 
      success: false, 
      message: "Please provide both Consumer Number and Operator" 
    }, { status: 400 });
  }

  try {
    console.log(`Fetching Gas Bill for ${consumerNo} at Operator ${operatorCode}`);

    // Build the query parameters securely
    const params = new URLSearchParams({
      apimember_id: process.env.PLAN_API_USER_ID || '',
      api_password: process.env.PLAN_API_PASSWORD || '',
      ConsumerNo: consumerNo,
      operator_code: operatorCode
    });

    // Make the request to PlanAPI
    const apiUrl = `https://planapi.in/api/Mobile/GasInfoFetch?${params.toString()}`;
    const res = await fetch(apiUrl);
    
    // 🔍 THE SHIELD: Prevent crashes by reading text instead of forcing JSON
    const rawText = await res.text();
    
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      // If PlanAPI sends a 404 HTML page, this safely catches it!
      console.error("PlanAPI sent HTML instead of JSON:", rawText.substring(0, 200));
      return NextResponse.json({ 
        success: false, 
        message: `API HTML Error. PlanAPI says: ${rawText.substring(0, 100)}` 
      }, { status: 400 });
    }

    // Handle their specific response format
    if (data.ERROR === "0" && data.STATUS === "1") {
      console.log("✅ Gas Bill Found!");
      return NextResponse.json({ 
        success: true, 
        bill: data.BILLDEATILS, // Grabbing the misspelled object
        message: data.MESSAGE 
      });
    } else {
      console.log("❌ Gas Fetch Failed:", data.MESSAGE);
      return NextResponse.json({ 
        success: false, 
        // Show the EXACT error on the phone screen!
        message: `PlanAPI Refused: ${data.MESSAGE} (Code used: ${operatorCode})` 
      }, { status: 400 });
    }

  } catch (error: any) {
    console.error("Critical Gas API Error:", error);
    return NextResponse.json({ 
      success: false, 
      message: `CRASH REPORT: ${error.message || "Unknown Network Error"}` 
    }, { status: 500 });
  }
}
export const dynamic = 'force-dynamic';