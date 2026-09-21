import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getGoogleRoutesEta } from '../../../../lib/google-routes';
import { getRuntimeSupabaseEnv } from '@/app/lib/runtime-env';

const ACTIVE_STATUSES = new Set(['PICKED_UP', 'OUT_FOR_DELIVERY']);

export async function GET(request: Request, context: { params: Promise<{ orderId: string }> }) {
  const { url, anonKey, serviceRoleKey } = await getRuntimeSupabaseEnv();
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim();
  const { orderId } = await context.params;
  if (!token || !orderId || !url || !anonKey || !serviceRoleKey) return NextResponse.json({ code: 'AUTH_REQUIRED', source: 'UNAVAILABLE' }, { status: 401 });
  const authClient = createClient(url, anonKey);
  const { data: authData } = await authClient.auth.getUser(token);
  const user = authData.user;
  if (!user) return NextResponse.json({ code: 'AUTH_REQUIRED', source: 'UNAVAILABLE' }, { status: 401 });
  const service = createClient(url, serviceRoleKey);
  const { data: admin } = await service.from('admin_roles').select('user_id').eq('user_id', user.id).eq('role', 'admin').maybeSingle();
  const { data: order, error } = await service.from('orders').select('id,user_id,status,rider_id,assigned_rider_id,delivery_latitude,delivery_longitude').eq('id', orderId).maybeSingle();
  if (error) return NextResponse.json({ code: 'NOT_READY', source: 'UNAVAILABLE' }, { status: 503 });
  if (!order) return NextResponse.json({ code: 'NOT_FOUND', source: 'UNAVAILABLE' }, { status: 404 });
  const customerAllowed = order.user_id === user.id;
  const riderAllowed = order.assigned_rider_id === user.id;
  if (!admin && !customerAllowed && !riderAllowed) return NextResponse.json({ code: 'FORBIDDEN', source: 'UNAVAILABLE' }, { status: 403 });
  if (!ACTIVE_STATUSES.has(String(order.status))) return NextResponse.json({ source: 'UNAVAILABLE' }, { status: 200 });
  const riderQuery = order.rider_id ? service.from('riders').select('current_latitude,current_longitude').eq('id', order.rider_id).maybeSingle() : { data: null, error: null } as any;
  const { data: rider } = await riderQuery;
  const origin = { latitude: Number(rider?.current_latitude), longitude: Number(rider?.current_longitude) };
  const destination = { latitude: Number(order.delivery_latitude), longitude: Number(order.delivery_longitude) };
  if (!Number.isFinite(origin.latitude) || !Number.isFinite(origin.longitude) || !Number.isFinite(destination.latitude) || !Number.isFinite(destination.longitude)) return NextResponse.json({ source: 'UNAVAILABLE' }, { status: 200 });
  const eta = await getGoogleRoutesEta(origin, destination);
  if (!eta) return NextResponse.json({ source: 'UNAVAILABLE' }, { status: 200 });
  return NextResponse.json({ durationSeconds: eta.durationSeconds, distanceMeters: eta.distanceMeters, calculatedAt: eta.calculatedAt, source: 'GOOGLE_ROUTES' });
}
