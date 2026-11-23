import 'server-only';

import { createHash, createHmac } from 'node:crypto';
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getRuntimeSupabaseEnv } from '@/app/lib/runtime-env';
import { getGoogleRoutesEta } from '@/app/lib/google-routes';

export const MOVE_SERVICE_CODES = ['BIKE_COURIER','GOODS_DRIVER','AUTO_DRIVER','CAB_DRIVER'] as const;
export type MoveServiceCode = typeof MOVE_SERVICE_CODES[number];

const SERVICE_ELIGIBILITY: Record<MoveServiceCode, string> = {
  BIKE_COURIER: 'BIKE_COURIER',
  GOODS_DRIVER: 'GOODS_DRIVER',
  AUTO_DRIVER: 'AUTO_DRIVER',
  CAB_DRIVER: 'CAB_DRIVER',
};

const PRICING: Record<MoveServiceCode, { baseDriver: number; perKm: number; includedKm: number; minFare: number; feePct: number; feeMin: number; feeMax: number }> = {
  BIKE_COURIER: { baseDriver: 30, perKm: 7, includedKm: 2, minFare: 39, feePct: 0.10, feeMin: 5, feeMax: 20 },
  GOODS_DRIVER: { baseDriver: 65, perKm: 15, includedKm: 2, minFare: 79, feePct: 0.10, feeMin: 10, feeMax: 40 },
  AUTO_DRIVER: { baseDriver: 0, perKm: 0, includedKm: 0, minFare: 0, feePct: 0, feeMin: 0, feeMax: 0 },
  CAB_DRIVER: { baseDriver: 0, perKm: 0, includedKm: 0, minFare: 0, feePct: 0, feeMin: 0, feeMax: 0 },
};

const roundMoney = (value: number) => Math.round(value * 100) / 100;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export type MoveAuthContext = { user: User; service: SupabaseClient };

export async function requireMoveUser(request: Request): Promise<{ context?: MoveAuthContext; response?: NextResponse }> {
  const authorization = request.headers.get('authorization');
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  const { url, anonKey, serviceRoleKey } = await getRuntimeSupabaseEnv();
  if (!token || !url || !anonKey || !serviceRoleKey) {
    return { response: NextResponse.json({ error: 'Sign in is required.' }, { status: 401 }) };
  }
  const options = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } } as const;
  const authClient = createClient(url, anonKey, options);
  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data.user || data.user.is_anonymous) {
    return { response: NextResponse.json({ error: 'A verified customer account is required.' }, { status: 401 }) };
  }
  return { context: { user: data.user, service: createClient(url, serviceRoleKey, options) } };
}

export function isMoveServiceCode(value: unknown): value is MoveServiceCode {
  return typeof value === 'string' && (MOVE_SERVICE_CODES as readonly string[]).includes(value);
}

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const r = 6371;
  const toRad = (v: number) => v * Math.PI / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(s));
}

export async function quoteMove(serviceCode: MoveServiceCode, pickup: { latitude: number; longitude: number }, dropoff: { latitude: number; longitude: number }) {
  const route = await getGoogleRoutesEta(pickup, dropoff);
  const straightKm = haversineKm(pickup.latitude, pickup.longitude, dropoff.latitude, dropoff.longitude);
  const distanceKm = route ? route.distanceMeters / 1000 : straightKm * 1.25;
  const durationMinutes = route ? Math.max(1, Math.ceil(route.durationSeconds / 60)) : Math.max(5, Math.ceil(distanceKm * 3));

  if (serviceCode === 'AUTO_DRIVER' || serviceCode === 'CAB_DRIVER') {
    return { distanceKm: roundMoney(distanceKm), durationMinutes, quotedFare: null, driverPayout: null, platformFee: null, source: route?.source || 'distance_estimate' };
  }

  const p = PRICING[serviceCode];
  const extraKm = Math.max(0, distanceKm - p.includedKm);
  const driverPayout = roundMoney(p.baseDriver + extraKm * p.perKm);
  const platformFee = roundMoney(clamp(driverPayout * p.feePct, p.feeMin, p.feeMax));
  const quotedFare = roundMoney(Math.max(p.minFare, driverPayout + platformFee));
  return { distanceKm: roundMoney(distanceKm), durationMinutes, quotedFare, driverPayout, platformFee, source: route?.source || 'distance_estimate' };
}

export function moveOtpForRequest(requestId: string, secret: string) {
  const digest = createHmac('sha256', secret).update(`zeshu-move:${requestId}`).digest();
  const value = digest.readUInt32BE(0) % 1_000_000;
  return String(value).padStart(6, '0');
}

export function hashMoveOtp(code: string) {
  return createHash('sha256').update(code).digest('hex');
}

export async function dispatchNextWave(service: SupabaseClient, requestId: string) {
  const { data: request, error: requestError } = await service.from('move_dispatch_requests').select('*').eq('id', requestId).maybeSingle();
  if (requestError || !request) return null;
  if (!['SEARCHING','OFFERED'].includes(request.status) || request.assigned_rider_id) return request;

  const now = new Date();
  if (new Date(request.search_expires_at).getTime() <= now.getTime()) {
    await service.from('move_dispatch_offers').update({ status: 'EXPIRED', responded_at: now.toISOString() }).eq('request_id', requestId).eq('status', 'OFFERED');
    const { data } = await service.from('move_dispatch_requests').update({ status: 'NO_DRIVER', updated_at: now.toISOString() }).eq('id', requestId).in('status', ['SEARCHING','OFFERED']).select('*').maybeSingle();
    if (data) await service.from('move_dispatch_events').insert({ request_id: requestId, actor_type: 'SYSTEM', event_type: 'NO_DRIVER' });
    return data || request;
  }

  const { data: settings } = await service.from('move_dispatch_settings').select('*').eq('service_code', request.service_code).maybeSingle();
  if (!settings?.request_enabled || !settings?.matching_enabled) return request;

  await service.from('move_dispatch_offers').update({ status: 'EXPIRED', responded_at: now.toISOString() }).eq('request_id', requestId).eq('status', 'OFFERED').lte('expires_at', now.toISOString());
  const { data: activeOffers } = await service.from('move_dispatch_offers').select('id').eq('request_id', requestId).eq('status', 'OFFERED').gt('expires_at', now.toISOString()).limit(1);
  if (activeOffers?.length) return request;

  const { data: priorOffers } = await service.from('move_dispatch_offers').select('rider_id').eq('request_id', requestId);
  const prior = new Set((priorOffers || []).map((item: { rider_id: string }) => item.rider_id));

  const cutoff = new Date(Date.now() - 90_000).toISOString();
  const { data: riders } = await service
    .from('riders')
    .select('id,user_id,current_latitude,current_longitude,location_updated_at')
    .eq('is_active', true)
    .eq('admin_suspended', false)
    .not('current_latitude', 'is', null)
    .not('current_longitude', 'is', null)
    .gte('location_updated_at', cutoff)
    .limit(150);

  if (!riders?.length) return request;

  const userIds = riders.map((r: { user_id?: string | null }) => r.user_id).filter(Boolean) as string[];
  const { data: eligible } = userIds.length ? await service
    .from('driver_service_eligibility')
    .select('user_id')
    .eq('service_code', SERVICE_ELIGIBILITY[request.service_code as MoveServiceCode])
    .eq('status', 'ACTIVE')
    .in('user_id', userIds) : { data: [] as Array<{ user_id: string }> };
  const eligibleUsers = new Set((eligible || []).map((item: { user_id: string }) => item.user_id));

  const { data: activeTrips } = await service
    .from('move_dispatch_requests')
    .select('assigned_rider_id')
    .in('status', ['DRIVER_ASSIGNED','DRIVER_ARRIVING','ARRIVED','IN_PROGRESS'])
    .not('assigned_rider_id', 'is', null);
  const busy = new Set((activeTrips || []).map((item: { assigned_rider_id: string }) => item.assigned_rider_id));

  const radii = [2.5, 5, 10, Number(settings.max_radius_km || 15)];
  let wave = Number(request.search_wave || 0);
  let candidates: Array<{ id: string; distance: number }> = [];

  while (wave < radii.length && candidates.length === 0) {
    const radius = radii[wave];
    candidates = riders
      .filter((r: { id: string; user_id?: string | null }) => r.user_id && r.user_id !== request.customer_user_id && eligibleUsers.has(r.user_id) && !busy.has(r.id) && !prior.has(r.id))
      .map((r: { id: string; current_latitude: number; current_longitude: number }) => ({
        id: r.id,
        distance: haversineKm(Number(request.pickup_latitude), Number(request.pickup_longitude), Number(r.current_latitude), Number(r.current_longitude)),
      }))
      .filter((r) => r.distance <= radius)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, Number(settings.candidates_per_wave || 3));
    wave += 1;
  }

  await service.from('move_dispatch_requests').update({ search_wave: wave, updated_at: now.toISOString() }).eq('id', requestId);

  if (!candidates.length) return request;

  const expiresAt = new Date(Date.now() + Number(settings.offer_seconds || 20) * 1000).toISOString();
  const { error: offerError } = await service.from('move_dispatch_offers').insert(candidates.map((candidate) => ({
    request_id: requestId,
    rider_id: candidate.id,
    distance_to_pickup_km: roundMoney(candidate.distance),
    expires_at: expiresAt,
  })));
  if (offerError) {
    console.error('Move offer insert failed:', offerError.message);
    return request;
  }

  await service.from('move_dispatch_requests').update({ status: 'OFFERED', updated_at: now.toISOString() }).eq('id', requestId).in('status', ['SEARCHING','OFFERED']);
  await service.from('move_dispatch_events').insert({
    request_id: requestId,
    actor_type: 'SYSTEM',
    event_type: 'OFFER_WAVE_SENT',
    event_data: { wave, candidate_count: candidates.length, expires_at: expiresAt },
  });
  return request;
}
