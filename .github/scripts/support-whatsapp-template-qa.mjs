import assert from 'node:assert/strict';
import { auditMetaSupportTemplates, requiresTemplateParameters } from '../../app/lib/support-whatsapp-template-readiness.ts';

assert.equal(requiresTemplateParameters([{type:'BODY',text:'Your request has been updated.'}]),false);
assert.equal(requiresTemplateParameters([{type:'BODY',text:'Hello {{1}}'}]),true);
assert.equal(requiresTemplateParameters([{type:'HEADER',format:'IMAGE'},{type:'BODY',text:'Notice'}]),true);

let requests=0;
const fetchMock=async (input,init) => {
  requests++;
  assert.equal(init.method,'GET');
  assert.equal(new URL(input).hostname,'graph.facebook.com');
  const templateName=new URL(input).searchParams.get('name');
  assert.ok(['zeshu_support_reply','zeshu_support_resolved'].includes(templateName));
  return {
    ok:true,
    json:async()=>({data:[{name:templateName,language:'en',category:'UTILITY',status:'APPROVED',components:[{type:'BODY',text:'We have an update about your support request.'}]}]}),
  };
};
const config={token:'valid-token-for-mock-only',wabaId:'1234567890123',graphVersion:'v23.0',
  replyName:'zeshu_support_reply',replyLanguage:'en',
  resolvedName:'zeshu_support_resolved',resolvedLanguage:'en',request:fetchMock};
const accepted=await auditMetaSupportTemplates(config);
assert.equal(accepted.verified,true);
assert.equal(requests,2);

const marketing=await auditMetaSupportTemplates({...config,request:async(input)=>({
  ok:true,json:async()=>({data:[{name:new URL(input).searchParams.get('name'),language:'en',category:'MARKETING',status:'APPROVED',components:[{type:'BODY',text:'Hi'}]}]})
})});
assert.equal(marketing.verified,false);
assert.equal(marketing.templates[0].status,'WRONG_CATEGORY');

const missing=await auditMetaSupportTemplates({...config,wabaId:''});
assert.equal(missing.configured,false);
assert.equal(missing.verified,false);
assert.equal(missing.templates[0].status,'MISSING_CONFIG');

const dynamic=await auditMetaSupportTemplates({...config,request:async(input)=>({
  ok:true,json:async()=>({data:[{name:new URL(input).searchParams.get('name'),language:'en',category:'UTILITY',status:'APPROVED',components:[{type:'BODY',text:'Hello {{1}}'}]}]})
})});
assert.equal(dynamic.verified,false);
assert.equal(dynamic.templates[0].status,'VARIABLES_UNSUPPORTED');
console.log('WhatsApp template audit: approved utility, marketing, variables, missing config checks passed.');
