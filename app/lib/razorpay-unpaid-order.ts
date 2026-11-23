/** Shared server-side guard. A gateway lookup must positively prove that
 * an order is unpaid before Zeshu can issue another checkout attempt. */
export function isProvablyUnpaidRazorpayOrder(
  order: any,
  payments: any[] | null,
  expectedAmountPaise: number,
  expectedOrderId?: string,
): boolean {
  if (!order || !Array.isArray(payments) || !Number.isSafeInteger(expectedAmountPaise) || expectedAmountPaise <= 0) return false;
  if (expectedOrderId && order.id !== expectedOrderId) return false;
  if (Number(order.amount) !== expectedAmountPaise || String(order.currency || '').toUpperCase() !== 'INR') return false;
  if (Number(order.amount_paid) !== 0 || Number(order.amount_due) !== expectedAmountPaise || order.partial_payment === true) return false;
  const status = String(order.status || '').toLowerCase();
  if (status === 'created') return payments.length === 0;
  return status === 'attempted' && payments.length > 0
    && payments.every(payment => String(payment?.status || '').toLowerCase() === 'failed');
}
