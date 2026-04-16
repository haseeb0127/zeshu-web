import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase securely
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const { operator, number, amount, userId } = await request.json();

    // 1. THE A1TOPUP CONNECTION
    // (We will swap this with your exact A1Topup API link once you get their documentation)
    // const a1Response = await fetch('https://a1topup.com/api/...');
    const isSuccess = true; // Simulating a successful recharge for now

    if (isSuccess) {
      // 2. Calculate the Zeshu Coins to award (e.g., standard 1.5% commission profit)
      const earnedCoins = Math.floor(parseFloat(amount) * 0.015);

      // 3. Securely check their current wallet balance
      const { data: wallet, error: fetchError } = await supabase
        .from('wallets')
        .select('coins')
        .eq('user_id', userId)
        .single();

      // 4. Safely update or create their wallet
      if (!fetchError) {
        const newBalance = (wallet?.coins || 0) + earnedCoins;
        await supabase.from('wallets').update({ coins: newBalance }).eq('user_id', userId);
      } else {
        // If they don't have a wallet yet, create one!
        await supabase.from('wallets').insert([{ user_id: userId, coins: earnedCoins }]);
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Recharge successful! Coins added.' 
      });
      
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'Recharge rejected by operator.' 
      }, { status: 400 });
    }

  } catch (error) {
    console.error("Recharge Error:", error);
    return NextResponse.json({ 
      success: false, 
      message: 'Server error processing recharge' 
    }, { status: 500 });
  }
}
export const dynamic = 'force-dynamic';