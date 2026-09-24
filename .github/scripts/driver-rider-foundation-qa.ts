import fs from 'node:fs';

const read = (path: string) => fs.readFileSync(path, 'utf8');
const assert = (value: unknown, message: string) => {
  if (!value) throw new Error(message);
};

const form = read('app/components/DriverRiderInterestForm.tsx');
const api = read('app/api/partners/driver-interest/route.ts');
const readiness = read('app/lib/driver-rider-readiness.ts');
const status = read('app/api/partners/driver-interest/status/route.ts');
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

assert(readiness.includes('interestRegistrationAvailable: true'), 'interest registration should be available');
assert(readiness.includes('documentUploadAvailable: false'), 'document upload must fail closed');
assert(readiness.includes('activationAvailable: false'), 'driver/rider activation must fail closed');
assert(status.includes('activation_available: false'), 'public status API must report activation disabled');
assert(status.includes('document_upload_available: false'), 'public status API must report document upload disabled');

assert(move.includes('href="/earn"'), 'Move & Travel must link to Drive & Deliver');
assert(home.includes("href: '/earn'"), 'Zeshu search must expose Drive & Deliver');
assert(support.includes('Zeshu Delivery Rider'), 'support knowledge must cover rider onboarding');
assert(support.includes('secured onboarding flow'), 'support knowledge must protect sensitive onboarding data');
assert(assistant.includes('become a rider'), 'assistant routing must recognize rider onboarding');
assert(assistant.includes('Open Drive & Deliver on Zeshu'), 'assistant must direct applicants to Drive & Deliver');

for (const unsafeAction of [
  'Start ride',
  'Start delivery',
  'Go online',
  'Accept trip',
  'Accept delivery',
]) {
  assert(!form.includes(`>${unsafeAction}<`), `public onboarding form must not expose execution action: ${unsafeAction}`);
}

console.log('DRIVER_RIDER_FOUNDATION_QA=PASS');
