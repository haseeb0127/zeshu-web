import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const bike = readFileSync('app/bike/page.tsx','utf8');
const move = readFileSync('app/move/page.tsx','utf8');
const form = readFileSync('app/components/DriverRiderInterestForm.tsx','utf8');
const matching = readFileSync('app/api/move/matching/readiness/route.ts','utf8');
const dispatch = readFileSync('app/api/move/dispatch/route.ts','utf8');

assert(bike.includes('Bike Courier & Delivery'));
assert(bike.includes('Bike Taxi — future launch'));
assert(bike.includes('Passenger bookings are disabled.'));
assert(bike.includes('Do not convert a private vehicle or pay an agent'));
assert(bike.includes('/earn?role=BIKE_COURIER#join'));
assert(bike.includes('/earn?role=BIKE_RIDE_INTEREST#join'));
assert(move.includes('href="/bike"'), 'Both bike cards should lead to the bike hub.');
assert(form.includes('new URLSearchParams(window.location.search).get("role")'));
assert(form.includes('roles.some(([value]) => value === requestedRole)'));
assert(matching.includes('bike_taxi_available: false'));
assert(dispatch.includes("serviceCode === 'AUTO_DRIVER' || serviceCode === 'CAB_DRIVER'"));
assert(!bike.includes('book a bike taxi now'));
console.log('PASS: Zeshu Bike landing, courier recruitment, rider interest preselection and passenger-taxi compliance hold.');
