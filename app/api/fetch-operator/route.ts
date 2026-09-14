import { NextResponse } from 'next/server';
import { authenticateProviderRequest, authRequiredResponse, rateLimitResponse } from '@/app/lib/provider-security';

export async function GET(request: Request) {
  const user = await authenticateProviderRequest(request);
  if (!user) return authRequiredResponse();
  const limited = rateLimitResponse(user.id, 'fetch-operator');
  if (limited) return limited;
  const { searchParams } = new URL(request.url);
  const number = searchParams.get('number') || '';
  const service = searchParams.get('service') || 'mobile'; // Default to mobile
  if (!['mobile', 'dth'].includes(service) || number.length > 40) return NextResponse.json({ success: false, message: 'Invalid operator lookup request' }, { status: 400 });

  // Clean the input
  const cleanNumber = number.replace(/\D/g, '');

  try {
    if (service === 'dth') {
      // --- DTH OPERATOR FETCH ---
      const dthParams = new URLSearchParams({
        apimember_id: process.env.PLAN_API_USER_ID || '',
        api_password: process.env.PLAN_API_PASSWORD || '',
        dth_number: cleanNumber
      });
      
      const res = await fetch(`https://planapi.in/api/Mobile/DthOperatorFetch?${dthParams.toString()}`);
      const data = await res.json();

      if (data.ERROR === "0" && data.DthOpCode) {
        return NextResponse.json({ success: true, operator: data.DthName, opCode: data.DthOpCode });
      } else {
        return NextResponse.json({ success: false, message: "DTH operator could not be found." });
      }
    } else {
      // --- MOBILE OPERATOR FETCH (HLR) ---
      const mobileNumber = cleanNumber.slice(-10);
      if (mobileNumber.length !== 10) return NextResponse.json({ success: false, message: "Invalid mobile number" });

      const hlrParams = new URLSearchParams({
        ApiUserID: process.env.PLAN_API_USER_ID || '',
        ApiPassword: process.env.PLAN_API_PASSWORD || '',
        Mobileno: mobileNumber
      });
      
      const res = await fetch(`https://planapi.in/api/Mobile/OperatorFetchNew?${hlrParams.toString()}`);
      const data = await res.json();

      if (data.OpCode) {
        return NextResponse.json({ success: true, operator: data.Operator, opCode: data.OpCode, circleCode: data.CircleCode });
      } else {
        return NextResponse.json({ success: false, message: "Mobile Operator not found" });
      }
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') console.error("Operator provider request failed:", error instanceof Error ? error.message : 'unknown error');
    return NextResponse.json({ success: false, message: "Server connection failed" }, { status: 500 });
  }
}
