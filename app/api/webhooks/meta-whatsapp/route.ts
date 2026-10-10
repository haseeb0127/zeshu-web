import {getRuntimeEnvValue} from '@/app/lib/runtime-env';
import {parseInboundWhatsAppMessages,ingestInboundWhatsAppMessages} from '@/app/lib/whatsapp-inbox-webhook';
import {
  extractSupportWhatsappDeliveryEvents,
  hasValidMetaSignature,
  ingestSupportWhatsappDeliveryEvents,
  secureTextEquals,
} from '@/app/lib/support-whatsapp-webhook';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const textResponse = (body: string, status: number) => new Response(body, {
  status,
  headers: {
    'Cache-Control': 'no-store',
    'Content-Type': 'text/plain; charset=utf-8',
  },
});

export async function GET(request: Request) {
  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN?.trim();
  if (!verifyToken) return textResponse('Service unavailable.', 503);

  const searchParams = new URL(request.url).searchParams;
  const mode = searchParams.get('hub.mode');
  const suppliedToken = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');
  if (mode !== 'subscribe' || suppliedToken === null || challenge === null || !secureTextEquals(suppliedToken, verifyToken)) {
    return textResponse('Forbidden.', 403);
  }

  return textResponse(challenge, 200);
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  if(rawBody.length>524288) return textResponse('Request too large.',413);
  const appSecret = process.env.WHATSAPP_APP_SECRET?.trim();
  if (!appSecret) return textResponse('Service unavailable.', 503);

  const signature = request.headers.get('x-hub-signature-256');
  if (!hasValidMetaSignature(rawBody, signature, appSecret)) return textResponse('Forbidden.', 403);

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return textResponse('Invalid request.', 400);
  }

  const events = extractSupportWhatsappDeliveryEvents(payload);
  // Inbound messages are received only after Meta signs the webhook. Never
  // send an automatic reply, register phones, or turn on a customer toggle.
  const [wabaId,phoneId]=await Promise.all([
    getRuntimeEnvValue('WHATSAPP_BUSINESS_ACCOUNT_ID'),
    getRuntimeEnvValue('WHATSAPP_PHONE_NUMBER_ID'),
  ]);
  const incoming=parseInboundWhatsAppMessages(payload,wabaId,phoneId);
  if(events.length){
    const outcome=await ingestSupportWhatsappDeliveryEvents(events);
    if(outcome==='unavailable')return textResponse('Service unavailable.',503);
    if(outcome==='failed')return textResponse('Request could not be processed.',500);
  }
  if(incoming.length){
    const outcome=await ingestInboundWhatsAppMessages(incoming);
    if(outcome==='unavailable')return textResponse('Service unavailable.',503);
    if(outcome==='failed')return textResponse('Request could not be processed.',500);
  }
  return Response.json({received:true});
}
