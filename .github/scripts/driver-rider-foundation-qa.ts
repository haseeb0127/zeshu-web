import fs from 'node:fs';

const read = (path: string) => fs.readFileSync(path, 'utf8');
const assert = (value: unknown, message: string) => {
  if (!value) throw new Error(message);
};

const form = read('app/components/DriverRiderInterestForm.tsx');
const api = read('app/api/partners/driver-interest/route.ts');
const readiness = read('app/lib/driver-rider-readiness.ts');
const status = read('app/api/partners/driver-interest/status/route.ts');
const onboardingPage = read('app/earn/onboard/page.tsx');
const onboardingApi = read('app/api/driver/onboarding/route.ts');
const documentApi = read('app/api/driver/onboarding/documents/route.ts');
const adminApi = read('app/api/admin/drivers/route.ts');
const migration = read('supabase/migrations/20260925122338_driver_verification_foundation.sql');
const move = read('app/move/page.tsx');
const home = read('app/page.tsx');
const support = read('app/lib/support-ai.ts');
const assistant = read('app/api/support/assistant/route.ts');

for (const role of [
  'DELIVERY_RIDER',
  'BIKE_COURIER',
  'AUTO_DRIVER',
  'CAB_DRIVER',
  'GOODS_DRIVER',
  'PASSENGER_FLEET_OPERATOR',
  'LOGISTICS_FLEET_OPERATOR',
]) {
  assert(api.includes(`'${role}'`), `driver interest API missing role ${role}`);
  assert(readiness.includes(`'${role}'`), `readiness model missing role ${role}`);
}

for (const forbidden of [
  /form\.aadhaar/i,
  /form\.pan/i,
  /form\.driving_licen[cs]e_number/i,
  /form\.dl_number/i,
  /form\.rc_number/i,
  /form\.bank_account/i,
  /body\.aadhaar/i,
  /body\.pan/i,
  /body\.driving_licen[cs]e_number/i,
  /body\.dl_number/i,
  /body\.rc_number/i,
  /body\.bank_account/i,
]) {
  assert(!forbidden.test(form), `public driver form exposes forbidden sensitive field: ${forbidden}`);
  assert(!forbidden.test(api), `driver interest API accepts forbidden sensitive field: ${forbidden}`);
}

assert(form.includes('Privacy first'), 'driver interest form must show privacy guidance');
assert(form.includes('secured verification flow'), 'driver interest form must defer documents to a secure flow');
assert(api.includes("source: 'DRIVE_DELIVER'"), 'driver interest leads must be identifiable by source');
assert(api.includes("partnerType = role === 'DELIVERY_RIDER'"), 'driver interest API must route roles to partner categories');

assert(readiness.includes('VERIFICATION_AVAILABLE'), 'individual driver roles must expose verification readiness');
assert(readiness.includes('activationAvailable: false'), 'readiness must not imply automatic activation');
assert(status.includes('secure_document_verification_available: true'), 'public status must report secure verification available');
assert(status.includes('self_activation_available: false'), 'public status must keep self activation disabled');
assert(status.includes('passenger_bike_taxi_available: false'), 'public status must keep passenger bike taxi disabled');

for (const service of ['DELIVERY_RIDER', 'BIKE_COURIER', 'AUTO_DRIVER', 'CAB_DRIVER', 'GOODS_DRIVER']) {
  assert(onboardingPage.includes(`"${service}"`), `secure onboarding UI missing service ${service}`);
}
assert(!onboardingPage.includes('"BIKE_TAXI"'), 'passenger bike taxi must not be selectable');
assert(onboardingPage.includes('driver-verification'), 'documents must upload to private verification bucket');
assert(onboardingApi.includes('requireDriverUser'), 'driver onboarding API must authenticate applicants');
assert(onboardingApi.includes('needsMotorVehicle'), 'motorized services must require a vehicle before verification');
assert(documentApi.includes('storagePath.startsWith'), 'document metadata API must enforce user-owned storage path');
assert(adminApi.includes("const ACTIVATABLE = new Set(['DELIVERY_RIDER','BIKE_COURIER','GOODS_DRIVER'])"), 'only non-passenger services may activate in this phase');
assert(adminApi.includes('createSignedUrl'), 'admin document review must use short-lived signed URLs');
assert(migration.includes("'driver-verification'"), 'migration must create private driver verification storage');
assert(migration.includes('driver_user_has_current_activation'), 'database must enforce current activation eligibility');
assert(migration.includes('verification_grandfathered'), 'legacy riders must be explicitly grandfathered');

assert(move.includes('href="/earn"'), 'Move & Travel must link to Drive & Deliver');
assert(home.includes("href: '/earn'"), 'Zeshu search must expose Drive & Deliver');
assert(support.includes('Zeshu Delivery Rider'), 'support knowledge must cover rider onboarding');
assert(support.includes('secured onboarding flow'), 'support knowledge must protect sensitive onboarding data');
assert(assistant.includes('become a rider'), 'assistant routing must recognize rider onboarding');
assert(assistant.includes('Open Drive & Deliver on Zeshu'), 'assistant must direct applicants to Drive & Deliver');

for (const unsafeAction of ['Start ride', 'Start delivery', 'Accept trip', 'Accept delivery']) {
  assert(!form.includes(`>${unsafeAction}<`), `public interest form must not expose execution action: ${unsafeAction}`);
}

console.log('DRIVER_RIDER_FOUNDATION_QA=PASS');
