import { NextResponse } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getRuntimeEnvValue, getRuntimeSupabaseEnv } from '@/app/lib/runtime-env';
import {
  META_CONNECT_COOKIE, META_CONNECT_TTL_MS, makeMetaConnectChallenge,
  verifyMetaConnectChallenge, exchangeMetaSignupCode, encryptMetaToken, metaIdValid, graphVersionValid,
} from '@/app/lib/meta-embedded-signup';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const noStore = { 'Cache-Control': 'private, no-store, max-age=0' };
const respond = (body: object, status = 200) => NextResponse.json(body, {status,headers:noStore});
type Auth = {userId:string;service:SupabaseClient};
async function requireAdmin(request:Request):Promise<Auth|null> {
  const authorization = request.headers.get('authorization');
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  if (!token) return null;
  const env = await getRuntimeSupabaseEnv();
  if (!env.url || !env.anonKey || !env.serviceRoleKey) return null;
  const session = createClient(env.url,env.anonKey,{
    auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},
  });
  const {data:{user},error}=await session.auth.getUser(token);
  if (!user || error) return null;
  const service=createClient(env.url,env.serviceRoleKey,{
    auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},
  });
  const {data:admin,error:roleError}=await service.from('admin_roles')
    .select('user_id').eq('user_id',user.id).eq('role','admin').maybeSingle();
  if (roleError || !admin) return null;
  return {userId:user.id,service};
}
async function readMetaConfig(){
  const keys=['WHATSAPP_META_APP_ID','WHATSAPP_META_CONFIG_ID','WHATSAPP_APP_SECRET',
    'WHATSAPP_GRAPH_API_VERSION','WHATSAPP_META_TOKEN_ENCRYPTION_KEY'] as const;
  const vals=await Promise.all(keys.map(k=>getRuntimeEnvValue(k)));
  const [appId,configId,appSecret,graphVersion,storageKey]=vals;
  // A saved Cloudflare secret is not necessarily a binding of the active
  // deployed Worker version. Distinguish absence from invalid encoding.
  // Report only an enum to authenticated Zeshu admins, never secret contents.
  const decodedKeyLength=storageKey ? Buffer.from(storageKey,'base64').length : 0;
  const keyStatus: 'READY' | 'NOT_VISIBLE_TO_RUNTIME' | 'INVALID_BASE64_KEY' =
    !storageKey ? 'NOT_VISIBLE_TO_RUNTIME'
      : decodedKeyLength === 32
        ? 'READY' : 'INVALID_BASE64_KEY';
  return {appId,configId,appSecret,graphVersion,storageKey,keyStatus,
    ready:metaIdValid(appId) && metaIdValid(configId) && appSecret.length>=16
      && graphVersionValid(graphVersion) && keyStatus === 'READY'};
}
function sameOrigin(request:Request):boolean {
  const origin=request.headers.get('origin');
  const url=new URL(request.url);
  return origin===url.origin && url.protocol==='https:';
}

export async function GET(request:Request){
  const auth=await requireAdmin(request);
  if(!auth) return respond({error:'Admin authentication required.'},401);
  const config=await readMetaConfig();
  const {data:connection,error}=await auth.service.from('whatsapp_meta_connections')
    .select('waba_id,phone_number_id,display_phone_number,verified_name,connected_at,verified_at,sending_approved')
    .eq('singleton_id',1).maybeSingle();
  if(error) return respond({error:'Meta connection status is unavailable.'},503);
  const missing:string[]=[];
  if(!metaIdValid(config.appId)) missing.push('WHATSAPP_META_APP_ID');
  if(!metaIdValid(config.configId)) missing.push('WHATSAPP_META_CONFIG_ID');
  if(config.appSecret.length<16) missing.push('WHATSAPP_APP_SECRET');
  if(!graphVersionValid(config.graphVersion)) missing.push('WHATSAPP_GRAPH_API_VERSION');
  if(config.keyStatus !== 'READY') missing.push('WHATSAPP_META_TOKEN_ENCRYPTION_KEY');
  const payload:{
    configured:boolean;missingSetup:string[];appId:string|null;configId:string|null;
    graphVersion:string|null;nonce?:string;
    connection:object|null; safeToSend:boolean;keyDiagnostic:'READY'|'NOT_VISIBLE_TO_RUNTIME'|'INVALID_BASE64_KEY';
  } = {
    configured:config.ready,missingSetup:missing,
    appId:config.ready?config.appId:null,
    configId:config.ready?config.configId:null,
    graphVersion:config.ready?config.graphVersion:null,
    keyDiagnostic:config.keyStatus,
    connection:connection ? {
      wabaId:connection.waba_id,phoneNumberId:connection.phone_number_id,
      phoneNumber:connection.display_phone_number,verifiedName:connection.verified_name,
      connectedAt:connection.connected_at,verifiedAt:connection.verified_at,
    }:null,
    safeToSend:false,
  };
  const response=respond(payload);
  if(config.ready) {
    const {nonce,cookieValue}=makeMetaConnectChallenge(auth.userId,config.appSecret);
    payload.nonce=nonce;
    // Refresh response body so challenge matches the HttpOnly signed cookie.
    const withNonce=respond(payload);
    withNonce.cookies.set(META_CONNECT_COOKIE,cookieValue,{
      httpOnly:true,secure:true,sameSite:'strict',path:'/',maxAge:META_CONNECT_TTL_MS/1000,
    });
    return withNonce;
  }
  response.cookies.delete(META_CONNECT_COOKIE);
  return response;
}

export async function POST(request:Request){
  if(!sameOrigin(request)) return respond({error:'Invalid request origin.'},403);
  const auth=await requireAdmin(request);
  if(!auth) return respond({error:'Admin authentication required.'},401);
  const config=await readMetaConfig();
  if(!config.ready) return respond({error:'Configure your Meta Developer app securely in Cloudflare first.'},503);
  if(Number(request.headers.get('content-length')||'0')>8192) return respond({error:'Invalid request size.'},413);

  let body:Record<string,unknown>;
  try {
    const parsed:unknown=await request.json();
    if(!parsed || typeof parsed!=='object' || Array.isArray(parsed)) throw Error();
    body=parsed as Record<string,unknown>;
  }catch{ return respond({error:'Invalid request.'},400); }
  const signedCookie=request.headers.get('cookie')?.split(';').map(s=>s.trim())
    .find(s=>s.startsWith(META_CONNECT_COOKIE+'='))?.slice(META_CONNECT_COOKIE.length+1);
  if(!verifyMetaConnectChallenge(signedCookie,body.nonce,auth.userId,config.appSecret))
    return respond({error:'Connection session expired. Refresh WhatsApp HQ and try again.'},403);
  if(typeof body.code!=='string' || !metaIdValid(body.wabaId) || !metaIdValid(body.phoneNumberId))
    return respond({error:'Meta did not provide complete account authorization details.'},400);
  // The one-time code is exchanged only on the trusted server. Never return
  // Meta access tokens, phone list payloads or provider exceptions to browser.
  try {
    const verified=await exchangeMetaSignupCode({
      appId:config.appId,appSecret:config.appSecret,graphVersion:config.graphVersion,
      code:body.code,wabaId:body.wabaId,phoneNumberId:body.phoneNumberId,
    });
    const encrypted=encryptMetaToken(verified.token,config.storageKey);
    const {error}=await auth.service.from('whatsapp_meta_connections').upsert({
      singleton_id:1,waba_id:body.wabaId,phone_number_id:body.phoneNumberId,
      display_phone_number:verified.phoneNumber,verified_name:verified.verifiedName,
      meta_app_id:config.appId,graph_version:config.graphVersion,
      ...encrypted,connected_by:auth.userId,connected_at:new Date().toISOString(),
      verified_at:new Date().toISOString(),
      sending_approved:false,
    },{onConflict:'singleton_id'});
    if(error) return respond({error:'Meta authorization succeeded, but secure storage is unavailable. Please contact Zeshu support.'},503);
    const response=respond({connected:true,wabaId:body.wabaId,phoneNumberId:body.phoneNumberId,
      phoneNumber:verified.phoneNumber,verifiedName:verified.verifiedName,
      note:'Meta assets verified. Automated WhatsApp sending remains disabled.'});
    response.cookies.delete(META_CONNECT_COOKIE);
    return response;
  } catch {
    return respond({error:'Meta could not verify this authorization and phone number. Check the selected business and Meta app settings, then retry.'},409);
  }
}
