// Admin-confirmed WABA webhook subscription repair. This never registers a
// phone, sends a WhatsApp message, alters templates or changes app credentials.
import {verifyOwnedWhatsappAccount} from './whatsapp-owned-waba-check';
import {checkWabaSubscription} from './whatsapp-waba-subscription-check';

const ID=/^[0-9]{5,32}$/;
const VERSION=/^v[0-9]+\.[0-9]+$/;
const SAFE_TOKEN=/^[A-Za-z0-9._~-]+$/;
const EXPECTED_PHONE='919505211212'; // Zeshu's owner-approved business number (digits only).

type RepairCode=
 | 'ALREADY_SUBSCRIBED'|'SUBSCRIBED'|'META_ACCEPTED_UNVERIFIED'
 | 'MISSING_SETTINGS'|'INVALID_CONFIG'|'PHONE_UNVERIFIED'
 | 'WRONG_PHONE_ACCOUNT'|'READ_CHECK_UNAVAILABLE'|'META_REFUSED'
 | 'META_UNAVAILABLE'|'SUBSCRIPTION_NOT_CONFIRMED';
export type SubscriptionRepairResult={
 status:RepairCode; subscribed:boolean|null;changed:boolean;
 reason?:string;httpStatus?:number;graphCode?:number;
};
const fail=(status:RepairCode,extra:Partial<SubscriptionRepairResult>={}):SubscriptionRepairResult=>
 ({status,subscribed:null,changed:false,...extra});
const obj=(x:unknown):Record<string,unknown>|null=>
 x!==null&&typeof x==='object'&&!Array.isArray(x)?x as Record<string,unknown>:null;
const digits=(x:string)=>x.replace(/[^0-9]/g,'');
const numericCode=(value:unknown):number|undefined=>
 typeof value==='number'&&Number.isSafeInteger(value)&&value>=0&&value<=100000?value:undefined;

export async function repairZeshuWabaSubscription(input:{
 token:string;wabaId:string;phoneNumberId:string;appId:string;graphVersion:string;
 verifyToken:string;appSecret:string;
 request?:typeof fetch;
}):Promise<SubscriptionRepairResult>{
 const {token,wabaId,phoneNumberId,appId,graphVersion,verifyToken,appSecret}=input;
 if(!token||!wabaId||!phoneNumberId||!appId||!graphVersion||!verifyToken||!appSecret)
  return fail('MISSING_SETTINGS');
 if(!SAFE_TOKEN.test(token)||token.length<20||token.length>10000
   ||!ID.test(wabaId)||!ID.test(phoneNumberId)||!ID.test(appId)||!VERSION.test(graphVersion))
  return fail('INVALID_CONFIG');

 // Before ANY write, Meta must verify the actual configured phone belongs to
 // the exact configured WABA. Duplicate WABAs called "Zeshu" are not interchangeable.
 const fetcher=input.request??fetch;
 const account=await verifyOwnedWhatsappAccount({
  token,wabaId,phoneNumberId,graphVersion,request:fetcher,
 });
 if(account.status!=='VERIFIED')
  return fail('PHONE_UNVERIFIED',{reason:account.status,
   ...(account.httpStatus?{httpStatus:account.httpStatus}:{}),
   ...(account.graphCode?{graphCode:account.graphCode}:{})});
 if(digits(account.displayPhoneNumber??'')!==EXPECTED_PHONE)
  return fail('WRONG_PHONE_ACCOUNT');

 const existing=await checkWabaSubscription({token,wabaId,appId,graphVersion,request:fetcher});
 if(existing.status==='SUBSCRIBED')
  return {status:'ALREADY_SUBSCRIBED',subscribed:true,changed:false};
 if(existing.status!=='NOT_SUBSCRIBED')
  return fail('READ_CHECK_UNAVAILABLE',{reason:existing.status,
    ...(existing.httpStatus?{httpStatus:existing.httpStatus}:{}),
    ...(existing.graphCode?{graphCode:existing.graphCode}:{})});

 // Only allowed mutation: Meta POST /<WABA-ID>/subscribed_apps.
 // This activates inbound callback delivery for the currently configured app;
 // it DOES NOT send messages, call /register, or configure the messages field.
 const url='https://graph.facebook.com/'+graphVersion+'/'+wabaId+'/subscribed_apps';
 let reply:Response;
 try{
  reply=await fetcher(url,{
   method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},
   body:'{}',cache:'no-store',redirect:'manual',signal:AbortSignal.timeout(10000),
  });
 }catch{return fail('META_UNAVAILABLE',{reason:'NETWORK_OR_TIMEOUT'});}
 if(!reply.ok){
  let graphCode:number|undefined;
  try{graphCode=numericCode(obj(obj(await reply.json())?.error)?.code);}catch{}
  return fail('META_REFUSED',{httpStatus:reply.status,
   ...(graphCode===undefined?{}:{graphCode})});
 }
 let accepted=false;
 try{accepted=obj(await reply.json())?.success===true;}catch{}
 if(!accepted)return fail('META_REFUSED',{reason:'INVALID_RESPONSE'});

 // Confirm exact app ID after POST. Never declare success solely from HTTP 200.
 const check=await checkWabaSubscription({token,wabaId,appId,graphVersion,request:fetcher});
 if(check.status==='SUBSCRIBED')
  return {status:'SUBSCRIBED',subscribed:true,changed:true};
 if(check.status==='NOT_SUBSCRIBED')
  return {status:'SUBSCRIPTION_NOT_CONFIRMED',subscribed:false,changed:true};
 return {status:'META_ACCEPTED_UNVERIFIED',subscribed:null,changed:true,
  reason:check.status};
}
