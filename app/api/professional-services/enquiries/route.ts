import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isHomeServiceCode } from '@/app/lib/home-services-categories';
import { getRuntimeSupabaseEnv } from '@/app/lib/runtime-env';
import { rateLimitResponse } from '@/app/lib/provider-security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const noStore = { 'Cache-Control': 'no-store, max-age=0' };
const allowed = new Set(['WEDDING','INTERIORS','HOME_SERVICES']);

async function serviceClient() {
  const { url, serviceRoleKey } = await getRuntimeSupabaseEnv();
  return url && serviceRoleKey
    ? createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })
    : null;
}

// Used by the public page so that a missing/failed database migration never
// renders an apparently functioning enquiry form.
export async function GET() {
  const db = await serviceClient();
  if (!db) return NextResponse.json({ home_services_enquiries_enabled: false }, { headers: noStore });
  const { error } = await db.from('professional_service_enquiries')
    .select('service_category', { head: true }).limit(0);
  return NextResponse.json({ home_services_enquiries_enabled: !error }, { headers: noStore });
}

export async function POST(request: Request) {
  const bytes = Number(request.headers.get('content-length') || '0');
  if (bytes > 8000) return NextResponse.json({ error: 'Request is too large.' }, { status: 413, headers: noStore });
  let input: Record<string, unknown>;
  try {
    const raw = await request.text();
    if (raw.length > 8000) return NextResponse.json({ error: 'Request is too large.' }, { status: 413, headers: noStore });
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('invalid');
    input = data as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400, headers: noStore });
  }
  const field = (key: string, max: number) =>
    typeof input[key] === 'string' ? (input[key] as string).trim().slice(0, max) : '';
  const service_type = field('service_type', 20);
  const service_category = field('service_category', 30);
  const customer_name = field('customer_name', 100);
  const contact_phone = field('contact_phone', 20);
  const normalizedPhone = contact_phone.replace(/[\s()+-]/g,'').replace(/^91(?=[6-9]\d{9}$)/,'');
  const city = field('city', 100);
  const budget_range = field('budget_range', 80);
  const project_details = field('project_details', 2000);
  const requested_date = field('requested_date', 10);
  const home = service_type === 'HOME_SERVICES';
  if (!allowed.has(service_type) || customer_name.length < 2
      || !/^[6-9]\d{9}$/.test(normalizedPhone)
      || city.length < 2 || !budget_range || project_details.length < 10
      || input.consent !== true || field('website', 100)
      || (home && (!isHomeServiceCode(service_category) || city.toLowerCase() !== 'jagtial'))
      || (!home && service_category)) {
    return NextResponse.json({ error: 'Please check your details, service area and consent.' }, { status: 400, headers: noStore });
  }
  if (requested_date) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(requested_date))
      return NextResponse.json({ error: 'Invalid date.' }, { status: 400, headers: noStore });
    const parsed = new Date(requested_date + 'T00:00:00Z');
    const today = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00Z');
    const days = (parsed.getTime() - today.getTime()) / 86_400_000;
    if (!Number.isInteger(days) || parsed.toISOString().slice(0, 10) !== requested_date || days < -1 || days > 365)
      return NextResponse.json({ error: 'Choose a valid upcoming date.' }, { status: 400, headers: noStore });
  }

  const rateLimit = rateLimitResponse(normalizedPhone, 'professional-service-enquiry');
  if (rateLimit) return rateLimit;
  const db = await serviceClient();
  if (!db) return NextResponse.json({ error: 'Service temporarily unavailable.' }, { status: 503, headers: noStore });

  if (home) {
    // Shared DB cap complements the per-worker limiter on Cloudflare.
    const since = new Date(Date.now() - 86_400_000).toISOString();
    const { count, error } = await db.from('professional_service_enquiries')
      .select('id', { count: 'exact', head: true })
      .eq('service_type', 'HOME_SERVICES')
      .eq('contact_phone', normalizedPhone)
      .gte('created_at', since);
    if (error) return NextResponse.json({ error: 'Enquiries are temporarily unavailable.' }, { status: 503, headers: noStore });
    if ((count || 0) >= 3) return NextResponse.json({ error: 'Please contact Zeshu Help about your existing requests.' }, { status: 429, headers: noStore });
  }

  const payload = {
    service_type, customer_name, contact_phone: normalizedPhone,
    city, budget_range, project_details, requested_date: requested_date || null,
    ...(home ? { service_category } : {}),
  };
  const { error } = await db.from('professional_service_enquiries').insert(payload);
  if (error) return NextResponse.json({ error: 'Unable to save enquiry. Please try again.' }, { status: 503, headers: noStore });
  return NextResponse.json({
    ok: true,
    message: 'Your enquiry was saved for manual review. No professional, visit, price or booking is confirmed, and no payment has been taken.',
  }, { status: 201, headers: noStore });
}
