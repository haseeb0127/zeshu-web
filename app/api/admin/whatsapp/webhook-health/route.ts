import {NextResponse} from 'next/server';
import {authorizeWhatsAppInboxAdmin,inboxNoStore} from '@/app/lib/whatsapp-inbox-auth';
import {getRuntimeEnvValue} from '@/app/lib/runtime-env';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const out=(body:object,status=200)=>NextResponse.json(body,{status,headers:inboxNoStore});

/** Read-only admin diagnostic: never returns secret values or raw callbacks. */
export async function GET(request:Request){
  const admin=await authorizeWhatsAppInboxAdmin(request);
  if(!admin)return out({error:'Admin sign-in required.'},403);
  const names=['WHATSAPP_WEBHOOK_VERIFY_TOKEN','WHATSAPP_APP_SECRET',
    'WHATSAPP_BUSINESS_ACCOUNT_ID','WHATSAPP_PHONE_NUMBER_ID'] as const;
  const values=await Promise.all(names.map(x=>getRuntimeEnvValue(x)));
  const [verifyToken,appSecret,wabaId,phoneId]=values;
  const {data:health,error}=await admin.service.from('whatsapp_webhook_health')
    .select('signed_callbacks,matching_account_callbacks,inbound_message_events,last_signed_at,last_matching_account_at,last_inbound_at')
    .eq('singleton_id',1).maybeSingle();
  if(error)return out({error:'Webhook health check is temporarily unavailable.'},503);
  return out({
    webhookCallbackUrl:'https://zeshu.in/api/webhooks/meta-whatsapp',
    webhookSecretsPresent:Boolean(verifyToken&&appSecret),
    accountIdentifiersPresent:Boolean(wabaId&&phoneId),
    lastSignedCallbackAt:health?.last_signed_at??null,
    lastMatchingAccountCallbackAt:health?.last_matching_account_at??null,
    lastInboundMessageAt:health?.last_inbound_at??null,
    observedSignedCallbacks:Number(health?.signed_callbacks||0),
    observedMatchingAccountCallbacks:Number(health?.matching_account_callbacks||0),
    observedInboundMessageEvents:Number(health?.inbound_message_events||0),
    subscriptionVerified:false,
    sendingEnabled:false,
    note:'No signed callbacks seen does not prove Meta is disconnected. To verify actual subscription, inspect Meta app WhatsApp configuration. Customer sends remain OFF.',
  });
}
