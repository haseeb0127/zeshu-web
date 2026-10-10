import 'server-only';
import {createClient} from '@supabase/supabase-js';
import {getRuntimeSupabaseEnv} from '@/app/lib/runtime-env';

type Item={
  customerWaId:string;displayName:string;providerMessageId:string;
  messageType:'text'|'unsupported';body:string;sentAt:string;
};
const rec=(x:unknown):Record<string,unknown>|null=>x!==null&&typeof x==='object'&&!Array.isArray(x)?x as Record<string,unknown>:null;
const str=(x:unknown)=>typeof x==='string'?x:'';
const id=(x:unknown)=>/^[1-9][0-9]{6,14}$/.test(str(x));
const metaId=(x:unknown)=>/^[0-9]{5,32}$/.test(str(x));
const phoneMessage=(x:unknown)=>typeof x==='string'&&x.length>=5&&x.length<=512;

/** Parse only incoming WhatsApp text or safe placeholders; never store media URLs or raw payloads. */
export function parseInboundWhatsAppMessages(payload:unknown,wabaId:string,phoneNumberId:string):Item[]{
  if(!metaId(wabaId)||!metaId(phoneNumberId))return [];
  const obj=rec(payload);
  if(obj?.object!=='whatsapp_business_account'||!Array.isArray(obj.entry))return [];
  const items:Item[]=[];
  for(const entry of obj.entry){
    if(items.length>=50)break;
    const row=rec(entry);
    if(row?.id!==wabaId||!Array.isArray(row.changes))continue;
    for(const change of row.changes){
      if(items.length>=50)break;
      const ch=rec(change),value=rec(ch?.value),metadata=rec(value?.metadata);
      if(ch?.field!=='messages'||!value||metadata?.phone_number_id!==phoneNumberId||!Array.isArray(value.messages))continue;
      const contactNames=new Map<string,string>();
      if(Array.isArray(value.contacts)){
        for(const contact of value.contacts){
          const c=rec(contact),profile=rec(c?.profile);
          if(id(c?.wa_id))contactNames.set(str(c?.wa_id),str(profile?.name).slice(0,100));
        }
      }
      for(const message of value.messages){
        if(items.length>=50)break;
        const m=rec(message);
        if(!m||!id(m.from)||!phoneMessage(m.id))continue;
        const stamp=str(m.timestamp);
        if(!/^\d{10}$/.test(stamp))continue;
        const time=Number(stamp)*1000;
        if(!Number.isFinite(time)||time<Date.UTC(2020,0,1)||time>Date.now()+86400000)continue;
        const messageType=m.type==='text'?'text':'unsupported';
        const body=messageType==='text' ? str(rec(m.text)?.body).trim().slice(0,4000)
          : '[WhatsApp '+str(m.type||'media').replace(/[^a-z0-9_-]/gi,'').slice(0,24)+' message — not displayed]';
        if(!body)continue;
        items.push({
          customerWaId:str(m.from),displayName:contactNames.get(str(m.from))||'',
          providerMessageId:str(m.id),messageType,body,sentAt:new Date(time).toISOString(),
        });
      }
    }
  }
  return items;
}

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
