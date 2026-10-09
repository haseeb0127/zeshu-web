import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupportWhatsappReadiness } from '@/app/lib/support-whatsapp-sender';
import { auditMetaSupportTemplates } from '@/app/lib/support-whatsapp-template-readiness';
import { getRuntimeEnvValue, getRuntimeSupabaseEnv } from '@/app/lib/runtime-env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Read-only: does not send messages, alter subscriptions, create templates,
// reveal credentials, or enable customer-facing notifications.
export async function GET(request: Request) {
  const auth = request.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!token) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  const env = await getRuntimeSupabaseEnv();
  if (!env.url || !env.anonKey || !env.serviceRoleKey) {
    return NextResponse.json({ error: 'Readiness check temporarily unavailable.' }, { status: 503 });
  }
  const session = createClient(env.url, env.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data: { user }, error: authError } = await session.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  const service = createClient(env.url, env.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data: admin, error: roleError } = await service.from('admin_roles')
    .select('user_id').eq('user_id', user.id).eq('role', 'admin').maybeSingle();
  if (roleError) return NextResponse.json({ error: 'Readiness check temporarily unavailable.' }, { status: 503 });
  if (!admin) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });

  const readiness = getSupportWhatsappReadiness();
  const names = ['CRON_SECRET','WHATSAPP_ACCESS_TOKEN','WHATSAPP_BUSINESS_ACCOUNT_ID','WHATSAPP_GRAPH_API_VERSION',
    'WHATSAPP_SUPPORT_REPLY_TEMPLATE_NAME','WHATSAPP_SUPPORT_REPLY_TEMPLATE_LANGUAGE',
    'WHATSAPP_SUPPORT_RESOLVED_TEMPLATE_NAME','WHATSAPP_SUPPORT_RESOLVED_TEMPLATE_LANGUAGE'] as const;
  const configs = await Promise.all(names.map(key=>getRuntimeEnvValue(key)));
  const vals = Object.fromEntries(names.map((key,index)=>[key,configs[index]])) as Record<typeof names[number],string>;
  const [templateAudit, outbox, preferences, delivered] = await Promise.all([
    auditMetaSupportTemplates({
      token: vals.WHATSAPP_ACCESS_TOKEN, wabaId: vals.WHATSAPP_BUSINESS_ACCOUNT_ID,
      graphVersion: vals.WHATSAPP_GRAPH_API_VERSION,
      replyName: vals.WHATSAPP_SUPPORT_REPLY_TEMPLATE_NAME,
      replyLanguage: vals.WHATSAPP_SUPPORT_REPLY_TEMPLATE_LANGUAGE,
      resolvedName: vals.WHATSAPP_SUPPORT_RESOLVED_TEMPLATE_NAME,
      resolvedLanguage: vals.WHATSAPP_SUPPORT_RESOLVED_TEMPLATE_LANGUAGE,
    }),
    service.from('support_notification_outbox').select('event_id',{head:true,count:'exact'}),
    service.from('support_notification_preferences').select('user_id',{head:true,count:'exact'})
      .eq('whatsapp_transactional_enabled',true).is('revoked_at',null),
    service.from('support_whatsapp_delivery_events').select('id',{head:true,count:'exact'}),
  ]);
  const cronConfigured = Boolean(vals.CRON_SECRET);
  const statisticsAvailable = !outbox.error && !preferences.error && !delivered.error;

  return NextResponse.json({
    ...readiness,
    cronConfigured,
    wabaConfigured: /^\d{5,32}$/.test(vals.WHATSAPP_BUSINESS_ACCOUNT_ID),
    templateAudit,
    metrics: statisticsAvailable
      ? { queuedEvents: outbox.count || 0, optedInAccounts: preferences.count || 0, deliveryEvents: delivered.count || 0 }
      : null,
    // Presence is NOT proof of approved templates, webhook subscription,
    // permitted business phone number, or successful end-to-end delivery.
    technicalChecksPassed: readiness.senderConfigured && readiness.webhookConfigured &&
      cronConfigured && templateAudit.verified,
    safeToEnableSender: false,
    safeToEnableUi: false,
    requiresOwnerApproval: true,
    note: 'Read-only checks only. Meta webhook subscription, phone-number ownership, a consented pilot recipient and real delivery must be verified before enabling sender or customer UI. No WhatsApp messages were sent.',
  }, {headers:{'Cache-Control':'private, no-store, max-age=0'}});
}
