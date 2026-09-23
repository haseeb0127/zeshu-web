import fs from 'node:fs';

const route = fs.readFileSync('app/api/support/assistant/route.ts', 'utf8');
const knowledge = fs.readFileSync('app/lib/support-ai.ts', 'utf8');
const env = fs.readFileSync('.env.example', 'utf8');
const help = fs.readFileSync('app/help/page.tsx', 'utf8');
const adminSupport = fs.readFileSync('app/api/admin/support/conversations/route.ts', 'utf8');
const adminDashboard = fs.readFileSync('app/admin/dashboard/page.tsx', 'utf8');

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
  'App, QR & Pass',
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
for (const phrase of [
  'Zeshu Prepaid is designed for India-wide mobile-plan discovery',
  'Zeshu DTH can guide you through subscriber/customer ID entry',
  'For Electricity, select the electricity provider first',
  'For FASTag, choose a supported provider',
  'Zeshu LPG currently supports the customer discovery surface only',
  'For Piped Gas, choose a supported provider',
  'For Water Bill discovery, select a supported provider',
  'For Broadband, select the provider',
  'Zeshu can provide QR/scanner tools',
  'Use Get Zeshu for the currently supported install options',
  'Zeshu Pass and Subscribe & Save are Coming Soon',
]) {
  assert(route.includes(phrase), `Assistant service coverage is missing: ${phrase}`);
}
assert(help.includes('const DIGITAL_HELP = ['), 'Help Center must expose digital-service support shortcuts');
assert(help.includes('Popular digital help'), 'Help Center must label digital support shortcuts');
assert(adminSupport.includes('support_category: supportCategory'), 'Admin support API must expose a service category');
assert(adminDashboard.includes('SUPPORT_CATEGORIES'), 'Admin support inbox must expose service-category filters');
assert(adminDashboard.includes('All services'), 'Admin support inbox must provide an all-services category view');

const moveFlagCount = (env.match(/^MOVE_EXECUTION_ENABLED=/gm) || []).length;
assert(moveFlagCount === 1, 'MOVE_EXECUTION_ENABLED must be documented exactly once');
assert(env.includes('Guided/rules-based help remains available while AI is off.'), 'Environment manifest should explain guided help fallback');

console.log('SUPPORT_ASSISTANT_COVERAGE_QA=PASS');
