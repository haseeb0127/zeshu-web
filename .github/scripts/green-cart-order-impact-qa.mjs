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
assert(impact.includes("role=\"progressbar\""),'Show actual 10,000-order campaign progress');
assert(impact.includes('10,000'),'Show approved 10,000-order plan');
assert(impact.includes('One tree per order—not per item'),
  'Do not accidentally promise one tree for each item in a cart');
assert(impact.includes('No extra tree fee'),'No surcharge should be introduced');
assert(impact.includes('Payment receipt and order summary')===false,'Use t() from storefront for receipt heading');
for(const code of ['en','te','hi','ur']){
 assert(impact.includes(code+':{'),'Zeshu Green UI should work in all storefront languages: '+code);
}
assert(lang.split('"Payment receipt and order summary"').length>=4,
  'Customer receipt title must be translated into Telugu/Hindi/Urdu');
assert(impact.includes("impact.status==='VERIFIED'&&impact.proofUrl"),
  'Only a verified commitment may display a planting evidence link');
assert(impact.includes('Planting has not happened yet.'),
  'A customer cannot be told a tree is already planted when only a slot is reserved');
assert(impact.includes('programme in planning')||impact.includes('Programme in planning'),
  'Do not pretend that the programme is active while planning');
assert(impact.includes('This purchase does not plant or reserve a tree today.'),
  'Planning mode must disclose zero actual tree impact');

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
console.log('PASS: cart and order details display honest 10,000-order tree progress, private proof-gated impact, four languages, no payments or false planting.');
