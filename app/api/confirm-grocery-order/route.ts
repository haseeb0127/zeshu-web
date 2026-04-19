import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with the SERVICE_ROLE_KEY to bypass RLS securely
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, cartItems, totalAmount, paymentId, address } = body;

    // 1. Save the Order to your Supabase Database
    // THIS is what triggers your Admin Dashboard to "DING!"
    const { data: order, error } = await supabase
      .from('orders')
      .insert([{
        user_id: userId,
        items: cartItems,
        total_paid: totalAmount,
        payment_id: paymentId,
        delivery_address: address,
        status: 'PENDING'
      }])
      .select()
      .single();

    if (error) {
      console.error("Supabase Insert Error:", error);
      throw error;
    }

    // 2. (Optional) Ping Your Phone via Telegram
    // If you haven't set these up in your .env yet, it will just skip this part safely!
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
      const itemList = cartItems.map((c: any) => `${c.qty}x ${c.item.name}`).join('\n');
      const message = `🚨 *NEW ZESHU GROCERY ORDER!* 🚨\n💰 *Amount:* ₹${totalAmount}\n📍 *Address:* ${address}\n📦 *Items:*\n${itemList}`;

      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: message, parse_mode: 'Markdown' })
      }).catch(err => console.log("Telegram failed, but order saved:", err));
    }

    return NextResponse.json({ success: true, message: "Order dispatched to Zeshu HQ!" });

  } catch (error: any) {
    console.error("Order fulfillment error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}