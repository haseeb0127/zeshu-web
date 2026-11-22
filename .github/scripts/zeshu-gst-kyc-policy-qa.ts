import assert from 'node:assert/strict';
import fs from 'node:fs';
import { ZESHU_LEGAL_BUSINESS as business } from '../../app/lib/legal-business-details.ts';

const read = path => fs.readFileSync(path, 'utf8');
const policy = read('app/policies/page.tsx');
const info = read('app/business-details/page.tsx');
const seller = read('app/partners/page.tsx');
const footer = read('app/page.tsx');
const adminGst = read('app/admin/gst/page.tsx');
const checkout = read('app/api/create-razorpay-order/route.ts');
const kyc = read('docs/ZESHU_MARKETPLACE_GST_GATEWAY_KYC_2026.md');

assert.equal(business.gstin, '36DLEPM3189J1ZN');
assert.equal(business.legalName, 'MOHD HASEEB RAFIQUE');
assert.equal(business.tradeName, 'ZESHU');
assert.equal(business.gstRegistrationType, 'Regular');
assert.equal(business.gstEffectiveDate, '09 November 2026');
assert(business.registeredAddress.includes('1-2-210/A/1'));
assert(business.registeredAddress.includes('505327'));
assert.equal(business.supportPhone, '+91 95052 11212');

for (const field of ['business-gst','marketplace-model','seller-payouts-taxes','privacy','cancellation-refunds','returns','delivery','grievance','contact']) {
  assert(policy.includes("id: '" + field + "'"), 'Missing policy section ' + field);
}
for (const term of ['business.gstin','business.legalName','business.registeredAddress','Zeshu Cash','no seller membership can be charged','Seller Payouts', 'statutory rights','48 hours','one month', 'privacy@zeshu.in']) {
  assert(policy.toLowerCase().includes(term.toLowerCase()), 'Missing policy evidence: ' + term);
}
assert(policy.includes('Last updated: 23 November 2026'));
assert(info.includes('Registered business details'));
assert(info.includes('Products, pricing'));
assert(info.includes('seller')); 
assert(info.includes('Razorpay TEST'));
assert(info.includes('not currently enabled'));
assert(info.includes('No automated membership billing is currently enabled'));
assert(info.includes('customer'));
assert(info.includes('business.gstin'));
assert(info.includes('business.registeredAddress'));
assert(seller.includes('This plan is not yet collecting fees.'));
assert(seller.includes('₹299/month'));
assert(seller.includes('0% sales-commission plan'));
assert(footer.includes('href="/business-details"'));
assert(adminGst.includes('Issued GST REG-06'));
assert(adminGst.includes('The GST reporting workspace still has no active business tax profile'));
assert(kyc.includes('Regular GST registration alone'));
assert(kyc.includes('not yet a billing or auto-renewal product'));
assert(checkout.includes("ZESHU_LOCAL_PAID_DELIVERY_PILOT"));
assert(checkout.includes('nationwide_checkout_enabled'));
assert(!info.includes('has approved a production marketplace split'));
console.log('ZESHU_GST_KYC_AND_POLICY_QA=PASS');
