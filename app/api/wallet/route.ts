import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID required" },
        { status: 400 }
      );
    }

    const { data: wallet, error } = await supabase
      .from("wallets")
      .select("coins,zeshu_coins")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Wallet lookup error:", error);

      return NextResponse.json(
        { success: false, message: "Wallet lookup failed" },
        { status: 500 }
      );
    }

    if (wallet) {
      return NextResponse.json({
        success: true,
        balance: Number(wallet.coins || 0),
        coins: Number(wallet.zeshu_coins || 0),
      });
    }

    const { data: newWallet, error: insertError } = await supabase
      .from("wallets")
      .insert({
        user_id: userId,
        coins: 0,
        zeshu_coins: 50,
      })
      .select("coins,zeshu_coins")
      .single();

    if (insertError || !newWallet) {
      console.error("Wallet creation error:", insertError);

      return NextResponse.json(
        { success: false, message: "Failed to create wallet" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      balance: Number(newWallet.coins || 0),
      coins: Number(newWallet.zeshu_coins || 0),
      isNewUser: true,
    });
  } catch (error) {
    console.error("Wallet API error:", error);

    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}