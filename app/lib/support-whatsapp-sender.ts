import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const BATCH_SIZE = 5;
const LEASE_SECONDS = 120;
const META_TIMEOUT_MS = 10_000;
const MAX_RETRY_DELAY_MS = 60 * 60 * 1_000;
const E164_PHONE = /^\+[1-9][0-9]{7,14}$/;

export type SupportWhatsappReadiness = {
  senderEnabled: boolean;
  uiEnabled: boolean;
  senderConfigured: boolean;
  webhookConfigured: boolean;
  missingSenderConfig: string[];
  missingWebhookConfig: string[];
};

type SenderConfig = {
  supabaseUrl: string;
  serviceRoleKey: string;
  accessToken: string;
  phoneNumberId: string;
  graphApiVersion: string;
  replyTemplateName: string;
  replyTemplateLanguage: string;
  resolvedTemplateName: string;
  resolvedTemplateLanguage: string;
};

type ClaimedEvent = {
  event_id: string;
  recipient_user_id: string;
  event_type: string;
  provider: string;
  attempts: number;
  claim_token: string;
  created_at: string;
};

type Outcome = 'SENT' | 'FAILED' | 'CANCELLED';
type EventResult = 'sent' | 'failed' | 'cancelled' | 'deferred';
type Template = { name: string; language: string };
type MetaPayload = {
  messaging_product: 'whatsapp';
  recipient_type: 'individual';
  to: string;
  type: 'template';
  template: { name: string; language: { code: string } };
};

export type SupportWhatsappRunResult = {
  ok: boolean;
  claimed: number;
  sent: number;
  failed: number;
  cancelled: number;
  deferred: number;
  quarantined: number;
};

function emptyResult(): SupportWhatsappRunResult {
  return { ok: false, claimed: 0, sent: 0, failed: 0, cancelled: 0, deferred: 0, quarantined: 0 };
}

function configuredValue(name: string): string | null {
  const value = process.env[name];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

const PHONE_NUMBER_ID = /^\d{5,32}$/;
const GRAPH_API_VERSION = /^v\d+\.\d+$/;
const TEMPLATE_NAME = /^[a-z0-9_]{1,512}$/;
const TEMPLATE_LANGUAGE = /^[a-z]{2}(?:_[A-Z]{2})?$/;

function validSenderConfigValue(name: string, value: string | null): boolean {
  if (!value) return false;
  if (name === 'WHATSAPP_PHONE_NUMBER_ID') return PHONE_NUMBER_ID.test(value);
  if (name === 'WHATSAPP_GRAPH_API_VERSION') return GRAPH_API_VERSION.test(value);
  if (name === 'WHATSAPP_SUPPORT_REPLY_TEMPLATE_NAME' || name === 'WHATSAPP_SUPPORT_RESOLVED_TEMPLATE_NAME') return TEMPLATE_NAME.test(value);
  if (name === 'WHATSAPP_SUPPORT_REPLY_TEMPLATE_LANGUAGE' || name === 'WHATSAPP_SUPPORT_RESOLVED_TEMPLATE_LANGUAGE') return TEMPLATE_LANGUAGE.test(value);
  if (name === 'WHATSAPP_ACCESS_TOKEN') return value.length >= 20;
  return true;
}

export function getSupportWhatsappReadiness(): SupportWhatsappReadiness {
  const senderRequired = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'WHATSAPP_ACCESS_TOKEN',
    'WHATSAPP_PHONE_NUMBER_ID',
    'WHATSAPP_GRAPH_API_VERSION',
    'WHATSAPP_SUPPORT_REPLY_TEMPLATE_NAME',
    'WHATSAPP_SUPPORT_REPLY_TEMPLATE_LANGUAGE',
    'WHATSAPP_SUPPORT_RESOLVED_TEMPLATE_NAME',
    'WHATSAPP_SUPPORT_RESOLVED_TEMPLATE_LANGUAGE',
  ];
  const webhookRequired = [
    'WHATSAPP_WEBHOOK_VERIFY_TOKEN',
    'WHATSAPP_APP_SECRET',
  ];

  const missingSenderConfig = senderRequired.filter((name) => !validSenderConfigValue(name, configuredValue(name)));
  const missingWebhookConfig = webhookRequired.filter((name) => !configuredValue(name));

  return {
    senderEnabled: process.env.SUPPORT_WHATSAPP_SENDER_ENABLED === 'true',
    uiEnabled: process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP_UI_ENABLED === 'true',
    senderConfigured: missingSenderConfig.length === 0,
    webhookConfigured: missingWebhookConfig.length === 0,
    missingSenderConfig,
    missingWebhookConfig,
  };
}

function loadConfig(): SenderConfig | null {
  if (process.env.SUPPORT_WHATSAPP_SENDER_ENABLED !== 'true') return null;

  const supabaseUrl = configuredValue('NEXT_PUBLIC_SUPABASE_URL');
  const serviceRoleKey = configuredValue('SUPABASE_SERVICE_ROLE_KEY');
  const accessToken = configuredValue('WHATSAPP_ACCESS_TOKEN');
  const phoneNumberId = configuredValue('WHATSAPP_PHONE_NUMBER_ID');
  const graphApiVersion = configuredValue('WHATSAPP_GRAPH_API_VERSION');
  const replyTemplateName = configuredValue('WHATSAPP_SUPPORT_REPLY_TEMPLATE_NAME');
  const replyTemplateLanguage = configuredValue('WHATSAPP_SUPPORT_REPLY_TEMPLATE_LANGUAGE');
  const resolvedTemplateName = configuredValue('WHATSAPP_SUPPORT_RESOLVED_TEMPLATE_NAME');
  const resolvedTemplateLanguage = configuredValue('WHATSAPP_SUPPORT_RESOLVED_TEMPLATE_LANGUAGE');

  if (!supabaseUrl || !serviceRoleKey || !accessToken || !phoneNumberId ||
      !graphApiVersion || !replyTemplateName || !replyTemplateLanguage ||
      !resolvedTemplateName || !resolvedTemplateLanguage) return null;

  if (!validSenderConfigValue('WHATSAPP_ACCESS_TOKEN', accessToken) ||
      !validSenderConfigValue('WHATSAPP_PHONE_NUMBER_ID', phoneNumberId) ||
      !validSenderConfigValue('WHATSAPP_GRAPH_API_VERSION', graphApiVersion) ||
      !validSenderConfigValue('WHATSAPP_SUPPORT_REPLY_TEMPLATE_NAME', replyTemplateName) ||
      !validSenderConfigValue('WHATSAPP_SUPPORT_REPLY_TEMPLATE_LANGUAGE', replyTemplateLanguage) ||
      !validSenderConfigValue('WHATSAPP_SUPPORT_RESOLVED_TEMPLATE_NAME', resolvedTemplateName) ||
      !validSenderConfigValue('WHATSAPP_SUPPORT_RESOLVED_TEMPLATE_LANGUAGE', resolvedTemplateLanguage)) return null;

  return {
    supabaseUrl,
    serviceRoleKey,
    accessToken,
    phoneNumberId,
    graphApiVersion,
    replyTemplateName,
    replyTemplateLanguage,
    resolvedTemplateName,
    resolvedTemplateLanguage,
  };
}

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function parseClaimedEvent(value: unknown): ClaimedEvent | null {
  const row = record(value);
  if (!row || typeof row.event_id !== 'string' || !row.event_id ||
      typeof row.recipient_user_id !== 'string' || !row.recipient_user_id ||
      typeof row.event_type !== 'string' ||
      typeof row.provider !== 'string' ||
      typeof row.claim_token !== 'string' || !row.claim_token ||
      typeof row.created_at !== 'string' ||
      typeof row.attempts !== 'number' || !Number.isInteger(row.attempts)) return null;
  return row as ClaimedEvent;
}

function templateFor(eventType: string, config: SenderConfig): Template | null {
  if (eventType === 'SUPPORT_REPLY') {
    return { name: config.replyTemplateName, language: config.replyTemplateLanguage };
  }
  if (eventType === 'SUPPORT_RESOLVED') {
    return { name: config.resolvedTemplateName, language: config.resolvedTemplateLanguage };
  }
  return null;
}

function retryDelayMs(attempts: number, retryAfterMs?: number): number {
  if (retryAfterMs !== undefined) return Math.min(MAX_RETRY_DELAY_MS, Math.max(1_000, retryAfterMs));
  const exponential = 60_000 * 2 ** Math.max(0, attempts - 1);
  const jitter = Math.floor(Math.random() * 15_000);
  return Math.min(MAX_RETRY_DELAY_MS, exponential + jitter);
}

function retryAfterMs(value: string | null): number | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (/^\d+$/.test(trimmed)) {
    const seconds = Number(trimmed);
    return Number.isFinite(seconds) ? Math.min(MAX_RETRY_DELAY_MS, seconds * 1_000) : undefined;
  }
  const date = Date.parse(trimmed);
  const delay = date - Date.now();
  return Number.isFinite(delay) && delay > 0 ? Math.min(MAX_RETRY_DELAY_MS, delay) : undefined;
}

async function finishEvent(
  service: SupabaseClient,
  event: ClaimedEvent,
  outcome: Outcome,
  lastError: string | null = null,
  nextAttemptAt: string | null = null,
  providerMessageId: string | null = null,
): Promise<EventResult> {
  try {
    const { data, error } = await service.rpc('complete_support_whatsapp_notification', {
      p_event_id: event.event_id,
      p_claim_token: event.claim_token,
      p_outcome: outcome,
      p_provider_message_id: providerMessageId,
      p_last_error: lastError,
      p_next_attempt_at: nextAttemptAt,
    });
    if (error || data !== true) return 'deferred';
    return outcome === 'SENT' ? 'sent' : outcome === 'CANCELLED' ? 'cancelled' : 'failed';
  } catch {
    return 'deferred';
  }
}

function failTerminal(service: SupabaseClient, event: ClaimedEvent, code: string): Promise<EventResult> {
  return finishEvent(service, event, 'FAILED', code);
}

function failRetryable(service: SupabaseClient, event: ClaimedEvent, code: string, delayMs?: number): Promise<EventResult> {
  const nextAttemptAt = event.attempts < 5
    ? new Date(Date.now() + retryDelayMs(event.attempts, delayMs)).toISOString()
    : null;
  return finishEvent(service, event, 'FAILED', code, nextAttemptAt);
}

async function lookupRecipient(service: SupabaseClient, userId: string): Promise<
  { kind: 'ok'; recipient: string } |
  { kind: 'retry' } |
  { kind: 'terminal'; code: string }
> {
  try {
    const { data, error } = await service.auth.admin.getUserById(userId);
    if (error) return { kind: 'retry' };
    const user = data?.user;
    if (!user || typeof user.phone !== 'string' || !user.phone.trim()) {
      return { kind: 'terminal', code: 'PHONE_UNAVAILABLE' };
    }
    const confirmedAt = (user as typeof user & { phone_confirmed_at?: string | null }).phone_confirmed_at;
    if (typeof confirmedAt !== 'string' || !confirmedAt.trim() || !Number.isFinite(Date.parse(confirmedAt))) {
      return { kind: 'terminal', code: 'PHONE_UNVERIFIED' };
    }
    if (!E164_PHONE.test(user.phone)) return { kind: 'terminal', code: 'PHONE_INVALID_FORMAT' };
    return { kind: 'ok', recipient: user.phone.slice(1) };
  } catch {
    return { kind: 'retry' };
  }
}

async function checkCurrentConsent(service: SupabaseClient, event: ClaimedEvent): Promise<
  'valid' | 'revoked' | 'epoch_changed' | 'lookup_failed'
> {
  try {
    const { data, error } = await service
      .from('support_notification_preferences')
      .select('whatsapp_transactional_enabled,consented_at,revoked_at')
      .eq('user_id', event.recipient_user_id)
      .maybeSingle();
    if (error) return 'lookup_failed';
    if (!data || data.whatsapp_transactional_enabled !== true || data.revoked_at !== null ||
        typeof data.consented_at !== 'string' || !Number.isFinite(Date.parse(data.consented_at))) {
      return 'revoked';
    }
    return Date.parse(data.consented_at) > Date.parse(event.created_at) ? 'epoch_changed' : 'valid';
  } catch {
    return 'lookup_failed';
  }
}

type MetaResult =
  | { kind: 'sent'; providerMessageId: string }
  | { kind: 'failed'; code: 'PROVIDER_OUTCOME_UNKNOWN' | 'PROVIDER_RESPONSE_INVALID' | 'RATE_LIMITED' | 'PROVIDER_REJECTED'; retryAfter?: number };

async function sendTemplate(config: SenderConfig, payload: MetaPayload): Promise<MetaResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), META_TIMEOUT_MS);
  try {
    const url = `https://graph.facebook.com/${encodeURIComponent(config.graphApiVersion)}/${encodeURIComponent(config.phoneNumberId)}/messages`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
      cache: 'no-store',
      redirect: 'error',
    });

    if (response.ok) {
      let value: unknown;
      try {
        value = await response.json();
      } catch {
        return { kind: 'failed', code: controller.signal.aborted ? 'PROVIDER_OUTCOME_UNKNOWN' : 'PROVIDER_RESPONSE_INVALID' };
      }
      const messages = record(value)?.messages;
      const firstMessage = Array.isArray(messages) ? record(messages[0]) : null;
      const id = firstMessage?.id;
      return typeof id === 'string' && id.trim()
        ? { kind: 'sent', providerMessageId: id }
        : { kind: 'failed', code: 'PROVIDER_RESPONSE_INVALID' };
    }
    if (response.status === 429) {
      return { kind: 'failed', code: 'RATE_LIMITED', retryAfter: retryAfterMs(response.headers.get('retry-after')) };
    }
    if (response.status === 408 || response.status >= 500) {
      return { kind: 'failed', code: 'PROVIDER_OUTCOME_UNKNOWN' };
    }
    return { kind: 'failed', code: 'PROVIDER_REJECTED' };
  } catch {
    return { kind: 'failed', code: 'PROVIDER_OUTCOME_UNKNOWN' };
  } finally {
    clearTimeout(timeout);
  }
}

async function processEvent(service: SupabaseClient, config: SenderConfig, event: ClaimedEvent): Promise<EventResult> {
  if (event.provider !== 'META_WHATSAPP' || event.attempts < 1 || event.attempts > 5 ||
      !Number.isFinite(Date.parse(event.created_at))) {
    return failTerminal(service, event, 'EVENT_INVALID');
  }
  const template = templateFor(event.event_type, config);
  if (!template) return failTerminal(service, event, 'EVENT_TYPE_UNSUPPORTED');

  const recipient = await lookupRecipient(service, event.recipient_user_id);
  if (recipient.kind === 'retry') return failRetryable(service, event, 'AUTH_LOOKUP_FAILED');
  if (recipient.kind === 'terminal') return failTerminal(service, event, recipient.code);

  const consent = await checkCurrentConsent(service, event);
  if (consent === 'lookup_failed') return failRetryable(service, event, 'CONSENT_LOOKUP_FAILED');
  if (consent === 'revoked') return finishEvent(service, event, 'CANCELLED', 'CONSENT_REVOKED');
  if (consent === 'epoch_changed') return finishEvent(service, event, 'CANCELLED', 'CONSENT_EPOCH_CHANGED');

  const payload: MetaPayload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: recipient.recipient,
    type: 'template',
    template: { name: template.name, language: { code: template.language } },
  };

  try {
    const { data, error } = await service.rpc('mark_support_whatsapp_request_started', {
      p_event_id: event.event_id,
      p_claim_token: event.claim_token,
    });
    if (error || data !== true) return 'deferred';
  } catch {
    return 'deferred';
  }

  const result = await sendTemplate(config, payload);
  if (result.kind === 'sent') {
    return finishEvent(service, event, 'SENT', null, null, result.providerMessageId);
  }
  if (result.code === 'RATE_LIMITED') {
    return failRetryable(service, event, 'RATE_LIMITED', result.retryAfter);
  }
  return failTerminal(service, event, result.code);
}

export async function runSupportWhatsappSender(): Promise<SupportWhatsappRunResult> {
  const summary = emptyResult();
  const config = loadConfig();
  if (!config) return summary;

  let service: SupabaseClient;
  try {
    service = createClient(config.supabaseUrl, config.serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  } catch {
    return summary;
  }

  try {
    const { data: quarantined, error: quarantineError } = await service.rpc('quarantine_expired_support_whatsapp_notifications');
    if (quarantineError || typeof quarantined !== 'number' || !Number.isInteger(quarantined) || quarantined < 0) return summary;
    summary.quarantined = quarantined;

    const { data: claimed, error: claimError } = await service.rpc('claim_support_whatsapp_notifications', {
      p_batch_size: BATCH_SIZE,
      p_lease_seconds: LEASE_SECONDS,
    });
    if (claimError || !Array.isArray(claimed) || claimed.length > BATCH_SIZE) return summary;

    summary.claimed = claimed.length;
    for (const row of claimed) {
      const event = parseClaimedEvent(row);
      let result: EventResult = 'deferred';
      if (event) {
        try {
          result = await processEvent(service, config, event);
        } catch {
          // An unsettled claim stays fenced; lease recovery decides its next state.
        }
      }
      summary[result] += 1;
    }
    summary.ok = true;
  } catch {
    // No raw provider, Supabase, recipient, or configuration error is returned or logged.
  }
  return summary;
}
