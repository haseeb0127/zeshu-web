import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      userId, 
      cartItems, 
      totalAmount, 
      paymentId, 
      razorpay_order_id, 
      razorpay_signature, 
      address 
    } = body;

    // 1. Verify the Razorpay Signature (Security Check)
    if (!razorpay_order_id || !paymentId || !razorpay_signature) {
      return NextResponse.json({ success: false, error: "Missing payment verification data" }, { status: 400 });
    }

    const secret = "fTZHsPWL0aRyt8paZ7nvHIwA";
    if (!secret) {
      console.error("RAZORPAY_KEY_SECRET is missing from environment variables.");
      return NextResponse.json({ success: false, error: "Server configuration error" }, { status: 500 });
    }

    // Hash the order_id and payment_id with the secret key
    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${paymentId}`)
      .digest('hex');

    // If the hashes don't match, this is a fake/hacked payment request
    if (generatedSignature !== razorpay_signature) {
      console.warn("🚨 FRAUD ATTEMPT: Invalid Razorpay Signature detected.");
      return NextResponse.json({ success: false, error: "Payment verification failed. Invalid signature." }, { status: 400 });
    }

    // 2. Insert the order securely into your database
    const { data, error } = await supabase
      .from('orders')
      .insert([
        {
          user_id: userId,
          cart_items: JSON.stringify(cartItems), 
          total_amount: totalAmount,
          payment_id: paymentId,
          delivery_address: address,
          status: 'pending'
        }
      ])
      .select()
      .single();

    if (error) {
      console.error("Supabase Insert Error:", error);
      throw error;
    }

    return NextResponse.json({ success: true, order: data });
  } catch (error: any) {
    console.error('Order Confirmation Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}