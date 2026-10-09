import type Razorpay from 'razorpay';

/**
 * Recovery is allowed ONLY after provider-side read-only verification of a
 * captured TEST payment. SQL owns the atomic stock, reward and order commit.
 * Never create a charge/capture/refund here.
 */
export async function reconcileCapturedTestCheckout(args: {
  gateway: Razorpay;
  serviceClient: any;
  userId: string;
  reservationId: string;
  razorpayOrderId: string;
  expectedTotalRupees: number;
  providerOrder?: any;
  providerPayments?: any;
}): Promise<'RECOVERED' | 'NOT_CAPTURED' | 'REVIEW_REQUIRED'> {
  const { gateway, serviceClient, userId, reservationId, razorpayOrderId, expectedTotalRupees } = args;
  const expectedPaise = Math.round(Number(expectedTotalRupees) * 100);
  if (!razorpayOrderId.startsWith('order_') || !Number.isSafeInteger(expectedPaise) || expectedPaise <= 0) {
    return 'REVIEW_REQUIRED';
  }
  try {
    const order = args.providerOrder ?? await gateway.orders.fetch(razorpayOrderId);
    const list = args.providerPayments ?? await gateway.orders.fetchPayments(razorpayOrderId);
    const payments = Array.isArray(list?.items) ? list.items : null;
    if (!order || order.id !== razorpayOrderId || !payments ||
        Number(list?.count) !== payments.length ||
        Number(order.amount) !== expectedPaise ||
        String(order.currency).toUpperCase() !== 'INR') return 'REVIEW_REQUIRED';
    if (String(order.status).toLowerCase() !== 'paid') return 'NOT_CAPTURED';
    if (Number(order.amount_paid) !== expectedPaise || Number(order.amount_due) !== 0 || order.partial_payment === true) {
      return 'REVIEW_REQUIRED';
    }
    const captured = payments.filter((payment: any) => payment?.status === 'captured');
    if (captured.length !== 1 || payments.some((payment: any) => payment.status !== 'captured' && payment.status !== 'failed')) {
      return 'REVIEW_REQUIRED';
    }
    const candidate = captured[0];
    if (!candidate?.id || candidate.order_id !== razorpayOrderId ||
        Number(candidate.amount) !== expectedPaise ||
        String(candidate.currency).toUpperCase() !== 'INR' ||
        candidate.captured !== true || Number(candidate.amount_refunded || 0) !== 0 ||
        candidate.refund_status) return 'REVIEW_REQUIRED';

    // Independent provider lookup prevents trusting a truncated or stale list.
    const verified: any = await gateway.payments.fetch(String(candidate.id));
    if (!verified || verified.id !== candidate.id ||
        verified.order_id !== razorpayOrderId || verified.status !== 'captured' ||
        verified.captured !== true || Number(verified.amount) !== expectedPaise ||
        String(verified.currency).toUpperCase() !== 'INR' ||
        Number(verified.amount_refunded || 0) !== 0 || verified.refund_status) {
      return 'REVIEW_REQUIRED';
    }
    const { data: result, error } = await serviceClient.rpc('reconcile_captured_expired_test_checkout', {
      p_user_id: userId,
      p_reservation_id: reservationId,
      p_razorpay_order_id: razorpayOrderId,
      p_payment_id: String(verified.id),
      p_captured_amount_paise: expectedPaise,
    });
    if (error || typeof result !== 'string' || !result) {
      console.error('[payment-recovery]', { code: 'ATOMIC_RECONCILIATION_FAILED', errorCode: error?.code || 'UNKNOWN' });
      return 'REVIEW_REQUIRED';
    }
    return 'RECOVERED';
  } catch (error) {
    console.error('[payment-recovery]', { code: 'PROVIDER_CHECK_FAILED', errorType: error instanceof Error ? error.name : typeof error });
    return 'REVIEW_REQUIRED';
  }
}
