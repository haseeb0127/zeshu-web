import crypto from 'crypto';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json();
    if (![razorpay_order_id, razorpay_payment_id, razorpay_signature].every((value) => typeof value === 'string' && value.length > 0)) {
      return NextResponse.json({ success: false, verified: false, message: 'Invalid payment verification request' }, { status: 400 });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return NextResponse.json({ success: false, verified: false, message: 'Payment verification is unavailable' }, { status: 503 });
    }

    const expected = crypto.createHmac('sha256', secret).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex');
    const verified = razorpay_signature.length === expected.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(razorpay_signature));
    return NextResponse.json({ success: verified, verified, message: verified ? 'Payment verified' : 'Payment verification failed' }, { status: verified ? 200 : 400 });
  } catch {
    return NextResponse.json({ success: false, verified: false, message: 'Invalid payment verification request' }, { status: 400 });
  }
}
