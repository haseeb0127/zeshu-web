import 'server-only';
import {createClient} from '@supabase/supabase-js';
import {getRuntimeSupabaseEnv} from '@/app/lib/runtime-env';

/** Called exclusively AFTER HMAC SHA256 verification and successful event ingestion.
 *  Records aggregate counts only; never writes customer numbers, tokens or payloads.
 */
export async function recordVerifiedWhatsappWebhook(matchingAccount:boolean,inboundCount:number):Promise<boolean>{
  if(!Number.isInteger(inboundCount)||inboundCount<0||inboundCount>50)return false;
  const env=await getRuntimeSupabaseEnv();
  if(!env.url||!env.serviceRoleKey)return false;
  try{
    const service=createClient(env.url,env.serviceRoleKey,{
      auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},
    });
    const {data,error}=await service.rpc('record_verified_whatsapp_webhook',{
      p_matches_account:matchingAccount,
      p_inbound_count:inboundCount,
    });
    return !error&&data===true;
  }catch{return false;}
}
