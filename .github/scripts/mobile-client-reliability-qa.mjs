import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  classifyClientFailure,groupClientRoute,safeClientDigest,shouldSelfHealChunk
} from '../../app/lib/client-failure-recovery.ts';
import {
  readBrowserStorage,writeBrowserStorage,removeBrowserStorage,parseStoredArray
} from '../../app/lib/safe-browser-storage.ts';

assert.equal(classifyClientFailure({name:'ChunkLoadError',message:'Loading chunk 12 failed'}),'asset');
assert.equal(classifyClientFailure({name:'TypeError',message:'Failed to fetch dynamically imported module'}),'asset');
assert.equal(classifyClientFailure({name:'SecurityError',message:'localStorage access denied'}),'storage');
assert.equal(classifyClientFailure({name:'Error',message:'Hydration failed'}),'hydration');
assert.equal(classifyClientFailure({name:'Error',message:'Something else'}),'render');
assert.equal(groupClientRoute('/'),'home');
assert.equal(groupClientRoute('/admin/payments?token=secret'),'admin');
assert.equal(groupClientRoute('/checkout'),'account');
assert.equal(groupClientRoute('/dine'),'dine');
assert.equal(groupClientRoute('/whatever/other-private-path'),'other');
assert.equal(safeClientDigest('12345'),'12345');
assert.equal(safeClientDigest('this could contain a payment id!'),null);
assert.equal(parseStoredArray('[{"id":"a"}]')?.length,1);
assert.equal(parseStoredArray('{"id":"a"}'),null);
assert.equal(parseStoredArray('{bad json'),null);
assert.equal(parseStoredArray(JSON.stringify(Array.from({length:501},(_,i)=>i))),null);

const oldWindow=globalThis.window,oldNavigator=globalThis.navigator;
const memory=new Map();
try{
  Object.defineProperty(globalThis,'window',{value:{
    localStorage:{
      getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,v),
      removeItem:k=>memory.delete(k),
    },
    sessionStorage:{
      getItem:k=>memory.get('session:'+k)??null,
      setItem:(k,v)=>memory.set('session:'+k,v),
      removeItem:k=>memory.delete('session:'+k),
    },
  },configurable:true,writable:true});
  Object.defineProperty(globalThis,'navigator',{value:{onLine:true},configurable:true,writable:true});
  assert.equal(readBrowserStorage('local','test'),null);
  assert.equal(writeBrowserStorage('local','test','OK'),true);
  assert.equal(readBrowserStorage('local','test'),'OK');
  assert.equal(removeBrowserStorage('local','test'),true);
  assert.equal(readBrowserStorage('local','test'),null);
  const chunk={name:'ChunkLoadError',message:'Loading chunk 15 failed'};
  assert.equal(shouldSelfHealChunk(chunk,'/fashion',10000000),true);
  assert.equal(shouldSelfHealChunk(chunk,'/fashion',10000015),false);
  assert.equal(shouldSelfHealChunk(chunk,'/fashion',10000000+31*60000),true);
  assert.equal(shouldSelfHealChunk(chunk,'/checkout',10000000),false);
  assert.equal(shouldSelfHealChunk(chunk,'/admin',10000000),false);
  assert.equal(shouldSelfHealChunk({name:'TypeError',message:'Something else'},'/',10000000),false);
  Object.defineProperty(globalThis,'window',{value:{
    localStorage:{getItem(){throw Error('blocked');},setItem(){throw Error('blocked');},removeItem(){throw Error('blocked');}},
    sessionStorage:{getItem(){throw Error('blocked');},setItem(){throw Error('blocked');},removeItem(){throw Error('blocked');}},
  },configurable:true,writable:true});
  assert.equal(readBrowserStorage('local','blocked'),null);
  assert.equal(writeBrowserStorage('local','blocked','x'),false);
  assert.equal(removeBrowserStorage('local','blocked'),false);
  assert.equal(shouldSelfHealChunk(chunk,'/',10000000),false,'Do not create an endless retry loop when storage is blocked');
}finally{
  if(oldWindow===undefined)delete globalThis.window;
  else Object.defineProperty(globalThis,'window',{value:oldWindow,configurable:true,writable:true});
  if(oldNavigator===undefined)delete globalThis.navigator;
  else Object.defineProperty(globalThis,'navigator',{value:oldNavigator,configurable:true,writable:true});
}

const storefront=readFileSync('app/page.tsx','utf8');
assert(storefront.includes('const [cartRestored, setCartRestored]'), 'Saved carts must hydrate before any persistence write');
assert(storefront.includes('if (!cartRestored) return;'), 'Initial empty cart must never overwrite saved cart');
assert(storefront.includes('parseStoredArray(rawCachedProducts, 500)'), 'Invalid product cache must not be rendered');
assert(storefront.includes("readBrowserStorage('session', PENDING_GROCERY_CONFIRMATION_KEY)"), 'Blockable payment recovery storage must be guarded');
assert(storefront.includes("writeBrowserStorage('session', PENDING_GROCERY_CONFIRMATION_KEY"), 'Captured payment recovery must never throw on blocked session storage');
assert(!storefront.includes('localStorage.setItem(CART_STORAGE_KEY'), 'Direct cart storage write is not safe');
assert(!storefront.includes("setProducts(JSON.parse(cachedProducts))"), 'Never render unvalidated JSON as a product array');

const root=readFileSync('app/global-error.tsx','utf8');
const page=readFileSync('app/error.tsx','utf8');
for(const s of [root,page]){
  assert(s.includes('reportClientFailure(error,path,'),'Browser errors must be reported without customer details');
  assert(s.includes('shouldSelfHealChunk(error,path)'),'Stale chunk should recover once');
  assert(!s.includes('console.error('),'Do not leak raw errors or payment/customer input to logs');
  assert(!s.includes('Reload Zeshu'),'No confusing duplicate reload prompt');
}
const api=readFileSync('app/api/diagnostics/client-failure/route.ts','utf8');
assert(api.includes("fetchSite!=='same-origin'"),'Reject cross-origin telemetry spam');
assert(api.includes('raw.length>500'),'Restrict diagnostic payloads');
assert(api.includes('console.warn('),'Log safe categories to Cloudflare observability');
assert(!api.includes('console.error('),'Never log raw error messages');
console.log('PASS: Android blocked storage, invalid cache, saved cart hydration, payment safety and bounded PWA client recovery.');
