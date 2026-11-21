import assert from 'node:assert/strict';
import sitemap from '../../app/sitemap.ts';

const urls=sitemap();
assert(Array.isArray(urls)&&urls.length>=10&&urls.length<=30,'Limit the public sitemap to verified evergreen routes');
const values=urls.map(x=>x.url);
assert(new Set(values).size===values.length,'Duplicate SEO URLs');
assert(values.includes('https://zeshu.in/'),'Homepage missing');
for(const pathname of ['/dine','/fashion','/help','/policies','/partners','/earn','/move','/pay']){
 assert(values.includes('https://zeshu.in'+pathname),`Public ${pathname} page missing`);
}
assert(!values.includes('https://zeshu.in/green'),'Paused Green must not be indexed');
for(const url of values){
 const p=new URL(url);
 assert.equal(p.origin,'https://zeshu.in');
 assert(!p.search&&!p.hash,'No query-string or fragments in sitemap');
 assert(!/(^|\/)(admin|api|checkout|cart|login|auth|account|orders|payment|orders|support-inbox|customer-chat|staging)(\/|$)/.test(p.pathname),
  `Do not expose internal/private paths: ${p.pathname}`);
 assert(!/\/product\//.test(p.pathname),'Never advertise unverified products as indexed');
 assert(!/\/restaurant\//.test(p.pathname),'Never advertise unverified restaurants as indexed');
}
console.log('PASS: Zeshu public SEO sitemap contains actual discovery routes and excludes checkout, accounts, admin and unverified listings.');
