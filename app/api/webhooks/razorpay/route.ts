import { NextResponse } from 'next/server';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { createClient } from '@supabase/supabase-js';
import { getRuntimeEnvValue, getRuntimeSupabaseEnv } from '../../../lib/runtime-env';

export const dynamic = 'force-dynamic';

const isValidSignature = (rawBody: string, signature: string, secret: string) => {
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return signature.length === expected.length
    && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
};

const safeEventUpdate = async (client: any, eventId: string, values: Record<string, unknown>) => {
  await client.from('payment_provider_events').update(values).eq('id', eventId);
};

const markRefundedHoldReleased = async (client: any, reservationId: string, paymentId: string, orderId: string) => {
  const { error } = await client.rpc('release_refunded_zeshu_cash_redemption', {
    p_reservation_id: reservationId,
    p_razorpay_payment_id: paymentId,
    p_razorpay_order_id: orderId,
  });
  return !error;
};

export async function POST(request: Request) {
  const [{ url: runtimeSupabaseUrl, serviceRoleKey: runtimeServiceRoleKey }, webhookSecret, runtimeRazorpayKeyId, runtimeRazorpayKeySecret] = await Promise.all([
    getRuntimeSupabaseEnv(),
    getRuntimeEnvValue('RAZORPAY_WEBHOOK_SECRET'),
    getRuntimeEnvValue('RAZORPAY_KEY_ID'),
    getRuntimeEnvValue('RAZORPAY_KEY_SECRET'),
  ]);
  if (!runtimeSupabaseUrl || !runtimeServiceRoleKey || !webhookSecret) {
    return NextResponse.json({ success: false, error: 'Webhook service is not configured.' }, { status: 503 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get('x-razorpay-signature') || '';
  const providerEventId = request.headers.get('x-razorpay-event-id') || '';
  if (!signature || !providerEventId || !isValidSignature(rawBody, signature, webhookSecret)) {
    return NextResponse.json({ success: false, error: 'Invalid webhook signature.' }, { status: 401 });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid webhook payload.' }, { status: 400 });
  }

  const eventType = typeof payload?.event === 'string' ? payload.event : '';
  const paymentEntity = payload?.payload?.payment?.entity;
  const orderEntity = payload?.payload?.order?.entity;
  const refundEntity = payload?.payload?.refund?.entity;
  const paymentId = typeof paymentEntity?.id === 'string'
    ? paymentEntity.id
    : typeof refundEntity?.payment_id === 'string' ? refundEntity.payment_id : null;
  const orderId = typeof paymentEntity?.order_id === 'string'
    ? paymentEntity.order_id
    : typeof refundEntity?.order_id === 'string'
      ? refundEntity.order_id
      : typeof orderEntity?.id === 'string' ? orderEntity.id : null;
  const payloadHash = crypto.createHash('sha256').update(rawBody).digest('hex');
  const serviceClient = createClient(runtimeSupabaseUrl, runtimeServiceRoleKey);

  const { data: insertedEvent, error: insertError } = await (serviceClient as any)
    .from('payment_provider_events')
    .insert({
      provider: 'razorpay',
      provider_event_id: providerEventId,
      event_type: eventType || 'unknown',
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      payload_hash: payloadHash,
      status: 'RECEIVED',
    })
    .select('id,status')
    .single();

  if (insertError?.code === '23505') {
    const { data: existingEvent } = await (serviceClient as any)
      .from('payment_provider_events')
      .select('id,status')
      .eq('provider_event_id', providerEventId)
      .maybeSingle();
    if (existingEvent?.status === 'PROCESSED' || existingEvent?.status === 'IGNORED') {
      return NextResponse.json({ received: true, duplicate: true });
    }
    if (!existingEvent) return NextResponse.json({ success: false, error: 'Webhook event could not be recorded.' }, { status: 500 });
    payload.event_record_id = existingEvent.id;
  } else if (insertError || !insertedEvent) {
    return NextResponse.json({ success: false, error: 'Webhook event could not be recorded.' }, { status: 500 });
  }

  const eventRecordId = insertedEvent?.id || payload.event_record_id;
  const relevantEvents = new Set(['payment.authorized', 'payment.captured', 'payment.failed', 'order.paid', 'refund.processed', 'refund.failed']);
  if (!relevantEvents.has(eventType)) {
    await safeEventUpdate(serviceClient, eventRecordId, { status: 'IGNORED', processed_at: new Date().toISOString() });
    return NextResponse.json({ received: true, ignored: true });
  }

  if (eventType === 'payment.authorized' || eventType === 'payment.failed') {
    await safeEventUpdate(serviceClient, eventRecordId, { status: 'PROCESSED', processed_at: new Date().toISOString() });
    return NextResponse.json({ received: true, processed: true });
  }

  if (eventType === 'refund.failed') {
    if (paymentId) {
      await (serviceClient as any).from('payment_reconciliation_refunds').update({ status: 'FAILED_REVIEW', updated_at: new Date().toISOString() }).eq('payment_id', paymentId);
    }
    await safeEventUpdate(serviceClient, eventRecordId, { status: 'PROCESSED', processed_at: new Date().toISOString() });
    return NextResponse.json({ received: true, processed: true });
  }

  if (eventType === 'refund.processed') {
    if (!paymentId || !orderId || typeof refundEntity?.id !== 'string') {
      await safeEventUpdate(serviceClient, eventRecordId, { status: 'FAILED_REVIEW' });
      return NextResponse.json({ received: true, review: true });
    }
    const { data: refundRecord } = await (serviceClient as any)
      .from('payment_reconciliation_refunds')
      .select('*')
      .eq('payment_id', paymentId)
      .maybeSingle();
    if (!refundRecord || refundRecord.refund_id !== refundEntity.id || refundRecord.razorpay_order_id !== orderId) {
      await safeEventUpdate(serviceClient, eventRecordId, { status: 'FAILED_REVIEW' });
      return NextResponse.json({ received: true, review: true });
    }
    await (serviceClient as any).from('payment_reconciliation_refunds').update({ status: 'REFUNDED', updated_at: new Date().toISOString() }).eq('payment_id', paymentId);
    const { data: processedOrder } = await (serviceClient as any)
      .from('orders')
      .select('id')
      .eq('payment_id', paymentId)
      .maybeSingle();
    if (processedOrder) {
      await safeEventUpdate(serviceClient, eventRecordId, { status: 'FAILED_REVIEW' });
      return NextResponse.json({ received: true, review: true });
    }
    const { data: reservation } = await (serviceClient as any).from('inventory_reservations').select('id').eq('razorpay_order_id', orderId).maybeSingle();
    if (reservation && !(await markRefundedHoldReleased(serviceClient, reservation.id, paymentId, orderId))) {
      return NextResponse.json({ success: false, error: 'Refunded payment requires reconciliation review.' }, { status: 503 });
    }
    await safeEventUpdate(serviceClient, eventRecordId, { status: 'PROCESSED', processed_at: new Date().toISOString() });
    return NextResponse.json({ received: true, processed: true, refunded: true });
  }

  if (!paymentId || !orderId) {
    await safeEventUpdate(serviceClient, eventRecordId, { status: 'FAILED_REVIEW' });
    return NextResponse.json({ received: true, review: true });
  }

  const keyId = runtimeRazorpayKeyId;
  const keySecret = runtimeRazorpayKeySecret;
  if (!keyId || !keySecret) return NextResponse.json({ success: false, error: 'Payment service is unavailable.' }, { status: 503 });
  const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

  let payment: any;
  let providerOrder: any;
  try {
    payment = await razorpay.payments.fetch(paymentId);
    providerOrder = await razorpay.orders.fetch(orderId);
  } catch {
    return NextResponse.json({ success: false, error: 'Provider verification is temporarily unavailable.' }, { status: 503 });
  }

  const { data: reservation, error: reservationError } = await (serviceClient as any)
    .from('inventory_reservations')
    .select('*')
    .eq('razorpay_order_id', orderId)
    .maybeSingle();
  if (reservationError) return NextResponse.json({ success: false, error: 'Reconciliation lookup failed.' }, { status: 500 });

  if (!reservation) {
    await safeEventUpdate(serviceClient, eventRecordId, { status: 'IGNORED', processed_at: new Date().toISOString() });
    return NextResponse.json({ received: true, ignored: true });
  }

  const expectedAmount = Math.round(Number(reservation.expected_total_paid) * 100);
  const verifiedCaptured = payment?.id === paymentId
    && payment?.order_id === orderId
    && providerOrder?.id === orderId
    && payment?.status === 'captured'
    && payment?.captured === true
    && Number(payment?.amount) === expectedAmount;
  if (!verifiedCaptured) {
    await safeEventUpdate(serviceClient, eventRecordId, { status: 'FAILED_REVIEW' });
    return NextResponse.json({ received: true, review: true });
  }

  const { data: existingOrder } = await (serviceClient as any)
    .from('orders')
    .select('id')
    .eq('payment_id', paymentId)
    .maybeSingle();
  if (existingOrder) {
    await safeEventUpdate(serviceClient, eventRecordId, { status: 'PROCESSED', processed_at: new Date().toISOString() });
    return NextResponse.json({ received: true, processed: true, duplicateOrder: true });
  }

  if (reservation.status === 'PAYMENT_PENDING' && new Date(reservation.expires_at).getTime() > Date.now()) {
    const { data: orderResult, error: finalizeError } = await serviceClient.rpc('finalize_grocery_order', {
      p_user_id: reservation.user_id,
      p_reservation_id: reservation.id,
      p_razorpay_order_id: orderId,
      p_payment_id: paymentId,
      p_captured_amount_paise: Number(payment.amount),
    });
    if (finalizeError) return NextResponse.json({ success: false, error: 'Order reconciliation is temporarily unavailable.' }, { status: 503 });
    const finalizedOrderId = Array.isArray(orderResult) ? orderResult[0] : orderResult;
    if (typeof finalizedOrderId !== 'string') return NextResponse.json({ success: false, error: 'Order reconciliation requires review.' }, { status: 500 });
    const { error: consumeError } = await serviceClient.rpc('consume_zeshu_cash_redemption', { p_reservation_id: reservation.id, p_order_id: finalizedOrderId });
    if (consumeError && consumeError.message !== 'reward redemption not found') return NextResponse.json({ success: false, error: 'Reward reconciliation is temporarily unavailable.' }, { status: 503 });
    await safeEventUpdate(serviceClient, eventRecordId, { status: 'PROCESSED', processed_at: new Date().toISOString() });
    return NextResponse.json({ received: true, processed: true });
  }

  if (reservation.status !== 'EXPIRED') {
    await safeEventUpdate(serviceClient, eventRecordId, { status: 'FAILED_REVIEW' });
    return NextResponse.json({ received: true, review: true });
  }

  const { data: rewardHold } = await (serviceClient as any)
    .from('reward_redemptions')
    .select('id,status')
    .eq('reservation_id', reservation.id)
    .maybeSingle();
  const releaseConfirmedRefund = async () => {
    if (!rewardHold || rewardHold.status === 'RELEASED') return true;
    if (rewardHold.status !== 'RESERVED') return false;
    return markRefundedHoldReleased(serviceClient, reservation.id, paymentId, orderId);
  };

  const refundAmount = Number(payment.amount);
  let { data: refundRecord } = await (serviceClient as any)
    .from('payment_reconciliation_refunds')
    .select('*')
    .eq('payment_id', paymentId)
    .maybeSingle();

  if (refundRecord?.status === 'REFUNDED') {
    if (await releaseConfirmedRefund()) {
      await safeEventUpdate(serviceClient, eventRecordId, { status: 'PROCESSED', processed_at: new Date().toISOString() });
      return NextResponse.json({ received: true, processed: true, refunded: true });
    }
    return NextResponse.json({ success: false, error: 'Refunded payment requires reconciliation review.' }, { status: 503 });
  }

  if (!refundRecord) {
    const { data: createdRefund, error: createRefundError } = await (serviceClient as any)
      .from('payment_reconciliation_refunds')
      .insert({
        payment_id: paymentId,
        razorpay_order_id: orderId,
        reservation_id: reservation.id,
        amount_paise: refundAmount,
        status: 'PENDING',
        reason: 'EXPIRED_RESERVATION_CAPTURED_PAYMENT',
      })
      .select('*')
      .single();
    if (createRefundError?.code === '23505') {
      const { data: existingRefund } = await (serviceClient as any).from('payment_reconciliation_refunds').select('*').eq('payment_id', paymentId).maybeSingle();
      refundRecord = existingRefund;
    } else if (createRefundError || !createdRefund) {
      return NextResponse.json({ success: false, error: 'Refund reconciliation requires review.' }, { status: 500 });
    } else {
      refundRecord = createdRefund;
    }
  }

  if (!refundRecord || refundRecord.status === 'FAILED_REVIEW') {
    return NextResponse.json({ received: true, review: true });
  }

  if (refundRecord.status === 'PENDING') {
    const { data: claimedRefund } = await (serviceClient as any)
      .from('payment_reconciliation_refunds')
      .update({ status: 'REFUND_REQUESTED', updated_at: new Date().toISOString() })
      .eq('payment_id', paymentId)
      .eq('status', 'PENDING')
      .select('*')
      .maybeSingle();
    if (!claimedRefund) {
      return NextResponse.json({ success: false, error: 'Refund reconciliation is already in progress.' }, { status: 503 });
    }
    refundRecord = claimedRefund;
  }

  if (refundRecord.status === 'REFUND_REQUESTED' && refundRecord.refund_id) {
    try {
      const providerRefund = await razorpay.payments.fetchRefund(paymentId, refundRecord.refund_id);
      if (providerRefund?.status === 'processed') {
        await (serviceClient as any).from('payment_reconciliation_refunds').update({ status: 'REFUNDED', updated_at: new Date().toISOString() }).eq('payment_id', paymentId);
        if (await releaseConfirmedRefund()) {
          await safeEventUpdate(serviceClient, eventRecordId, { status: 'PROCESSED', processed_at: new Date().toISOString() });
          return NextResponse.json({ received: true, processed: true, refunded: true });
        }
      }
    } catch {
      return NextResponse.json({ success: false, error: 'Refund status is temporarily unavailable.' }, { status: 503 });
    }
    return NextResponse.json({ success: false, error: 'Refund is still processing.' }, { status: 503 });
  }

  let refund: any;
  let refundError: any = null;
  try {
    const refundIdempotencyKey = `zeshu_refund_${paymentId}`;
    const refundClient = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
      headers: { 'X-Refund-Idempotency': refundIdempotencyKey } as any,
    });
    refund = await refundClient.payments.refund(paymentId, { amount: refundAmount });
  } catch (error) {
    refund = null;
    refundError = error;
  }
  if (!refund?.id) {
    const providerStatus = Number(refundError?.statusCode ?? refundError?.status ?? 0);
    if (providerStatus >= 400 && providerStatus !== 409) {
      await (serviceClient as any).from('payment_reconciliation_refunds').update({ status: 'FAILED_REVIEW', updated_at: new Date().toISOString() }).eq('payment_id', paymentId);
      await safeEventUpdate(serviceClient, eventRecordId, { status: 'FAILED_REVIEW' });
      return NextResponse.json({ received: true, review: true });
    }
    return NextResponse.json({ success: false, error: 'Refund request is being reconciled.' }, { status: 503 });
  }

  const refundStatus = refund.status === 'processed' ? 'REFUNDED' : 'REFUND_REQUESTED';
  await (serviceClient as any).from('payment_reconciliation_refunds').update({ refund_id: refund.id, status: refundStatus, updated_at: new Date().toISOString() }).eq('payment_id', paymentId);
  if (refundStatus === 'REFUNDED' && await releaseConfirmedRefund()) {
    await safeEventUpdate(serviceClient, eventRecordId, { status: 'PROCESSED', processed_at: new Date().toISOString() });
    return NextResponse.json({ received: true, processed: true, refunded: true });
  }
  return NextResponse.json({ success: false, error: 'Refund is still processing.' }, { status: 503 });
}
