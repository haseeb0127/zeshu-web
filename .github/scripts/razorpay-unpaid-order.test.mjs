import assert from 'node:assert/strict';
import {isProvablyUnpaidRazorpayOrder as eligible} from '../../app/lib/razorpay-unpaid-order.ts';
const order=(status,amount_paid=0)=>({id:'order_test',status,amount:7000,amount_due:7000-amount_paid,amount_paid,currency:'INR',partial_payment:false});
assert.equal(eligible(order('created'),[],7000,'order_test'),true,'created with no attempts');
assert.equal(eligible(order('attempted'),[{status:'failed'}],7000,'order_test'),true,'terminal unsuccessful attempt');
assert.equal(eligible(order('created'),[{status:'failed'}],7000,'order_test'),false,'inconsistent created order');
assert.equal(eligible(order('attempted'),[],7000,'order_test'),false,'inconsistent attempted order');
for (const payment of ['authorized','captured','created','pending','refunded','unknown']) {
  assert.equal(eligible(order('attempted'),[{status:payment}],7000,'order_test'),false,payment+' must block');
}
assert.equal(eligible(order('paid',7000),[{status:'captured'}],7000,'order_test'),false,'paid blocks');
assert.equal(eligible(order('created'),[],7001,'order_test'),false,'amount mismatch');
assert.equal(eligible(order('created'),[],7000,'other_order'),false,'order mismatch');
assert.equal(eligible(order('created'),null,7000,'order_test'),false,'unknown provider response');
assert.equal(eligible({...order('created'),partial_payment:true},[],7000,'order_test'),false,'partial payments forbidden');
console.log('Razorpay read-only unpaid eligibility guard: 12 safety checks passed');
