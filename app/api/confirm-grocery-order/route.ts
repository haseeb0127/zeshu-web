import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, cartItems, totalAmount, paymentId, address } = body;

    // 🚀 Insert the order directly into your database
    const { data, error } = await supabase
      .from('orders')
      .insert([
        {
          user_id: userId,
          cart_items: JSON.stringify(cartItems), 
          total_amount: totalAmount,
          payment_id: paymentId || 'TEST_PAYMENT',
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