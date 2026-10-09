import assert from 'node:assert/strict';
import { reconcileCapturedTestCheckout } from '../../app/lib/razorpay-captured-recovery.ts';

const make = (patch = {}) => {
  const order = { id: 'order_test123', status: 'paid', amount: 7000,
    amount_paid: 7000, amount_due: 0, currency: 'INR', partial_payment: false,
    ...(patch.order || {}) };
  const payment = { id: 'pay_test123', order_id: order.id, status: 'captured',
    captured: true, amount: 7000, amount_refunded: 0, refund_status: null,
    currency: 'INR', ...(patch.payment || {}) };
  const items = patch.items || [payment];
  const list = { count: patch.count ?? items.length, items };
  const rpcCalls = [];
  const gateway = {
    orders: { fetch: async () => order, fetchPayments: async () => list },
    payments: { fetch: async () => ({ ...payment, ...(patch.verified || {}) }) },
  };
  const serviceClient = { rpc: async (name, payload) => {
    rpcCalls.push({ name, payload });
    return patch.rpcResult || { data: 'recovered-order-uuid', error: null };
  } };
  return { order, payment, items, list, gateway, serviceClient, rpcCalls };
};
async function scenario(name, overrides, expected, expectedRpcCalls = 0) {
  const s = make(overrides);
  const got = await reconcileCapturedTestCheckout({
    gateway: s.gateway, serviceClient: s.serviceClient,
    userId: 'test-user-uuid', reservationId: 'test-reservation-uuid',
    razorpayOrderId: 'order_test123', expectedTotalRupees: 70,
  });
  assert.equal(got, expected, name);
  assert.equal(s.rpcCalls.length, expectedRpcCalls, `${name}: database calls`);
}
await scenario('verified captured test order recovers exactly once', {}, 'RECOVERED', 1);
await scenario('wrong merchant order amount never mutates DB',
  { order: { amount: 7100 } }, 'REVIEW_REQUIRED');
await scenario('captured payment was partly refunded',
  { payment: { amount_refunded: 100 } }, 'REVIEW_REQUIRED');
await scenario('payment was only authorized',
  { order: { status: 'attempted' }, payment: { status: 'authorized', captured: false } }, 'NOT_CAPTURED');
await scenario('captured payment details changed on independent lookup',
  { verified: { captured: false } }, 'REVIEW_REQUIRED');
await scenario('provider list truncated', { count: 2 }, 'REVIEW_REQUIRED');
await scenario('gateway order includes due amount', { order: { amount_due: 7000 } }, 'REVIEW_REQUIRED');
await scenario('database refuses recovery', { rpcResult: { data: null, error: { code: 'P0001' } } }, 'REVIEW_REQUIRED', 1);
console.log('PASS: captured TEST payment reconciliation protects mismatched, authorized, refunded, or ambiguous payments.');
