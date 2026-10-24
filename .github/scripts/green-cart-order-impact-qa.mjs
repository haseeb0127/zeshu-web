import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const file=path=>readFileSync(path,'utf8');
const page=file('app/page.tsx');
const impact=file('app/components/GreenOrderImpact.tsx');
const orderApi=file('app/api/green/orders/[id]/route.ts');
const policies=file('docs/ZESHU_GREEN_TREE_PROGRAM.md');
const lang=file('app/components/CustomerLanguageProvider.tsx');

assert(page.includes('<GreenOrderImpact />'),'Shopping cart should disclose Zeshu Green');
assert(page.includes('<GreenOrderImpact orderId={trackedOrder.id} orderStatus={trackedOrder.status} />'),
  'Customer payment/order detail and tracking must show genuine per-order status');
assert(page.includes('Payment receipt and order summary'),'Show Green status alongside the customer payment summary');
assert(impact.includes("fetch('/api/green/impact',{cache:'no-store'})"),
  'Cart should use live aggregate programme mode instead of hard-coded claims');
assert(impact.includes("customerSupabase().auth.getSession()"),
  'Receipt must authenticate as the actual customer');
assert(impact.includes("'Authorization:'")===false,'Do not interpolate raw access credentials into presentation');
assert(impact.includes("Authorization:'Bearer '+session.access_token"),
  'Send a customer bearer token to the protected per-order endpoint');
assert(!impact.includes('role="progressbar"'),
  'Checkout and receipt should remain simple instead of showing the private 10,000-order internal progress bar');
assert(!impact.includes('{w.milestone}')&&!impact.includes('{w.explain}'),
  'Do not overload the customer checkout with the owner campaign milestone and operational details');
assert(impact.includes('The 10,000-order planting milestone is tracked in Green HQ'),
  'Document why the milestone is hidden from checkout but retained in the owner Green dashboard');
assert(impact.includes('One tree per order—not per item'),
  'Do not accidentally promise one tree for each item in a cart');
assert(impact.includes('No extra tree fee'),'No surcharge should be introduced');
assert(impact.includes('Payment receipt and order summary')===false,'Use t() from storefront for receipt heading');
for(const code of ['en','te','hi','ur']){
 assert(impact.includes(code+':{'),'Zeshu Green UI should work in all storefront languages: '+code);
}
assert(lang.split('"Payment receipt and order summary"').length>=4,
  'Customer receipt title must be translated into Telugu/Hindi/Urdu');
assert(impact.includes("impact?.status==='VERIFIED'&&impact.proofUrl"),
  'Only a verified commitment may display a planting evidence link');
assert(impact.includes('It has not been planted yet.'),
  'A reserved tree cannot be advertised as already planted');
assert(!/pledged:.*10,000/.test(impact),
  'Customer pledge copy in any language should not expose campaign batch logistics');
assert(impact.includes('We’re preparing tree planting.'),
  'Do not pretend a funded planting program is already active in planning mode');
assert(impact.includes('Our goal: 1 tree per eligible delivered order. Coming soon.'),
  'The cart must show one clear, short, future goal rather than falsely claim contribution');
assert(impact.includes('if(!orderId)return <section data-green-impact="cart"'),
  'Cart must render a separate compact Zeshu Green strip');
assert(impact.includes('flex items-center gap-2.5 rounded-xl') && impact.includes('px-3 py-2.5'),
  'Cart impact should be compact, not a large promotional card');
const compact=impact.split('if(!orderId)return <section data-green-impact="cart"')[1]?.split('return <section data-green-impact={orderId?')[0]||'';
assert(compact.includes('{w.name}')&&compact.includes('{statusMessage}'),
  'Compact cart must show the programme name and accurate real-time state');
assert(!compact.includes('{w.goal}')&&!compact.includes('href="/green"')&&!compact.includes('{w.zeroFee}'),
  'Do not clutter cart with repeated goals, fees or long details links');
assert(!compact.includes('one tree planted')&&!compact.includes('contributed to planting'),
  'A cart before checkout must never claim a tree was planted');
assert(impact.includes('No tree has been reserved for this order yet.'),
  'Receipt cannot claim one tree was reserved before the programme is funded and activated');
assert(impact.includes('One tree planted, thanks to your order!'),
  'Only verified tree plantings may use the planted confirmation message');

assert(orderApi.includes('customer.auth.getUser(access)'),'Authenticate the actual customer');
assert(orderApi.includes(".eq('id',id).eq('user_id',user.id)"),
 'Never allow an order ID to reveal another customer order');
assert(orderApi.includes("db.from('zeshu_green_tree_commitments')"),
 'Status must derive from independently recorded programme commitments');
assert(orderApi.includes("status==='VERIFIED'"),'Verified evidence only for proof links');
assert(orderApi.includes("status==='PLEDGED'")&&orderApi.includes("status==='PLANTED'"),
 'Distinguish pledged from merely reported and independently verified trees');
assert(orderApi.includes("const status=order.status==='CANCELLED'"),
 'Cancelled orders cannot produce an impact claim');
assert(orderApi.includes("new Date(order.created_at).getTime()>=new Date(cfg.data.activated_at).getTime()"),
 'Never label pre-activation orders as eligible');
assert(orderApi.includes('feePaise:0'),'Trees must not silently add a checkout fee');
assert(!orderApi.includes('export async function POST'),'Tree receipt should be read-only');
assert(!orderApi.includes('insert(')&&!orderApi.includes('update('),
 'Tree receipt must never allocate or forge commitments');

assert(policies.includes('10,000-order planting batches'),
 'Respect Zeshu-approved 10,000 qualifying order campaign plan');
console.log('PASS: simple customer Zeshu Green card, owner-only checkout milestone, private verified-tree evidence and four-language honest statuses.');
