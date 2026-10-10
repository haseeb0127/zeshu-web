import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';

// Native Node strips TS types but needs explicit extensions on relative imports;
// copy only pure helper sources to a temporary, isolated mocked-test directory.
const dir=mkdtempSync(join(tmpdir(),'zeshu-wa-repair-qa-'));
try {
 for(const name of ['whatsapp-owned-waba-check','whatsapp-waba-subscription-check']){
  writeFileSync(join(dir,name+'.ts'),readFileSync('app/lib/'+name+'.ts'));
 }
 const helper=readFileSync('app/lib/whatsapp-waba-subscription-repair.ts','utf8')
  .replace("from './whatsapp-owned-waba-check'","from './whatsapp-owned-waba-check.ts'")
  .replace("from './whatsapp-waba-subscription-check'","from './whatsapp-waba-subscription-check.ts'");
 writeFileSync(join(dir,'repair.ts'),helper);
 const {repairZeshuWabaSubscription}=await import(pathToFileURL(join(dir,'repair.ts')).href);
 const args={
  token:'EAAMockedBearerTokenNeverValid000000000',wabaId:'1234567890123',
  phoneNumberId:'9876543210987',appId:'555444333222111',
  graphVersion:'v23.0',verifyToken:'test-only-private-verify',
  appSecret:'test-only-app-secret',
 };
 const response=(obj,status=200)=>new Response(JSON.stringify(obj),{status});
 const mockProvider=({phone='+91 95052 11212',already=false,deny=false,failWrite=false}={})=>{
  const calls=[];
  let subscribed=already;
  const request=async(url,init)=>{
   calls.push({url,method:init.method,headers:init.headers});
   assert.equal(new URL(url).hostname,'graph.facebook.com');
   if(url.includes('/phone_numbers')){
    assert.equal(init.method,'GET');
    return response({data:[{id:args.phoneNumberId,display_phone_number:phone,verified_name:'Zeshu'}]});
   }
   if(url.includes('/subscribed_apps')){
    if(init.method==='GET'){
     if(deny)return response({error:{code:190,message:'PRIVATE META SECRET ERROR'}},401);
     return response({data:subscribed?[{whatsapp_business_api_data:{id:args.appId,name:'Zeshu Support'}}]:[]});
    }
    assert.equal(init.method,'POST');
    assert.equal(init.headers.Authorization,'Bearer '+args.token);
    assert.equal(init.redirect,'manual');
    assert.equal(init.body,'{}');
    if(failWrite)return response({error:{code:200,message:'PRIVATE PERMISSION ERROR'}},403);
    subscribed=true;
    return response({success:true});
   }
   throw Error('unexpected API action '+url);
  };
  return {request,calls};
 };
 const a=mockProvider();const created=await repairZeshuWabaSubscription({...args,request:a.request});
 assert.equal(created.status,'SUBSCRIBED');
 assert.equal(created.changed,true);
 assert.equal(created.subscribed,true);
 assert.equal(a.calls.filter(x=>x.method==='POST').length,1);
 assert.equal(a.calls.filter(x=>x.method==='GET').length,3);
 assert.ok(!JSON.stringify(created).includes(args.token));
 const b=mockProvider({already:true});
 const existing=await repairZeshuWabaSubscription({...args,request:b.request});
 assert.equal(existing.status,'ALREADY_SUBSCRIBED');
 assert.equal(existing.changed,false);
 assert.equal(b.calls.filter(x=>x.method==='POST').length,0);
 const c=mockProvider({phone:'+91 91234 56789'});
 const wrong=await repairZeshuWabaSubscription({...args,request:c.request});
 assert.equal(wrong.status,'WRONG_PHONE_ACCOUNT');
 assert.equal(c.calls.filter(x=>x.method==='POST').length,0);
 const d=mockProvider({deny:true});
 const unauthorized=await repairZeshuWabaSubscription({...args,request:d.request});
 assert.equal(unauthorized.status,'READ_CHECK_UNAVAILABLE');
 assert.equal(d.calls.filter(x=>x.method==='POST').length,0);
 assert.ok(!JSON.stringify(unauthorized).includes('PRIVATE META'));
 const e=mockProvider({failWrite:true});
 const refused=await repairZeshuWabaSubscription({...args,request:e.request});
 assert.equal(refused.status,'META_REFUSED');
 assert.equal(refused.graphCode,200);
 assert.ok(!JSON.stringify(refused).includes('PRIVATE PERMISSION'));
 const f=await repairZeshuWabaSubscription({...args,appSecret:''});
 assert.equal(f.status,'MISSING_SETTINGS');
 const server=readFileSync('app/api/admin/whatsapp/repair-subscription/route.ts','utf8');
 assert(server.includes('authorizeWhatsAppInboxAdmin(request)'),'Endpoint must require admin session');
 assert(server.includes("allowInboundWebhooks!==true"),'Require deliberate opt-in');
 assert(server.includes("expectedPhoneLast4!=='1212'"),'Require exact configured number confirmation');
 assert(server.includes('getRuntimeEnvValue(key)'),'Read existing secrets only from server');
 const inbox=readFileSync('app/admin/whatsapp/inbox/page.tsx','utf8');
 assert(inbox.includes('Check & repair incoming connection'),'Accessible button missing from mobile inbox');
 assert(inbox.includes('window.confirm'),'Require visual confirmation before metadata write');
 console.log('PASS: idempotent WhatsApp WABA inbound subscription, phone/account matching, no message sends and safe error responses.');
} finally {rmSync(dir,{recursive:true,force:true});}
