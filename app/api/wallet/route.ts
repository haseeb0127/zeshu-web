import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ success: false, message: "User ID required" }, { status: 400 });
    }

    // 1. Check if the user already has a wallet
    const { data: existingWallet, error: fetchError } = await supabase
      .from('wallets')
      .select('balance, zeshu_coins')
      .eq('user_id', userId)
      .single();

    if (existingWallet) {
      // 2A. Wallet exists, return the balance
      return NextResponse.json({ 
        success: true, 
        balance: existingWallet.balance, 
        coins: existingWallet.zeshu_coins 
      });
    }

    // 2B. Wallet DOES NOT exist -> Create it and give 50 Coins Signup Bonus!
    const { data: newWallet, error: insertError } = await supabase
      .from('wallets')
      .insert([
        { user_id: userId, balance: 0, zeshu_coins: 50 }
      ])
      .select('balance, zeshu_coins')
      .single();

    if (insertError) {
      console.error("Wallet Creation Error:", insertError);
      return NextResponse.json({ success: false, message: "Failed to create wallet" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      balance: newWallet.balance, 
      coins: newWallet.zeshu_coins,
      isNewUser: true // We can use this to show a "Welcome Bonus!" toast in the UI
    });

  } catch (error: any) {
    console.error("Wallet API Crashed:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}