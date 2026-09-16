import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import Razorpay from 'razorpay';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

type RazorpayPaymentRecord = { id?: string; order_id?: string; amount?: number | string; status?: string; captured?: boolean };

const isDevelopment = process.env.NODE_ENV !== 'production';
const logPaymentDiagnostic = (message: string, details: Record<string, unknown>) => { if (isDevelopment) console.info(`[Razorpay confirmation] ${message}`, details); };
const paymentFetchErrorDetails = (error: unknown) => {
  const value = error as { statusCode?: unknown; code?: unknown; message?: unknown; error?: { code?: unknown; description?: unknown } } | undefined;
  return { code: value?.error?.code ?? value?.code ?? value?.statusCode ?? 'unknown', message: value?.error?.description ?? value?.message ?? 'Unknown Razorpay fetch error' };
};
const finalizationErrorResponse = (message?: string) => {
  if (message === 'reservation expired; payment reconciliation required') {
    return NextResponse.json({ success: false, code: 'PAYMENT_RECONCILIATION_REQUIRED', error: 'Your payment was received, but the order needs verification. Please do not pay again.' }, { status: 409 });
  }
  if (message === 'invalid reservation request' || message === 'invalid reservation items') {
    return NextResponse.json({ success: false, error: 'This payment confirmation does not match the reserved checkout. Please contact support and do not pay again.' }, { status: 400 });
  }
  return NextResponse.json({ success: false, error: 'Unable to finalize the verified order. Retry confirmation with the same payment; do not pay again.' }, { status: 500 });
};

export async function POST(req: Request) {
  try {
    const authorization = req.headers.get('authorization');
    if (!authorization?.startsWith('Bearer ')) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });

    const accessToken = authorization.slice('Bearer '.length).trim();
    if (!accessToken) return NextResponse.json({ success: false, error: 'Your customer session has expired. Please sign in again.' }, { status: 401 });
    const authClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: authError } = await authClient.auth.getUser(accessToken);
    if (authError || !user) return NextResponse.json({ success: false, error: 'Your customer session has expired. Please sign in again.' }, { status: 401 });

    const body = await req.json();
    const reservationId = body.reservationId;
    const razorpayPaymentId = body.razorpay_payment_id;
    const razorpayOrderId = body.razorpay_order_id;
    const razorpaySignature = body.razorpay_signature;
    if (typeof reservationId !== 'string' || !reservationId || typeof razorpayPaymentId !== 'string' || !razorpayPaymentId || typeof razorpayOrderId !== 'string' || !razorpayOrderId || typeof razorpaySignature !== 'string' || !razorpaySignature) {
      return NextResponse.json({ success: false, error: 'Missing payment verification data' }, { status: 400 });
    }
    logPaymentDiagnostic('confirmation payload received', { hasReservationId: true, hasRazorpayOrderId: true, hasRazorpayPaymentId: true, hasRazorpaySignature: true });

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) return NextResponse.json({ success: false, error: 'Server configuration error' }, { status: 500 });
    const generatedSignature = crypto.createHmac('sha256', secret).update(`${razorpayOrderId}|${razorpayPaymentId}`).digest('hex');
    if (razorpaySignature.length !== generatedSignature.length || !crypto.timingSafeEqual(Buffer.from(generatedSignature), Buffer.from(razorpaySignature))) {
      console.warn('Razorpay signature validation failed.');
      return NextResponse.json({ success: false, error: 'Payment verification failed. Invalid signature.' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data: adminRole, error: adminRoleError } = await supabase.from('admin_roles').select('user_id').eq('user_id', user.id).eq('role', 'admin').maybeSingle();
    if (adminRoleError) return NextResponse.json({ success: false, error: 'Unable to verify checkout identity.' }, { status: 500 });
    if (adminRole) return NextResponse.json({ success: false, error: 'Admin sessions cannot confirm customer orders.' }, { status: 403 });

    const { data: customerProfile, error: customerProfileError } = await supabase.from('users').select('id').eq('id', user.id).maybeSingle();
    if (customerProfileError) return NextResponse.json({ success: false, error: 'Unable to verify customer profile.' }, { status: 500 });
    if (!customerProfile) return NextResponse.json({ success: false, error: 'Customer profile required before order confirmation.' }, { status: 403 });

    const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID!, key_secret: secret });
    let payment: RazorpayPaymentRecord | undefined;
    try {
      const fetchedPayment = await razorpay.payments.fetch(razorpayPaymentId);
      if (fetchedPayment && typeof fetchedPayment === 'object') payment = fetchedPayment as RazorpayPaymentRecord;
      logPaymentDiagnostic('payment fetch completed', { returnedObject: Boolean(payment), paymentStatus: payment?.status ?? null });
    } catch (error) {
      logPaymentDiagnostic('payment fetch failed', paymentFetchErrorDetails(error));
      return NextResponse.json({ success: false, error: 'Unable to verify the Razorpay payment. Retry confirmation with the same payment; do not pay again.' }, { status: 502 });
    }

    const paymentAmount = Number(payment?.amount);
    if (!payment || payment.id !== razorpayPaymentId || payment.order_id !== razorpayOrderId || !Number.isSafeInteger(paymentAmount) || paymentAmount < 0) {
      return NextResponse.json({ success: false, error: 'Payment amount or order does not match checkout.' }, { status: 400 });
    }
    if (payment.status !== 'captured' || payment.captured !== true) {
      return NextResponse.json({ success: false, error: 'Payment is not captured yet. Retry confirmation shortly with the same payment; do not pay again.' }, { status: 409 });
    }

    const { data: finalizedOrderId, error: finalizeError } = await supabase.rpc('finalize_grocery_order', {
      p_user_id: user.id,
      p_reservation_id: reservationId,
      p_razorpay_order_id: razorpayOrderId,
      p_payment_id: razorpayPaymentId,
      p_captured_amount_paise: paymentAmount,
    });
    if (finalizeError) return finalizationErrorResponse(finalizeError.message);

    const orderId = Array.isArray(finalizedOrderId) ? finalizedOrderId[0] : finalizedOrderId;
    if (typeof orderId !== 'string' || !orderId) return NextResponse.json({ success: false, error: 'Verified payment did not return an order reference. Retry confirmation with the same payment; do not pay again.' }, { status: 500 });

    const { data: destinationSnapshot } = await supabase.from('inventory_reservation_location_snapshots').select('latitude,longitude,accuracy_meters,source').eq('reservation_id', reservationId).eq('user_id', user.id).maybeSingle();
    if (destinationSnapshot) {
      const { error: destinationError } = await supabase.from('orders').update({ delivery_latitude: destinationSnapshot.latitude, delivery_longitude: destinationSnapshot.longitude, delivery_location_accuracy_meters: destinationSnapshot.accuracy_meters, delivery_location_source: destinationSnapshot.source }).eq('id', orderId).eq('user_id', user.id).is('delivery_latitude', null);
      if (destinationError && isDevelopment) console.error('[checkout] destination snapshot update failed', destinationError.message);
    }

    const { error: redemptionError } = await supabase.rpc('consume_zeshu_cash_redemption', {
      p_reservation_id: reservationId,
      p_order_id: orderId,
    });
    if (redemptionError && redemptionError.message !== 'reward redemption not found') {
      return NextResponse.json({ success: false, error: 'Order was finalized, but Zeshu Cash could not be completed. Retry confirmation with the same payment; do not pay again.' }, { status: 500 });
    }

    const { data: order, error: orderError } = await supabase.from('orders').select('*').eq('id', orderId).eq('user_id', user.id).maybeSingle();
    if (orderError || !order) return NextResponse.json({ success: false, error: 'Order finalization completed but could not be loaded. Retry confirmation with the same payment; do not pay again.' }, { status: 500 });

    const { data: redemption } = await supabase.from('reward_redemptions').select('approved_amount').eq('reservation_id', reservationId).eq('status', 'CONSUMED').maybeSingle();
    const merchandiseSubtotal = Array.isArray(order.items) ? order.items.reduce((sum: number, entry: any) => sum + Number(entry?.item?.price || 0) * Number(entry?.qty || 0), 0) : 0;
    const pendingReward = merchandiseSubtotal >= 500 ? 5 : merchandiseSubtotal >= 299 ? 3 : merchandiseSubtotal >= 199 ? 2 : merchandiseSubtotal >= 99 ? 1 : 0;

    return NextResponse.json({ success: true, order, zeshuCashUsed: Number(redemption?.approved_amount || 0), pendingReward });
  } catch (error: unknown) {
    console.error('Order confirmation failed without completing finalization.', error instanceof Error ? error.message : 'unknown error');
    return NextResponse.json({ success: false, error: 'Unable to confirm order. Retry confirmation with the same payment; do not pay again.' }, { status: 500 });
  }
}
