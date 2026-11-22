import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getRuntimeSupabaseEnv } from '@/app/lib/runtime-env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'no-store, max-age=0' };
const statuses = new Set(['NEW','REVIEWING','SOURCING','QUOTED','CLOSED','CANCELLED']);

async function adminDb(request: Request) {
  const token = request.headers.get('authorization');
  const { url, anonKey, serviceRoleKey } = await getRuntimeSupabaseEnv();
  if (!url || !anonKey || !serviceRoleKey || !token?.startsWith('Bearer ')) return null;
  const auth = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: { user }, error } = await auth.auth.getUser(token.slice(7).trim());
  if (error || !user) return null;
  const service = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: role, error: roleError } = await service.from('admin_roles').select('user_id')
    .eq('user_id', user.id).eq('role','admin').maybeSingle();
  if (roleError || !role) return null;
  return service;
}

export async function GET(request: Request) {
  const db = await adminDb(request);
  if (!db) return NextResponse.json({ error: 'Admin access required.' }, { status: 403, headers });
  const { data, error } = await db.from('move_quote_enquiries')
    .select('id,service_code,pickup_town,pickup_landmark,destination,travel_date,travel_time,contact_name,contact_phone,passengers,load_description,notes,status,created_at')
    .order('created_at', { ascending: false }).limit(250);
  if (error) return NextResponse.json({ error: 'Unable to load transport enquiries.' }, { status: 503, headers });
  return NextResponse.json({ enquiries: data || [] }, { headers });
}

export async function PATCH(request: Request) {
  const db = await adminDb(request);
  if (!db) return NextResponse.json({ error: 'Admin access required.' }, { status: 403, headers });
  const body = await request.json().catch(() => null);
  const id = typeof body?.id === 'string' ? body.id : '';
  const status = typeof body?.status === 'string' ? body.status : '';
  if (!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(id) || !statuses.has(status))
    return NextResponse.json({ error: 'Invalid update.' }, { status: 400, headers });
  const { data, error } = await db.from('move_quote_enquiries')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id).select('id').maybeSingle();
  if (error || !data) return NextResponse.json({ error: 'Enquiry not updated.' }, { status: 409, headers });
  return NextResponse.json({ ok: true }, { headers });
}
