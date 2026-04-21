import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  let number = searchParams.get('number') || '';

  // 1. STRIKE THE 91: Clean the number to 10 digits
  const cleanNumber = number.replace(/\D/g, '').slice(-10);

  if (cleanNumber.length !== 10) {
    return NextResponse.json({ plans: [], message: "Please enter a valid 10-digit number" });
  }

  try {
    // --- STEP 1: HLR Check (To get the official Numeric Codes) ---
    const hlrParams = new URLSearchParams({
      ApiUserID: process.env.PLAN_API_USER_ID || '',
      ApiPassword: process.env.PLAN_API_PASSWORD || '',
      Mobileno: cleanNumber
    });
    
    const hlrRes = await fetch(`https://planapi.in/api/Mobile/OperatorFetchNew?${hlrParams.toString()}`);
    const hlrData = await hlrRes.json();

    const opCode = hlrData.OpCode || "";
    const circleCode = hlrData.CircleCode || "92";

    if (!opCode) {
        return NextResponse.json({ plans: [], message: "Could not identify operator code" });
    }

    // --- STEP 2: Fetch Live Plans using Numeric Keys ---
    const planParams = new URLSearchParams({
      apimember_id: process.env.PLAN_API_USER_ID || '',
      api_password: process.env.PLAN_API_PASSWORD || '',
      operatorcode: opCode, 
      circle: circleCode // NOTE: Change back to 'cricle' if the API documentation specifically requires the typo!
    });

    const planRes = await fetch(`https://planapi.in/api/Mobile/MobileRechargePlan?${planParams.toString()}`);
    const planData = await planRes.json();

    // --- STEP 3: Error Check ---
    if (planData.STATUS === "3" || planData.STATUS === "0") {
      console.log("❌ API REJECTED REQUEST:", planData.MESSAGE);
      return NextResponse.json({ plans: [], message: planData.MESSAGE });
    }

    // --- STEP 4: The Logic Fix (Merging everything into one clean array) ---
    let rawPlans: any[] = [];
    if (planData.RDATA && typeof planData.RDATA === 'object') {
      Object.keys(planData.RDATA).forEach((cat) => {
        const list = planData.RDATA[cat];
        if (Array.isArray(list)) {
          // We attach BOTH names just to be 100% safe
          rawPlans = [...rawPlans, ...list.map(p => ({ 
            ...p, 
            categoryName: cat, // Used for the Tabs
            catName: cat       // Used for the description fallback
          }))];
        }
      });
    }

    // --- STEP 5: Final Formatting ---
    const formattedPlans = rawPlans.map((p: any) => ({
      amount: String(p.rs || p.amount || p.Price || "0"), // Converted to string for mobile safety
      validity: p.validity || p.Validity || 'N/A',
      desc: p.desc || p.Description || p.detail || `Live ${p.categoryName} Plan`,
      categoryName: p.categoryName // CRITICAL: This MUST be here for the tabs to work!
    })).filter(p => p.amount !== "0");

    console.log(`✅ ZESHU SUCCESS: Found ${formattedPlans.length} live plans with categories.`);
    return NextResponse.json({ plans: formattedPlans });

  } catch (error) {
    console.error("Critical API Error:", error);
    return NextResponse.json({ plans: [], message: "Failed to connect to provider" }, { status: 500 });
  }
}