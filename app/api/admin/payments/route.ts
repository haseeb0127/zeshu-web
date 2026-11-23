import { NextResponse } from 'next/server';
import { requireMarketingAdmin } from '@/app/lib/marketing-server';
import {
  getPaymentRouterMode,
  isPaymentProviderConfigured,
  type PaymentProvider,
  type PaymentRail,
} from '@/app/lib/payment-routing';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PROVIDERS: PaymentProvider[] = ['razorpay', 'cashfree', 'phonepe', 'paytm'];
const HEALTH = ['ONBOARDING', 'ACTIVE', 'DEGRADED', 'DOWN', 'PAUSED'] as const;
const RAILS: PaymentRail[] = ['UPI', 'RUPAY_DEBIT', 'DEBIT_CARD', 'CREDIT_CARD', 'NET_BANKING', 'WALLET'];

const integerOrNull = (value: unknown) => {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isInteger(number) ? number : null;
};

const cleanRails = (value: unknown): PaymentRail[] | null => {
  if (!Array.isArray(value)) return null;
  const rails = Array.from(new Set(value.map((item) => String(item).trim().toUpperCase())))
    .filter((item): item is PaymentRail => RAILS.includes(item as PaymentRail));
  return rails.length > 0 ? rails : null;
};

const configured = (provider: PaymentProvider) => isPaymentProviderConfigured(provider);

export async function GET(request: Request) {
  const { context, response } = await requireMarketingAdmin(request);
  if (response || !context) return response!;

  const [profilesResult, attemptsResult] = await Promise.all([
    context.service
      .from('payment_gateway_profiles')
      .select('provider,display_name,routing_enabled,health_status,priority,supported_rails,upi_fee_bps,rupay_debit_fee_bps,debit_card_fee_bps,credit_card_fee_bps,net_banking_fee_bps,wallet_fee_bps,fixed_fee_paise,rolling_success_rate_bps,rolling_latency_ms,last_metrics_at,updated_at')
      .order('priority', { ascending: true }),
    context.service
      .from('payment_attempts')
      .select('id,reservation_id,provider,provider_order_id,amount_paise,status,payment_rail,selected_reason,failure_code,created_at,updated_at')
      .order('created_at', { ascending: false })
      .limit(50),
  ]);

  if (profilesResult.error || attemptsResult.error) {
    return NextResponse.json({ error: 'Payment operations data is temporarily unavailable.' }, { status: 503 });
  }

  const profiles = (profilesResult.data || []).map((profile: any) => ({
    ...profile,
    configured: configured(profile.provider as PaymentProvider),
  }));

  return NextResponse.json({
    router_mode: getPaymentRouterMode(),
    profiles,
    recent_attempts: attemptsResult.data || [],
  });
}

export async function PATCH(request: Request) {
  const { context, response } = await requireMarketingAdmin(request);
  if (response || !context) return response!;

  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const provider = String(body.provider || '').trim().toLowerCase() as PaymentProvider;
  if (!PROVIDERS.includes(provider)) {
    return NextResponse.json({ error: 'Choose a supported payment provider.' }, { status: 400 });
  }

  const healthStatus = String(body.health_status || '').trim().toUpperCase();
  if (!HEALTH.includes(healthStatus as (typeof HEALTH)[number])) {
    return NextResponse.json({ error: 'Choose a valid provider health state.' }, { status: 400 });
  }

  const priority = integerOrNull(body.priority);
  const fixedFeePaise = integerOrNull(body.fixed_fee_paise);
  const rails = cleanRails(body.supported_rails);
  if (
    priority === null || priority < 1 || priority > 1000
    || fixedFeePaise === null || fixedFeePaise < 0
    || !rails
  ) {
    return NextResponse.json({ error: 'Review provider priority, payment methods and fixed fee.' }, { status: 400 });
  }

  const feeFields = [
    'upi_fee_bps',
    'rupay_debit_fee_bps',
    'debit_card_fee_bps',
    'credit_card_fee_bps',
    'net_banking_fee_bps',
    'wallet_fee_bps',
  ] as const;
  const feeUpdates: Record<string, number | null> = {};
  for (const field of feeFields) {
    const value = integerOrNull(body[field]);
    if (body[field] !== null && body[field] !== undefined && body[field] !== '' && (value === null || value < 0 || value > 10000)) {
      return NextResponse.json({ error: 'Gateway fee percentages must be between 0% and 100%.' }, { status: 400 });
    }
    feeUpdates[field] = value;
  }

  const routingEnabled = body.routing_enabled === true;
  const providerConfigured = configured(provider);
  if (routingEnabled && !providerConfigured) {
    return NextResponse.json({
      error: 'Add this provider’s merchant credentials securely before enabling it for routing.',
    }, { status: 409 });
  }
  if (healthStatus === 'ACTIVE' && !providerConfigured && provider !== 'razorpay') {
    return NextResponse.json({
      error: 'An unconfigured provider cannot be marked active.',
    }, { status: 409 });
  }

  const { data, error } = await context.service
    .from('payment_gateway_profiles')
    .update({
      routing_enabled: routingEnabled,
      health_status: healthStatus,
      priority,
      supported_rails: rails,
      fixed_fee_paise: fixedFeePaise,
      ...feeUpdates,
      updated_at: new Date().toISOString(),
    })
    .eq('provider', provider)
    .select('provider,display_name,routing_enabled,health_status,priority,supported_rails,upi_fee_bps,rupay_debit_fee_bps,debit_card_fee_bps,credit_card_fee_bps,net_banking_fee_bps,wallet_fee_bps,fixed_fee_paise,rolling_success_rate_bps,rolling_latency_ms,last_metrics_at,updated_at')
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Payment provider settings could not be saved.' }, { status: 503 });
  }

  return NextResponse.json({
    profile: { ...data, configured: providerConfigured },
    router_mode: getPaymentRouterMode(),
  });
}
