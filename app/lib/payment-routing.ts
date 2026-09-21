import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';

export type PaymentProvider = 'razorpay' | 'cashfree' | 'phonepe' | 'paytm';
export type PaymentRail =
  | 'UPI'
  | 'RUPAY_DEBIT'
  | 'DEBIT_CARD'
  | 'CREDIT_CARD'
  | 'NET_BANKING'
  | 'WALLET'
  | 'UNKNOWN';

export type PaymentRouterMode = 'off' | 'observe' | 'smart';

export type PaymentGatewayProfile = {
  provider: PaymentProvider;
  display_name: string;
  routing_enabled: boolean;
  health_status: 'ONBOARDING' | 'ACTIVE' | 'DEGRADED' | 'DOWN' | 'PAUSED';
  priority: number;
  supported_rails: PaymentRail[];
  upi_fee_bps: number | null;
  rupay_debit_fee_bps: number | null;
  debit_card_fee_bps: number | null;
  credit_card_fee_bps: number | null;
  net_banking_fee_bps: number | null;
  wallet_fee_bps: number | null;
  fixed_fee_paise: number;
  rolling_success_rate_bps: number | null;
  rolling_latency_ms: number | null;
  last_metrics_at: string | null;
};

const ROUTER_MODES = new Set<PaymentRouterMode>(['off', 'observe', 'smart']);

export function getPaymentRouterMode(): PaymentRouterMode {
  const value = String(process.env.PAYMENT_ROUTER_MODE || 'off').trim().toLowerCase() as PaymentRouterMode;
  return ROUTER_MODES.has(value) ? value : 'off';
}

export function isPaymentProviderConfigured(provider: PaymentProvider) {
  switch (provider) {
    case 'razorpay':
      return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
    case 'cashfree':
      return Boolean(process.env.CASHFREE_APP_ID && process.env.CASHFREE_SECRET_KEY);
    case 'phonepe':
      return Boolean(
        process.env.PHONEPE_CLIENT_ID
        && process.env.PHONEPE_CLIENT_SECRET
        && process.env.PHONEPE_CLIENT_VERSION,
      );
    case 'paytm':
      return Boolean(process.env.PAYTM_MID && process.env.PAYTM_MERCHANT_KEY && process.env.PAYTM_WEBSITE);
    default:
      return false;
  }
}

function feeBpsForRail(profile: PaymentGatewayProfile, rail: PaymentRail): number | null {
  switch (rail) {
    case 'UPI':
      return profile.upi_fee_bps;
    case 'RUPAY_DEBIT':
      return profile.rupay_debit_fee_bps;
    case 'DEBIT_CARD':
      return profile.debit_card_fee_bps;
    case 'CREDIT_CARD':
      return profile.credit_card_fee_bps;
    case 'NET_BANKING':
      return profile.net_banking_fee_bps;
    case 'WALLET':
      return profile.wallet_fee_bps;
    default:
      return null;
  }
}

export function estimateGatewayFeePaise(
  profile: PaymentGatewayProfile,
  amountPaise: number,
  rail: PaymentRail,
) {
  const basisPoints = feeBpsForRail(profile, rail);
  if (basisPoints == null) return null;
  return Math.max(0, Math.ceil((amountPaise * basisPoints) / 10_000) + Number(profile.fixed_fee_paise || 0));
}

export function canReplacePaymentAttempt(status?: string | null) {
  const normalized = String(status || '').trim().toUpperCase();
  return ['NOT_STARTED', 'FAILED', 'CANCELLED', 'REVERSED'].includes(normalized);
}

export async function selectPaymentProvider(
  service: SupabaseClient,
  input: {
    amountPaise: number;
    rail: PaymentRail;
  },
) {
  const { data, error } = await service
    .from('payment_gateway_profiles')
    .select('*')
    .eq('routing_enabled', true)
    .in('health_status', ['ACTIVE', 'DEGRADED'])
    .order('priority', { ascending: true });

  if (error) throw error;

  const candidates = ((data || []) as PaymentGatewayProfile[])
    .filter((profile) => isPaymentProviderConfigured(profile.provider))
    .filter((profile) => (
      profile.supported_rails.includes(input.rail)
      || input.rail === 'UNKNOWN'
    ))
    .map((profile) => ({
      profile,
      estimatedFeePaise: estimateGatewayFeePaise(profile, input.amountPaise, input.rail),
    }));

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => {
    const healthA = a.profile.health_status === 'ACTIVE' ? 0 : 1;
    const healthB = b.profile.health_status === 'ACTIVE' ? 0 : 1;
    if (healthA !== healthB) return healthA - healthB;

    const successA = a.profile.rolling_success_rate_bps ?? -1;
    const successB = b.profile.rolling_success_rate_bps ?? -1;
    if (successA !== successB) return successB - successA;

    const feeA = a.estimatedFeePaise ?? Number.MAX_SAFE_INTEGER;
    const feeB = b.estimatedFeePaise ?? Number.MAX_SAFE_INTEGER;
    if (feeA !== feeB) return feeA - feeB;

    const latencyA = a.profile.rolling_latency_ms ?? Number.MAX_SAFE_INTEGER;
    const latencyB = b.profile.rolling_latency_ms ?? Number.MAX_SAFE_INTEGER;
    if (latencyA !== latencyB) return latencyA - latencyB;

    return Number(a.profile.priority || 100) - Number(b.profile.priority || 100);
  });

  const selected = candidates[0];
  return {
    provider: selected.profile.provider,
    displayName: selected.profile.display_name,
    estimatedFeePaise: selected.estimatedFeePaise,
    reason: selected.profile.rolling_success_rate_bps == null
      ? 'healthy_provider_priority'
      : 'health_success_cost_latency',
  };
}
