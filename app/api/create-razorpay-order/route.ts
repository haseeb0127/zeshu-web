import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';

// Initialize Razorpay securely using your hidden .env keys
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(request: Request) {
  try {
    const { amount } = await request.json();

    // Create the order on Razorpay's secure servers
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Razorpay expects paise (₹1 = 100 paise)
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