import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const manifest=readFileSync('app/manifest.ts','utf8');
const inbox=readFileSync('app/admin/whatsapp/inbox/page.tsx','utf8');
const sw=readFileSync('public/sw.js','utf8');
const route=readFileSync('app/api/admin/whatsapp/inbox/route.ts','utf8');

assert(manifest.includes("start_url: '/'"),'Keep the consumer Zeshu installed app entry point unchanged.');
assert(manifest.includes("scope: '/'"),'Preserve the existing installed Zeshu app scope.');
assert(manifest.includes("name: 'Zeshu WhatsApp Inbox'"),'Android app shortcut needs a helpful label.');
assert(manifest.includes("url: '/admin/whatsapp/inbox'"),'App shortcut must open the private admin Inbox.');
assert(!manifest.includes('access_token'),'Never place sessions or tokens in a public PWA manifest.');
assert(inbox.includes('Open Zeshu Inbox quickly on your phone'),'Mobile Inbox guide must be visible.');
assert(inbox.includes('long-press the installed Zeshu icon'),'Explain Android shortcut discovery.');
assert(inbox.includes('It is not native WhatsApp Business Coexistence.'),'Avoid misrepresenting a PWA as the native app.');
assert(inbox.includes("navigator.clipboard.writeText(url)"),'Provide a manual copy-link fallback.');
assert(inbox.includes("document.addEventListener('visibilitychange',onResume)"),'Refresh the private Inbox when a user returns.');
assert(inbox.includes('Push alerts and WhatsApp replies are not enabled.'),'Do not imply notifications or sending work.');
assert(sw.includes('NEVER cache HTML responses, API calls, user sessions'),'Never cache WhatsApp private message content.');
assert(!sw.includes('cache.put('),'No dynamic private caching in service worker.');
assert(route.includes('authorizeWhatsAppInboxAdmin(request)'),'Inbox must remain admin-only.');
console.log('PASS: Zeshu Inbox Android home-screen shortcut, foreground refresh and private API protection.');
