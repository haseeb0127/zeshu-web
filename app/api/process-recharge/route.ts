import { NextResponse } from 'next/server';
export async function POST(request: Request) {
  try {
    await request.json();
    return NextResponse.json({
      success: false,
      fulfillment: 'UNAVAILABLE',
      message: 'Recharge fulfillment is unavailable until a live provider is configured.'
    }, { status: 503 });
  } catch {
    return NextResponse.json({ 
      success: false, 
      message: 'Invalid recharge request'
    }, { status: 400 });
  }
}
export const dynamic = 'force-dynamic';
