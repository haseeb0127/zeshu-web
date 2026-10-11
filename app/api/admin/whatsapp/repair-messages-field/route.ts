import {NextResponse} from 'next/server';
import {authorizeWhatsAppInboxAdmin,inboxNoStore} from '@/app/lib/whatsapp-inbox-auth';
import {getRuntimeEnvValue} from '@/app/lib/runtime-env';
import {repairExistingZeshuMessagesField} from '@/app/lib/whatsapp-messages-field-repair';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const out=(body:object,status=200)=>NextResponse.json(body,{status,headers:inboxNoStore});

/** Inbound-only webhook field change, never Meta messages or phone registration.
 * Requires private Zeshu admin and explicit, narrow owner confirmation.
 */
export async function POST(request:Request){
 const admin=await authorizeWhatsAppInboxAdmin(request);
 if(!admin)return out({error:'Zeshu administrator access required.'},403);
 const length=Number(request.headers.get('content-length')||0);
 if(length>1024||!request.headers.get('content-type')?.includes('application/json'))
  return out({error:'Invalid Meta webhook repair request.'},400);
 let data:Record<string,unknown>|null=null;
 try{const parsed:unknown=await request.json();
  if(parsed&&typeof parsed==='object'&&!Array.isArray(parsed))
   data=parsed as Record<string,unknown>;
 }catch{return out({error:'Invalid Meta webhook repair request.'},400);}
 if(data?.action!=='repair_existing_messages_field'
  ||data?.confirmInboundOnly!==true||data?.expectedPhoneLast4!=='1212')
  return out({error:'Confirm inbound-only repair for the existing Zeshu number.'},400);
 const keys=['WHATSAPP_ACCESS_TOKEN','WHATSAPP_BUSINESS_ACCOUNT_ID',
  'WHATSAPP_PHONE_NUMBER_ID','WHATSAPP_META_APP_ID','WHATSAPP_APP_SECRET',
  'WHATSAPP_GRAPH_API_VERSION','WHATSAPP_WEBHOOK_VERIFY_TOKEN'] as const;
 const values=await Promise.all(keys.map(x=>getRuntimeEnvValue(x)));
 const missing=keys.filter((_,i)=>!values[i]);
 if(missing.length)return out({status:'MISSING_SETTINGS',missing,changed:false,
   sendingEnabled:false},409);
 const result=await repairExistingZeshuMessagesField({
  token:values[0],wabaId:values[1],phoneNumberId:values[2],appId:values[3],
  appSecret:values[4],graphVersion:values[5],verifyToken:values[6],
 });
 const okay=['ALREADY_READY','REPAIRED'].includes(result.status);
 return out({...result,sendingEnabled:false,phoneRegistrationChanged:false,
  note:okay
   ? 'Existing Meta messages webhook field is subscribed. Inbound customer delivery and phone registration remain separately unverified; no customer message was sent.'
   : 'Existing Meta config was not safely repairable. No Zeshu customer send or phone registration action was attempted. Check provider status and inspect Meta directly before changing credentials.',
 },okay?200:409);
}
