import assert from 'node:assert/strict';
import fs from 'node:fs';
import { HOME_SERVICE_CATEGORIES, HOME_SERVICE_HELD_CATEGORIES, isHomeServiceCode } from '../../app/lib/home-services-categories.ts';
const read = (path: string) => fs.readFileSync(path, 'utf8');

assert.equal(HOME_SERVICE_CATEGORIES.length,8);
assert(isHomeServiceCode('ELECTRICIAN'));
assert(isHomeServiceCode('PLUMBER'));
assert(!isHomeServiceCode('BABYSITTER'));
assert(!isHomeServiceCode('FULL_TIME_MAID'));
assert(!isHomeServiceCode('IN_HOME_TUTOR'));
assert(HOME_SERVICE_HELD_CATEGORIES.some(name=>name.includes('Babysitters')));

const api = read('app/api/professional-services/enquiries/route.ts');
assert(api.includes("'HOME_SERVICES'"));
assert(api.includes('isHomeServiceCode(service_category)'));
assert(api.includes("city.toLowerCase() !== 'jagtial'"));
assert(api.includes('input.consent !== true'));
assert(api.includes('rateLimitResponse'));
assert(api.includes('>= 3'));
assert(api.includes('home_services_enquiries_enabled: !error'), 'Fail closed when schema/readiness is missing');
assert(api.includes('No professional, visit, price or booking is confirmed'));
assert(!api.includes('razorpay.orders.create'));
assert(!api.includes('chargeWallet'));

const schema=read('supabase/migrations/20261123070000_professional_home_services_quote_only.sql');
assert(schema.includes('service_category'));
assert(schema.includes("'HOME_SERVICES'"));
assert(schema.includes('enable row level security'));
assert(schema.includes('revoke all on table public.professional_service_enquiries from anon, authenticated'));
assert(schema.includes('to service_role'));
const partnerSchema=read('supabase/migrations/20261123070001_services_partner_interest.sql');
assert(partnerSchema.includes("'HOME_SERVICE_PRO'"));
assert(partnerSchema.includes("'MOBILITY'"));

const page=read('app/professional-services/home-services/page.tsx');
const form=read('app/components/HomeServiceQuoteForm.tsx');
const hub=read('app/components/HomeBusinessHub.tsx');
assert(page.includes('Jagtial pilot'));
assert(page.includes('Quote enquiry only'));
assert(page.includes('₹99 is not a confirmed standard price'));
assert(page.includes('HOME_SERVICE_HELD_CATEGORIES'));
assert(page.includes('/partners?type=HOME_SERVICE_PRO#partner-apply'));
assert(form.includes('/api/professional-services/enquiries'));
assert(form.includes('HOME_SERVICES'));
assert(form.includes('consent'));
assert(form.includes('No ₹99 inspection'));
assert(form.includes('disabled={busy || checking || !available}'));
assert(hub.includes('/professional-services/home-services'));
assert(hub.includes('Enquire only'));
assert(read('app/professional-services/page.tsx').includes('/professional-services/home-services'));
assert(read('app/api/admin/professional-services/route.ts').includes('service_category'));
assert(read('app/admin/professional-services/page.tsx').includes('Home Services'));
assert(read('app/api/partners/route.ts').includes("'HOME_SERVICE_PRO'"));
assert(read('app/components/PartnerLeadForm.tsx').includes('Home-service professional / salon'));

const policies=read('app/policies/page.tsx');
assert(policies.includes("id: 'home-services'"));
assert(policies.includes('babysitting') || policies.includes('Babysitting'));
assert(policies.includes('₹15/₹50'));
assert(policies.includes('₹199/₹299'));
assert(policies.includes('private to authorised Zeshu staff'));
assert(!api.includes('confirmed appointment'));

console.log('ZESHU_HOME_SERVICES_QUOTE_FIRST_QA=PASS');
