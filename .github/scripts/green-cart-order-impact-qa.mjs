import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const file=p=>readFileSync(p,'utf8');
const page=file('app/page.tsx');
const impact=file('app/components/GreenOrderImpact.tsx');
const orderApi=file('app/api/green/orders/[id]/route.ts');
const green=file('app/green/page.tsx');
const docs=file('docs/ZESHU_GREEN_TREE_PROGRAM.md');
const translations=file('app/components/CustomerLanguageProvider.tsx');

// The owner paused Zeshu Green. Do not load even the informational legacy
// cart/order components; do not advertise trees with checkout or order status.
assert(!page.includes('<GreenOrderImpact'), 'Paused Green must not appear in cart or order status');
assert(!page.includes("dynamic(() => import('./components/GreenOrderImpact'))"), 'Do not load legacy Green UI');
assert(green.includes('Zeshu Green is on hold'), 'Old bookmarks must disclose owner pause');
assert(green.includes('There is no tree-planting benefit'), 'No tree promises on old URL');
assert(!green.includes("fetch('/api/green/impact'"), 'Archived Green page must not query or track customer orders');

// Preserve private historical records and authenticity checks, without making
// them visible or implying Green is active.
assert(impact.includes("fetch('/api/green/impact',{cache:'no-store'})"),'Historical component retains honest impact data');
assert(impact.includes('customerSupabase().auth.getSession()'),'Original private access guard is preserved');
assert(orderApi.includes('customer.auth.getUser(access)'));
assert(orderApi.includes(".eq('id',id).eq('user_id',user.id)"));
assert(orderApi.includes("db.from('zeshu_green_tree_commitments')"));
assert(orderApi.includes("status==='VERIFIED'"));
assert(orderApi.includes('feePaise:0'));
assert(!orderApi.includes('export async function POST'),'No public planting mutation');
assert(!orderApi.includes('insert(')&&!orderApi.includes('update('),'Historical status route remains read-only');
assert(docs.includes('Owner instruction: 21 November 2026'),'Owner pause documented explicitly');
assert(translations.split('"Payment receipt and order summary"').length>=4,'Payment receipt translations intact');
console.log('PASS: Paused Green removed from cart and order status; private historic tree proof and zero-fee safeguards retained.');
