import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';

const dir=mkdtempSync(join(tmpdir(),'zeshu-wa-mobile-qa-'));
try{
  writeFileSync(join(dir,'whatsapp-owned-waba-check.ts'),readFileSync('app/lib/whatsapp-owned-waba-check.ts'));
  const code=readFileSync('app/lib/whatsapp-mobile-registration-check.ts','utf8')
    .replace("from './whatsapp-owned-waba-check'","from './whatsapp-owned-waba-check.ts'");
  writeFileSync(join(dir,'mobile.ts'),code);
  const {checkZeshuMobileRegistration}=await import(pathToFileURL(join(dir,'mobile.ts')).href);
  const args={
    token:'EAAMockedReadOnlySystemUserToken000000001',
    wabaId:'123456789012345',phoneNumberId:'987654321012345',graphVersion:'v25.0',
  };
  const calls=[];
  const provider=({onApp=false,platform='CLOUD_API',phone='+91 95052 11212',error=0,wrongId=false}={})=>async(url,opts)=>{
    calls.push({url,method:opts.method,auth:opts.headers?.Authorization,redirect:opts.redirect});
    assert.equal(opts.method,'GET','Never create, register, remove or message');
    assert.equal(opts.redirect,'manual','Never redirect an auth header');
    assert.equal(opts.headers.Authorization,'Bearer '+args.token);
    assert.equal(new URL(url).hostname,'graph.facebook.com');
    if(url.includes('/phone_numbers')){
      return new Response(JSON.stringify({data:[{
        id:args.phoneNumberId,display_phone_number:phone,verified_name:'Zeshu',
      }]}),{status:200});
    }
    assert.equal(new URL(url).pathname,'/v25.0/'+args.phoneNumberId);
    assert.equal(new URL(url).searchParams.get('fields'),'is_on_biz_app,platform_type');
    if(error)return new Response(JSON.stringify({error:{code:error,message:'SECRET RAW PROVIDER MESSAGE'}}),{status:400});
    return new Response(JSON.stringify({id:wrongId?'111111111111111':args.phoneNumberId,
      is_on_biz_app:onApp,platform_type:platform}),{status:200});
  };
  const only=await checkZeshuMobileRegistration({...args,request:provider()});
  assert.equal(only.status,'CLOUD_API_ONLY');
  assert.equal(only.isOnBusinessApp,false);
  assert.equal(only.platformType,'CLOUD_API');
  assert.equal(calls.filter(x=>x.method!=='GET').length,0);
  assert.ok(!JSON.stringify(only).includes(args.token));
  assert.ok(!JSON.stringify(only).includes(args.phoneNumberId));
  const coexist=await checkZeshuMobileRegistration({...args,request:provider({onApp:true})});
  assert.equal(coexist.status,'COEXISTENCE_ACTIVE');
  const wrongPhone=await checkZeshuMobileRegistration({...args,request:provider({phone:'+91 99999 99999'})});
  assert.equal(wrongPhone.status,'WRONG_NUMBER');
  const unsupported=await checkZeshuMobileRegistration({...args,request:provider({error:100})});
  assert.equal(unsupported.status,'UNSUPPORTED_FIELDS');
  assert.ok(!JSON.stringify(unsupported).includes('SECRET RAW'));
  const notVerified=await checkZeshuMobileRegistration({...args,request:provider({wrongId:true})});
  assert.equal(notVerified.status,'META_UNAVAILABLE');
  const malformed=await checkZeshuMobileRegistration({...args,token:'Invalid\nInjected',request:async()=>{throw Error('should not fetch');}});
  assert.equal(malformed.status,'INVALID_CONFIG');
  const missing=await checkZeshuMobileRegistration({...args,token:''});
  assert.equal(missing.status,'MISSING_SETTINGS');
  const offline=await checkZeshuMobileRegistration({...args,request:async()=>{throw Error('private traceback');}});
  assert.equal(offline.status,'OWNERSHIP_UNVERIFIED');
  assert.ok(!JSON.stringify(offline).includes('private traceback'));
  const adminApi=readFileSync('app/api/admin/whatsapp/mobile-registration/route.ts','utf8');
  assert(adminApi.includes('authorizeWhatsAppInboxAdmin(request)'));
  assert(!adminApi.includes("method:'POST'"));
  const inbox=readFileSync('app/admin/whatsapp/inbox/page.tsx','utf8');
  assert(inbox.includes('Check WhatsApp mobile login & Cloud API status'));
  assert(inbox.includes('!loading&&webhook&&'),
    'Connection controls should not disappear as soon as a signed callback arrives.');
  assert(!inbox.includes('!loading&&webhook?.observedSignedCallbacks===0&&'),
    'Avoid hiding connection diagnostics after first signed callback.');
  console.log('PASS: safe Meta mobile Cloud API/coexistence diagnostic, account ownership, no OTP and always-visible inbox controls');
}finally{rmSync(dir,{recursive:true,force:true});}
