import assert from 'node:assert/strict';
import { verifyOwnedWhatsappAccount } from '../../app/lib/whatsapp-owned-waba-check.ts';
const params={
  token:'EAATestOnlyTokenNotValidForMeta00001',
  wabaId:'1234567890123',phoneNumberId:'5432109876543',graphVersion:'v23.0',
};
let hits=[];
const mock=async(url,init)=>{
  hits.push({url:new URL(url),method:init.method,headers:init.headers});
  return new Response(JSON.stringify({
    data:[{id:params.phoneNumberId,display_phone_number:'+91 95000 00000',verified_name:'Zeshu'}],
  }),{status:200});
};
let result=await verifyOwnedWhatsappAccount({...params,request:mock});
assert.equal(result.status,'VERIFIED');
assert.equal(result.verifiedName,'Zeshu');
assert.equal(hits[0].url.hostname,'graph.facebook.com');
assert.equal(hits[0].method,'GET');
assert.equal(hits[0].headers.Authorization,'Bearer '+params.token);
assert.equal(hits[0].url.searchParams.get('fields'),'id,display_phone_number,verified_name');
const missing=await verifyOwnedWhatsappAccount({...params,token:''});
assert.equal(missing.status,'MISSING_SETTINGS');
const forbidden=await verifyOwnedWhatsappAccount({...params,request:async()=>new Response('{}',{status:403})});
assert.equal(forbidden.status,'TOKEN_UNAUTHORIZED');
const wrong=await verifyOwnedWhatsappAccount({...params,request:async()=>new Response(JSON.stringify({
  data:[{id:'9876543210000'}],
}),{status:200})});
assert.equal(wrong.status,'PHONE_NOT_IN_ACCOUNT');
const invalid=await verifyOwnedWhatsappAccount({...params,phoneNumberId:'unsafe'});
assert.equal(invalid.status,'INVALID_CONFIG');
assert.ok(!JSON.stringify(result).includes(params.token));
console.log('PASS: first-party Meta Cloud API read-only verification, restricted Graph endpoint, no leaked token.');
