import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sendOneWhatsAppServiceReply} from '../../app/lib/whatsapp-free-service-send.ts';

const args={
 token:'EAAFakeMetaTokenForUnitTestsOnly0000000',phoneNumberId:'1234567890123',
 graphVersion:'v25.0',recipient:'919501234567',body:'Hello customer',
};
let calls=0;
const approved=await sendOneWhatsAppServiceReply({...args,request:async(url,init)=>{
 calls++;
 assert.equal(url,'https://graph.facebook.com/v25.0/1234567890123/messages');
 assert.equal(init.method,'POST');
 assert.equal(init.redirect,'manual');
 assert.equal(init.headers.Authorization,'Bearer '+args.token);
 const data=JSON.parse(init.body);
 assert.deepEqual(data,{
  messaging_product:'whatsapp',recipient_type:'individual',to:args.recipient,
  type:'text',text:{preview_url:false,body:'Hello customer'},
 });
 assert.ok(!('template' in data));
 return new Response(JSON.stringify({messages:[{id:'wamid.UNIT-TEST'}]}),{status:200});
}});
assert.equal(approved.status,'ACCEPTED');
assert.equal(calls,1);
assert.ok(!JSON.stringify(approved).includes(args.token));

const missing=await sendOneWhatsAppServiceReply({...args,recipient:'447700900123',request:async()=>{throw Error('should not send outside India');}});
assert.equal(missing.status,'REJECTED');
const invalidToken=await sendOneWhatsAppServiceReply({...args,token:'EAAInvalid\nNewline',request:async()=>{throw Error('should not be called');}});
assert.equal(invalidToken.status,'REJECTED');
const rejected=await sendOneWhatsAppServiceReply({...args,request:async()=>new Response(
 JSON.stringify({error:{code:190,message:'PRIVATE_META_PROVIDER_ERROR'}}),{status:403},
)});
assert.equal(rejected.status,'REJECTED');
assert.equal(rejected.providerCode,190);
assert.ok(!JSON.stringify(rejected).includes('PRIVATE_META'));
const uncertain=await sendOneWhatsAppServiceReply({...args,request:async()=>{throw Error('PRIVATE_TRANSPORT_STACK');}});
assert.equal(uncertain.status,'UNKNOWN');
assert.ok(!JSON.stringify(uncertain).includes('PRIVATE_TRANSPORT_STACK'));
const badOk=await sendOneWhatsAppServiceReply({...args,request:async()=>new Response('{}',{status:200})});
assert.equal(badOk.status,'UNKNOWN');

const migration=readFileSync('supabase/migrations/20261027190000_whatsapp_free_support_replies.sql','utf8');
const route=readFileSync('app/api/admin/whatsapp/inbox/[threadId]/route.ts','utf8');
const ui=readFileSync('app/admin/whatsapp/inbox/page.tsx','utf8');
assert(migration.includes('pg_advisory_xact_lock'),'Reservations must serialize across admins.');
assert(migration.includes("interval '35 days'"),'Conservative quota must not reset at month boundary.');
assert(migration.includes('v_used>=500'),'Hard stop safely below 1,000 Meta shared free tier.');
assert(migration.includes("interval '23 hours 50 minutes'"),'Server must enforce a fresh inbound conversation.');
assert(migration.includes("recipient_wa_id text not null check(recipient_wa_id ~ '^91[6-9]"),'Only Indian WhatsApp numbers eligible.');
assert(migration.includes('enable row level security'),'Private reply records must have RLS.');
assert(migration.includes('to service_role'),'No public RPC execution.');
assert(route.includes('authorizeWhatsAppInboxAdmin(request)'),'Every reply requires Zeshu admin session.');
assert(route.includes("origin!==new URL(request.url).origin"),'All sends require correct Origin.');
assert(route.includes("payload.action==='send_free_service_reply'"),'Sending must be explicit.');
assert(route.includes('confirmedHumanReply!==true'),'No invisible auto-sends.');
assert(route.includes("'WHATSAPP_FREE_REPLIES_PAUSED'"),'Emergency pause switch needed.');
assert(route.includes('reserve_free_whatsapp_service_reply'),'Must reserve quota before external send.');
assert(route.includes("status:'UNKNOWN'"),'Network uncertainty must prevent retry.');
assert(!route.includes('message_template'),'No billable template in free replies path.');
assert(ui.includes('window.confirm'),'Manual per-message confirmation required.');
assert(ui.includes('Send free-tier support reply'),'Human-facing action must be clear.');
assert(ui.includes('Marketing, templates, bulk and automated messages stay OFF'),'Paid channels must not turn on silently.');
console.log('PASS: manual WhatsApp free-tier reply guard, 35-day quota, no templates/automation, cautious error semantics.');
