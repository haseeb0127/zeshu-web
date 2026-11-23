import { NextResponse } from 'next/server';
import { getPhonePeSandboxConfig, requireStagingPaymentTester } from '@/app/lib/phonepe-sandbox';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const access = await requireStagingPaymentTester(request);
  if ('response' in access) return access.response;

  const config = await getPhonePeSandboxConfig();
  return NextResponse.json({
    sandbox: true,
    environment: config.environment,
    configured: config.ready,
    client_id_present: Boolean(config.clientId),
    client_secret_present: Boolean(config.clientSecret),
    client_version_present: Boolean(config.clientVersion),
    router_mode_required: 'off',
  }, { headers: { 'Cache-Control': 'no-store' } });
}
