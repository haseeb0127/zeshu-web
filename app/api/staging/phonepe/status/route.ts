import { NextResponse } from 'next/server';
import { getPhonePeSandboxOrderStatus, requireStagingPaymentTester } from '@/app/lib/phonepe-sandbox';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const access = await requireStagingPaymentTester(request);
  if ('response' in access) return access.response;

  const url = new URL(request.url);
  const merchantOrderId = String(url.searchParams.get('merchantOrderId') || '').trim();
  if (!/^zeshu_stg_pp_[A-Za-z0-9_-]+$/.test(merchantOrderId) || merchantOrderId.length > 63) {
    return NextResponse.json({ error: 'Invalid PhonePe sandbox order ID.' }, { status: 400 });
  }

  try {
    const status = await getPhonePeSandboxOrderStatus(merchantOrderId);
    return NextResponse.json({
      success: true,
      ...status,
      fulfillmentSubmitted: false,
      routerActivated: false,
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const code = error instanceof Error ? error.message : 'PHONEPE_STATUS_FAILED';
    return NextResponse.json({
      success: false,
      code,
      error: 'PhonePe sandbox order status could not be checked.',
    }, { status: 503 });
  }
}
