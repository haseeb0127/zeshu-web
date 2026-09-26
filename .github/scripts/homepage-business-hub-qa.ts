import fs from 'node:fs';

const read = (path: string) => fs.readFileSync(path, 'utf8');
const assert = (value: unknown, message: string) => {
  if (!value) throw new Error(message);
};

const homeHub = read('app/components/HomeBusinessHub.tsx');
const layout = read('app/layout.tsx');
const translations = read('app/components/CustomerLanguageProvider.tsx');

for (const phrase of [
  'Shop. Move. Send. Recharge. One Zeshu.',
  'What do you need today?',
  'Groceries & essentials',
  'Rides & courier',
  'Recharge & bills',
  'Marketplace',
  'Where Zeshu works',
  'Customers, drivers, sellers and brands — one platform',
]) {
  assert(homeHub.includes(phrase), `Homepage business hub missing customer-facing phrase: ${phrase}`);
}

for (const scope of ['Jagtial', 'Telangana', 'India']) {
  assert(homeHub.includes(scope), `Homepage business hub missing geographic scope: ${scope}`);
}

for (const href of ['/move', '/earn', '/partners', '/help', '/policies', '/app']) {
  assert(homeHub.includes(`href="${href}"`) || homeHub.includes(`href={${JSON.stringify(href)}`), `Homepage business hub missing key destination: ${href}`);
}

assert(homeHub.includes('/move/request?service=Auto'), 'Homepage must provide direct Move entry');
assert(homeHub.includes('/move/request?service=Bike%20Courier'), 'Homepage must provide direct courier entry');
assert(homeHub.includes('request_enabled'), 'Homepage Move status must come from live readiness');
assert(homeHub.includes('Opening soon'), 'Unavailable Move services must be labeled honestly');
assert(!homeHub.includes('Uber'), 'Homepage must not mention competitor brands');
assert(!homeHub.includes('compliance-gated'), 'Homepage must not expose internal compliance terminology');

assert(layout.includes('Telangana Move & Courier'), 'Site metadata must describe broader Zeshu service scope');
assert(layout.includes('India-wide digital services'), 'Site metadata must describe digital-service scope');

for (const languageSection of ['te:', 'hi:', 'ur:']) {
  assert(translations.includes(languageSection), `Translation dictionary missing ${languageSection}`);
}
for (const phrase of [
  '"Shop. Move. Send. Recharge. One Zeshu."',
  '"Where Zeshu works"',
  '"Sell on Zeshu"',
  '"Promote with Zeshu"',
]) {
  const occurrences = translations.split(phrase).length - 1;
  assert(occurrences >= 3, `Homepage translation coverage incomplete for ${phrase}`);
}

console.log('HOMEPAGE_BUSINESS_HUB_QA=PASS');
