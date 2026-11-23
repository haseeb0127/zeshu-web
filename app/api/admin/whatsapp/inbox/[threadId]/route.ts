import {NextResponse} from 'next/server';
import {authorizeWhatsAppInboxAdmin,inboxNoStore} from '@/app/lib/whatsapp-inbox-auth';

export const runtime='nodejs';
export const dynamic='force-dynamic';
type Context={params:Promise<{threadId:string}>};
const uuid=(value:string)=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const out=(body:object,status=200)=>NextResponse.json(body,{status,headers:inboxNoStore});

export async function GET(request:Request,context:Context){
  const auth=await authorizeWhatsAppInboxAdmin(request);
  if(!auth)return out({error:'Admin sign-in required.'},403);
  const {threadId}=await context.params;
  if(!uuid(threadId))return out({error:'Invalid thread.'},400);
  const {data:thread,error}=await auth.service.from('whatsapp_inbox_threads')
    .select('id,customer_wa_id,display_name,last_message_at,status')
    .eq('id',threadId).maybeSingle();
  if(error)return out({error:'WhatsApp inbox unavailable.'},503);
  if(!thread)return out({error:'Conversation not found.'},404);
  const [messages,draft]=await Promise.all([
    auth.service.from('whatsapp_inbox_messages')
      .select('id,direction,message_type,body,sent_at')
      .eq('thread_id',threadId).order('sent_at',{ascending:false}).limit(100),
    auth.service.from('whatsapp_inbox_drafts')
      .select('body,updated_at').eq('thread_id',threadId).maybeSingle(),
  ]);
  if(messages.error||draft.error)return out({error:'WhatsApp inbox unavailable.'},503);
  return out({thread,messages:(messages.data||[]).reverse(),draft:draft.data||null,canSend:false});
}

export async function POST(request:Request,context:Context){
  const origin=request.headers.get('origin');
  if(!origin||origin!==new URL(request.url).origin)return out({error:'Invalid origin.'},403);
  const auth=await authorizeWhatsAppInboxAdmin(request);
  if(!auth)return out({error:'Admin sign-in required.'},403);
  const {threadId}=await context.params;
  if(!uuid(threadId))return out({error:'Invalid thread.'},400);
  if(Number(request.headers.get('content-length')||'0')>10000)return out({error:'Draft too large.'},413);
  const payload=await request.json().catch(()=>null) as {action?:unknown;body?:unknown}|null;
  if(!payload||payload.action!=='save_draft'||typeof payload.body!=='string')
    return out({error:'Only saving an unsent draft is supported.'},400);
  const body=payload.body.trim();
  if(!body||body.length>4000)return out({error:'Draft must contain 1–4000 characters.'},400);
  const {data:thread,error:threadError}=await auth.service.from('whatsapp_inbox_threads')
    .select('id').eq('id',threadId).maybeSingle();
  if(threadError)return out({error:'Inbox temporarily unavailable.'},503);
  if(!thread)return out({error:'Conversation not found.'},404);
  const {error}=await auth.service.from('whatsapp_inbox_drafts').upsert({
    thread_id:threadId,body,updated_by:auth.userId,updated_at:new Date().toISOString(),
  },{onConflict:'thread_id'});
  if(error)return out({error:'Draft could not be saved.'},503);
  return out({saved:true,sent:false,note:'Draft saved privately. No WhatsApp message was sent.'});
}
