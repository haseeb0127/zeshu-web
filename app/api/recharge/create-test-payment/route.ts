import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Razorpay from 'razorpay';
import { getRuntimeEnvValue, getRuntimeSupabaseEnv } from '@/app/lib/runtime-env';
import { discoverPlans } from '@/app/lib/planapi';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get('authorization');
    if (!authorization?.startsWith('Bearer ')) return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
    const accessToken = authorization.slice('Bearer '.length).trim();
    const { url: supabaseUrl, anonKey, serviceRoleKey } = await getRuntimeSupabaseEnv();
    if (!accessToken || !supabaseUrl || !anonKey || !serviceRoleKey) return NextResponse.json({ success: false, error: 'Test payment is unavailable.' }, { status: 401 });
    const authClient = createClient(supabaseUrl, anonKey);
    const { data: { user }, error: authError } = await authClient.auth.getUser(accessToken);
    if (authError || !user) return NextResponse.json({ success: false, error: 'Your customer session has expired. Please sign in again.' }, { status: 401 });
    const serviceClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: adminRole, error: roleError } = await serviceClient.from('admin_roles').select('user_id').eq('user_id', user.id).eq('role', 'admin').maybeSingle();
    if (roleError) return NextResponse.json({ success: false, error: 'Unable to verify customer profile.' }, { status: 500 });
    if (adminRole) return NextResponse.json({ success: false, error: 'Admin sessions cannot be used for customer checkout.' }, { status: 403 });
    const { data: customerProfile, error: profileError } = await serviceClient.from('users').select('id').eq('id', user.id).maybeSingle();
    if (profileError) return NextResponse.json({ success: false, error: 'Unable to verify customer profile.' }, { status: 500 });
    if (!customerProfile) return NextResponse.json({ success: false, error: 'Customer profile required before checkout.' }, { status: 403 });
    const body = await request.json();
    const mobile = typeof body?.mobile === 'string' ? body.mobile.replace(/\D/g, '') : '';
    const amount = Number(body?.amount);
    const planId = typeof body?.planId === 'string' ? body.planId.trim() : '';
    if (!/^[6-9]\d{9}$/.test(mobile) || !planId || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ success: false, error: 'A valid mobile number and selected plan are required.' }, { status: 400 });
    }
    const discovered = await discoverPlans(mobile);
    const selected = [...discovered.plans, ...discovered.specialOffers].find((plan) => String(plan.id) === planId);
    if (!selected || Number(selected.amount) !== amount) {
      return NextResponse.json({ success: false, error: 'The selected plan is no longer available.' }, { status: 400 });
    }
    const [keyId, keySecret] = await Promise.all([
      getRuntimeEnvValue('RAZORPAY_KEY_ID'),
      getRuntimeEnvValue('RAZORPAY_KEY_SECRET'),
    ]);
    if (!keyId || !keySecret || !keyId.startsWith('rzp_test_')) return NextResponse.json({ success: false, error: 'Test payment is unavailable.' }, { status: 503 });
    const customerRef = crypto.createHmac('sha256', keySecret).update(`recharge-test-customer:${user.id}`).digest('hex').slice(0, 24);
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const order = await razorpay.orders.create({ amount: Math.round(amount * 100), currency: 'INR', receipt: `recharge_test_${Date.now()}`, notes: { service: 'mobile_recharge_test', planId, operatorCode: discovered.operatorCode, circleCode: discovered.circleCode, customerRef } });
    return NextResponse.json({ success: true, mode: 'test', keyId, orderId: order.id, amount: order.amount, currency: order.currency });
  } catch {
    return NextResponse.json({ success: false, error: 'Test payment is temporarily unavailable.' }, { status: 503 });
  }
}
