import assert from 'node:assert/strict';
import fs from 'node:fs';
import { calculateLocalCheckoutPrice } from '../../app/lib/local-checkout-pricing.ts';

const legacy299 = calculateLocalCheckoutPrice({ subtotal: 299, pilotEnabled: false });
assert.equal(legacy299.deliveryFee, 0);
assert.equal(legacy299.handlingFee, 0);
assert.equal(legacy299.totalBeforeRewards, 299);
assert.equal(calculateLocalCheckoutPrice({ subtotal: 199, pilotEnabled: false }).deliveryFee, 30);

const center = calculateLocalCheckoutPrice({ subtotal: 349, pilotEnabled: true, latitude: 18.80, longitude: 78.93 });
assert.equal(center.policy, 'PAID_LOCAL_PILOT');
assert.equal(center.eligible, true);
assert.equal(center.deliveryFee, 29);
assert.equal(center.handlingFee, 10);
assert.equal(center.totalBeforeRewards, 388);

// Approximate Jagtial northward straight-line distances.
const middle = calculateLocalCheckoutPrice({ subtotal: 349, pilotEnabled: true, latitude: 18.827, longitude: 78.93 });
assert.equal(middle.deliveryFee, 39);
const outer = calculateLocalCheckoutPrice({ subtotal: 349, pilotEnabled: true, latitude: 18.845, longitude: 78.93 });
assert.equal(outer.deliveryFee, 49);
assert.equal(calculateLocalCheckoutPrice({ subtotal: 349, pilotEnabled: true, latitude: 18.87, longitude: 78.93 }).eligible, false);
assert.equal(calculateLocalCheckoutPrice({ subtotal: 349, pilotEnabled: true }).reason, 'ADDRESS_REQUIRED');
assert.equal(calculateLocalCheckoutPrice({ subtotal: -10, pilotEnabled: true }).reason, 'INVALID_SUBTOTAL');
assert.equal(calculateLocalCheckoutPrice({ subtotal: 349, pilotEnabled: true, latitude: Number.NaN, longitude: 78.93 }).eligible, false);

const checkout = fs.readFileSync('app/api/create-razorpay-order/route.ts', 'utf8');
const page = fs.readFileSync('app/page.tsx', 'utf8');
const endpoint = fs.readFileSync('app/api/local-delivery-quote/route.ts', 'utf8');
const env = fs.readFileSync('.env.example', 'utf8');
const planner = fs.readFileSync('app/components/FulfillmentEconomicsPlanner.tsx', 'utf8');

assert(checkout.includes("getRuntimeEnvValue('ZESHU_LOCAL_PAID_DELIVERY_PILOT') === 'true'"));
assert(endpoint.includes("getRuntimeEnvValue('ZESHU_LOCAL_PAID_DELIVERY_PILOT') === 'true'"));
assert(env.includes('ZESHU_LOCAL_PAID_DELIVERY_PILOT=false'));
assert(checkout.includes('recoveryHandlingFee'), 'Expired-payment recovery must compare fees');
assert(checkout.includes('handlingFee'), 'Bound-payment retry must compare fees');
assert(checkout.includes('pricingSnapshot.handling_fee = authoritativeLocalPrice.handlingFee'), 'Snapshot must persist fee');
assert(checkout.includes('fulfillmentPatch.expected_total_paid = reservationExpectedTotal'), 'Reservation total must update before Razorpay');
assert(checkout.includes('fulfillmentPatch.pre_reward_total_paid = reservationExpectedTotal'), 'Cash redemption must use correct pre-reward total');
assert(checkout.includes('checkoutFulfillmentMode === \'INDIA_STANDARD\''), 'India split must remain intact');
assert(page.includes("fetch('/api/local-delivery-quote'"), 'Cart must call real server quote');
assert(page.includes('localQuoteReady'), 'Checkout must block stale/unavailable fee previews');
assert(page.includes('platformHandlingFee'), 'Platform fee must be disclosed in cart');
assert(!page.includes("You've unlocked FREE delivery 🎉"), 'Old unconditional free-delivery banner must not be promised');
assert(planner.includes('SIMULATION ONLY'), 'Planner must remain independent of live fees');
console.log('ZESHU_LOCAL_PAID_DELIVERY_QA=PASS');
