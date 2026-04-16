import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';

// Initialize Razorpay with placeholders to bypass the strict Vercel Build check.
// Once live, Vercel swaps these for your REAL Environment Variables.
const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder',
});

export async function POST(request: Request) {
  try {
    const { amount } = await request.json();

    // Ensure amount is valid
    if (!amount || isNaN(amount)) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    // Create the order on Razorpay's secure servers
    // amount * 100 converts Rupees to Paise
    const order = await razorpay.orders.create({
      amount: Math.round(Number(amount) * 100), 
      currency: 'INR',
      receipt: 'zeshu_receipt_' + Math.random().toString(36).substring(7),
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error("Razorpay Error:", error);
    return NextResponse.json(
      { error: 'Error creating Razorpay order' }, 
      { status: 500 }
    );
  }
}