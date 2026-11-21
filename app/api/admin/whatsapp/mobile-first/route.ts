import {NextResponse} from 'next/server';
import {authorizeWhatsAppInboxAdmin,inboxNoStore} from '@/app/lib/whatsapp-inbox-auth';
import {getRuntimeEnvValue} from '@/app/lib/runtime-env';
import {deregisterZeshuCloudPhone} from '@/app/lib/whatsapp-cloud-phone-deregister';

export const runtime='nodejs';
export const dynamic='force-dynamic';

const output=(body:object,status=200)=>NextResponse.json(body,{status,headers:inboxNoStore});

/**
 * Dedicated mobile-first offboarding action, NOT deletion.
 * No automatic calls: a signed-in admin must intentionally confirm in UI.
 * Restricted to the zeshu.in production hostname.
 */
export async function POST(request:Request){
 const url=new URL(request.url);
 if(url.protocol!=='https:'||url.hostname!=='zeshu.in'
    ||request.headers.get('origin')!=='https://zeshu.in')
  return output({error:'Open this action from the official https://zeshu.in admin page.'},403);
 const admin=await authorizeWhatsAppInboxAdmin(request);
 if(!admin)return output({error:'Zeshu administrator sign-in required.'},403);
 if(!request.headers.get('content-type')?.toLowerCase().includes('application/json')
    ||Number(request.headers.get('content-length')||0)>1024)
  return output({error:'Invalid transition request.'},400);
 let body:Record<string,unknown>|null=null;
 try{
  const candidate:unknown=await request.json();
  if(candidate&&typeof candidate==='object'&&!Array.isArray(candidate))
   body=candidate as Record<string,unknown>;
 }catch{return output({error:'Invalid transition request.'},400);}
 if(body?.action!=='deregister_cloud_api_for_mobile_first'
   ||body?.confirmedPhone!=='+91 95052 11212'
   ||body?.acceptCustomerMessagingInterruption!==true
   ||body?.acceptNoOtpGuarantee!==true
   ||body?.preserveZeshuDataAndCredentials!==true)
  return output({error:'Confirm the exact phone number, outage and migration risks.'},400);

 // Never disconnect a production sender with active sending switched ON.
 if((await getRuntimeEnvValue('SUPPORT_WHATSAPP_SENDER_ENABLED')).toLowerCase()==='true')
  return output({status:'SENDER_STILL_ENABLED',changed:false,
    note:'Disable live outbound messaging in Cloudflare before offboarding.'},409);

 const names=['WHATSAPP_ACCESS_TOKEN','WHATSAPP_BUSINESS_ACCOUNT_ID',
  'WHATSAPP_PHONE_NUMBER_ID','WHATSAPP_GRAPH_API_VERSION'] as const;
 const values=await Promise.all(names.map(x=>getRuntimeEnvValue(x)));
 const missing=names.filter((_,i)=>!values[i]);
 if(missing.length)return output({
  status:'MISSING_SETTINGS',changed:false,missing,
  note:'Meta credentials remain unchanged. Enter any needed values only in Cloudflare.',
 },409);

 const result=await deregisterZeshuCloudPhone({
  token:values[0],wabaId:values[1],phoneNumberId:values[2],graphVersion:values[3],
 });
 // Intentionally no account deletion, database deletion, token rotation,
 // removal of the configured Zeshu phone number, or re-registration.
 console.info('[Zeshu WhatsApp mobile-first transition]',{
  actor:admin.userId,status:result.status,changed:result.changed,
  ...(result.graphCode===undefined?{}:{metaCode:result.graphCode}),
 });
 const success=result.status==='DEREGISTERED';
 return output({
  ...result,
  note:success
   ?'Meta accepted the Cloud API phone deregistration. Your Zeshu website and stored Inbox remain intact. Next register this SAME number in WhatsApp Business mobile. Do not attempt API re-registration until a supported Coexistence plan is established.'
   :'Cloud API deregistration was not confirmed. Do not delete the WABA or repeatedly try to re-register the number.',
 },success?200:409);
}
