import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const file=p=>readFileSync(p,'utf8');
const publicApi=file('app/api/green/impact/route.ts');
const adminApi=file('app/api/admin/green/route.ts');
const adminUi=file('app/admin/green/page.tsx');
const storefront=file('app/components/HomeBusinessHub.tsx');
const greenPage=file('app/green/page.tsx');
for(const [name,source] of [['public impact',publicApi],['private planning dashboard',adminApi]]){
 assert(source.includes('treePerEligibleDeliveredOrder:1'),name+' should report the one-tree-per-eligible-delivery goal');
 assert(source.includes('fundingConfirmed:false'),name+' must disclose that per-order funding is not confirmed');
 assert(source.includes('plantingPartnerConfirmed'),name+' must disclose partner readiness');
 assert(source.includes('eligibleDeliveredOrdersTracked:null'),name+' must not invent qualifying deliveries');
 assert(source.includes('trackingEnabled:false'),name+' must admit tracking has not been activated');
 assert(!source.includes('plantingBatch:greenBatchProgress'),name+' must not expose the old 10,000 legacy tree-commitment batch as orders');
 assert(!source.includes("from '@/app/lib/zeshu-green-batch'"),name+' must not conflate legacy commitments with delivered orders');
}
assert(adminUi.includes('eligibleDeliveredOrdersTracked:null'), 'Admin should preserve untracked pilot semantics');
assert(greenPage.includes('No tree is claimed'), 'Public page must not promise trees were planted');
assert(storefront.includes('Our goal: one tree for every eligible delivered order'), 'Homepage goal must match API');
assert(publicApi.includes(".eq('status','VERIFIED')"),'Only evidence-backed trees may appear in verified total');
assert(adminApi.includes('canAnnouncePerOrderPromise:false'),'No one-tree-per-order promise before funded activation');
console.log('PASS: Homepage, public Green API and private Green HQ consistently disclose the unfunded one-tree-per-eligible-delivery goal without fabricated order progress.');
