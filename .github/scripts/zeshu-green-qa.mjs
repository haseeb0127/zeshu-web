import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=(p)=>readFileSync(p,'utf8');
const migration=read('supabase/migrations/20261014130000_zeshu_green_verified_tree_campaign.sql');
const nullGuard=read('supabase/migrations/20261014132000_zeshu_green_active_guard_null_safe.sql');
const guard=read('supabase/migrations/20261014235500_zeshu_green_evidence_guards.sql');
const ownerApi=read('app/api/admin/green/route.ts');
const ownerPage=read('app/admin/green/page.tsx');
const adminNav=read('app/admin/dashboard/page.tsx');
const impact=read('app/api/green/impact/route.ts');
const green=read('app/green/page.tsx');
const hub=read('app/components/HomeBusinessHub.tsx');
const lang=read('app/components/CustomerLanguageProvider.tsx');
const docs=read('docs/ZESHU_GREEN_TREE_PROGRAM.md');

// No false environmental promises, no retroactive claims and no checkout changes.
assert(migration.includes("mode text not null default 'PLANNING'"),'Tree planting must start disabled');
assert(migration.includes("mode <> 'ACTIVE'"),'Activation must be database-guarded');
assert(nullGuard.includes("coalesce(partner_public_website,'')"),'Missing partner URL must fail ACTIVE guard');
assert(nullGuard.includes('coalesce(tree_unit_budget_paise,0)'),'Missing funded unit budget must fail ACTIVE guard');
for(const gate of ['verified_partner_agreement','live_order_payments_verified','funded_tree_quota > 0','tree_unit_budget_paise']){
 assert(migration.includes(gate),'Missing planting funding/verification guard: '+gate);
}
assert(migration.includes("new.status <> 'DELIVERED'"),'Only delivered orders are eligible');
assert(migration.includes("old.status = 'DELIVERED'"),'Do not double-count a delivery');
assert(migration.includes("new.created_at < cfg.activated_at"),'Do not reward previous or TEST history');
assert(migration.includes('for update'),'Funded quota must serialize concurrent deliveries');
assert(migration.includes("set mode='PAUSED'"),'A fully allocated quota must auto-pause');
assert(migration.includes('on conflict(order_id) do nothing'),'Each order must fund at most one tree');
assert(migration.includes("status='VOID'"),'Cancelled unplanted deliveries must be voidable');
assert(migration.includes("status <> 'VERIFIED'"),'Verified trees must require actual evidence');
for(const field of ['proof_url','native_species','planting_area','partner_reference','planted_at','verified_at']){
 assert(migration.includes(field),'Verification should require '+field);
}
for(const tbl of ['zeshu_green_program','zeshu_green_tree_commitments']){
 assert(migration.includes('alter table public.'+tbl+' enable row level security'),'RLS required on '+tbl);
 assert(migration.includes('revoke all on table public.'+tbl+' from public,anon,authenticated'),'Do not expose '+tbl);
}
assert(impact.includes("from('zeshu_green_tree_commitments')"),'Impact must derive from real records');
assert(impact.includes(".eq('status','VERIFIED')"),'Planted counts must use verified records only');
assert(impact.includes('no-store'),'Impact must not cache stale claims');
assert(!impact.includes("select('*')"),'Public impact must not expose private order/customer records');
assert(impact.includes('getRuntimeSupabaseEnv'),'Use server-only service credentials');
assert(impact.includes('No historical or TEST orders are counted'),'Disclose pilot baseline');
assert(green.includes('programmeStatus'),'UI must show planning/active/paused');
assert(green.includes('No tree planting is claimed'),'Clear evidence-based promise required');
assert(green.includes('Our goal: one tree for every eligible delivered order.'),'Phrase as objective, not already fulfilled');
assert(green.includes('verifiedPlanted'),'Only verified trees listed as planted');
assert(green.includes('not a carbon-offset')||green.includes('not a carbon-offset or carbon-neutral'),
 'Must not imply unverified carbon offsets');
assert(hub.includes('href="/green"'),'Green must be discoverable from storefront');
assert(hub.includes('data-zeshu-green-home="planning"'),'Homepage pilot should be clearly labelled');
assert(!hub.includes('One tree planted with every order'),'No unverified tree impact marketing');
for(const token of ['"Zeshu Green"','"See the plan"','"Our goal: one tree for every eligible delivered order."']){
 assert(lang.split(token).length-1>=3,'Translation dictionaries incomplete: '+token);
}
assert(docs.includes('Razorpay remains in TEST mode'),'Do not start in payment test mode');
assert(docs.includes('No app UI exists to switch'),'Activation requires explicit business approval');
assert(guard.includes("coalesce(proof_url,'')"),'SQL NULL proof must not bypass VERIFIED tree evidence');
assert(guard.includes("status not in ('PLANTED','VERIFIED')"),'Reported planting requires basic partner evidence');
assert(guard.includes("verified_at >= planted_at"),'Verification cannot predate planting');
assert(guard.includes("coalesce(native_species,'')"),'Require actual tree species before claiming planted');
assert(guard.includes("coalesce(partner_reference,'')"),'Require partner report ID before claiming planted');
assert(ownerApi.includes('authorizeWhatsAppInboxAdmin(request)'),'Private HQ must require owner role');
assert(ownerApi.includes("getRuntimeEnvValue('RAZORPAY_KEY_ID')"),'Show live vs test gateway truth to owner');
assert(ownerApi.includes("razorpayId.startsWith('rzp_test_')"),'TEST mode must be obvious to owner');
assert(ownerApi.includes('paymentGatewayLive'),'Block per-order marketing until real payment readiness');
assert(ownerApi.includes('canAnnouncePerOrderPromise:Object.values(gates).every(Boolean)&&reserved<quota'),
  'No funded capacity must prevent per-order marketing');
assert(!ownerApi.includes('export async function POST')&&!ownerApi.includes('export async function PATCH'),
  'Owner HQ must be read-only: no program activation or spending');
assert(ownerPage.includes("fundedTreeQuota")&&ownerPage.includes("counts.verified"),'Show real budget/capacity and proof-backed planting counts');
assert(ownerPage.includes("No customer tree fee"),'Owner must not quietly charge customers');
assert(ownerPage.includes("no activation control"),'Green HQ must not activate by button');
assert(adminNav.includes('href="/admin/green"'),'Green HQ must be discoverable from Zeshu Admin');
console.log('PASS: honest Zeshu Green programme, verified tree accounting, privacy and safely disabled live pledge');
