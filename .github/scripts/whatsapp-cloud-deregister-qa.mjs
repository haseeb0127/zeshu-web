import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';

const dir=mkdtempSync(join(tmpdir(),'zeshu-wa-deregister-'));
try{
 const ownership=readFileSync('app/lib/whatsapp-owned-waba-check.ts','utf8');
 const mobile=readFileSync('app/lib/whatsapp-mobile-registration-check.ts','utf8')
  .replace("from './whatsapp-owned-waba-check'","from './whatsapp-owned-waba-check.ts'");
 const dereg=readFileSync('app/lib/whatsapp-cloud-api-deregister.ts','utf8')
  .replace("from './whatsapp-mobile-registration-check'","from './whatsapp-mobile-registration-check.ts'");
 writeFileSync(join(dir,'whatsapp-owned-waba-check.ts'),ownership);
 writeFileSync(join(dir,'whatsapp-mobile-registration-check.ts'),mobile);
 writeFileSync(join(dir,'deregister.ts'),dereg);
 const {deregisterZeshuCloudApiPhone}=await import(pathToFileURL(join(dir,'deregister.ts')).href);
 const args={token:'EAATestOnlyNeverUseAsRealToken0123456789',wabaId:'1234567890123',
  phoneNumberId:'9876543210987',graphVersion:'v27.0'};
 const fake=(x,status=200)=>new Response(JSON.stringify(x),{status});
 const scenario=({phone='+91 95052 11212',onApp=false,platform='CLOUD_API',
    refused=false,throwOnPost=false,invalidSuccess=false}={})=>{
  const calls=[];
  const request=async(url,init)=>{
   calls.push({url,init});
   assert.equal(new URL(url).hostname,'graph.facebook.com');
   assert.equal(init.headers?.Authorization,'Bearer '+args.token);
   assert.equal(init.redirect,'manual');
   if(url.includes('/phone_numbers')){
    assert.equal(init.method,'GET');
    return fake({data:[{id:args.phoneNumberId,display_phone_number:phone,verified_name:'Zeshu'}]});
   }
   if(url.includes('?fields=')){
    assert.equal(init.method,'GET');
    return fake({id:args.phoneNumberId,is_on_biz_app:onApp,platform_type:platform});
   }
   assert.equal(url,'https://graph.facebook.com/v27.0/'+args.phoneNumberId+'/deregister');
   assert.equal(init.method,'POST');
   assert.equal(init.body,undefined,'Official Meta deregistration has no request body');
   assert.equal(init.redirect,'manual');
   if(throwOnPost)throw Error('PRIVATE PROVIDER DETAILS');
   if(refused)return fake({error:{code:200,message:'PRIVATE ACCOUNT DATA'}},403);
   if(invalidSuccess)return fake({success:false});
   return fake({success:true});
  };
  return {request,calls};
 };
 const successCase=scenario();
 const success=await deregisterZeshuCloudApiPhone({...args,request:successCase.request});
 assert.deepEqual(success,{status:'DEREGISTERED',changed:true});
 assert.equal(successCase.calls.filter(x=>x.init.method==='POST').length,1);
 assert.ok(!JSON.stringify(success).includes(args.token));
 assert.ok(!JSON.stringify(success).includes(args.phoneNumberId));
 const wrong=scenario({phone:'+91 99999 99999'});
 assert.equal((await deregisterZeshuCloudApiPhone({...args,request:wrong.request})).status,'PHONE_NOT_VERIFIED');
 assert.equal(wrong.calls.filter(x=>x.init.method==='POST').length,0);
 const coexist=scenario({onApp:true});
 assert.equal((await deregisterZeshuCloudApiPhone({...args,request:coexist.request})).status,'NOT_CLOUD_API_ONLY');
 assert.equal(coexist.calls.filter(x=>x.init.method==='POST').length,0);
 const invalidStatus=scenario({platform:'ON_PREMISE'});
 assert.equal((await deregisterZeshuCloudApiPhone({...args,request:invalidStatus.request})).status,'NOT_CLOUD_API_ONLY');
 assert.equal(invalidStatus.calls.filter(x=>x.init.method==='POST').length,0);
 const deny=scenario({refused:true});
 const denied=await deregisterZeshuCloudApiPhone({...args,request:deny.request});
 assert.equal(denied.status,'META_REFUSED');
 assert.equal(denied.providerErrorCode,200);
 assert.ok(!JSON.stringify(denied).includes('PRIVATE ACCOUNT DATA'));
 const timeout=scenario({throwOnPost:true});
 const unknown=await deregisterZeshuCloudApiPhone({...args,request:timeout.request});
 assert.equal(unknown.status,'OUTCOME_UNCERTAIN');
 assert.equal(timeout.calls.filter(x=>x.init.method==='POST').length,1);
 assert.ok(!JSON.stringify(unknown).includes('PRIVATE PROVIDER DETAILS'));
 const malformed=scenario();
 assert.equal((await deregisterZeshuCloudApiPhone({...args,token:'bad\ninjected',request:malformed.request})).status,'INVALID_CONFIG');
 assert.equal(malformed.calls.length,0);
 const badBody=scenario({invalidSuccess:true});
 assert.equal((await deregisterZeshuCloudApiPhone({...args,request:badBody.request})).status,'OUTCOME_UNCERTAIN');
 assert.equal(badBody.calls.filter(x=>x.init.method==='POST').length,1);
 const route=readFileSync('app/api/admin/whatsapp/deregister-cloud-api/route.ts','utf8');
 assert(route.includes('authorizeWhatsAppInboxAdmin(request)'), 'Auth guard required');
 assert(route.includes("confirmPhrase!=='DEREGISTER +91 95052 11212'"),'Exact number confirmation required');
 assert(route.includes('acknowledgeIncomingStops!==true'),'Inbound disruption confirmation required');
 assert(route.includes('acknowledgeOtpNotGuaranteed!==true'),'No OTP guarantee confirmation required');
 assert(route.includes("origin!=='https://zeshu.in'"),'Origin guard required');
 assert(!route.includes('getRuntimeEnvValue(\'SUPABASE_SERVICE_ROLE_KEY\')'),'No secret returned to browser');
 const page=readFileSync('app/admin/whatsapp/deregister/page.tsx','utf8');
 assert(page.includes('window.confirm('),'Final user consent required');
 assert(page.includes('phoneStatus?.status===\'CLOUD_API_ONLY\''),'Disable action if Meta cannot verify Cloud API-only');
 assert(page.includes('!acceptImpact||!acceptOtp'),'Both warnings must be acknowledged');
 assert(page.includes('DEREGISTER +91 95052 11212'),'Exact number must be retyped');
 const hq=readFileSync('app/admin/whatsapp/page.tsx','utf8');
 assert(hq.includes('href="/admin/whatsapp/deregister"'),'Deregistration action must be discoverable only in admin');
 console.log('PASS: Zeshu Cloud API deregistration guarded by owner admin auth, exact phone match, status recheck, explicit consent, one Meta POST and no token leaks.');
}finally{rmSync(dir,{recursive:true,force:true});}
