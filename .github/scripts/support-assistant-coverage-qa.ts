import fs from 'node:fs';

const route = fs.readFileSync('app/api/support/assistant/route.ts', 'utf8');
const knowledge = fs.readFileSync('app/lib/support-ai.ts', 'utf8');
const env = fs.readFileSync('.env.example', 'utf8');
const help = fs.readFileSync('app/help/page.tsx', 'utf8');

const assert = (condition: boolean, message: string) => {
  if (!condition) throw new Error(message);
};

assert(route.includes('There is no published launch date I can safely promise'), 'Assistant must not invent Move & Travel launch dates');
assert(route.includes('I will not invent a fare, charge or ETA'), 'Assistant must not invent fares or ETAs');
assert(route.includes('final weight/size limits, prohibited-goods rules, insurance and liability'), 'Courier limits must defer to verified provider terms');
assert(route.includes('authorized provider shown at booking will supply the authoritative fare, baggage, room and ticket rules'), 'Travel supplier rules must remain provider-authoritative');
assert(knowledge.includes('do not invent or estimate a launch date'), 'Knowledge base must forbid invented launch dates');
assert(knowledge.includes('do not estimate it'), 'Knowledge base must forbid invented Move pricing/ETA');

for (const topic of [
  'Shopping & Orders',
  'Marketplace',
  'Delivery & Address',
  'Rides',
  'Courier & Cargo',
  'Car Share',
  'Travel',
  'Pharmacy & Health',
  'Recharge & Bills',
  'Zeshu Cash & Referrals',
  'Payments & Refunds',
  'Account & Safety',
  'QR & UPI Tools',
  'App & Languages',
  'Offers & Sponsored',
  'Pass & Subscriptions',
]) {
  assert(help.includes(`key: "${topic}"`), `Help Center must expose ${topic}`);
}
assert(help.includes('Human support is available for every Zeshu service.'), 'Help Center must offer human support across services');
assert(route.includes('support_category: classifySupportCategory'), 'Assistant responses must include a normalized support category');
assert(route.includes('buildCategorizedSupportSubject'), 'Automatic handoffs must carry a categorized subject');
assert(route.includes('deliveryInfoIntent'), 'Assistant must distinguish delivery/address guidance from private order tracking');
assert(route.includes('!deliveryInfoIntent(message)'), 'Delivery/address questions must not trigger private order lookup');
assert(route.includes('Zeshu does not promise one universal delivery or shipping fee'), 'Assistant must explain live delivery-fee authority');
assert(route.includes('Zeshu keeps seller trust labels separate'), 'Assistant must explain seller trust labels');
assert(route.includes('Zeshu WhatsApp customer support is not treated as live'), 'Assistant must not present WhatsApp support as live before activation');
assert(route.includes('Zeshu Now is the fast local-commerce layer'), 'Assistant must explain the Zeshu Now/Market/Digital model');
assert(route.includes('Use Zeshu’s Privacy Policy for the full data-handling terms'), 'Assistant must answer privacy questions safely');
assert(help.includes('Current service status'), 'Help Center must show customer-facing service status');
assert(help.includes('Available where shown'), 'Help Center must avoid claiming universal marketplace availability');
assert(help.includes('Discovery available'), 'Help Center must label discovery-only services clearly');
assert(route.includes('QR and UPI Tools can be used for supported discovery/scanning utilities'), 'Assistant must explain QR/UPI execution limits');
assert(route.includes('Zeshu Pass and Subscribe & Save are currently Coming Soon'), 'Assistant must explain subscription launch status');
assert(route.includes('Sponsored banners or products must be clearly labelled'), 'Assistant must explain sponsored placement');
assert(knowledge.includes('No membership fee, recurring charge or subscription payment should be collected'), 'Knowledge base must prevent premature subscription billing');
assert(knowledge.includes('QR/contact money transfer, funded cashback and real UPI payment actions remain disabled'), 'Knowledge base must keep QR/UPI money movement gated');

const home = fs.readFileSync('app/page.tsx', 'utf8');
const move = fs.readFileSync('app/move/page.tsx', 'utf8');
assert(home.includes('/help?service='), 'Digital service panel must expose service-specific support');
assert(home.includes("t('Get help')"), 'Digital service panel must show a Get help action');
assert(move.includes('/help?service='), 'Move & Travel cards must expose service-specific support');

const moveFlagCount = (env.match(/^MOVE_EXECUTION_ENABLED=/gm) || []).length;
assert(moveFlagCount === 1, 'MOVE_EXECUTION_ENABLED must be documented exactly once');
assert(env.includes('Guided/rules-based help remains available while AI is off.'), 'Environment manifest should explain guided help fallback');

console.log('SUPPORT_ASSISTANT_COVERAGE_QA=PASS');
