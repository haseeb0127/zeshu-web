// Explicit owner-authorized Meta Cloud API deregistration for Zeshu's existing number.
// This is a destructive *phone registration* action, NOT removal of the WABA,
// Meta app, WhatsApp phone asset, customer data or credentials.
// No retries: an HTTP timeout after POST may mean Meta already completed the action.
import {checkZeshuMobileRegistration} from './whatsapp-mobile-registration-check';

const META_ID=/^[0-9]{5,32}$/;
const VERSION=/^v[0-9]+\.[0-9]+$/;
const ACCESS_TOKEN=/^[A-Za-z0-9._~-]+$/;

type DeregisterStatus=
 'DEREGISTERED'|'MISSING_SETTINGS'|'INVALID_CONFIG'|'PHONE_NOT_VERIFIED'|
 'NOT_CLOUD_API_ONLY'|'META_REFUSED'|'META_UNAVAILABLE'|'OUTCOME_UNCERTAIN';

export type DeregisterResult={
 status:DeregisterStatus;changed:boolean;reason?:string;
 providerHttpStatus?:number;providerErrorCode?:number;
};

const failure=(status:DeregisterStatus,details:Partial<DeregisterResult>={}):DeregisterResult=>
 ({status,changed:false,...details});
const record=(x:unknown):Record<string,unknown>|null=>
 x!==null&&typeof x==='object'&&!Array.isArray(x)?x as Record<string,unknown>:null;
const errorCode=(x:unknown):number|undefined=>
 typeof x==='number'&&Number.isSafeInteger(x)&&x>=0&&x<=100000?x:undefined;

/**
 * Fail closed unless Meta independently verifies:
 *  1. this phone ID belongs to the configured Zeshu WABA,
 *  2. its display number is +91 95052 11212,
 *  3. it is Cloud API-only, NOT Business App Coexistence.
 *
 * User must deliberately confirm the destructive action at the route layer.
 */
export async function deregisterZeshuCloudApiPhone(input:{
 token:string;wabaId:string;phoneNumberId:string;graphVersion:string;
 request?:typeof fetch;
}):Promise<DeregisterResult>{
 const {token,wabaId,phoneNumberId,graphVersion}=input;
 if(!token||!wabaId||!phoneNumberId||!graphVersion)return failure('MISSING_SETTINGS');
 if(!META_ID.test(wabaId)||!META_ID.test(phoneNumberId)||!VERSION.test(graphVersion)||
    token.length<20||token.length>10000||!ACCESS_TOKEN.test(token))
   return failure('INVALID_CONFIG');
 const request=input.request??fetch;
 const status=await checkZeshuMobileRegistration({
  token,wabaId,phoneNumberId,graphVersion,request,
 });
 if(status.status==='WRONG_NUMBER'||status.status==='OWNERSHIP_UNVERIFIED'
   ||status.status==='UNSUPPORTED_FIELDS'||status.status==='TOKEN_UNAUTHORIZED'){
  return failure('PHONE_NOT_VERIFIED',{reason:status.status,
   ...(status.providerHttpStatus?{providerHttpStatus:status.providerHttpStatus}:{}),
   ...(status.providerErrorCode?{providerErrorCode:status.providerErrorCode}:{})});
 }
 if(status.status!=='CLOUD_API_ONLY'){
  return failure(status.status==='META_UNAVAILABLE'?'META_UNAVAILABLE':'NOT_CLOUD_API_ONLY',
   {reason:status.status});
 }

 // This is the ONLY write. Never issue /{id}, /delete, /register, /messages
 // or /subscribed_apps requests as part of deregistration.
 // Meta's official request contains no JSON body and returns {success:true}.
 const url='https://graph.facebook.com/'+graphVersion+'/'+phoneNumberId+'/deregister';
 let reply:Response;
 try{
  reply=await request(url,{
   method:'POST',headers:{Authorization:'Bearer '+token},
   cache:'no-store',redirect:'manual',signal:AbortSignal.timeout(12000),
  });
 }catch{
  // Never repeat the write automatically. The first request may have worked.
  return failure('OUTCOME_UNCERTAIN',{reason:'NETWORK_OR_TIMEOUT_AFTER_POST'});
 }
 if(reply.status>=300&&reply.status<400)
  return failure('META_REFUSED',{reason:'META_REDIRECT',providerHttpStatus:reply.status});
 if(!reply.ok){
  let code:number|undefined;
  try{code=errorCode(record(record(await reply.json())?.error)?.code);}catch{}
  return failure('META_REFUSED',{providerHttpStatus:reply.status,
   ...(code===undefined?{}:{providerErrorCode:code})});
 }
 let accepted=false;
 try{accepted=record(await reply.json())?.success===true;}catch{}
 if(!accepted)return failure('OUTCOME_UNCERTAIN',{reason:'INVALID_META_SUCCESS_RESPONSE'});
 return {status:'DEREGISTERED',changed:true};
}
