import {NextResponse} from 'next/server';
import {authorizeWhatsAppInboxAdmin,inboxNoStore} from '@/app/lib/whatsapp-inbox-auth';
import {getRuntimeEnvValue} from '@/app/lib/runtime-env';
import {sendOneWhatsAppServiceReply} from '@/app/lib/whatsapp-free-service-send';

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
  const [{data:lastInbound,error:inboundError},{count:recentCount,error:quotaError},token,phoneId,graphVersion,paused]=await Promise.all([
    auth.service.from('whatsapp_inbox_messages').select('sent_at')
      .eq('thread_id',threadId).eq('direction','INBOUND')
      .order('sent_at',{ascending:false}).limit(1).maybeSingle(),
    auth.service.from('whatsapp_inbox_reply_attempts').select('id',{head:true,count:'exact'})
      .gte('created_at',new Date(Date.now()-35*86400000).toISOString()),
    getRuntimeEnvValue('WHATSAPP_ACCESS_TOKEN'),getRuntimeEnvValue('WHATSAPP_PHONE_NUMBER_ID'),
    getRuntimeEnvValue('WHATSAPP_GRAPH_API_VERSION'),getRuntimeEnvValue('WHATSAPP_FREE_REPLIES_PAUSED'),
  ]);
  const recent=lastInbound?.sent_at && new Date(lastInbound.sent_at).getTime()>Date.now()-(23*60+50)*60000;
  const remaining=quotaError?0:Math.max(0,500-(recentCount||0));
  const eligible=Boolean(!inboundError&&!quotaError&&thread.status==='OPEN'
    &&/^91[6-9][0-9]{9}$/.test(thread.customer_wa_id)
    &&recent&&remaining>0&&token&&phoneId&&graphVersion&&paused!=='true');
  const {data:replies,error:replyError}=await auth.service.from('whatsapp_inbox_reply_attempts')
    .select('id,body,state,created_at').eq('thread_id',threadId)
    .order('created_at',{ascending:false}).limit(50);
  if(replyError)return out({error:'WhatsApp reply history is unavailable.'},503);
  return out({
    thread,messages:(messages.data||[]).reverse(),draft:draft.data||null,
    sentReplies:(replies||[]).reverse(),canSend:eligible,freeReplyRemaining:remaining,
    lastCustomerMessageAt:lastInbound?.sent_at??null,
    manualServiceOnly:true,templatesEnabled:false,promotionsEnabled:false,
    note:'Only human-approved non-template replies to recent inbound messages. Limited to 500 reserved replies in any 35-day period; Meta gives 1,000 free service messages per business number per month. Other senders may count toward that shared allowance.',
  });
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
  if(!payload||typeof payload.body!=='string')
    return out({error:'Invalid reply request.'},400);
  if(payload.action==='send_free_service_reply'){
    const params=payload as {action:string;body:string;requestId?:unknown;confirmedHumanReply?:unknown};
    if(params.confirmedHumanReply!==true||typeof params.requestId!=='string'||!uuid(params.requestId))
      return out({error:'A distinct confirmed manual customer-service reply is required.'},400);
    const body=params.body.trim();
    if(body.length<1||body.length>4000)return out({error:'Reply must have 1–4000 characters.'},400);
    const [token,phoneNumberId,graphVersion,paused]=await Promise.all([
      getRuntimeEnvValue('WHATSAPP_ACCESS_TOKEN'),
      getRuntimeEnvValue('WHATSAPP_PHONE_NUMBER_ID'),
      getRuntimeEnvValue('WHATSAPP_GRAPH_API_VERSION'),
      getRuntimeEnvValue('WHATSAPP_FREE_REPLIES_PAUSED'),
    ]);
    if(paused==='true'||!token||!phoneNumberId||!graphVersion)
      return out({error:'Manual WhatsApp support replies are currently unavailable.'},503);
    const {data:reservation,error:reserveError}=await auth.service.rpc('reserve_free_whatsapp_service_reply',{
      p_request_id:params.requestId,p_thread_id:threadId,p_admin_user_id:auth.userId,p_body:body,
    });
    if(reserveError)return out({error:'Could not verify the free-service reply allowance.'},503);
    const state=reservation?.status;
    if(state!=='RESERVED'){
      const messages:Record<string,string>={
        WINDOW_CLOSED:'The customer has not messaged within the last 23h50m. Replying would require a paid template, which is disabled.',
        FREE_LIMIT_REACHED:'The conservative free-support limit (500 reservations in any 35 days) is reached. Further sending is blocked.',
        NOT_ELIGIBLE:'This conversation cannot receive a free reply. Only customer-initiated Indian WhatsApp conversations are eligible.',
        ALREADY_RESERVED:'This reply request was already reserved. Check the conversation before attempting anything else.',
        DENIED:'This manual message is not authorized.',
      };
      return out({error:messages[state]||'Free reply cannot be authorized.'},409);
    }
    const attemptId=reservation?.attemptId;
    if(typeof attemptId!=='string'||!uuid(attemptId))
      return out({error:'Reply reservation was not confirmed. No message was sent.'},503);
    // Get destination solely from our private DB, never from the client.
    const {data:reserved,error:readError}=await auth.service.from('whatsapp_inbox_reply_attempts')
      .select('recipient_wa_id,body').eq('id',attemptId).maybeSingle();
    if(readError||!reserved)
      return out({error:'Reply reserved but cannot verify recipient; no message sent. Do not retry this request.'},503);
    const sent=await sendOneWhatsAppServiceReply({
      token,phoneNumberId,graphVersion,
      recipient:reserved.recipient_wa_id,body:reserved.body,
    });
    const metaState=sent.status==='ACCEPTED'?'ACCEPTED':sent.status==='REJECTED'?'REJECTED':'UNKNOWN';
    const {error:updateError}=await auth.service.from('whatsapp_inbox_reply_attempts')
      .update({state:metaState,provider_message_id:sent.status==='ACCEPTED'?sent.providerMessageId:null,
        completed_at:new Date().toISOString()}).eq('id',attemptId).eq('state','RESERVED');
    if(updateError)return out({
      status:'UNKNOWN',error:'The request was attempted, but its result could not be recorded. Do not retry or resend automatically.',
    },502);
    if(sent.status==='ACCEPTED')return out({
      status:'ACCEPTED',accepted:true,delivered:false,note:'Meta accepted the manual reply. Delivery has not yet been confirmed. No template or campaign was sent.',
    });
    if(sent.status==='REJECTED')return out({
      status:'REJECTED',error:'Meta refused this service reply. No automatic retry was made.',
      providerHttpStatus:sent.providerHttpStatus??null,providerErrorCode:sent.providerCode??null,
    },502);
    return out({status:'UNKNOWN',error:'Meta reply result is uncertain. Check Meta and do not resend blindly.'},502);
  }
  if(payload.action!=='save_draft')return out({error:'Only manual free replies or saving a draft are supported.'},400);
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
