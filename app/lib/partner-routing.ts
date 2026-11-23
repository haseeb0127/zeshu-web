import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';

export type PartnerCategory =
  | 'GROCERY'
  | 'FRESH'
  | 'PHARMACY'
  | 'MEDICINE_DISTRIBUTOR'
  | 'RECHARGE_BILLS'
  | 'TRAVEL'
  | 'DELIVERY';

export type PartnerHealth = 'ONBOARDING' | 'ACTIVE' | 'DEGRADED' | 'DOWN' | 'PAUSED';

export type ServicePartner = {
  id: string;
  name: string;
  category: PartnerCategory;
  partner_kind: string;
  vendor_id: string | null;
  priority: number;
  status: PartnerHealth;
  service_area: string | null;
  target_prep_minutes: number | null;
  auto_failover_enabled: boolean;
  consecutive_failures: number;
};

const HEALTH_ORDER: Record<PartnerHealth, number> = {
  ACTIVE: 0,
  DEGRADED: 1,
  ONBOARDING: 2,
  PAUSED: 3,
  DOWN: 4,
};

export async function listPartnerCandidates(
  service: SupabaseClient,
  category: PartnerCategory,
): Promise<ServicePartner[]> {
  const { data, error } = await service
    .from('service_partners')
    .select('id,name,category,partner_kind,vendor_id,priority,status,service_area,target_prep_minutes,auto_failover_enabled,consecutive_failures')
    .eq('category', category)
    .in('status', ['ACTIVE', 'DEGRADED'])
    .order('priority', { ascending: true });

  if (error) throw error;

  return (data || [])
    .map((row) => row as ServicePartner)
    .sort((a, b) => {
      const healthDelta = HEALTH_ORDER[a.status] - HEALTH_ORDER[b.status];
      if (healthDelta !== 0) return healthDelta;
      const failureDelta = Number(a.consecutive_failures || 0) - Number(b.consecutive_failures || 0);
      if (failureDelta !== 0) return failureDelta;
      return Number(a.priority || 100) - Number(b.priority || 100);
    });
}

export function selectPrimaryAndBackups(partners: ServicePartner[]) {
  const eligible = partners.filter((partner) => partner.status === 'ACTIVE' || partner.status === 'DEGRADED');
  return {
    primary: eligible[0] || null,
    backups: eligible.slice(1),
  };
}

export function canFailOverFinancialTransaction(input: {
  transactionStarted: boolean;
  originalStatus?: string | null;
}) {
  if (!input.transactionStarted) return true;
  const status = String(input.originalStatus || '').trim().toUpperCase();
  return ['FAILED', 'REVERSED', 'CANCELLED', 'NOT_STARTED'].includes(status);
}

export function canFailOverPhysicalOrder(input: {
  exactSkuAvailable: boolean;
  replacementPricePaise: number;
  originalPricePaise: number;
  partnerCanMeetTarget: boolean;
}) {
  if (!input.exactSkuAvailable) return false;
  if (input.replacementPricePaise > input.originalPricePaise) return false;
  return input.partnerCanMeetTarget;
}

export async function logPartnerFailover(
  service: SupabaseClient,
  input: {
    category: PartnerCategory;
    orderId?: string | null;
    externalReference?: string | null;
    fromPartnerId?: string | null;
    toPartnerId?: string | null;
    reason: string;
    financialTransactionStarted?: boolean;
    originalTransactionStatus?: string | null;
    outcome: 'ROUTED' | 'BLOCKED' | 'MANUAL_REVIEW' | 'COMPLETED' | 'FAILED';
  },
) {
  const { error } = await service.from('partner_failover_events').insert({
    category: input.category,
    order_id: input.orderId || null,
    external_reference: input.externalReference || null,
    from_partner_id: input.fromPartnerId || null,
    to_partner_id: input.toPartnerId || null,
    reason: input.reason.slice(0, 500),
    financial_transaction_started: Boolean(input.financialTransactionStarted),
    original_transaction_status: input.originalTransactionStatus || null,
    outcome: input.outcome,
  });
  if (error) throw error;
}
