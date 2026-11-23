import {NextResponse} from 'next/server';
import {authorizeWhatsAppInboxAdmin,inboxNoStore} from '@/app/lib/whatsapp-inbox-auth';
import {getRuntimeEnvValue} from '@/app/lib/runtime-env';
import {repairZeshuWabaSubscription} from '@/app/lib/whatsapp-waba-subscription-repair';

export const runtime='nodejs';
export const dynamic='force-dynamic';
const out=(body:object,status=200)=>NextResponse.json(body,{status,headers:inboxNoStore});

/** Explicitly authorized one-time inbound-only subscription of Zeshu's existing WABA. */
export async function POST(request:Request){
 const admin=await authorizeWhatsAppInboxAdmin(request);
 if(!admin)return out({error:'Zeshu administrator access required.'},403);
 if(Number(request.headers.get('content-length')||0)>1024
   ||!request.headers.get('content-type')?.includes('application/json'))
  return out({error:'Invalid repair request.'},400);
 let payload:Record<string,unknown>|null=null;
 try{
  const value:unknown=await request.json();
  if(value&&typeof value==='object'&&!Array.isArray(value))payload=value as Record<string,unknown>;
 }catch{return out({error:'Invalid repair request.'},400);}
 if(payload?.action!=='subscribe_existing_waba'||payload?.allowInboundWebhooks!==true
   ||payload?.expectedPhoneLast4!=='1212')
  return out({error:'Confirm the existing Zeshu phone number and inbound-only change.'},400);
 const keys=[
  'WHATSAPP_ACCESS_TOKEN','WHATSAPP_BUSINESS_ACCOUNT_ID','WHATSAPP_PHONE_NUMBER_ID',
  'WHATSAPP_META_APP_ID','WHATSAPP_GRAPH_API_VERSION','WHATSAPP_WEBHOOK_VERIFY_TOKEN',
  'WHATSAPP_APP_SECRET',
 ] as const;
 const values=await Promise.all(keys.map(key=>getRuntimeEnvValue(key)));
 const missing=keys.filter((_,index)=>!values[index]);
 if(missing.length)return out({status:'MISSING_SETTINGS',missing,subscribed:null,
  changed:false,sendingEnabled:false,note:'Configure missing settings in Cloudflare, not in this form.'},409);
 const result=await repairZeshuWabaSubscription({
  token:values[0],wabaId:values[1],phoneNumberId:values[2],appId:values[3],
  graphVersion:values[4],verifyToken:values[5],appSecret:values[6],
 });
 const success=result.status==='ALREADY_SUBSCRIBED'||result.status==='SUBSCRIBED';
 return out({
  status:result.status,subscribed:result.subscribed,changed:result.changed,
  diagnosticReason:result.reason??null,providerHttpStatus:result.httpStatus??null,
  providerErrorCode:result.graphCode??null,
  messagesFieldVerified:false,signedCallbackVerified:false,sendingEnabled:false,
  note:success
   ? 'Correct Zeshu WABA app subscription is listed. Verify Meta app-level messages webhook field and wait for real signed callbacks. No customer messages were sent.'
   : 'Meta subscription could not be fully verified. No phone registration, token rotation or customer messaging was attempted. Do not retry repeatedly on a provider error.',
 },success?200:409);
}
