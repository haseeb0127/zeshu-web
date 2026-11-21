import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const src=(p)=>readFileSync(p,'utf8');
const hub=src('app/pay/page.tsx');
const main=src('app/page.tsx');
const promos=src('app/components/HomeBusinessHub.tsx');
const provider=src('app/api/process-recharge/route.ts');
const launch=src('docs/EXTERNAL_LAUNCH_GATES.md');
const green=src('app/green/page.tsx');
for(const category of ['mobile','electricity','dth','fastag','lpg','water','broadband','upi']){
  assert(hub.includes(`id:"${category}"`),`Missing Pay category: ${category}`);
  assert(main.includes(`id: '${category}'`),`Pay destination isn't recognized by storefront: ${category}`);
}
assert(hub.includes('Discovery only · No live transactions'),'Customer must be told there are no real payments');
assert(hub.includes('<div data-pay-launch-steps'), 'Pay launch steps should use a grid without automatic ordered-list counters');
assert(!hub.includes('<ol className="mt-4 grid'), 'Numbered text plus ordered-list counters duplicates step numbers');
assert(hub.includes('No payment or recharge will be completed'),'Avoid misleading recharge claims');
assert(hub.includes('is not a UPI payment app'),'Never suggest Zeshu has a UPI issuer/payments licence');
assert(hub.includes('t(item.label)'),'Localized service cards must use existing translations');
assert(hub.includes('lang==="ur"?"rtl":"ltr"'),'Urdu page must render RTL');
assert(hub.includes('/?view=services&service='),'Pay cards must take customer to existing service detail');
assert(hub.includes('zeshu:pay:service-intent'),'Pay navigation needs an explicit one-use PWA handoff');
assert(main.includes("payServiceIntent = window.sessionStorage.getItem('zeshu:pay:service-intent') === '1'"),'Storefront must inspect Pay handoff');
assert(main.includes("window.sessionStorage.removeItem('zeshu:pay:service-intent')"),'Pay handoff must be single-use');
assert(main.includes('isReload || (isStandalone && !payServiceIntent)'),'PWA refresh must not trap users in Pay');
assert(main.includes("if (requestedView !== 'services') return"),'Ignore unrelated URL parameters');
assert(promos.includes('s.action==="pay"?"/pay"'),'Hero must link to the dedicated Pay hub');
assert(promos.includes('href="/pay"'),'Hero Pay CTA must be a navigable link');
assert(main.includes('href="/pay"'),'Primary store navigation must link Pay');
assert(main.includes("href: '/pay'"),'Store search must discover Pay');
assert(hub.includes('href="/help"'),'Pay must provide a help route');
assert(!hub.includes('create-test-payment')&&!hub.includes('create-razorpay-order'),'Pay overview must not accept checkout');
assert(provider.includes("fulfillment: 'UNAVAILABLE'"),'Recharge fulfilment must remain disabled');
assert(provider.includes('{ status: 503 }'),'Recharge backend must reject real transactions');
assert(launch.includes('Do not turn on real bill-payment/recharge fulfilment until'),'Pay provider agreement/compliance gate must remain');
assert(green.includes('programme is not live yet'),'Tree pledge must not be falsely marketed as live');
console.log('PASS: multilingual Zeshu Pay discovery, honest provider gates, no payments, PWA deep-link safety and Green pledge.');
