import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(p,'utf8');
const migration=read('supabase/migrations/20261014130000_zeshu_green_verified_tree_campaign.sql');
const nullGuard=read('supabase/migrations/20261014132000_zeshu_green_active_guard_null_safe.sql');
const guard=read('supabase/migrations/20261014235500_zeshu_green_evidence_guards.sql');
const impact=read('app/api/green/impact/route.ts');
const green=read('app/green/page.tsx');
const hub=read('app/components/HomeBusinessHub.tsx');
const lang=read('app/components/CustomerLanguageProvider.tsx');
const docs=read('docs/ZESHU_GREEN_TREE_PROGRAM.md');
const ownerApi=read('app/api/admin/green/route.ts');
const ownerPage=read('app/admin/green/page.tsx');
const adminNav=read('app/admin/dashboard/page.tsx');

// Keep all old financial/evidence gates until the legacy per-order pledge system
// is deliberately replaced; the pilot must NEVER accidentally activate it.
assert(migration.includes("mode text not null default 'PLANNING'"));
assert(migration.includes("mode <> 'ACTIVE'"));
assert(migration.includes("new.status <> 'DELIVERED'"));
assert(migration.includes("new.created_at < cfg.activated_at"));
assert(migration.includes("set mode='PAUSED'"));
assert(nullGuard.includes("coalesce(partner_public_website,'')"));
assert(guard.includes("status not in ('PLANTED','VERIFIED')"));
assert(guard.includes("coalesce(proof_url,'')"));
assert(impact.includes(".eq('status','VERIFIED')"));
assert(impact.includes('no-store')&&!impact.includes("select('*')"));
assert(impact.includes('one tree for every eligible delivered order'));
assert(ownerApi.includes('canAnnouncePerOrderPromise:false'));
assert(ownerApi.includes('authorizeWhatsAppInboxAdmin(request)'));
assert(ownerApi.includes('bulkPlantingAuthorized:false'));
assert(ownerApi.includes("razorpayId.startsWith('rzp_test_')"));
assert(!ownerApi.includes('export async function POST'));
assert(!ownerApi.includes('export async function PATCH'));
assert(ownerPage.includes('Goal: one tree for every eligible completed delivery order'));
assert(!ownerPage.includes('10,000 tree planting drive'));
assert(ownerPage.includes('legacy commitment counter does not track')||ownerPage.includes('Legacy commitment counter does not track'));
assert(green.includes('one tree for every eligible completed delivery order'));
assert(green.includes('verifiedPlanted')&&green.includes('No tree is claimed'));
assert(green.includes('This is not a carbon-offset'));
assert(!green.includes('10,000 eligible orders'));
assert(hub.includes('href="/green"'));
assert(hub.includes('Our goal: one tree for every eligible delivered order.'));
assert(hub.includes('Still planning — no trees planted for orders yet.'));
for(const phrase of ['"Our goal: one tree for every eligible delivered order."',
  '"Still planning — no trees planted for orders yet."']){
 assert(lang.split(phrase).length-1===3,'All three translation dictionaries need '+phrase);
}
assert(docs.includes('one tree for each eligible, completed customer delivery order'));
assert(docs.includes('Razorpay remains in TEST mode'));
assert(docs.includes('Keep the existing programme in PLANNING and its activation gates closed'));
assert(adminNav.includes('href="/admin/green"'));
console.log('PASS: compact truthful Zeshu Green pilot, legacy one-tree trigger disabled, secure evidence-only tree reporting.');
