import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const number = searchParams.get('number');

  if (!number || number.length !== 10) {
    return NextResponse.json({ operator: null, message: "Invalid number" }, { status: 400 });
  }

  try {
    // 1. SAFELY ENCODE the password so special characters (@, #, &) don't break the URL
    const queryParams = new URLSearchParams({
      ApiUserID: process.env.PLAN_API_USER_ID || '',
      ApiPassword: process.env.PLAN_API_PASSWORD || '',
      Mobileno: number
    });

    const url = `https://planapi.in/api/Mobile/OperatorFetchNew?${queryParams.toString()}`;
    
    const res = await fetch(url);
    const data = await res.json();

    console.log("PlanAPI HLR Response:", data);

    if (data.ERROR !== "0" || data.STATUS !== "1") {
      console.log("PlanAPI failed to find operator:", data.Message);
      return NextResponse.json({ operator: null });
    }

    const rawOperator = (data.Operator || "").toUpperCase();
    let matchedOperator = "";

    if (rawOperator.includes("JIO")) matchedOperator = "JIO";
    else if (rawOperator.includes("AIRTEL")) matchedOperator = "Airtel";
    else if (rawOperator.includes("VODA") || rawOperator.includes("VI")) matchedOperator = "Vodafone";
    else if (rawOperator.includes("IDEA")) matchedOperator = "Idea";
    else if (rawOperator.includes("BSNL")) matchedOperator = "BSNL";

    return NextResponse.json({ operator: matchedOperator, circle: data.Circle });

  } catch (error) {
    console.error("HLR Fetch Error:", error);
    return NextResponse.json({ operator: null }, { status: 500 });
  }
}