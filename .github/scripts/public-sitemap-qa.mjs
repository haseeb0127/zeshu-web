import assert from 'node:assert/strict';
import sitemap from '../../app/sitemap.ts';
import robots from '../../app/robots.ts';
import fs from 'node:fs';

const urls=sitemap();
assert(Array.isArray(urls)&&urls.length>=10&&urls.length<=30,'Limit the public sitemap to verified evergreen routes');
const values=urls.map(x=>x.url);
assert(new Set(values).size===values.length,'Duplicate SEO URLs');
assert(values.includes('https://zeshu.in/'),'Homepage missing');
for(const pathname of ['/dine','/fashion','/help','/policies','/partners','/earn','/move','/pay','/services','/weddings','/interiors']){
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
const instructions=robots();
assert.equal(instructions.sitemap,'https://zeshu.in/sitemap.xml','Robots must advertise the canonical sitemap');
assert.equal(instructions.host,'https://zeshu.in','Robots must advertise the canonical host');
const rules=Array.isArray(instructions.rules)?instructions.rules:[instructions.rules];
const universal=rules.find(r=>r.userAgent==='*');
assert(universal,'All public crawlers must have a rule');
for(const path of ['/', '/_next/']){
 assert([universal.allow].flat().includes(path),`Public static assets must remain crawlable: ${path}`);
}
for(const path of ['/admin','/api','/checkout','/account']){
 assert([universal.disallow].flat().includes(path),`Sensitive route must be excluded: ${path}`);
}
assert(urls.length===15,'Only vetted public evergreen URLs should be indexed');
const layout=fs.readFileSync('app/layout.tsx','utf8');
assert(layout.includes('type="application/ld+json"'),'JSON-LD must be in the initial server layout');
assert(layout.includes('"@type": "Organization"') && layout.includes('"@type": "WebSite"'),'Site must have both verified structured-data types');
assert(layout.includes('JSON.stringify(organizationWebsiteJsonLd)'),'Use safe server-initial JSON-LD');
assert(fs.existsSync('public/zeshu-glossy-icon.png'),'Open Graph and Organization logo must be a real local asset');
for(const social of [
 'https://www.instagram.com/zeshu.in/',
 'https://www.facebook.com/people/Zeshu/61595101370222/',
 'https://www.youtube.com/channel/UCl7cbxE4FOSAOTigzePoHSA',
]){
 assert(layout.includes(social),'Use a verified Zeshu social identity: '+social);
}
assert(!layout.includes('instagram.com/zeshuin/'),'Incorrect example Instagram URL must not be claimed');
assert(!layout.includes('alternates: { canonical: "/" }'),'Never canonicalize every department to the homepage');
for(const route of ['/dine','/fashion','/pay','/move','/services','/weddings','/interiors']){
 assert(values.includes('https://zeshu.in'+route),'Required department in sitemap: '+route);
}
const lastModified=urls.filter(u=>u.lastModified);
assert(lastModified.length===8,'Only confirmed November 23 changed pages have last-modified values');
assert(lastModified.every(u=>new Date(u.lastModified).toISOString().startsWith('2026-11-22T18:30:00.000Z')),'Must not fabricate build-time lastmod values');
console.log('PASS: Zeshu public SEO sitemap contains actual discovery routes and excludes checkout, accounts, admin and unverified listings.');
console.log('ZESHU_ROBOTS_SCHEMA_SEO_QA=PASS');
