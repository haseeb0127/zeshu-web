import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Razorpay from "razorpay";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json(
        {
          success: false,
          error: "Payment service is not configured.",
        },
        { status: 500 }
      );
    }

    const body = await request.json();

    const userId = body.userId;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "User ID is required.",
        },
        { status: 400 }
      );
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    // =========================
    // RECHARGE PAYMENT
    // =========================

    if (body.service && body.number && body.amount !== undefined) {
      const amount = Number(body.amount);
      const service = String(body.service).trim();
      const number = String(body.number).trim();
      const operator = String(body.operator || "").trim();

      if (
        !Number.isFinite(amount) ||
        amount <= 0 ||
        amount > 100000
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid recharge amount.",
          },
          { status: 400 }
        );
      }

      if (!service || !number) {
        return NextResponse.json(
          {
            success: false,
            error: "Recharge details are incomplete.",
          },
          { status: 400 }
        );
      }

      const razorpayOrder = await razorpay.orders.create({
        amount: Math.round(amount * 100),
        currency: "INR",
        receipt: `recharge_${Date.now()}`,
        notes: {
          user_id: userId,
          service,
          number,
          operator,
        },
      });

      return NextResponse.json({
        success: true,
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
      });
    }

    // =========================
    // GROCERY PAYMENT
    // =========================

    const cartItems = body.cartItems;

    if (
      !Array.isArray(cartItems) ||
      cartItems.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid checkout data.",
        },
        { status: 400 }
      );
    }

    const productIds = cartItems
      .map((item: any) => item?.item?.id)
      .filter(Boolean);

    if (productIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No valid products found.",
        },
        { status: 400 }
      );
    }

    const { data: products, error: productsError } =
      await supabase
        .from("products")
        .select("id,name,price,in_stock,quantity")
        .in("id", productIds);

    if (productsError || !products) {
      return NextResponse.json(
        {
          success: false,
          error: "Unable to validate products.",
        },
        { status: 500 }
      );
    }

    let itemTotal = 0;

    for (const cartItem of cartItems) {
      const product = products.find(
        (p: any) =>
          String(p.id) === String(cartItem?.item?.id)
      );

      const qty = Number(cartItem?.qty);

      if (
        !product ||
        !Number.isInteger(qty) ||
        qty <= 0
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid cart item.",
          },
          { status: 400 }
        );
      }

      if (
        !product.in_stock ||
        Number(product.quantity || 0) < qty
      ) {
        return NextResponse.json(
          {
            success: false,
            error: `${product.name} is out of stock.`,
          },
          { status: 400 }
        );
      }

      itemTotal += Number(product.price) * qty;
    }

    const smallCartCharge =
      itemTotal > 0 && itemTotal < 100 ? 20 : 0;

    const deliveryCharge =
      itemTotal > 0 && itemTotal < 200 ? 30 : 0;

    const handlingFee = 5;

    const donationAmount =
      body.isDonating === true ? 1 : 0;

    const tipAmount = Number(body.tipAmount || 0);

    const allowedTips = [0, 20, 30, 50];

    if (!allowedTips.includes(tipAmount)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid tip amount.",
        },
        { status: 400 }
      );
    }

    let coinDiscount = 0;

    if (body.useZeshuCoins === true) {
      const { data: wallet } = await supabase
        .from("wallets")
        .select("coins")
        .eq("user_id", userId)
        .maybeSingle();

      const availableCoins = Number(wallet?.coins || 0);

      coinDiscount = Math.min(
        50,
        itemTotal,
        availableCoins
      );
    }

    const finalTotal =
      itemTotal +
      smallCartCharge +
      deliveryCharge +
      handlingFee +
      donationAmount +
      tipAmount -
      coinDiscount;

    if (
      !Number.isFinite(finalTotal) ||
      finalTotal <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid checkout total.",
        },
        { status: 400 }
      );
    }

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(finalTotal * 100),
      currency: "INR",
      receipt: `zeshu_${Date.now()}`,
      notes: {
        user_id: userId,
      },
    });

    return NextResponse.json({
      success: true,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
    });
  } catch (error) {
    console.error(
      "Razorpay order creation error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Unable to create payment order.",
      },
      { status: 500 }
    );
  }
}