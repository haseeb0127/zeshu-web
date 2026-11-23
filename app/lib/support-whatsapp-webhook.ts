import 'server-only';

import { createHmac, timingSafeEqual } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const MIN_PROVIDER_TIMESTAMP = 946684800;
const MAX_PROVIDER_TIMESTAMP = 4102444800;
const SUPPORTED_STATUSES = new Set(['sent', 'delivered', 'read', 'failed']);

export type SupportWhatsappDeliveryEvent = {
  providerMessageId: string;
  providerStatus: 'sent' | 'delivered' | 'read' | 'failed';
  providerTimestampEpoch: number;
  providerErrorCode: string | null;
};

type DeliveryIngestionResult = 'ok' | 'unavailable' | 'failed';

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
};

export const secureTextEquals = (left: string, right: string) => {
  const leftBuffer = Buffer.from(left, 'utf8');
  const rightBuffer = Buffer.from(right, 'utf8');
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
};

export const hasValidMetaSignature = (rawBody: string, signature: string | null, appSecret: string) => {
  if (!signature || !/^sha256=[0-9a-f]{64}$/i.test(signature)) return false;
  const suppliedDigest = Buffer.from(signature.slice(7), 'hex');
  const expectedDigest = createHmac('sha256', appSecret).update(rawBody, 'utf8').digest();
  return suppliedDigest.length === expectedDigest.length && timingSafeEqual(suppliedDigest, expectedDigest);
};

const parseProviderTimestamp = (value: unknown): number | null => {
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value)) return null;
    return value >= MIN_PROVIDER_TIMESTAMP && value < MAX_PROVIDER_TIMESTAMP ? value : null;
  }
  if (typeof value !== 'string' || !/^\d+$/.test(value)) return null;
  try {
    const epoch = BigInt(value);
    if (epoch < BigInt(MIN_PROVIDER_TIMESTAMP) || epoch >= BigInt(MAX_PROVIDER_TIMESTAMP)) return null;
    return Number(epoch);
  } catch {
    return null;
  }
};

const parseProviderErrorCode = (value: unknown): string | null => {
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value) || value < 0) return null;
    const code = String(value);
    return code.length <= 20 ? code : null;
  }
  if (typeof value !== 'string' || !/^\d{1,20}$/.test(value)) return null;
  return value;
};

const findProviderErrorCode = (errors: unknown): string | null => {
  if (!Array.isArray(errors)) return null;
  for (const error of errors) {
    if (!isRecord(error)) continue;
    const code = parseProviderErrorCode(error.code);
    if (code !== null) return code;
  }
  return null;
};

export const extractSupportWhatsappDeliveryEvents = (payload: unknown): SupportWhatsappDeliveryEvent[] => {
  if (!isRecord(payload) || payload.object !== 'whatsapp_business_account' || !Array.isArray(payload.entry)) return [];

  const events: SupportWhatsappDeliveryEvent[] = [];
  for (const entry of payload.entry) {
    if (!isRecord(entry) || !Array.isArray(entry.changes)) continue;
    for (const change of entry.changes) {
      if (!isRecord(change) || change.field !== 'messages' || !isRecord(change.value) || !Array.isArray(change.value.statuses)) continue;
      for (const statusEntry of change.value.statuses) {
        if (!isRecord(statusEntry) || typeof statusEntry.id !== 'string' || typeof statusEntry.status !== 'string') continue;
        const providerMessageId = statusEntry.id.trim();
        const providerStatus = statusEntry.status.trim().toLowerCase();
        const providerTimestampEpoch = parseProviderTimestamp(statusEntry.timestamp);
        if (!providerMessageId || providerMessageId.length > 512 || !SUPPORTED_STATUSES.has(providerStatus) || providerTimestampEpoch === null) continue;

        events.push({
          providerMessageId,
          providerStatus: providerStatus as SupportWhatsappDeliveryEvent['providerStatus'],
          providerTimestampEpoch,
          providerErrorCode: providerStatus === 'failed' ? findProviderErrorCode(statusEntry.errors) : null,
        });
      }
    }
  }
  return events;
};

export const ingestSupportWhatsappDeliveryEvents = async (
  events: SupportWhatsappDeliveryEvent[],
): Promise<DeliveryIngestionResult> => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!supabaseUrl || !serviceRoleKey) return 'unavailable';

  const service = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  try {
    for (const event of events) {
      const { data, error } = await service.rpc('ingest_support_whatsapp_delivery_event', {
        p_provider_message_id: event.providerMessageId,
        p_provider_status: event.providerStatus,
        p_provider_timestamp_epoch: event.providerTimestampEpoch,
        p_provider_error_code: event.providerErrorCode,
      });
      if (error || data !== true) return 'failed';
    }
    return 'ok';
  } catch {
    return 'failed';
  }
};
