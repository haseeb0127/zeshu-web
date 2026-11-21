import {NextResponse} from 'next/server';
import {authorizeWhatsAppInboxAdmin,inboxNoStore} from '@/app/lib/whatsapp-inbox-auth';
import {getRuntimeEnvValue} from '@/app/lib/runtime-env';
import {deregisterZeshuCloudApiPhone} from '@/app/lib/whatsapp-cloud-api-deregister';

export const runtime='nodejs';
export const dynamic='force-dynamic';
const json=(body:object,status=200)=>NextResponse.json(body,{status,headers:inboxNoStore});

/**
 * Explicit admin-only, destructive Cloud API phone deregistration.
 * This only releases +91 95052 11212 from Cloud API; it does not delete WABA,
 * remove a phone asset, request OTP, or enroll a mobile Business app.
 */
export async function POST(request:Request){
 const admin=await authorizeWhatsAppInboxAdmin(request);
 if(!admin)return json({error:'Zeshu administrator authentication required.'},403);
 if(!request.headers.get('content-type')?.startsWith('application/json')
   ||Number(request.headers.get('content-length')||0)>1024)
   return json({error:'Invalid request.'},400);
 // Bearer authorization protects CSRF; Origin additionally prevents cross-site
 // requests from other browser contexts that somehow acquired a token.
 const origin=request.headers.get('origin');
 if(origin&&origin!=='https://zeshu.in')
  return json({error:'Please perform this action from the official Zeshu admin website.'},403);
 let body:Record<string,unknown>|null=null;
 try{
  const payload:unknown=await request.json();
  if(payload&&typeof payload==='object'&&!Array.isArray(payload))
   body=payload as Record<string,unknown>;
 }catch{return json({error:'Invalid request.'},400);}
 if(body?.action!=='deregister_zeshu_cloud_api'
   ||body?.confirmPhrase!=='DEREGISTER +91 95052 11212'
   ||body?.acknowledgeIncomingStops!==true
   ||body?.acknowledgeOtpNotGuaranteed!==true)
   return json({error:'Confirm the exact number and consequences before deregistering.'},400);

 const keys=['WHATSAPP_ACCESS_TOKEN','WHATSAPP_BUSINESS_ACCOUNT_ID',
  'WHATSAPP_PHONE_NUMBER_ID','WHATSAPP_GRAPH_API_VERSION'] as const;
 const settings=await Promise.all(keys.map(key=>getRuntimeEnvValue(key)));
 const missing=keys.filter((_,i)=>!settings[i]);
 if(missing.length)return json({
  status:'MISSING_SETTINGS',changed:false,missing,
  note:'Existing Cloudflare credentials are missing; no changes were made.',
 },409);

 const result=await deregisterZeshuCloudApiPhone({
  token:settings[0],wabaId:settings[1],phoneNumberId:settings[2],
  graphVersion:settings[3],
 });
 const succeeded=result.status==='DEREGISTERED';
 return json({
  ...result,number:'••••1212',
  note:succeeded
    ?'Meta confirmed deregistration from WhatsApp Cloud API. This number can no longer send or receive through that Cloud API registration. Mobile-app OTP eligibility is not guaranteed.'
    :result.status==='OUTCOME_UNCERTAIN'
    ?'Meta response was unclear. Do not submit deregistration again until the phone registration state has been checked in Meta.'
    :'Deregistration did not receive Meta success confirmation. The server has not deliberately changed any other Zeshu settings.',
 },succeeded?200:409);
}
