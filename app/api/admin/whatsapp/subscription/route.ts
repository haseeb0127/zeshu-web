import {NextResponse} from 'next/server';
import {authorizeWhatsAppInboxAdmin,inboxNoStore} from '@/app/lib/whatsapp-inbox-auth';
import {getRuntimeEnvValue} from '@/app/lib/runtime-env';
import {checkWabaSubscription} from '@/app/lib/whatsapp-waba-subscription-check';

export const runtime='nodejs';
export const dynamic='force-dynamic';
const out=(body:object,status=200)=>NextResponse.json(body,{status,headers:inboxNoStore});

/** Admin-only, read-only Graph GET: this never changes Meta subscription or sends messages. */
export async function GET(request:Request){
  const admin=await authorizeWhatsAppInboxAdmin(request);
  if(!admin)return out({error:'Administrator access required.'},403);
  const names=['WHATSAPP_ACCESS_TOKEN','WHATSAPP_BUSINESS_ACCOUNT_ID',
    'WHATSAPP_META_APP_ID','WHATSAPP_GRAPH_API_VERSION'] as const;
  const values=await Promise.all(names.map(x=>getRuntimeEnvValue(x)));
  const missing=names.filter((_,i)=>!values[i]);
  if(missing.length)return out({
    status:'MISSING_SETTINGS',subscribed:null,missing,
    messagesFieldVerified:false,sendingEnabled:false,
    note:'Read-only check. App webhook messages field and native mobile Coexistence must be verified separately.',
  });
  const result=await checkWabaSubscription({
    token:values[0],wabaId:values[1],appId:values[2],graphVersion:values[3],
  });
  return out({
    status:result.status,subscribed:result.subscribed,missing:[],
    diagnosticReason:result.reason??null,providerHttpStatus:result.httpStatus??null,
    providerErrorCode:result.graphCode??null,
    messagesFieldVerified:false,sendingEnabled:false,
    note:'WABA app subscription only. This GET does not subscribe, register a phone or send messages.',
  });
}
