import {NextResponse} from 'next/server';
import {authorizeWhatsAppInboxAdmin,inboxNoStore} from '@/app/lib/whatsapp-inbox-auth';
import {getRuntimeEnvValue} from '@/app/lib/runtime-env';
import {checkAppWebhookFieldStatus} from '@/app/lib/whatsapp-app-webhook-check';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const out=(body:object,status=200)=>NextResponse.json(body,{status,headers:inboxNoStore});

/** Private read-only Meta GET /{app-id}/subscriptions; no customer sends or writes. */
export async function GET(request:Request){
 const admin=await authorizeWhatsAppInboxAdmin(request);
 if(!admin)return out({error:'Zeshu administrator access required.'},403);
 const envNames=['WHATSAPP_META_APP_ID','WHATSAPP_APP_SECRET','WHATSAPP_GRAPH_API_VERSION'] as const;
 const vals=await Promise.all(envNames.map(x=>getRuntimeEnvValue(x)));
 const missing=envNames.filter((_,i)=>!vals[i]);
 if(missing.length)return out({status:'MISSING_SETTINGS',missing,
  messagesFieldSubscribed:null,callbackMatches:null,sendingEnabled:false});
 const status=await checkAppWebhookFieldStatus({
  appId:vals[0],appSecret:vals[1],graphVersion:vals[2],
 });
 return out({
  ...status,
  sendingEnabled:false,
  note:'Checks Meta app-level messages field and default callback. If the WABA overrides its callback, inspect that setting separately. It does not send a WhatsApp message, register the phone or prove a signed callback reached Zeshu.',
 });
}
