import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const health=readFileSync('app/api/admin/whatsapp/webhook-health/route.ts','utf8');
const inbox=readFileSync('app/admin/whatsapp/inbox/page.tsx','utf8');
const parser=readFileSync('app/lib/whatsapp-inbox-parser.ts','utf8');
assert(health.includes('authorizeWhatsAppInboxAdmin(request)'),
 'Diagnostic counts must be accessible only to admins.');
assert(health.includes(".select('message_type')"),
 'Count only message type, no inbound message bodies, phone numbers or media IDs.');
assert(health.includes(".eq('direction','INBOUND')"),
 'Text/non-text counters may not include drafts or outbound events.');
assert(health.includes('.limit(50)'),
 'Cap per-refresh diagnosis work in the private Inbox.');
assert(health.includes('recentInboundTypesAvailable:!recentError'),
 'An unavailable count must be distinguished from zero messages.');
assert(health.includes('recentInboundTextMessages:textCount'),
 'Show the existence of customer text messages separately.');
assert(health.includes('recentInboundNonTextMessages:otherCount'),
 'Show limitations when the event is media or unsupported.');
assert(inbox.includes('✅ Incoming WhatsApp webhook and Inbox are receiving messages'),
 'Do not claim incoming is not verified after signed messages are stored.');
assert(inbox.includes('webhook.observedInboundMessageEvents>0&&threads.length>0'),
 'Success must require both signed callback telemetry and an actual stored thread.');
assert(inbox.includes('Advanced Meta webhook and phone diagnostics'),
 'Keep Meta diagnostics accessible even when inbound works.');
assert(inbox.includes("open={webhook.observedInboundMessageEvents===0}"),
 'Avoid showing huge Meta repair controls over working conversations.');
assert(inbox.includes('attachment not retrieved')&&inbox.includes("m.message_type!=='text'"),
 'Explain the non-text placeholder instead of pretending to show the media.');
assert(inbox.includes('Reply drafts are saved privately and never sent.'),
 'No user should mistake drafts for real WhatsApp replies.');
assert(parser.includes('messageType===\'text\''),'Parser must continue classifying text safely.');
assert(!health.includes("select('*')"),'Diagnostic cannot fetch all private message fields.');
console.log('PASS: verified inbound status, privacy-safe non-text counts, mobile admin usability and draft-only messaging.');
