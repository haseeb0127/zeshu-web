import assert from 'node:assert/strict';
import {checkWabaSubscription} from '../../app/lib/whatsapp-waba-subscription-check.ts';

const params={
  token:'EAATestOnlyTokenForUnitTests00000001',
  wabaId:'1234567890123',appId:'9876543210123',graphVersion:'v23.0',
};
let requests=0;
const subscribed=await checkWabaSubscription({...params,request:async(url,init)=>{
  requests++;
  assert.equal(init.method,'GET');
  assert.equal(init.headers.Authorization,'Bearer '+params.token);
  assert.equal(init.redirect,'manual');
  assert.equal(new URL(url).pathname,'/v23.0/'+params.wabaId+'/subscribed_apps');
  return new Response(JSON.stringify({data:[
    {whatsapp_business_api_data:{id:params.appId,name:'Zeshu Support'}},
  ]}),{status:200});
}});
assert.equal(subscribed.status,'SUBSCRIBED');
assert.equal(subscribed.subscribed,true);
assert.equal(requests,1);
assert.ok(!JSON.stringify(subscribed).includes(params.token));
assert.ok(!JSON.stringify(subscribed).includes(params.appId));

const otherApp=await checkWabaSubscription({...params,request:async()=>new Response(JSON.stringify({
  data:[{whatsapp_business_api_data:{id:'5555555555555',name:'Zeshu Support'}}],
}),{status:200})});
assert.equal(otherApp.status,'NOT_SUBSCRIBED');
assert.equal(otherApp.subscribed,false);

let pages=0;
const paged=await checkWabaSubscription({...params,request:async(url)=>{
  pages++;
  return new Response(JSON.stringify(pages===1
    ? {data:[{whatsapp_business_api_data:{id:'5555555555555'}}],paging:{next:'more',cursors:{after:'safecursor'}}}
    : {data:[{whatsapp_business_api_data:{id:params.appId}}]}),{status:200});
}});
assert.equal(paged.status,'SUBSCRIBED');
assert.equal(pages,2);

const missing=await checkWabaSubscription({...params,token:''});
assert.equal(missing.status,'MISSING_SETTINGS');
const malformed=await checkWabaSubscription({...params,token:'EAAInsecure\nHeader',request:async()=>{throw Error('should never fetch');}});
assert.equal(malformed.status,'INVALID_CONFIG');
const unauthorized=await checkWabaSubscription({...params,request:async()=>new Response(
  JSON.stringify({error:{code:190,message:'sensitive provider error',fbtrace_id:'private'}}),{status:400},
)});
assert.equal(unauthorized.status,'TOKEN_UNAUTHORIZED');
assert.equal(unauthorized.graphCode,190);
assert.ok(!JSON.stringify(unauthorized).includes('sensitive provider'));
assert.ok(!JSON.stringify(unauthorized).includes('private'));
const transport=await checkWabaSubscription({...params,request:async()=>{throw Error('internal connection details');}});
assert.equal(transport.status,'META_UNAVAILABLE');
assert.equal(transport.reason,'NETWORK_OR_TIMEOUT');
assert.ok(!JSON.stringify(transport).includes('internal connection'));
const redirect=await checkWabaSubscription({...params,request:async()=>new Response(null,{status:302,headers:{Location:'https://suspicious.example'}})});
assert.equal(redirect.status,'META_UNAVAILABLE');
assert.equal(redirect.reason,'REDIRECT');
assert.ok(!JSON.stringify(redirect).includes('suspicious.example'));
const invalid=await checkWabaSubscription({...params,request:async()=>new Response(JSON.stringify({ok:true}),{status:200})});
assert.equal(invalid.reason,'INVALID_RESPONSE');
console.log('PASS: read-only Meta WABA-to-app subscription diagnostics, strict ID matching, pagination and secret-safe errors.');
