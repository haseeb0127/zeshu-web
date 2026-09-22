import { NextResponse } from 'next/server';
import { getRuntimeEnvValue, getRuntimeSupabaseEnv } from '@/app/lib/runtime-env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CANDIDATE_HOST = 'zeshu-web-production-candidate.asif-mohammed0127.workers.dev';
const PRODUCTION_PROJECT_REF = 'isofiudzgpuxgenzicdb';

const placeholder = (value: string) => {
  const text = String(value || '').trim().toLowerCase();
  return !text
    || text.includes('build-check')
    || text.includes('build_check')
    || text.includes('placeholder')
    || text.includes('dummy');
};

export async function GET(request: Request) {
  const host = (request.headers.get('host') || '').toLowerCase().split(':')[0];
  if (host !== CANDIDATE_HOST) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

  const { url, anonKey, serviceRoleKey } = await getRuntimeSupabaseEnv();
  const [razorpayKey, razorpayPublicKey, razorpaySecret, razorpayWebhookSecret, routesKey, routerMode, whatsappSender] = await Promise.all([
    getRuntimeEnvValue('RAZORPAY_KEY_ID'),
    getRuntimeEnvValue('NEXT_PUBLIC_RAZORPAY_KEY_ID'),
    getRuntimeEnvValue('RAZORPAY_KEY_SECRET'),
    getRuntimeEnvValue('RAZORPAY_WEBHOOK_SECRET'),
    getRuntimeEnvValue('GOOGLE_MAPS_ROUTES_API_KEY'),
    getRuntimeEnvValue('PAYMENT_ROUTER_MODE'),
    getRuntimeEnvValue('SUPPORT_WHATSAPP_SENDER_ENABLED'),
  ]);

  return NextResponse.json({
    runtime: {
      production_supabase_url_present: Boolean(url),
      production_supabase_url_matches: Boolean(url && url.includes(PRODUCTION_PROJECT_REF)),
      anon_key_present: Boolean(anonKey),
      service_secret_present: Boolean(serviceRoleKey),
      payment_router_off: (routerMode || 'off').toLowerCase() === 'off',
      whatsapp_sender_off: (whatsappSender || 'false').toLowerCase() !== 'true',
      razorpay_test_configured: !placeholder(razorpayKey)
        && razorpayKey.startsWith('rzp_test_')
        && razorpayPublicKey === razorpayKey
        && !placeholder(razorpaySecret)
        && !placeholder(razorpayWebhookSecret),
      razorpay_public_key_matches: !placeholder(razorpayPublicKey) && razorpayPublicKey === razorpayKey,
      google_routes_configured: !placeholder(routesKey),
    },
  }, { headers: { 'Cache-Control': 'no-store' } });
}
