import {NextResponse} from 'next/server';
import {authorizeWhatsAppInboxAdmin,inboxNoStore} from '@/app/lib/whatsapp-inbox-auth';
import {getRuntimeEnvValue} from '@/app/lib/runtime-env';
import {checkZeshuMobileRegistration} from '@/app/lib/whatsapp-mobile-registration-check';

export const runtime='nodejs';
export const dynamic='force-dynamic';
const out=(body:object,status=200)=>NextResponse.json(body,{status,headers:inboxNoStore});

/** Admin-only read-only Meta GET for phone platform and Business App Coexistence. */
export async function GET(request:Request){
  const admin=await authorizeWhatsAppInboxAdmin(request);
  if(!admin)return out({error:'Zeshu administrator access required.'},403);
  const keys=['WHATSAPP_ACCESS_TOKEN','WHATSAPP_BUSINESS_ACCOUNT_ID',
    'WHATSAPP_PHONE_NUMBER_ID','WHATSAPP_GRAPH_API_VERSION'] as const;
  const values=await Promise.all(keys.map(key=>getRuntimeEnvValue(key)));
  const missing=keys.filter((_,i)=>!values[i]);
  if(missing.length)return out({
    status:'MISSING_SETTINGS',missing,isOnBusinessApp:null,platformType:null,
    messagingEnabled:false,otpRequested:false,
  });
  const check=await checkZeshuMobileRegistration({
    token:values[0],wabaId:values[1],phoneNumberId:values[2],graphVersion:values[3],
  });
  return out({
    ...check,missing:[],messagingEnabled:false,otpRequested:false,
    note:'Read-only Meta phone platform check. It cannot identify SMS OTP cooldown causes, prove account login eligibility, register a phone or send customer messages.',
  });
}
