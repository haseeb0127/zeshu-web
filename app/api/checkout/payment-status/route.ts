import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Razorpay from 'razorpay';
import { getRuntimeEnvValue, getRuntimeSupabaseEnv } from '../../../lib/runtime-env';

export const dynamic = 'force-dynamic';

const noStore = { 'Cache-Control': 'private, no-store, max-age=0' };
const reply = (payload: Record<string, unknown>, status = 200) =>
  NextResponse.json(payload, { status, headers: noStore });

// This endpoint MUST remain read-only. It NEVER creates Razorpay orders,
// releases reservations, captures payments or modifies customer data.
export async function GET(request: Request) {
  try {
    const authorization = request.headers.get('authorization') || '';
    if (!authorization.startsWith('Bearer ')) return reply({message:'Please sign in again to check payment status.',safeToRetry:false},401);
    const accessToken = authorization.slice(7).trim();
    if (!accessToken) return reply({message:'Your session has expired.',safeToRetry:false},401);
    const supabaseEnv = await getRuntimeSupabaseEnv();
    const isStaging = (request.headers.get('host') || '').split(':')[0].toLowerCase()
      === 'zeshu-web-staging.asif-mohammed0127.workers.dev';
    if (!supabaseEnv.url || !supabaseEnv.anonKey || !supabaseEnv.serviceRoleKey ||
        (isStaging && !supabaseEnv.url.includes('xdzgdhupfgsdyzellpqq'))) {
      return reply({message:'Payment status is temporarily unavailable. No payment was started.',safeToRetry:false},503);
    }
    const authClient = createClient(supabaseEnv.url,supabaseEnv.anonKey);
    const {data:{user},error:authError}=await authClient.auth.getUser(accessToken);
    if (authError || !user) return reply({message:'Please sign in again to check payment status.',safeToRetry:false},401);

    const service = createClient(supabaseEnv.url,supabaseEnv.serviceRoleKey, {
      auth:{persistSession:false,autoRefreshToken:false},
    });
    const {data:pending,error} = await service.from('inventory_reservations')
      .select('status,expected_total_paid,razorpay_order_id,expires_at')
      .eq('user_id',user.id)
      .in('status',['PAYMENT_PENDING','EXPIRED'])
      .not('razorpay_order_id','is',null)
      .is('abandoned_at',null)
      .order('created_at',{ascending:false}).limit(1).maybeSingle();
    if (error) return reply({message:'Could not verify previous checkout safely. No payment was started.',safeToRetry:false},503);
    if (!pending) return reply({
      status:'NO_OPEN_PAYMENT',
      message:'There is no unresolved previous checkout. You may review your cart and start a new TEST checkout.',
      safeToRetry:true,
    });

    // Fail closed if the provider credentials are unavailable or not TEST.
    const [keyId,keySecret] = await Promise.all([
      getRuntimeEnvValue('RAZORPAY_KEY_ID'),getRuntimeEnvValue('RAZORPAY_KEY_SECRET'),
    ]);
    if (!keyId.startsWith('rzp_test_') || !keySecret) return reply({
      status:'CANNOT_CONFIRM',
      message:'Your earlier payment cannot currently be checked with Razorpay. No new payment was started. Contact Zeshu support.',
      safeToRetry:false,
    },503);

    const razorpay = new Razorpay({key_id:keyId,key_secret:keySecret});
    const [order,payments] = await Promise.all([
      razorpay.orders.fetch(String(pending.razorpay_order_id)),
      razorpay.orders.fetchPayments(String(pending.razorpay_order_id)),
    ]);
    const items = Array.isArray((payments as any)?.items) ? (payments as any).items : null;
    const amountPaise = Math.round(Number(pending.expected_total_paid)*100);
    const sameOrder = (order as any)?.id === pending.razorpay_order_id &&
      Number((order as any).amount) === amountPaise &&
      String((order as any).currency).toUpperCase()==='INR';
    if (!sameOrder || items === null) return reply({
      status:'CANNOT_CONFIRM',message:'The previous payment needs manual verification before retrying. No new payment was started.',safeToRetry:false,
    });
    const statuses = items.map((p:any)=>String(p.status || '').toLowerCase());
    const attempted = items.length > 0;
    // Authorized/captured/unknown states must never be treated as unpaid.
    const safeToRetry = ['created','attempted'].includes(String((order as any).status).toLowerCase()) &&
      Number((order as any).amount_paid)===0 &&
      Number((order as any).amount_due)===amountPaise &&
      (statuses.length===0 || statuses.every((s:string)=>s==='failed'));
    if (safeToRetry) return reply({
      status:'UNPAID',
      message:`Your previous ₹${Number(pending.expected_total_paid).toLocaleString('en-IN')} TEST checkout has no successful payment at Razorpay. No new payment was initiated by this check. You can retry your current cart; Zeshu will revalidate it and the old checkout before another attempt.`,
      safeToRetry:true,
    });
    return reply({
      status:attempted?'PAYMENT_ATTEMPT_REQUIRES_REVIEW':'PENDING_VERIFICATION',
      message:'Razorpay has not confirmed that your previous payment is safely unpaid. Do not pay again yet. Contact support to avoid duplicate charges.',
      safeToRetry:false,
    });
  } catch {
    return reply({status:'CANNOT_CONFIRM',
      message:'Razorpay status could not be verified. No new payment was started. Please try the status check later or contact support.',
      safeToRetry:false},503);
  }
}
