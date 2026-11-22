import assert from 'node:assert/strict';
import fs from 'node:fs';
import { getIndiaTodayISO, validateMoveQuote, MOVE_QUOTE_SERVICE_CODES, MOVE_QUOTE_TOWNS } from '../../app/lib/move-quote-enquiry.ts';
const read = (path: string) => fs.readFileSync(path,'utf8');

assert.equal(MOVE_QUOTE_TOWNS.length, 5);
assert(MOVE_QUOTE_TOWNS.includes('Dharmapuri'));
assert(MOVE_QUOTE_SERVICE_CODES.includes('CHARTER_BUS'));
const now = new Date('2026-11-23T06:00:00.000Z');
assert.equal(getIndiaTodayISO(now), '2026-11-23');
const sample = {
  service_code: 'OUTSTATION_CAB', pickup_town:'Jagtial', destination:'Hyderabad',
  travel_date: '2026-11-26', travel_time:'08:30', contact_name:'Sample Customer',
  contact_phone:'9876543210', pickup_landmark:'Bus stand', passengers:'3',
  load_description:'', notes:'Pickup from main road', consent:true, website:'',
};
const valid = validateMoveQuote(sample, now);
assert(valid.ok);
if(valid.ok) {
  assert.equal(valid.value.contact_phone,'9876543210');
  assert.equal(valid.value.service_code,'OUTSTATION_CAB');
}
const failures = [
  {...sample, service_code: 'BIKE_TAXI'},
  {...sample, service_code: 'CAR_POOL'},
  {...sample, pickup_town: 'Hyderabad'},
  {...sample, destination:''},
  {...sample, consent:false},
  {...sample, website:'https://spam.example'},
  {...sample, contact_phone:'12345'},
  {...sample, travel_date:'2026-11-22'},
  {...sample, travel_date:'2027-12-01'},
  {...sample, travel_time:'28:88'},
  {...sample, service_code:'CHARTER_BUS', passengers:''},
  {...sample, service_code:'MINI_TRUCK', load_description:''},
  {...sample, service_code:'RETURN_CAB', notes:''},
];
for(const entry of failures) assert.equal(validateMoveQuote(entry,now).ok,false,JSON.stringify(entry));
const sql = read('supabase/migrations/20261123010000_move_quote_enquiries.sql');
for(const phrase of ['public.move_quote_enquiries','enable row level security','revoke all on table public.move_quote_enquiries from public, anon, authenticated','to service_role']) {
  assert(sql.includes(phrase), 'Private schema lacks '+phrase);
}
const api=read('app/api/move/quotes/route.ts');
assert(api.includes('validateMoveQuote'));
assert(api.includes('rateLimitResponse'));
assert(api.includes("status: 201"));
assert(api.includes('if (error || !data?.id)'));
assert(!api.includes('create_booking'));
assert(!api.includes('Razorpay'));
const admin=read('app/api/admin/move/quotes/route.ts');
assert(admin.includes(".eq('role','admin')"));
assert(admin.includes('auth.auth.getUser'));
const adminUI=read('app/admin/move/quotes/page.tsx');
assert(adminUI.includes('No vehicle') || adminUI.includes('not a confirmed vehicle booking'));
const quoteUI=read('app/move/quote/page.tsx');
assert(quoteUI.includes("fetch('/api/move/quotes'"));
assert(quoteUI.includes('consent'));
assert(quoteUI.includes('No payment'));
const move=read('app/move/page.tsx');
assert(move.includes('Scheduled cabs, trucks'));
assert(move.includes('/move/quote?service='));
assert(move.includes('regulatoryHold: true'));
const home=read('app/components/HomeBusinessHub.tsx');
for(const phrase of ['Everyday essentials & services','Quotes & Local Pros','zeshu-meat-fish','Plans only','Quote requests']) assert(home.includes(phrase));
const readiness=read('app/lib/move-readiness.ts');
assert(readiness.includes('customerBookingAvailable: false'));
const matching=read('app/api/move/matching/readiness/route.ts');
assert(matching.includes('bike_taxi_available: false'));
assert(read('app/admin/dashboard/page.tsx').includes('/admin/move/quotes'));
console.log('ZESHU_MOVE_DISTRICT_QUOTE_QA=PASS');
