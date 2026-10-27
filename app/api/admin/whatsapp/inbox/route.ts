import {NextResponse} from 'next/server';
import {authorizeWhatsAppInboxAdmin,inboxNoStore} from '@/app/lib/whatsapp-inbox-auth';

export const runtime='nodejs';
export const dynamic='force-dynamic';

export async function GET(request:Request){
  const auth=await authorizeWhatsAppInboxAdmin(request);
  if(!auth)return NextResponse.json({error:'Administrator sign-in required.'},{status:403,headers:inboxNoStore});
  const {data,error}=await auth.service.from('whatsapp_inbox_threads')
    .select('id,customer_wa_id,display_name,last_message_preview,last_message_at,status,updated_at')
    .order('last_message_at',{ascending:false,nullsFirst:false}).limit(75);
  if(error)return NextResponse.json({error:'WhatsApp inbox is temporarily unavailable.'},{status:503,headers:inboxNoStore});
  return NextResponse.json({
    conversations:data||[],
    manualSupportRepliesAvailable:true,
    campaignsEnabled:false,templatesEnabled:false,automationEnabled:false,
    note:'Human-confirmed non-template support replies only within eligible 24h customer windows, capped to 500 reservations in any rolling 35 days. Sending is disabled outside these safety checks.',
  },{headers:inboxNoStore});
}
