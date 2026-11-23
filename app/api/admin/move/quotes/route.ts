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
    .select('id,service_code,pickup_town,pickup_landmark,destination,travel_date,travel_time,contact_name,contact_phone,passengers,load_description,notes,status,created_at,admin_notes,last_customer_contact_at')
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
  const notes = typeof body?.admin_notes === 'string' ? body.admin_notes.trim() : '';
  const contacted = body?.mark_contacted === true;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) ||
      !statuses.has(status) || notes.length > 1000 ||
      (body?.mark_contacted !== undefined && typeof body.mark_contacted !== 'boolean'))
    return NextResponse.json({ error: 'Invalid update.' }, { status: 400, headers });
  if (status === 'QUOTED' && notes.length < 20)
    return NextResponse.json({ error: 'Before marking quoted, record the verified operator and itemised quotation details in private notes.' }, { status: 400, headers });
  const { data, error } = await db.from('move_quote_enquiries')
    .update({
      status,
      admin_notes: notes,
      updated_at: new Date().toISOString(),
      ...(contacted ? { last_customer_contact_at: new Date().toISOString() } : {}),
    })
    .eq('id', id).select('id').maybeSingle();
  if (error || !data) return NextResponse.json({ error: 'Enquiry not updated.' }, { status: 409, headers });
  return NextResponse.json({ ok: true }, { headers });
}
