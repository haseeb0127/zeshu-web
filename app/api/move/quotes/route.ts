import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getRuntimeSupabaseEnv } from '@/app/lib/runtime-env';
import { rateLimitResponse } from '@/app/lib/provider-security';
import { validateMoveQuote } from '@/app/lib/move-quote-enquiry';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const noStore = { 'Cache-Control': 'no-store, max-age=0' };

async function serviceDb() {
  const { url, serviceRoleKey } = await getRuntimeSupabaseEnv();
  return url && serviceRoleKey
    ? createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })
    : null;
}

export async function GET() {
  const db = await serviceDb();
  if (!db) return NextResponse.json({ accepting_requests: false }, { headers: noStore });
  // Do not claim the inbox is operational when its private table/migration is absent.
  const { error } = await db.from('move_quote_enquiries').select('id', { head: true, count: 'exact' }).limit(0);
  return NextResponse.json({
    accepting_requests: !error,
    note: 'An enquiry only. No driver booking, operator quote, fare or payment is confirmed.',
  }, { headers: noStore });
}

export async function POST(request: Request) {
  const size = Number(request.headers.get('content-length') || '0');
  if (size > 12000) return NextResponse.json({ error: 'Request is too large.' }, { status: 413, headers: noStore });
  let input: unknown;
  try {
    const raw = await request.text();
    if (raw.length > 12000) return NextResponse.json({ error: 'Request is too large.' }, { status: 413, headers: noStore });
    input = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'Check the enquiry form.' }, { status: 400, headers: noStore });
  }
  const validated = validateMoveQuote(input);
  if (!validated.ok) return NextResponse.json({ error: validated.error }, { status: 400, headers: noStore });
  const limited = rateLimitResponse(validated.value.contact_phone, 'move-scheduled-quote');
  if (limited) return limited;

  const db = await serviceDb();
  if (!db) return NextResponse.json({ error: 'Scheduled quotations are temporarily unavailable.' }, { status: 503, headers: noStore });

  // Additional shared-database safeguard: a phone cannot flood the private inbox
  // even when requests hit different Cloudflare Worker instances.
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error: countError } = await db.from('move_quote_enquiries')
    .select('id', { count: 'exact', head: true })
    .eq('contact_phone', validated.value.contact_phone)
    .gte('created_at', since);
  if (countError) return NextResponse.json({ error: 'Unable to process your enquiry at the moment.' }, { status: 503, headers: noStore });
  if ((count || 0) >= 4) return NextResponse.json({ error: 'Too many recent enquiries from this number. Contact Zeshu Help if you need assistance.' }, { status: 429, headers: noStore });

  const { data, error } = await db.from('move_quote_enquiries')
    .insert(validated.value)
    .select('id')
    .single();
  if (error || !data?.id) return NextResponse.json({ error: 'Unable to save the enquiry. Please try again.' }, { status: 503, headers: noStore });
  return NextResponse.json({
    saved: true,
    reference: 'ZMQ-' + String(data.id).slice(0, 8).toUpperCase(),
    message: 'Request received for manual review. No vehicle, price, driver or booking has been confirmed. No payment has been taken.',
  }, { status: 201, headers: noStore });
}
