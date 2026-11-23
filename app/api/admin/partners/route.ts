import { NextResponse } from 'next/server';
import { cleanText, requireMarketingAdmin } from '@/app/lib/marketing-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CATEGORIES = new Set(['GROCERY','FRESH','PHARMACY','MEDICINE_DISTRIBUTOR','RECHARGE_BILLS','TRAVEL','DELIVERY']);
const KINDS = new Set(['LOCAL_VENDOR','PHARMACY','DISTRIBUTOR','API_PROVIDER','AFFILIATE','RIDER_POOL','OTHER']);
const STATUSES = new Set(['ONBOARDING','ACTIVE','DEGRADED','DOWN','PAUSED']);

export async function GET(request: Request) {
  const { context, response } = await requireMarketingAdmin(request);
  if (response || !context) return response!;

  const [{ data: partners, error: partnerError }, { data: events, error: eventError }, { data: vendors, error: vendorError }] = await Promise.all([
    context.service.from('service_partners').select('*').order('category').order('priority'),
    context.service.from('partner_failover_events').select('*').order('created_at', { ascending: false }).limit(100),
    context.service.from('vendors').select('id,business_name,category,is_open,admin_suspended').order('business_name'),
  ]);

  if (partnerError || eventError || vendorError) {
    return NextResponse.json({ error: 'Partner routing data could not be loaded.' }, { status: 503 });
  }

  return NextResponse.json({ partners: partners || [], events: events || [], vendors: vendors || [] });
}

export async function POST(request: Request) {
  const { context, response } = await requireMarketingAdmin(request);
  if (response || !context) return response!;

  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const name = cleanText(body.name, 160);
  const category = cleanText(body.category, 40).toUpperCase();
  const partnerKind = cleanText(body.partner_kind, 40).toUpperCase();
  const status = cleanText(body.status, 30).toUpperCase() || 'ONBOARDING';
  const serviceArea = cleanText(body.service_area, 160);
  const notes = cleanText(body.commercial_notes, 1200);
  const vendorId = cleanText(body.vendor_id, 80) || null;
  const priority = Math.max(1, Math.min(1000, Number(body.priority || 100)));
  const targetPrepMinutes = body.target_prep_minutes == null || body.target_prep_minutes === ''
    ? null
    : Math.max(1, Math.min(240, Number(body.target_prep_minutes)));

  if (!name || !CATEGORIES.has(category) || !KINDS.has(partnerKind) || !STATUSES.has(status)) {
    return NextResponse.json({ error: 'Name, category, partner type and status are required.' }, { status: 400 });
  }

  const { data, error } = await context.service.from('service_partners').insert({
    name,
    category,
    partner_kind: partnerKind,
    vendor_id: vendorId,
    priority,
    status,
    service_area: serviceArea || null,
    target_prep_minutes: targetPrepMinutes,
    auto_failover_enabled: body.auto_failover_enabled === true,
    commercial_notes: notes || null,
  }).select('*').single();

  if (error) return NextResponse.json({ error: 'Partner could not be saved.' }, { status: 400 });
  return NextResponse.json({ partner: data }, { status: 201 });
}

export async function PATCH(request: Request) {
  const { context, response } = await requireMarketingAdmin(request);
  if (response || !context) return response!;

  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const id = cleanText(body.id, 80);
  if (!id) return NextResponse.json({ error: 'Partner ID is required.' }, { status: 400 });

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.status != null) {
    const status = cleanText(body.status, 30).toUpperCase();
    if (!STATUSES.has(status)) return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });
    updates.status = status;
    if (status === 'DOWN') updates.last_failure_at = new Date().toISOString();
    else updates.last_health_at = new Date().toISOString();
  }
  if (body.priority != null) updates.priority = Math.max(1, Math.min(1000, Number(body.priority)));
  if (body.auto_failover_enabled != null) updates.auto_failover_enabled = body.auto_failover_enabled === true;
  if (body.target_prep_minutes != null) updates.target_prep_minutes = Math.max(1, Math.min(240, Number(body.target_prep_minutes)));

  const { data, error } = await context.service.from('service_partners').update(updates).eq('id', id).select('*').single();
  if (error || !data) return NextResponse.json({ error: 'Partner could not be updated.' }, { status: 400 });
  return NextResponse.json({ partner: data });
}
