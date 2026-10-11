// Explicitly admin-confirmed repair of an EXISTING Meta WhatsApp app-level
// 'messages' field subscription. Never registers/deregisters a phone or sends.
import {verifyOwnedWhatsappAccount} from './whatsapp-owned-waba-check';
import {checkWabaSubscription} from './whatsapp-waba-subscription-check';
const ID=/^[0-9]{5,32}$/;
const VERSION=/^v[0-9]+\.[0-9]+$/;
const TOKEN=/^[a-zA-Z0-9._~-]+$/;
const CALLBACK='https://zeshu.in/api/webhooks/meta-whatsapp';
const EXPECTED='919505211212';
const obj=(x:unknown):Record<string,unknown>|null=>
 x!==null&&typeof x==='object'&&!Array.isArray(x)?x as Record<string,unknown>:null;
const number=(x:unknown)=>typeof x==='number'&&Number.isSafeInteger(x)&&x>=0&&x<=100000?x:null;
export type MessagesRepairStatus=
 'ALREADY_READY'|'REPAIRED'|'NOT_CONFIRMED'|'MISSING_SETTINGS'|'INVALID_CONFIG'|
 'WRONG_PHONE'|'OWNERSHIP_UNVERIFIED'|'WABA_NOT_SUBSCRIBED'|'WABA_UNVERIFIED'|
 'APP_SUBSCRIPTION_MISSING'|'APP_INACTIVE'|'CALLBACK_MISMATCH'|'FIELD_DATA_UNAVAILABLE'|
 'MULTIPLE_SUBSCRIPTIONS'|'META_UNAVAILABLE'|'TOKEN_UNAUTHORIZED'|'META_REFUSED';
export type MessagesRepairResult={status:MessagesRepairStatus;changed:boolean;
 messagesFieldSubscribed:boolean|null;reason?:string;providerHttpStatus?:number;providerErrorCode?:number};
const fail=(status:MessagesRepairStatus,details:Partial<MessagesRepairResult>={}):MessagesRepairResult=>
 ({status,changed:false,messagesFieldSubscribed:null,...details});
type Input={token:string;wabaId:string;phoneNumberId:string;appId:string;appSecret:string;
 graphVersion:string;verifyToken:string;request?:typeof fetch};
const fieldsOf=(x:unknown):string[]|null=>{
 if(!Array.isArray(x)||x.length>75)return null;
 const fields=x.map(e=>typeof e==='string'?e:obj(e)?.name);
 if(fields.some(f=>typeof f!=='string'||!/^[a-z][a-z0-9_]{1,80}$/.test(f)))
  return null;
 return [...new Set(fields as string[])];
};
async function readApp(input:Input,request:typeof fetch):Promise<
 {status:'OK';fields:string[];callback:string;active:boolean}|{status:'ERROR';error:MessagesRepairResult}>{
 let res:Response;
 try{res=await request('https://graph.facebook.com/'+input.graphVersion+'/'+input.appId+'/subscriptions',{
   method:'GET',headers:{Authorization:'Bearer '+input.appId+'|'+input.appSecret},
   cache:'no-store',redirect:'manual',signal:AbortSignal.timeout(10000),
 });}catch{return {status:'ERROR',error:fail('META_UNAVAILABLE',{reason:'NETWORK_OR_TIMEOUT'})};}
 if(res.status>=300&&res.status<400)
  return {status:'ERROR',error:fail('META_UNAVAILABLE',{reason:'REDIRECT',providerHttpStatus:res.status})};
 if(!res.ok){
  let code:null|number=null;
  try{code=number(obj(obj(await res.json())?.error)?.code);}catch{}
  return {status:'ERROR',error:fail(res.status===401||res.status===403||code===190||code===10||code===200
    ?'TOKEN_UNAUTHORIZED':'META_UNAVAILABLE',{
    reason:'HTTP_ERROR',providerHttpStatus:res.status,...(code===null?{}:{providerErrorCode:code}),
  })};
 }
 let raw:Record<string,unknown>|null=null;
 try{raw=obj(await res.json());}catch{}
 if(!Array.isArray(raw?.data))return {status:'ERROR',error:fail('FIELD_DATA_UNAVAILABLE')};
 const subs=raw.data.map(obj).filter(x=>x?.object==='whatsapp_business_account');
 if(!subs.length)return {status:'ERROR',error:fail('APP_SUBSCRIPTION_MISSING')};
 if(subs.length!==1)return {status:'ERROR',error:fail('MULTIPLE_SUBSCRIPTIONS')};
 const sub=subs[0]!;
 const fields=fieldsOf(sub.fields);
 if(!fields)return {status:'ERROR',error:fail('FIELD_DATA_UNAVAILABLE')};
 return {status:'OK',fields,callback:typeof sub.callback_url==='string'?sub.callback_url:'',
   active:sub.active!==false};
}
/** Narrow repair: app object already subscribed, callback exactly Zeshu's,
 *  keep ALL existing subscribed fields, append only 'messages'.
 *  Any ambiguous or mismatched configuration fails closed with no writes.
 */
export async function repairExistingZeshuMessagesField(input:Input):Promise<MessagesRepairResult>{
 const {token,wabaId,phoneNumberId,appId,appSecret,graphVersion,verifyToken}=input;
 if(!token||!wabaId||!phoneNumberId||!appId||!appSecret||!graphVersion||!verifyToken)
  return fail('MISSING_SETTINGS');
 if(!TOKEN.test(token)||token.length<20||token.length>10000||!ID.test(wabaId)
  ||!ID.test(phoneNumberId)||!ID.test(appId)||!VERSION.test(graphVersion)
  ||!/^[\x21-\x7e]{16,512}$/.test(appSecret)||verifyToken.length<12
  ||verifyToken.length>512||/[\x00-\x1f]/.test(verifyToken))return fail('INVALID_CONFIG');
 const request=input.request??fetch;
 const phone=await verifyOwnedWhatsappAccount({token,wabaId,phoneNumberId,graphVersion,request});
 if(phone.status!=='VERIFIED')
  return fail('OWNERSHIP_UNVERIFIED',{reason:phone.status,
   ...(phone.httpStatus?{providerHttpStatus:phone.httpStatus}:{}),
   ...(phone.graphCode?{providerErrorCode:phone.graphCode}:{})});
 if((phone.displayPhoneNumber??'').replace(/\D/g,'')!==EXPECTED)return fail('WRONG_PHONE');
 const sub=await checkWabaSubscription({token,wabaId,appId,graphVersion,request});
 if(sub.status!=='SUBSCRIBED')return fail(sub.status==='NOT_SUBSCRIBED'
   ?'WABA_NOT_SUBSCRIBED':'WABA_UNVERIFIED',{reason:sub.status,
   ...(sub.httpStatus?{providerHttpStatus:sub.httpStatus}:{}),
   ...(sub.graphCode?{providerErrorCode:sub.graphCode}:{})});
 const read=await readApp(input,request);
 if(read.status==='ERROR')return read.error;
 if(!read.active)return fail('APP_INACTIVE');
 if(read.callback.replace(/\/$/,'')!==CALLBACK)return fail('CALLBACK_MISMATCH');
 if(read.fields.includes('messages'))return {status:'ALREADY_READY',changed:false,messagesFieldSubscribed:true};
 if(read.fields.length>=75)return fail('FIELD_DATA_UNAVAILABLE');

 // Existing fields retained unchanged, messages added. This API call only
 // modifies the Meta app's webhook field subscription; no WhatsApp send action.
 const nextFields=[...read.fields,'messages'];
 const form=new URLSearchParams({
  object:'whatsapp_business_account',callback_url:CALLBACK,
  verify_token:verifyToken,fields:nextFields.join(','),
 });
 let response:Response;
 try{response=await request('https://graph.facebook.com/'+graphVersion+'/'+appId+'/subscriptions',{
  method:'POST',headers:{Authorization:'Bearer '+appId+'|'+appSecret,
   'Content-Type':'application/x-www-form-urlencoded'},
  body:form.toString(),cache:'no-store',redirect:'manual',signal:AbortSignal.timeout(12000),
 });}catch{return fail('META_UNAVAILABLE',{reason:'NETWORK_OR_TIMEOUT'});}
 if(!response.ok){
  let code:null|number=null;
  try{code=number(obj(obj(await response.json())?.error)?.code);}catch{}
  return fail('META_REFUSED',{providerHttpStatus:response.status,
   ...(code===null?{}:{providerErrorCode:code})});
 }
 let acknowledged=false;
 try{const data=obj(await response.json());acknowledged=data?.success===true||data?.success==='true';}catch{}
 if(!acknowledged)return fail('NOT_CONFIRMED',{reason:'UNEXPECTED_PROVIDER_RESPONSE'});
 const after=await readApp(input,request);
 if(after.status==='ERROR')return fail('NOT_CONFIRMED',{reason:after.error.status});
 if(after.active&&after.callback.replace(/\/$/,'')===CALLBACK
  &&nextFields.every(field=>after.fields.includes(field)))
  return {status:'REPAIRED',changed:true,messagesFieldSubscribed:true};
 return {status:'NOT_CONFIRMED',changed:true,messagesFieldSubscribed:false,
  reason:'PROVIDER_READBACK_MISMATCH'};
}
