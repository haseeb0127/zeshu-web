import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {summarizeVerifiedWhatsAppShape} from '../../app/lib/whatsapp-webhook-shape.ts';
const dir=mkdtempSync(join(tmpdir(),'zeshu-meta-message-fields-'));
try{
 for(const name of ['whatsapp-owned-waba-check','whatsapp-waba-subscription-check']){
  writeFileSync(join(dir,name+'.ts'),readFileSync('app/lib/'+name+'.ts'));
 }
 const content=readFileSync('app/lib/whatsapp-messages-field-repair.ts','utf8')
  .replace("from './whatsapp-owned-waba-check'","from './whatsapp-owned-waba-check.ts'")
  .replace("from './whatsapp-waba-subscription-check'","from './whatsapp-waba-subscription-check.ts'");
 writeFileSync(join(dir,'repair.ts'),content);
 const {repairExistingZeshuMessagesField}=await import(pathToFileURL(join(dir,'repair.ts')).href);
 const args={token:'EAAReadOnlyTestSystemUserToken000000000',wabaId:'1234567890011',
  phoneNumberId:'9876543210011',appId:'111222333444555',
  appSecret:'MockAppSecretNeverReal12345678',graphVersion:'v23.0',
  verifyToken:'MockMetaVerifyTokenNeverReal'};
 const reply=data=>new Response(JSON.stringify(data),{status:200});
 function provider({phone='+91 95052 11212',callback='https://zeshu.in/api/webhooks/meta-whatsapp',
    fields=['message_template_status_update'],multiple=false,unsubscribed=false}={}){
  const calls=[];let savedFields=[...fields];
  const request=async(url,init)=>{
   const parsed=new URL(url);
   assert.equal(parsed.host,'graph.facebook.com');
   calls.push({url,method:init.method});
   assert.equal(init.redirect,'manual');
   if(parsed.pathname.includes('/phone_numbers')){
    assert.equal(init.method,'GET');
    return reply({data:[{id:args.phoneNumberId,display_phone_number:phone,verified_name:'Zeshu'}]});
   }
   if(parsed.pathname.endsWith('/subscribed_apps')){
    assert.equal(init.method,'GET');
    return reply({data:unsubscribed?[]:[{whatsapp_business_api_data:{id:args.appId}}]});
   }
   if(parsed.pathname.endsWith('/subscriptions')){
    assert.equal(init.headers.Authorization,'Bearer '+args.appId+'|'+args.appSecret);
    if(init.method==='GET'){
     const object={object:'whatsapp_business_account',active:true,
      callback_url:callback,fields:savedFields};
     return reply({data:multiple?[object,object]:[object]});
    }
    assert.equal(init.method,'POST');
    assert.equal(init.headers['Content-Type'],'application/x-www-form-urlencoded');
    const form=new URLSearchParams(init.body);
    assert.equal(form.get('object'),'whatsapp_business_account');
    assert.equal(form.get('callback_url'),'https://zeshu.in/api/webhooks/meta-whatsapp');
    assert.equal(form.get('verify_token'),args.verifyToken);
    assert.deepEqual(form.get('fields')?.split(','),['message_template_status_update','messages']);
    savedFields=form.get('fields')?.split(',')||[];
    return reply({success:true});
   }
   throw Error('Unknown URL '+url);
  };
  return {request,calls};
 }
 const a=provider(),fixed=await repairExistingZeshuMessagesField({...args,request:a.request});
 assert.equal(fixed.status,'REPAIRED');
 assert.equal(fixed.changed,true);
 assert.equal(fixed.messagesFieldSubscribed,true);
 assert.equal(a.calls.filter(x=>x.method==='POST').length,1);
 const b=provider({fields:['message_template_status_update','messages']});
 const already=await repairExistingZeshuMessagesField({...args,request:b.request});
 assert.equal(already.status,'ALREADY_READY');
 assert.equal(b.calls.filter(x=>x.method==='POST').length,0);
 const c=provider({callback:'https://other.example/wa'});
 assert.equal((await repairExistingZeshuMessagesField({...args,request:c.request})).status,'CALLBACK_MISMATCH');
 assert.equal(c.calls.filter(x=>x.method==='POST').length,0);
 const d=provider({phone:'+91 90000 00000'});
 assert.equal((await repairExistingZeshuMessagesField({...args,request:d.request})).status,'WRONG_PHONE');
 assert.equal(d.calls.filter(x=>x.method==='POST').length,0);
 const e=provider({unsubscribed:true});
 assert.equal((await repairExistingZeshuMessagesField({...args,request:e.request})).status,'WABA_NOT_SUBSCRIBED');
 assert.equal(e.calls.filter(x=>x.method==='POST').length,0);
 const f=provider({multiple:true});
 assert.equal((await repairExistingZeshuMessagesField({...args,request:f.request})).status,'MULTIPLE_SUBSCRIPTIONS');
 assert.equal(f.calls.filter(x=>x.method==='POST').length,0);
 assert.ok(!JSON.stringify(fixed).includes(args.token));
 assert.ok(!JSON.stringify(fixed).includes(args.appSecret));
 const raw={object:'whatsapp_business_account',entry:[{id:args.wabaId,changes:[{
  field:'messages',value:{metadata:{phone_number_id:args.phoneNumberId},
   messages:[{id:'private-payload-id',text:{body:'private text'}}]}}]}]};
 const shape=summarizeVerifiedWhatsAppShape(raw,args.wabaId,args.phoneNumberId);
 assert.deepEqual(shape,{messagesField:true,phoneMessages:true,candidateMessages:1});
 assert.ok(!JSON.stringify(shape).includes('private'));
 assert.deepEqual(summarizeVerifiedWhatsAppShape(raw,'8888888888888',args.phoneNumberId),
  {messagesField:false,phoneMessages:false,candidateMessages:0});
 const webhook=readFileSync('app/api/webhooks/meta-whatsapp/route.ts','utf8');
 assert(webhook.includes('hasValidMetaSignature(rawBody, signature, appSecret)'));
 assert(webhook.indexOf('hasValidMetaSignature(rawBody, signature, appSecret)')<
  webhook.indexOf('summarizeVerifiedWhatsAppShape(payload,wabaId,phoneId)'),
  'Only signed Meta payloads get aggregate classification.');
 const api=readFileSync('app/api/admin/whatsapp/repair-messages-field/route.ts','utf8');
 assert(api.includes('authorizeWhatsAppInboxAdmin(request)'));
 assert(api.includes("confirmInboundOnly!==true"));
 const inbox=readFileSync('app/admin/whatsapp/inbox/page.tsx','utf8');
 assert(inbox.includes('Verify & repair incoming messages field'));
 const migration=readFileSync('supabase/migrations/20261011063500_whatsapp_messages_field_shape_diagnostics.sql','utf8');
 assert(migration.includes('revoke all on function public.record_verified_whatsapp_message_shape'));
 assert(!migration.includes('grant execute on function public.record_verified_whatsapp_message_shape(boolean,boolean,integer,integer)\n to anon'));
 console.log('PASS: meta webhook messages field repair preserves existing subscriptions, checks exact phone/callback, denies unsafe writes and stores aggregate metrics only');
}finally{rmSync(dir,{recursive:true,force:true});}
