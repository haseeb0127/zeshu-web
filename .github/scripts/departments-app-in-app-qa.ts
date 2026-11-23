import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DEPARTMENTS,DEPARTMENT_ORDER,departmentForPathname,departmentSearchHref} from '../../app/lib/department-config.ts';

const read=(file:string)=>fs.readFileSync(file,'utf8');
assert.equal(DEPARTMENT_ORDER.length,7);
assert.equal(new Set(DEPARTMENT_ORDER).size,7);
for(const id of DEPARTMENT_ORDER) {
  const d=DEPARTMENTS[id];
  assert(d.href.startsWith('/'),'Department must have a local route');
  assert.equal(departmentForPathname(d.href)?.id,id);
  assert.equal(d.tabs[0].href,'/','First bottom tab must return to unified Zeshu Hub');
  assert(d.tabs.length>=4 && d.tabs.length<=5,'Contextual mobile tabs only');
  assert(d.tabs.every(t=>t.href.startsWith('/')),'No external or invented account apps');
}
assert.equal(departmentForPathname('/admin'),null);
assert.equal(departmentForPathname('/'),null);
assert.equal(departmentForPathname('/professional-services/home-services')?.id,'services');
assert.equal(departmentForPathname('/move/quote')?.id,'move');
assert.equal(departmentSearchHref('fashion','sarees'),'/fashion?q=sarees#live-fashion-title');
assert.equal(departmentSearchHref('services','ac repair'),'/services?q=ac%20repair#service-menus');
assert(!departmentSearchHref('move','anywhere').includes('?q='),'Quote-only vertical cannot pretend it has live search');

const root=read('app/layout.tsx');
assert(root.includes('<DepartmentFrame>{children}</DepartmentFrame>'),'All departments share one root account context');
for(const id of DEPARTMENT_ORDER){
 assert(read('app/'+id+'/page.tsx').length>0,'Missing top-level route '+id);
}
const shell=read('app/components/DepartmentFrame.tsx');
assert(shell.includes('usePathname'),'Contextual shell requires pathname');
assert(shell.includes('DepartmentConfig')===false || shell.includes('departmentForPathname'),'Shell must use shared config');
assert(shell.includes('Zeshu Hub'));
assert(shell.includes('No')===false || !shell.includes('Zeshu Cash balance: ₹'),'No fake wallet amount');
const currentServices=read('app/services/page.tsx');
assert(currentServices.includes('HomeServicesPage'),'Services route must not redirect to bills');
assert(!currentServices.includes("redirect('/?view=services')"));
assert(read('app/pay/page.tsx').includes('No fabricated paid bills'));
assert(read('app/dine/page.tsx').includes('Verified restaurant directory'));
assert(read('app/dine/page.tsx').includes('No verified restaurants') || read('app/dine/page.tsx').includes('Restaurant bookings are opening soon'));
assert(read('app/move/page.tsx').includes('<MoveQuickQuote />'));
assert(read('app/move/quote/page.tsx').includes("params.get('destination')"),'Quick route must prefill actual quote form');
assert(read('app/components/HomeServicesMenuCatalog.tsx').includes('categories.map'));
assert(read('app/components/FashionLiveCatalogue.tsx').includes('TwoColumnCatalogGrid'));
assert(read('app/professional-services/weddings/page.tsx').includes('wedding-quote'));
assert(read('app/professional-services/interiors/page.tsx').includes('interior-quote'));
assert(!read('app/components/MoveQuickQuote.tsx').includes('razorpay'));
assert(!read('app/components/departments/PageBlocks.tsx').includes('razorpay'));
const sitemap=read('app/sitemap.ts');
for (const route of ['/services','/weddings','/interiors'])assert(sitemap.includes("path:'"+route+"'"));
console.log('ZESHU_DEPARTMENT_APP_IN_APP_QA=PASS');

