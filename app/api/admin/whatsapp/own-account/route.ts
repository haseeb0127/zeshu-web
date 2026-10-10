import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getRuntimeEnvValue, getRuntimeSupabaseEnv } from '@/app/lib/runtime-env';
import { verifyOwnedWhatsappAccount } from '@/app/lib/whatsapp-owned-waba-check';

export const runtime='nodejs';
export const dynamic='force-dynamic';
const json=(body:object,status=200)=>NextResponse.json(body,{status,headers:{
  'Cache-Control':'private, no-store, max-age=0',
}});

// Read-only status endpoint, available only to verified Zeshu admin.
// No provider secrets or raw Meta errors are ever returned to a client.
export async function GET(request:Request) {
  const authorization=request.headers.get('authorization')||'';
  const token=authorization.startsWith('Bearer ')?authorization.slice(7).trim():'';
  if(!token)return json({error:'Admin sign-in required.'},401);
  const env=await getRuntimeSupabaseEnv();
  if(!env.url||!env.anonKey||!env.serviceRoleKey)
    return json({error:'WhatsApp connection check is unavailable.'},503);
  const session=createClient(env.url,env.anonKey,{
    auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},
  });
  const {data:{user},error:sessionError}=await session.auth.getUser(token);
  if(sessionError||!user)return json({error:'Admin sign-in required.'},401);
  const service=createClient(env.url,env.serviceRoleKey,{
    auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},
  });
  const {data:admin,error:roleError}=await service.from('admin_roles')
    .select('user_id').eq('user_id',user.id).eq('role','admin').maybeSingle();
  if(roleError)return json({error:'WhatsApp connection check is unavailable.'},503);
  if(!admin)return json({error:'Admin access required.'},403);

  const names=['WHATSAPP_ACCESS_TOKEN','WHATSAPP_BUSINESS_ACCOUNT_ID',
    'WHATSAPP_PHONE_NUMBER_ID','WHATSAPP_GRAPH_API_VERSION'] as const;
  const values=await Promise.all(names.map(name=>getRuntimeEnvValue(name)));
  const missing=names.filter((name,index)=>!values[index]);
  if(missing.length)return json({
    status:'MISSING_SETTINGS',missing,
    verified:false,phoneNumber:null,verifiedName:null,
    senderEnabled:false,customerMessagingAuthorized:false,
    note:'Configure only your existing Zeshu business Cloud API credentials in Cloudflare; no Meta partner onboarding is necessary.',
  });
  const result=await verifyOwnedWhatsappAccount({
    token:values[0],wabaId:values[1],phoneNumberId:values[2],graphVersion:values[3],
  });
  return json({
    status:result.status,missing:[],verified:result.status==='VERIFIED',
    diagnosticReason:result.reason??null,
    providerHttpStatus:result.httpStatus??null,
    providerErrorCode:result.graphCode??null,
    phoneNumber:result.displayPhoneNumber,verifiedName:result.verifiedName,
    senderEnabled:false,customerMessagingAuthorized:false,
    note:'Read-only Meta ownership check only. No registration, app subscriptions, customer message or payment.',
  });
}
