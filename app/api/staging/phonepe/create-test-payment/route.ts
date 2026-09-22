import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import {
  ZESHU_STAGING_ORIGIN,
  createPhonePeSandboxPayment,
  getPhonePeSandboxConfig,
  requireStagingPaymentTester,
} from '@/app/lib/phonepe-sandbox';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const access = await requireStagingPaymentTester(request);
  if ('response' in access) return access.response;

  const config = await getPhonePeSandboxConfig();
  if (!config.ready || config.environment !== 'sandbox') {
    return NextResponse.json({
      error: 'PhonePe sandbox credentials are not configured.',
      code: 'PHONEPE_SANDBOX_NOT_CONFIGURED',
    }, { status: 503 });
  }

  const body = await request.json().catch(() => ({}));
  const amountPaise = Number(body?.amountPaise ?? 100);
  if (!Number.isSafeInteger(amountPaise) || amountPaise < 100 || amountPaise > 10_000) {
    return NextResponse.json({ error: 'Choose a sandbox amount between ₹1 and ₹100.' }, { status: 400 });
  }

  const merchantOrderId = `zeshu_stg_pp_${Date.now()}_${randomUUID().slice(0, 8)}`;
  const redirectUrl = `${ZESHU_STAGING_ORIGIN}/admin/payments?phonepe_order=${encodeURIComponent(merchantOrderId)}`;

  try {
    const payment = await createPhonePeSandboxPayment({
      merchantOrderId,
      amountPaise,
      redirectUrl,
      testerId: access.user.id,
    });

    return NextResponse.json({
      success: true,
      ...payment,
      fulfillmentSubmitted: false,
      routerActivated: false,
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const code = error instanceof Error ? error.message : 'PHONEPE_CREATE_FAILED';
    const authFailure = code === 'PHONEPE_AUTH_FAILED';
    return NextResponse.json({
      success: false,
      code,
      error: authFailure
        ? 'PhonePe sandbox authentication failed. Check the sandbox credentials.'
        : 'PhonePe sandbox payment could not be created.',
    }, { status: authFailure ? 401 : 503 });
  }
}
