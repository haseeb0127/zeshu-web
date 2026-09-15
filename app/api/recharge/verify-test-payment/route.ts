import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Razorpay from 'razorpay';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get('authorization');
    if (!authorization?.startsWith('Bearer ')) return NextResponse.json({ paymentVerified: false, fulfillmentSubmitted: false, mode: 'test', error: 'Authentication required.' }, { status: 401 });
    const accessToken = authorization.slice('Bearer '.length).trim();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!accessToken || !supabaseUrl || !anonKey || !serviceRoleKey) return NextResponse.json({ paymentVerified: false, fulfillmentSubmitted: false, mode: 'test', error: 'Test payment is unavailable.' }, { status: 401 });
    const authClient = createClient(supabaseUrl, anonKey);
    const { data: { user }, error: authError } = await authClient.auth.getUser(accessToken);
    if (authError || !user) return NextResponse.json({ paymentVerified: false, fulfillmentSubmitted: false, mode: 'test', error: 'Your customer session has expired. Please sign in again.' }, { status: 401 });
    const serviceClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: adminRole, error: roleError } = await serviceClient.from('admin_roles').select('user_id').eq('user_id', user.id).eq('role', 'admin').maybeSingle();
    if (roleError) return NextResponse.json({ paymentVerified: false, fulfillmentSubmitted: false, mode: 'test', error: 'Unable to verify customer profile.' }, { status: 500 });
    if (adminRole) return NextResponse.json({ paymentVerified: false, fulfillmentSubmitted: false, mode: 'test', error: 'Admin sessions cannot be used for customer checkout.' }, { status: 403 });
    const { data: customerProfile, error: profileError } = await serviceClient.from('users').select('id').eq('id', user.id).maybeSingle();
    if (profileError) return NextResponse.json({ paymentVerified: false, fulfillmentSubmitted: false, mode: 'test', error: 'Unable to verify customer profile.' }, { status: 500 });
    if (!customerProfile) return NextResponse.json({ paymentVerified: false, fulfillmentSubmitted: false, mode: 'test', error: 'Customer profile required before checkout.' }, { status: 403 });
    const body = await request.json();
    const ids = ['razorpay_order_id', 'razorpay_payment_id', 'razorpay_signature'];
    if (!ids.every((key) => typeof body?.[key] === 'string' && body[key].length > 0)) return NextResponse.json({ paymentVerified: false, fulfillmentSubmitted: false, mode: 'test', error: 'Invalid test payment response.' }, { status: 400 });
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret || !keyId.startsWith('rzp_test_')) return NextResponse.json({ paymentVerified: false, fulfillmentSubmitted: false, mode: 'test', error: 'Test payment is unavailable.' }, { status: 503 });
    const customerRef = crypto.createHmac('sha256', keySecret).update(`recharge-test-customer:${user.id}`).digest('hex').slice(0, 24);
    const expected = crypto.createHmac('sha256', keySecret).update(`${body.razorpay_order_id}|${body.razorpay_payment_id}`).digest('hex');
    const validSignature = expected.length === body.razorpay_signature.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(body.razorpay_signature));
    if (!validSignature) return NextResponse.json({ paymentVerified: false, fulfillmentSubmitted: false, mode: 'test', error: 'Test payment verification failed.' }, { status: 400 });
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const payment: any = await razorpay.payments.fetch(body.razorpay_payment_id);
    const order: any = await razorpay.orders.fetch(body.razorpay_order_id);
    const amountPaid = order?.amount_paid;
    const verified = payment?.order_id === body.razorpay_order_id && order?.id === body.razorpay_order_id && order?.notes?.service === 'mobile_recharge_test' && order?.notes?.customerRef === customerRef && typeof order?.notes?.planId === 'string' && order?.currency === 'INR' && Number(order?.amount) > 0 && payment?.status === 'captured' && payment?.captured === true && Number(payment?.amount) === Number(order?.amount) && payment?.currency === order?.currency && (amountPaid === undefined || Number(amountPaid) === Number(payment?.amount));
    if (!verified) return NextResponse.json({ paymentVerified: false, fulfillmentSubmitted: false, mode: 'test', error: 'Test payment could not be verified.' }, { status: 400 });
    return NextResponse.json({ paymentVerified: true, fulfillmentSubmitted: false, mode: 'test' });
  } catch {
    return NextResponse.json({ paymentVerified: false, fulfillmentSubmitted: false, mode: 'test', error: 'Test payment verification is temporarily unavailable.' }, { status: 503 });
  }
}
