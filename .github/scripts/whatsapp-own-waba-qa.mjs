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
const rejected=await verifyOwnedWhatsappAccount({...params,request:async()=>new Response(JSON.stringify({
  error:{code:100,message:'Never display this raw Meta message',fbtrace_id:'Never show trace ID'},
}),{status:400})});
const redirect=await verifyOwnedWhatsappAccount({...params,request:async(url,init)=>{
  assert.equal(init.redirect,'manual');
  return new Response(null,{status:302,headers:{Location:'https://unsafe.example/redirect'}});
}});
assert.equal(redirect.status,'META_UNAVAILABLE');
assert.equal(redirect.reason,'GRAPH_REDIRECT');
assert.equal(redirect.httpStatus,302);
assert.ok(!JSON.stringify(redirect).includes('unsafe.example'));
assert.equal(rejected.status,'META_UNAVAILABLE');
assert.equal(rejected.reason,'GRAPH_BAD_REQUEST');
assert.equal(rejected.httpStatus,400);
assert.equal(rejected.graphCode,100);
assert.ok(!JSON.stringify(rejected).includes('Never display'));
assert.ok(!JSON.stringify(rejected).includes('Never show'));
const invalidToken=await verifyOwnedWhatsappAccount({...params,request:async()=>new Response(JSON.stringify({
  error:{code:190,message:'token expired'},
}),{status:400})});
assert.equal(invalidToken.status,'TOKEN_UNAUTHORIZED');
const throttled=await verifyOwnedWhatsappAccount({...params,request:async()=>new Response('{}',{status:429})});
assert.equal(throttled.reason,'GRAPH_RATE_LIMITED');
const upstream=await verifyOwnedWhatsappAccount({...params,request:async()=>new Response('{}',{status:503})});
assert.equal(upstream.reason,'GRAPH_UPSTREAM_ERROR');
const unreachable=await verifyOwnedWhatsappAccount({...params,request:async()=>{throw Error('secret upstream details');}});
assert.equal(unreachable.reason,'NETWORK_OR_TIMEOUT');
assert.equal(unreachable.networkFailureKind,'FETCH_REJECTED');
assert.equal(unreachable.metaGraphReachable,false);
assert.equal(unreachable.attempts,2);
// Two failing authorized attempts followed by an unauthenticated reachability probe.
let tries=0;
const publicProbe=await verifyOwnedWhatsappAccount({...params,request:async(url,options)=>{
  tries++;
  if(url==='https://graph.facebook.com/'){
    assert.equal(options.headers,undefined);
    return new Response('{}',{status:400});
  }
  throw Error('safe simulated egress failure');
}});
assert.equal(publicProbe.reason,'NETWORK_OR_TIMEOUT');
assert.equal(publicProbe.metaGraphReachable,true);
assert.equal(publicProbe.networkFailureKind,'FETCH_REJECTED');
assert.equal(tries,3);
// A transient outbound error should recover on the second read-only GET.
let recoverCount=0;
const recovered=await verifyOwnedWhatsappAccount({...params,request:async(url)=>{
  recoverCount++;
  if(recoverCount===1)throw Error('first attempt dropped');
  return new Response(JSON.stringify({
    data:[{id:params.phoneNumberId,display_phone_number:'+91 95000 00000',verified_name:'Zeshu'}],
  }),{status:200});
}});
assert.equal(recovered.status,'VERIFIED');
assert.equal(recoverCount,2);
assert.ok(!JSON.stringify(unreachable).includes('secret upstream'));
const invalidPayload=await verifyOwnedWhatsappAccount({...params,request:async()=>new Response(JSON.stringify({success:false}),{status:200})});
assert.equal(invalidPayload.reason,'GRAPH_INVALID_RESPONSE');
assert.ok(!JSON.stringify(rejected).includes(params.token));
assert.ok(!JSON.stringify(result).includes(params.token));
console.log('PASS: first-party Cloud API verification with safe HTTP/Graph diagnostic enums, no leaked secrets or raw provider errors.');
