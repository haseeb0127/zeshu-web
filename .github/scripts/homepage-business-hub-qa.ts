import fs from 'node:fs';

const read = (path: string) => fs.readFileSync(path, 'utf8');
const assert = (value: unknown, message: string) => {
  if (!value) throw new Error(message);
};

const homeHub = read('app/components/HomeBusinessHub.tsx');
const page = read('app/page.tsx');
const layout = read('app/layout.tsx');
const translations = read('app/components/CustomerLanguageProvider.tsx');

for (const phrase of [
  'Shop, move, send and manage everyday services with Zeshu.',
  'What would you like to do?',
  'Groceries & essentials',
  'Rides & courier',
  'Recharge & bills',
  'Marketplace',
  'Explore Zeshu Fashion',
  'Sarees',
  'Kurtis',
  'Kidswear',
  'Footwear',
  'Accessories',
  'Clear availability',
  'Customer support',
  'For customers, drivers, sellers and brands',
]) {
  assert(homeHub.includes(phrase), `Homepage business hub missing customer-facing phrase: ${phrase}`);
}

for (const scope of ['Jagtial', 'Telangana', 'India']) {
  assert(homeHub.includes(scope), `Homepage business hub missing geographic scope: ${scope}`);
}

for (const href of ['/move', '/fashion', '/earn', '/partners', '/help', '/policies', '/app']) {
  assert(homeHub.includes(`href="${href}"`) || homeHub.includes(`href={${JSON.stringify(href)}`), `Homepage business hub missing key destination: ${href}`);
}

assert(homeHub.includes('data-marketplace-layout="professional"'), 'Homepage must use the professional marketplace layout shell');
assert(page.includes('data-category-strip="marketplace"'), 'Mobile homepage must use icon-led marketplace category discovery');
const productCard = read('app/components/ProductCard.tsx');
assert(productCard.includes('data-product-card="marketplace"'), 'Product cards must use the professional marketplace card system');
assert(homeHub.includes('aria-roledescription="carousel"'), 'Homepage must expose the Zeshu self-promotion carousel accessibly');
assert(homeHub.includes('data-promo-slide'), 'Homepage promo carousel must render slide markers');
assert(homeHub.includes('data-promo-scope={slide.scope}'), 'Homepage promo carousel must expose structural scope markers');
for (const promo of ['Shop in Jagtial', 'Zeshu Fashion', 'Zeshu Pay', 'Zeshu Move', 'Marketplace']) {
  assert(homeHub.includes(promo), `Homepage promo carousel missing ${promo}`);
}
assert(homeHub.includes('promoTrackRef'), 'Homepage promo carousel must support manual swipe/arrow navigation');
assert(homeHub.includes('/api/move/matching/readiness'), 'Homepage Move status must come from live readiness');
assert(homeHub.includes('Check availability'), 'Move card must use customer-friendly availability wording');
assert(homeHub.includes('matching_enabled'), 'Move card must consider matching readiness before presenting live availability');
assert(!homeHub.includes('Available now'), 'Homepage must not claim live Move availability from readiness settings alone');
assert(homeHub.includes('Auto') && homeHub.includes('Cab') && homeHub.includes('Send parcel') && homeHub.includes('Mini Truck'), 'Move card must explain the supported service types');
assert(!homeHub.includes('moveShortcuts'), 'Homepage must not duplicate Move with a second shortcut panel');
assert(!homeHub.includes('Pick a Move service'), 'Homepage must not duplicate the Move decision section');
assert(!homeHub.includes('About Zeshu'), 'Homepage must avoid a second long business explanation section');
assert(homeHub.includes('Opening soon'), 'Homepage Move launcher must clearly label services that are not ready');
assert(!homeHub.includes('Uber'), 'Homepage must not mention competitor brands');
assert(!homeHub.includes('compliance-gated'), 'Homepage must not expose internal compliance terminology');

assert(page.includes("t('Set your address')"), 'Homepage header must use a clear address action');
assert(page.includes('Shop in Jagtial'), 'Homepage must clearly separate local shopping from service discovery');
assert(page.includes('support@zeshu.in'), 'Homepage footer must expose customer support email');
assert(!page.includes('+91 79772 04533'), 'Homepage must not expose the customer support phone number in the shopping surface');
assert(page.includes('data-customer-department-nav="primary"'), 'Homepage must expose a clear customer department navigation row');
for (const department of ['Zeshu Fashion', 'Zeshu Pay', 'Zeshu Move', 'Customer Service', 'Sell on Zeshu']) {
  assert(page.includes(department), `Homepage department navigation missing ${department}`);
}
assert(page.includes('Based in Jagtial, Telangana'), 'Homepage footer must state business location');

assert(layout.includes('Telangana Move & Courier'), 'Site metadata must describe broader Zeshu service scope');
assert(layout.includes('India-wide digital services'), 'Site metadata must describe digital-service scope');

for (const languageSection of ['te:', 'hi:', 'ur:']) {
  assert(translations.includes(languageSection), `Translation dictionary missing ${languageSection}`);
}
for (const phrase of [
  '"Shop, move, send and manage everyday services with Zeshu."',
  '"What would you like to do?"',
  '"Clear availability"',
  '"Set your address"',
  '"Shop in Jagtial"',
  '"Customer support"',
]) {
  const occurrences = translations.split(phrase).length - 1;
  assert(occurrences >= 3, `Homepage translation coverage incomplete for ${phrase}`);
}

console.log('HOMEPAGE_BUSINESS_HUB_QA=PASS');
