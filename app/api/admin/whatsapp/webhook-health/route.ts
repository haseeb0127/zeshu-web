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
    .select('signed_callbacks,matching_account_callbacks,inbound_message_events,last_signed_at,last_matching_account_at,last_inbound_at,messages_field_callbacks,phone_messages_callbacks,candidate_message_events,ignored_message_events,last_messages_field_at,last_phone_messages_at')
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
    observedMessagesFieldCallbacks:Number(health?.messages_field_callbacks||0),
    observedPhoneMessagesCallbacks:Number(health?.phone_messages_callbacks||0),
    observedCandidateMessageEvents:Number(health?.candidate_message_events||0),
    observedIgnoredMessageEvents:Number(health?.ignored_message_events||0),
    lastMessagesFieldCallbackAt:health?.last_messages_field_at??null,
    lastPhoneMessagesCallbackAt:health?.last_phone_messages_at??null,
    messageShapeTelemetrySince:'2026-10-11',
    subscriptionVerified:false,
    sendingEnabled:false,
    note:'Signed callbacks alone do not prove customer messages were received. Message-field shape counts start only after the October 11 instrumentation; past callbacks cannot be classified retroactively. Customer sends remain OFF.',
  });
}
