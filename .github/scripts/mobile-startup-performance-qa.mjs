import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const get=p=>readFileSync(p,'utf8');
const boot=get('app/components/PwaBoot.tsx');
const css=get('app/globals.css');
const sw=get('public/sw.js');
const home=get('app/page.tsx');
const native=get('android-shell/app/src/main/java/in/zeshu/staging/MainActivity.kt');
const art=get('app/components/GlossyArtwork.tsx');

assert(!boot.includes("addEventListener('load'"),'PWA splash must not wait for full image or analytics load');
assert(!boot.includes('document.readyState'), 'PWA splash must not depend on all images loading');
assert(boot.includes('overlay.classList.add(\'is-leaving\')'),'PWA logo should fade away instead of abruptly flashing');
assert(boot.includes("window.setTimeout(() => overlay.remove(), 1600)"),'PWA splash must never mask the storefront for several seconds');
assert(css.includes('zeshu-splash-safety-exit 250ms 1.5s forwards'),'CSS splash escape must release early even when JS is busy');
assert(native.includes('override fun onPageCommitVisible'), 'Android WebView should reveal only after trusted main-frame content commits');
assert(native.includes('850L -')===false && native.includes('250L -'),'Android startup must not artificially hold logo for 850ms');
assert(native.includes('STAGING_ORIGIN'),'Android APK must stay staging-only; do not move to production');
assert(native.includes('loadingFailed'),'Android startup must still show genuine network errors');
assert(sw.includes('navigationPreload.enable()'),'Installed PWA should request faster network-first navigations');
assert(sw.includes('event.preloadResponse || await fetch(request)'),'PWA navigation preload must preserve network fallback');
assert(sw.includes('request.mode !== \'navigate\''),'PWA must never intercept payment or private API GET requests');
assert(!sw.includes('cache.put('),'Do not store private HTML or customer sessions');
assert(home.includes("import dynamic from 'next/dynamic'"),'Dynamic module loading is required for optional map picker');
assert(home.includes("dynamic(() => import('./components/LocationSelector')"),'Map picker must be split into a separate client chunk');
assert(home.includes('locationSelectorOpen && <LocationSelector'),'Map picker JS must load only when opened');
assert(home.includes("void fetch('/api/marketplace/sellers'"),'Seller lookup must launch independently and without waiting for products');
assert(home.indexOf("void fetch('/api/marketplace/sellers'") <
  home.indexOf("await supabase.from('products').select('*')"),
  'Product and seller requests must remain concurrent on slow connections');
assert(!home.includes('await sellerPromise'),'Seller directory must not block product skeleton dismissal');
assert(home.includes('setProductsLoading(false);')&&home.includes('} finally {'),'Product loader must finish even if live product request fails');
assert(home.includes("response.ok ? response.json()"),'Failed seller HTTP responses must not block the storefront');
assert(home.includes('setMarketplaceSellers(Object.fromEntries'),'Seller response must still populate verified labels');
assert(home.includes("dynamic(() => import('./components/ReviewForm'))"),'Review UI must load only when needed');
assert(home.includes("dynamic(() => import('./components/OrderStatusTimeline'))"),'Tracking UI must load only when needed');
assert(home.includes("dynamic(() => import('./components/GreenOrderImpact'))"),'Order-specific green UI should be a deferred chunk');
assert(home.includes('window.requestIdleCallback(saveProducts'),'Optional product cache writes must not block initial Android paint');
assert(home.includes('setContentError(true);'),'Live catalog failures must not masquerade as verified inventory');
assert(home.includes('<Script id="razorpay-checkout-js"'),'Preserve existing checkout script and payment behavior');
assert(art.includes('loading={loading}') && art.includes('decoding="async"'),'Glossy posters must retain native lazy decoding');
console.log('PASS: faster PWA/Android launch, deferred map/reviews, nonblocking seller request, idle cache and unchanged payment / offline privacy.');
