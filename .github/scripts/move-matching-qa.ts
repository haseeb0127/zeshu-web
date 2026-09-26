import fs from 'node:fs';

const read = (path: string) => fs.readFileSync(path, 'utf8');
const assert = (value: unknown, message: string) => {
  if (!value) throw new Error(message);
};

const migration = read('supabase/migrations/20260925164500_move_matching_foundation.sql');
const engine = read('app/lib/move-matching-server.ts');
const customerApi = read('app/api/move/dispatch/route.ts');
const riderApi = read('app/api/move/dispatch/rider/route.ts');
const readiness = read('app/api/move/matching/readiness/route.ts');
const customerUi = read('app/components/MoveMatchingCustomer.tsx');
const riderUi = read('app/components/MoveMatchingRiderPanel.tsx');
const moveRequest = read('app/move/request/page.tsx');
const riderPage = read('app/rider/page.tsx');
const locationSelector = read('app/components/LocationSelector.tsx');
const moveArea = read('app/lib/move-service-area.ts');
const moveAreaApi = read('app/api/move/service-area/check/route.ts');
const quoteApi = read('app/api/move/quote/route.ts');
const homePage = read('app/page.tsx');
const homeBusiness = read('app/components/HomeBusinessHub.tsx');

for (const table of ['move_dispatch_settings','move_dispatch_requests','move_dispatch_offers','move_dispatch_events']) {
  assert(migration.includes(`public.${table}`), `Move matching migration missing ${table}`);
}
assert(migration.includes('accept_move_dispatch_offer'), 'Move matching must use an atomic acceptance function');
assert(migration.includes('grant execute on function public.accept_move_dispatch_offer(uuid,uuid) to service_role'), 'Atomic acceptance must be service-role only');
assert(migration.includes('revoke all on public.move_dispatch_requests from anon, authenticated'), 'Move requests must not be directly exposed to browser roles');

for (const service of ['BIKE_COURIER','GOODS_DRIVER','AUTO_DRIVER','CAB_DRIVER']) {
  assert(engine.includes(service), `Move engine missing service ${service}`);
}
assert(engine.includes('r.user_id !== request.customer_user_id'), 'Move matching must prevent self-matching');
assert(engine.includes("eq('status', 'ACTIVE')"), 'Move matching must require active verified service eligibility');
assert(engine.includes("new Date(Date.now() - 90_000)"), 'Move matching must reject stale rider GPS');
assert(engine.includes('const radii = [2.5, 5, 10'), 'Move matching must expand radius in waves');
assert(engine.includes('candidates_per_wave'), 'Move matching must cap rider offer fanout');

assert(customerApi.includes('passengerExecutionAllowed'), 'Passenger requests must remain provider/compliance gated');
assert(customerApi.includes('evaluateTelanganaMoveArea'), 'Move dispatch must enforce the Telangana footprint server-side');
assert(customerApi.includes('quoteMove'), 'Customer request must use route-aware quote');
assert(customerApi.includes('moveOtpForRequest'), 'Customer trip must use a stable server-derived OTP');
assert(!customerApi.includes('RAZORPAY'), 'Move matching must not silently capture payment');

assert(riderApi.includes("service.rpc('accept_move_dispatch_offer'"), 'Rider acceptance must use atomic database acceptance');
assert(riderApi.includes("hashMoveOtp(otp) !== trip.start_otp_hash"), 'Trip start must validate customer OTP');
assert(riderApi.includes("action === 'CANCEL'"), 'Rider must be able to release a pre-start request for rematching');

assert(readiness.includes('compliance_gate'), 'Move readiness must expose passenger compliance gate');
assert(customerUi.includes('LocationSelector'), 'Customer matching must use map-selected locations');
assert(customerUi.includes('Where are you going?'), 'Move customer UI must be destination-first');
assert(customerUi.includes('Pickup now'), 'Move customer UI must default to pickup-now flow');
assert(customerUi.includes('Zeshu Move'), 'Move customer UI must preserve Zeshu branding');
assert(customerUi.includes('mode="move"'), 'Move customer UI must use the Move-specific location mode');
assert(customerUi.includes('Finding nearby verified partners'), 'Customer UI must explain active matching');
assert(customerUi.includes('Start OTP'), 'Customer UI must display trip OTP only after assignment');
assert(customerUi.includes('Confirm ${serviceLabel}'), 'Customer UI must confirm the selected service and estimate before matching');
assert(!customerUi.includes('Uber'), 'Customer-facing Zeshu Move UI must not mention competitor brands');
assert(!customerUi.includes('compliance-gated'), 'Customer-facing Zeshu Move UI must not expose technical compliance wording');
assert(customerUi.includes('booking is opening soon'), 'Passenger-gated services must use customer-friendly Zeshu launch copy');
assert(riderUi.includes('New nearby request'), 'Rider UI must surface nearby offers');
assert(riderUi.includes('Earn ₹'), 'Rider UI must show payout before acceptance');
assert(moveRequest.includes('"Bike Courier": "BIKE_COURIER"'), 'Bike Courier must route into matching');
assert(moveRequest.includes('"Auto": "AUTO_DRIVER"'), 'Auto must route into matching architecture');
assert(!moveRequest.includes('"Bike Ride": "BIKE_TAXI"'), 'Passenger Bike Taxi must remain outside live matching');
assert(!riderPage.includes('!stagingQaAvailable || !isOnline || !riderId'), 'Rider GPS sharing must not be staging-only');
assert(locationSelector.includes("mode?: 'delivery' | 'move'"), 'Shared location selector must separate Move from delivery rules');
assert(locationSelector.includes("mode === 'move' ? '/api/move/service-area/check' : '/api/service-area/check'"), 'Move must not use the Jagtial grocery service-area endpoint');
assert(moveArea.includes('TELANGANA_BOUNDS'), 'Move service area must expose Telangana bounds');
assert(moveAreaApi.includes('evaluateTelanganaMoveArea'), 'Move service-area API must validate Telangana locations');
assert(quoteApi.includes('quoteMove'), 'Move quote API must provide a preview before matching');
assert(quoteApi.includes('evaluateTelanganaMoveArea'), 'Move quote must validate pickup and drop within Telangana');
assert(homePage.includes('HomeBusinessHub'), 'Zeshu homepage must surface the unified business hub');
assert(!homePage.includes('<HomeMoveQuickPanel />'), 'Homepage must not duplicate the old Move quick panel');
assert(homeBusiness.includes('Where are you going?'), 'Homepage business hub must keep destination-first Move access');
for (const shortcut of ['Auto', 'Cab', 'Send parcel', 'Mini Truck']) {
  assert(homeBusiness.includes(shortcut), `Homepage business hub missing ${shortcut} shortcut`);
}
for (const href of ['/move/request?service=Auto','/move/request?service=Cab','/move/request?service=Bike%20Courier','/move/request?service=Auto%20%2F%20Mini%20Truck']) {
  assert(homeBusiness.includes(href), `Homepage business hub missing shortcut route: ${href}`);
}
assert(homeBusiness.includes('/api/move/matching/readiness'), 'Homepage business hub must use live Move readiness instead of inventing availability');
assert(homeBusiness.includes('useCustomerLanguage'), 'Homepage business hub must use customer language translations');
for (const scope of ['Jagtial','Telangana','India']) {
  assert(homeBusiness.includes(scope), `Homepage business hub must explain ${scope} service scope`);
}
for (const path of ['/earn','/partners','/help']) {
  assert(homeBusiness.includes(`href="${path}"`), `Homepage business hub missing business/support route: ${path}`);
}
assert(homeBusiness.includes('Shop. Move. Send. Recharge. One Zeshu.'), 'Homepage business hub must explain Zeshu at first glance');
assert(!homeBusiness.includes('navigator.geolocation'), 'Homepage business hub must not request GPS before customer intent');
assert(!homeBusiness.includes('Uber'), 'Homepage business hub must not mention competitor brands');
assert(!homeBusiness.includes('compliance-gated'), 'Homepage business hub must not expose internal compliance wording');

console.log('MOVE_MATCHING_QA=PASS');
