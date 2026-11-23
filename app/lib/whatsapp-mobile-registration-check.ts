// Read-only WhatsApp Business mobile app / Cloud API status diagnosis.
// Never calls Meta registration, deregistration, phone OTP, or sending APIs.
import {verifyOwnedWhatsappAccount} from './whatsapp-owned-waba-check';

const META_ID=/^[0-9]{5,32}$/;
const VERSION=/^v[0-9]+\.[0-9]+$/;
const TOKEN=/^[A-Za-z0-9._~-]+$/;
const ZESHU_NUMBER='919505211212';
const rec=(x:unknown):Record<string,unknown>|null=>
  x!==null&&typeof x==='object'&&!Array.isArray(x)?x as Record<string,unknown>:null;
const safeCode=(x:unknown):number|undefined=>
  typeof x==='number'&&Number.isInteger(x)&&x>=0&&x<=100000?x:undefined;
type Status='COEXISTENCE_ACTIVE'|'CLOUD_API_ONLY'|'APP_INDICATED'|'NOT_CONFIRMED'|
 'OWNERSHIP_UNVERIFIED'|'WRONG_NUMBER'|'MISSING_SETTINGS'|'INVALID_CONFIG'|
 'META_UNAVAILABLE'|'UNSUPPORTED_FIELDS'|'TOKEN_UNAUTHORIZED';
type Reason='NETWORK_OR_TIMEOUT'|'HTTP_ERROR'|'INVALID_RESPONSE'|'REDIRECT'|'FIELD_UNAVAILABLE';
export type MobileRegistrationCheck={
  status:Status;isOnBusinessApp:boolean|null;platformType:'CLOUD_API'|'ON_PREMISE'|'NOT_APPLICABLE'|null;
  reason?:Reason;ownershipStatus?:string;providerHttpStatus?:number;providerErrorCode?:number;
};
const fail=(status:Status,extra:Partial<MobileRegistrationCheck>={}):MobileRegistrationCheck=>
  ({status,isOnBusinessApp:null,platformType:null,...extra});

/** Safely reports what Meta knows about Zeshu's EXISTING phone, not why an OTP is throttled. */
export async function checkZeshuMobileRegistration(args:{
  token:string;wabaId:string;phoneNumberId:string;graphVersion:string;request?:typeof fetch;
}):Promise<MobileRegistrationCheck>{
  const {token,wabaId,phoneNumberId,graphVersion}=args;
  if(!token||!wabaId||!phoneNumberId||!graphVersion)return fail('MISSING_SETTINGS');
  if(!META_ID.test(wabaId)||!META_ID.test(phoneNumberId)||!VERSION.test(graphVersion)
    ||token.length<20||token.length>10000||!TOKEN.test(token))return fail('INVALID_CONFIG');
  const request=args.request??fetch;
  const ownership=await verifyOwnedWhatsappAccount({...args,request});
  if(ownership.status!=='VERIFIED')
    return fail('OWNERSHIP_UNVERIFIED',{ownershipStatus:ownership.status,
      ...(ownership.httpStatus?{providerHttpStatus:ownership.httpStatus}:{}),
      ...(ownership.graphCode?{providerErrorCode:ownership.graphCode}:{})});
  if((ownership.displayPhoneNumber??'').replace(/\D/g,'')!==ZESHU_NUMBER)return fail('WRONG_NUMBER');
  const url=new URL('https://graph.facebook.com/'+graphVersion+'/'+phoneNumberId);
  url.searchParams.set('fields','is_on_biz_app,platform_type');
  let reply:Response;
  try{
    reply=await request(url.toString(),{
      method:'GET',headers:{Authorization:'Bearer '+token},
      cache:'no-store',redirect:'manual',signal:AbortSignal.timeout(10000),
    });
  }catch{return fail('META_UNAVAILABLE',{reason:'NETWORK_OR_TIMEOUT'});}
  if(reply.status>=300&&reply.status<400)
    return fail('META_UNAVAILABLE',{reason:'REDIRECT',providerHttpStatus:reply.status});
  if(!reply.ok){
    let code:number|undefined;
    try{code=safeCode(rec(rec(await reply.json())?.error)?.code);}catch{}
    const details={
      reason:'HTTP_ERROR' as const,providerHttpStatus:reply.status,
      ...(code===undefined?{}:{providerErrorCode:code}),
    };
    if(reply.status===401||reply.status===403||code===190||code===10||code===200)
      return fail('TOKEN_UNAUTHORIZED',details);
    if(reply.status===400 && code===100)return fail('UNSUPPORTED_FIELDS',details);
    return fail('META_UNAVAILABLE',details);
  }
  let data:Record<string,unknown>|null;
  try{data=rec(await reply.json());}catch{return fail('META_UNAVAILABLE',{reason:'INVALID_RESPONSE'});}
  if(data?.id!==phoneNumberId)return fail('META_UNAVAILABLE',{reason:'INVALID_RESPONSE'});
  const onApp=typeof data.is_on_biz_app==='boolean'?data.is_on_biz_app:null;
  const platform=data.platform_type==='CLOUD_API'||data.platform_type==='ON_PREMISE'
    ||data.platform_type==='NOT_APPLICABLE'?data.platform_type:null;
  if(onApp===null||platform===null)
    return fail('UNSUPPORTED_FIELDS',{reason:'FIELD_UNAVAILABLE'});
  let status:Status='NOT_CONFIRMED';
  if(platform==='CLOUD_API'&&onApp)status='COEXISTENCE_ACTIVE';
  else if(platform==='CLOUD_API'&&!onApp)status='CLOUD_API_ONLY';
  else if(onApp)status='APP_INDICATED';
  return {status,isOnBusinessApp:onApp,platformType:platform};
}
