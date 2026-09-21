import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getRuntimeEnvValue, getRuntimeSupabaseEnv } from '@/app/lib/runtime-env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const STAGING_HOST = 'zeshu-web-staging.asif-mohammed0127.workers.dev';
const STAGING_PROJECT_REF = 'xdzgdhupfgsdyzellpqq';

const placeholder = (value: string) => {
  const text = String(value || '').trim().toLowerCase();
  return !text
    || text.includes('build-check')
    || text.includes('build_check')
    || text.includes('placeholder')
    || text.includes('dummy');
};

export async function POST(request: Request) {
  const host = (request.headers.get('host') || '').toLowerCase().split(':')[0];
  if (host !== STAGING_HOST) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

  const authorization = request.headers.get('authorization') || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  if (!token) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  const { url, anonKey, serviceRoleKey } = await getRuntimeSupabaseEnv();
  if (!url || !anonKey || !serviceRoleKey || !url.includes(STAGING_PROJECT_REF)) {
    return NextResponse.json({ error: 'Staging runtime is not configured.' }, { status: 503 });
  }

  const auth = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: authData, error: authError } = await auth.auth.getUser(token);
  const user = authData.user;
  if (authError || !user || user.user_metadata?.staging_qa !== true) {
    return NextResponse.json({ error: 'Staging QA access required.' }, { status: 403 });
  }

  const service = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const [
    products,
    vendors,
    riders,
    deliveredOrders,
    rewards,
    orderReviews,
    productReviews,
    riderFeed,
    marketing,
    support,
    razorpayKey,
    routesKey,
    routerMode,
    whatsappSender,
  ] = await Promise.all([
    service.from('products').select('id', { head: true, count: 'exact' }),
    service.from('vendors').select('id', { head: true, count: 'exact' }),
    service.from('riders').select('id', { head: true, count: 'exact' }),
    service.from('orders').select('id', { head: true, count: 'exact' }).eq('status', 'DELIVERED'),
    service.from('customer_reward_ledger').select('id', { head: true, count: 'exact' }).eq('user_id', user.id),
    service.from('order_reviews').select('id', { head: true, count: 'exact' }).eq('user_id', user.id),
    service.from('product_reviews').select('id', { head: true, count: 'exact' }).eq('user_id', user.id),
    service.from('rider_location_feed').select('rider_id', { head: true, count: 'exact' }),
    service.from('marketing_campaigns').select('id', { head: true, count: 'exact' }),
    service.from('support_conversations').select('id', { head: true, count: 'exact' }),
    getRuntimeEnvValue('RAZORPAY_KEY_ID'),
    getRuntimeEnvValue('GOOGLE_MAPS_ROUTES_API_KEY'),
    getRuntimeEnvValue('PAYMENT_ROUTER_MODE'),
    getRuntimeEnvValue('SUPPORT_WHATSAPP_SENDER_ENABLED'),
  ]);

  const databaseChecks = {
    catalog: !products.error && Number(products.count || 0) > 0,
    vendor: !vendors.error && Number(vendors.count || 0) > 0,
    rider: !riders.error && Number(riders.count || 0) > 0,
    delivered_order: !deliveredOrders.error && Number(deliveredOrders.count || 0) > 0,
    reward_ledger: !rewards.error && Number(rewards.count || 0) > 0,
    order_review: !orderReviews.error && Number(orderReviews.count || 0) > 0,
    product_review: !productReviews.error && Number(productReviews.count || 0) > 0,
    rider_location_feed: !riderFeed.error && Number(riderFeed.count || 0) > 0,
    marketing_table: !marketing.error,
    support_table: !support.error,
  };

  const runtimeChecks = {
    staging_supabase: url.includes(STAGING_PROJECT_REF),
    service_secret_present: Boolean(serviceRoleKey),
    payment_router_off: (routerMode || 'off').toLowerCase() === 'off',
    whatsapp_sender_off: (whatsappSender || 'false').toLowerCase() !== 'true',
    razorpay_real_test_configured: !placeholder(razorpayKey) && razorpayKey.startsWith('rzp_test_'),
    google_routes_configured: !placeholder(routesKey),
  };

  const requiredDatabaseOk = Object.values(databaseChecks).every(Boolean);
  const requiredSafetyOk = runtimeChecks.staging_supabase
    && runtimeChecks.service_secret_present
    && runtimeChecks.payment_router_off
    && runtimeChecks.whatsapp_sender_off;

  return NextResponse.json({
    success: requiredDatabaseOk && requiredSafetyOk,
    database: databaseChecks,
    runtime: runtimeChecks,
    provider_tests_pending: {
      razorpay_test_gateway: !runtimeChecks.razorpay_real_test_configured,
      google_routes_eta: !runtimeChecks.google_routes_configured,
      whatsapp_real_send: true,
      sms_otp: true,
    },
  }, { headers: { 'Cache-Control': 'no-store' } });
}
