import 'server-only';
import {createClient} from '@supabase/supabase-js';
import {getRuntimeSupabaseEnv} from '@/app/lib/runtime-env';
import {type Item} from '@/app/lib/whatsapp-inbox-parser';
export {parseInboundWhatsAppMessages} from '@/app/lib/whatsapp-inbox-parser';

/** Service role only. Incoming webhook must be HMAC-verified before calling this. */
export async function ingestInboundWhatsAppMessages(items:Item[]):Promise<'ok'|'unavailable'|'failed'>{
  if(!items.length)return 'ok';
  const env=await getRuntimeSupabaseEnv();
  if(!env.url||!env.serviceRoleKey)return 'unavailable';
  const service=createClient(env.url,env.serviceRoleKey,{
    auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},
  });
  try{
    for(const item of items){
      const {data,error}=await service.rpc('ingest_whatsapp_inbox_message',{
        p_customer_wa_id:item.customerWaId,
        p_display_name:item.displayName,
        p_provider_message_id:item.providerMessageId,
        p_message_type:item.messageType,
        p_body:item.body,
        p_sent_at:item.sentAt,
      });
      if(error||data!==true)return 'failed';
    }
    return 'ok';
  }catch{return 'failed';}
}
