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
  'Shop, pay, move and get help with Zeshu.',
  'Shop in Jagtial',
  'Zeshu Fashion',
  'Zeshu Pay',
  'Zeshu Move',
  'Shop products',
  'Browse products',
  'Zeshu Weddings',
  'Zeshu Interiors',
]) {
  assert(homeHub.includes(phrase), `Homepage business hub missing customer-facing phrase: ${phrase}`);
}

for (const scope of ['Jagtial', 'Telangana', 'India']) {
  assert(homeHub.includes(scope), `Homepage business hub missing geographic scope: ${scope}`);
}

for (const href of ['/fashion']) {
  assert(homeHub.includes(`href="${href}"`), `Homepage business hub missing key customer destination: ${href}`);
}

for (const destination of ['/professional-services/weddings', '/professional-services/interiors']) {
  assert(homeHub.includes(destination), `Homepage carousel missing service destination: ${destination}`);
}

assert(homeHub.includes('"/move"'), 'Homepage carousel must link to Move');
assert(page.includes('data-category-strip="marketplace"'), 'Mobile homepage must use icon-led marketplace category discovery');
const productCard = read('app/components/ProductCard.tsx');
assert(productCard.includes('data-product-card="marketplace"'), 'Product cards must use the professional marketplace card system');
assert(homeHub.includes('snap-mandatory'), 'Homepage must expose the Zeshu self-promotion carousel');
assert(homeHub.includes('data-slide'), 'Homepage promo carousel must render slide markers');
assert(homeHub.includes('slides = ['), 'Homepage promo carousel must be driven by the compact customer slide set');
for (const promo of ['Shop in Jagtial', 'Zeshu Fashion', 'Zeshu Pay', 'Zeshu Move']) {
  assert(homeHub.includes(promo), `Homepage promo carousel missing ${promo}`);
}
assert(!homeHub.includes('title:t("Marketplace")'), 'Homepage must not duplicate Marketplace as a promo department');
assert(homeHub.includes('trackRef'), 'Homepage promo carousel must support manual swipe/arrow navigation');
assert(homeHub.includes('/api/move/matching/readiness'), 'Homepage Move status must come from live readiness');
assert(homeHub.includes('Check availability'), 'Move promotion must use customer-friendly availability wording');
assert(homeHub.includes('matching_enabled'), 'Move card must consider matching readiness before presenting live availability');
assert(!homeHub.includes('Available now'), 'Homepage must not claim live Move availability from readiness settings alone');
assert(homeHub.includes('See services'), 'Homepage Move promotion must use a neutral availability action');
assert(!homeHub.includes('Uber'), 'Homepage must not mention competitor brands');
assert(!homeHub.includes('compliance-gated'), 'Homepage must not expose internal compliance terminology');
assert(!homeHub.includes('Plan something bigger'), 'Homepage must not repeat professional services below the carousel');
assert(!homeHub.includes('For customers, drivers, sellers and brands'), 'Homepage must keep business onboarding out of the primary customer journey');

assert(page.includes("t('Set your address')"), 'Homepage header must use a clear address action');
assert(homeHub.includes('Shop in Jagtial') && page.includes('data-category-strip="marketplace"'), 'Homepage must preserve real shopping discovery without repeating the local hero');
assert(!page.includes('id="shop-jagtial-title"'), 'Homepage must not render a duplicate Shop in Jagtial heading');
assert(page.includes('support@zeshu.in'), 'Homepage footer must expose customer support email');
assert(!page.includes('+91 95052 11212'), 'Homepage must not expose the customer support phone number in the shopping surface');
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
  '"Set your address"',
  '"Shop in Jagtial"',
]) {
  const occurrences = translations.split(phrase).length - 1;
  assert(occurrences >= 3, `Homepage translation coverage incomplete for ${phrase}`);
}

console.log('HOMEPAGE_BUSINESS_HUB_QA=PASS');
