/**
 * One-time mobile-first transition for Zeshu's EXISTING WhatsApp number.
 *
 * The only write is Meta's documented POST /{phone-number-id}/deregister.
 * This does NOT delete the WABA, templates, webhook configuration, number,
 * stored conversations or Zeshu's existing API code/credentials.
 *
 * Run only through explicitly confirmed, authenticated owner action in prod.
 */
import {checkZeshuMobileRegistration} from './whatsapp-mobile-registration-check';

const META_ID=/^[0-9]{5,32}$/;
const VERSION=/^v[0-9]+\.[0-9]+$/;
const TOKEN=/^[a-zA-Z0-9._~-]+$/;
const record=(x:unknown):Record<string,unknown>|null=>
 x!==null&&typeof x==='object'&&!Array.isArray(x)?x as Record<string,unknown>:null;
const code=(value:unknown):number|undefined=>
 typeof value==='number'&&Number.isSafeInteger(value)&&value>=0&&value<=100000?value:undefined;

export type DeregistrationStatus='DEREGISTERED'|'MISSING_SETTINGS'|'INVALID_CONFIG'|
 'OWNERSHIP_NOT_VERIFIED'|'NOT_CLOUD_API_ONLY'|'PHONE_STATUS_UNAVAILABLE'|
 'PHONE_NOT_CONNECTED'|'META_REFUSED'|'META_RESPONSE_UNKNOWN'|'META_REQUEST_OUTCOME_UNKNOWN';
export type DeregistrationResult={
 status:DeregistrationStatus;changed:boolean;httpStatus?:number;graphCode?:number;reason?:string;
};
const fail=(status:DeregistrationStatus,extra:Partial<DeregistrationResult>={}):DeregistrationResult=>
 ({status,changed:false,...extra});
const providerError=async(response:Response)=>{
 let graphCode:number|undefined;
 try{graphCode=code(record(record(await response.json())?.error)?.code);}catch{}
 return {httpStatus:response.status,...(graphCode===undefined?{}:{graphCode})};
};

export async function deregisterZeshuCloudPhone(input:{
 token:string;wabaId:string;phoneNumberId:string;graphVersion:string;
 request?:typeof fetch;
}):Promise<DeregistrationResult>{
 const {token,wabaId,phoneNumberId,graphVersion}=input;
 if(!token||!wabaId||!phoneNumberId||!graphVersion)return fail('MISSING_SETTINGS');
 if(!META_ID.test(wabaId)||!META_ID.test(phoneNumberId)||!VERSION.test(graphVersion)
    ||token.length<20||token.length>10000||!TOKEN.test(token))return fail('INVALID_CONFIG');
 const request=input.request??fetch;
 // The existing read-only check verifies both correct WABA membership and
 // the exact approved +91 95052 11212 E.164 number before this write.
 const owned=await checkZeshuMobileRegistration({...input,request});
 if(owned.status==='WRONG_NUMBER'||owned.status==='OWNERSHIP_UNVERIFIED')
  return fail('OWNERSHIP_NOT_VERIFIED',{reason:owned.status});
 if(owned.status!=='CLOUD_API_ONLY')
  return fail('NOT_CLOUD_API_ONLY',{reason:owned.status});

 // A stale Cloud API assignment is not proof that the number is registered.
 // Require a fresh CONNECTED state; block if Meta cannot return it.
 const url='https://graph.facebook.com/'+graphVersion+'/'+phoneNumberId;
 let current:Response;
 try{
  current=await request(url+'?fields=status',{
   method:'GET',headers:{Authorization:'Bearer '+token},
   cache:'no-store',redirect:'manual',signal:AbortSignal.timeout(10000),
  });
 }catch{return fail('PHONE_STATUS_UNAVAILABLE',{reason:'NETWORK_OR_TIMEOUT'});}
 if(!current.ok||current.status>=300&&current.status<400)
  return fail('PHONE_STATUS_UNAVAILABLE',await providerError(current));
 let state:Record<string,unknown>|null;
 try{state=record(await current.json());}catch{return fail('PHONE_STATUS_UNAVAILABLE',{reason:'INVALID_RESPONSE'});}
 if(state?.id!==phoneNumberId)return fail('PHONE_STATUS_UNAVAILABLE',{reason:'PHONE_ID_MISMATCH'});
 if(state.status!=='CONNECTED')return fail('PHONE_NOT_CONNECTED');

 // Exactly one write. Never retry POST if Meta times out: the change may
 // already have succeeded even when its acknowledgement was lost.
 let response:Response;
 try{
  response=await request(url+'/deregister',{
   method:'POST',headers:{Authorization:'Bearer '+token},
   cache:'no-store',redirect:'manual',signal:AbortSignal.timeout(12000),
  });
 }catch{return fail('META_REQUEST_OUTCOME_UNKNOWN',{reason:'NETWORK_OR_TIMEOUT'});}
 if(!response.ok||response.status>=300&&response.status<400)
  return fail('META_REFUSED',await providerError(response));
 let result:Record<string,unknown>|null;
 try{result=record(await response.json());}
 catch{return fail('META_RESPONSE_UNKNOWN',{reason:'INVALID_RESPONSE'});}
 if(result?.success!==true)return fail('META_RESPONSE_UNKNOWN',{reason:'NO_SUCCESS_ACK'});
 return {status:'DEREGISTERED',changed:true};
}
