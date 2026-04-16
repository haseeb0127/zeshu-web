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
    const res = await fetch(`https://planapi.in/api/Mobile/GasInfoFetch?${params.toString()}`);
    const data = await res.json();

    // Handle their specific response format (and the 'BILLDEATILS' typo)
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
        message: data.MESSAGE || "Could not fetch bill details" 
      }, { status: 400 });
    }

  } catch (error) {
    console.error("Critical Gas API Error:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Internal Server Error" 
    }, { status: 500 });
  }
}