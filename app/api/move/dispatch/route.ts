import { NextResponse } from 'next/server';
import { getRuntimeSupabaseEnv } from '@/app/lib/runtime-env';
import { evaluateTelanganaMoveArea } from '@/app/lib/move-service-area';
import {
  dispatchNextWave,
  hashMoveOtp,
  isMoveServiceCode,
  moveOtpForRequest,
  quoteMove,
  requireMoveUser,
} from '@/app/lib/move-matching-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const coord = (value: unknown, min: number, max: number) => {
  const n = Number(value);
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
};
const text = (value: unknown, max = 300) => typeof value === 'string' ? value.trim().slice(0, max) : '';

const passengerExecutionAllowed = () =>
  process.env.MOVE_EXECUTION_ENABLED?.trim().toLowerCase() === 'true'
  && process.env.MOVE_RIDES_EXECUTION_ENABLED?.trim().toLowerCase() === 'true'
  && Boolean(process.env.ZESHU_RIDES_PROVIDER?.trim());

export async function POST(request: Request) {
  const auth = await requireMoveUser(request);
  if (!auth.context) return auth.response!;
  const { user, service } = auth.context;
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;

  const serviceCode = text(body.service_code, 40);
  if (!isMoveServiceCode(serviceCode)) return NextResponse.json({ error: 'Choose a supported Move service.' }, { status: 400 });
  if ((serviceCode === 'AUTO_DRIVER' || serviceCode === 'CAB_DRIVER') && !passengerExecutionAllowed()) {
    return NextResponse.json({ error: 'Auto/Cab live matching is not enabled until the compliant Telangana mobility provider gate is complete.' }, { status: 409 });
  }

  const pickupLatitude = coord(body.pickup_latitude, -90, 90);
  const pickupLongitude = coord(body.pickup_longitude, -180, 180);
  const dropoffLatitude = coord(body.dropoff_latitude, -90, 90);
  const dropoffLongitude = coord(body.dropoff_longitude, -180, 180);
  const pickupAddress = text(body.pickup_address);
  const dropoffAddress = text(body.dropoff_address);
  const details = text(body.details, 1000);

  if (pickupLatitude === null || pickupLongitude === null || dropoffLatitude === null || dropoffLongitude === null || !pickupAddress || !dropoffAddress) {
    return NextResponse.json({ error: 'Confirm pickup and drop locations on the map.' }, { status: 400 });
  }

  const pickupArea = evaluateTelanganaMoveArea(pickupLatitude, pickupLongitude, body.pickup_state);
  const dropoffArea = evaluateTelanganaMoveArea(dropoffLatitude, dropoffLongitude, body.dropoff_state);
  if (pickupArea !== 'ELIGIBLE' || dropoffArea !== 'ELIGIBLE') {
    return NextResponse.json({ error: 'Pickup and drop must currently be inside Telangana.' }, { status: 400 });
  }

  const { data: settings, error: settingsError } = await service
    .from('move_dispatch_settings')
    .select('*')
    .eq('service_code', serviceCode)
    .maybeSingle();
  if (settingsError || !settings?.request_enabled || !settings?.matching_enabled) {
    return NextResponse.json({ error: 'Live matching for this service is not open yet.' }, { status: 409 });
  }

  const { data: active } = await service
    .from('move_dispatch_requests')
    .select('id,status')
    .eq('customer_user_id', user.id)
    .in('status', ['SEARCHING','OFFERED','DRIVER_ASSIGNED','DRIVER_ARRIVING','ARRIVED','IN_PROGRESS'])
    .limit(1);
  if (active?.length) return NextResponse.json({ error: 'Finish or cancel your current Move request before starting another one.', request_id: active[0].id }, { status: 409 });

  const quote = await quoteMove(
    serviceCode,
    { latitude: pickupLatitude, longitude: pickupLongitude },
    { latitude: dropoffLatitude, longitude: dropoffLongitude },
  );
  if ((serviceCode === 'BIKE_COURIER' || serviceCode === 'GOODS_DRIVER') && quote.quotedFare === null) {
    return NextResponse.json({ error: 'A reliable fare estimate is unavailable right now.' }, { status: 503 });
  }

  const searchExpiresAt = new Date(Date.now() + Number(settings.max_search_seconds || 90) * 1000).toISOString();
  const { data: created, error } = await service.from('move_dispatch_requests').insert({
    customer_user_id: user.id,
    service_code: serviceCode,
    pickup_address: pickupAddress,
    pickup_latitude: pickupLatitude,
    pickup_longitude: pickupLongitude,
    dropoff_address: dropoffAddress,
    dropoff_latitude: dropoffLatitude,
    dropoff_longitude: dropoffLongitude,
    details: details || null,
    distance_km: quote.distanceKm,
    duration_minutes: quote.durationMinutes,
    quoted_fare: quote.quotedFare,
    driver_payout: quote.driverPayout,
    platform_fee: quote.platformFee,
    search_expires_at: searchExpiresAt,
  }).select('*').single();

  if (error || !created) {
    console.error('Move request creation failed:', error?.message);
    return NextResponse.json({ error: 'Could not start matching.' }, { status: 500 });
  }

  const { serviceRoleKey } = await getRuntimeSupabaseEnv();
  const otp = moveOtpForRequest(created.id, serviceRoleKey);
  await service.from('move_dispatch_requests').update({ start_otp_hash: hashMoveOtp(otp) }).eq('id', created.id);
  await service.from('move_dispatch_events').insert({
    request_id: created.id,
    actor_type: 'CUSTOMER',
    actor_user_id: user.id,
    event_type: 'REQUEST_CREATED',
    event_data: { service_code: serviceCode, quote_source: quote.source },
  });
  await dispatchNextWave(service, created.id);

  return NextResponse.json({
    success: true,
    request_id: created.id,
    status: 'SEARCHING',
    quote: {
      distance_km: quote.distanceKm,
      duration_minutes: quote.durationMinutes,
      fare: quote.quotedFare,
      driver_payout: quote.driverPayout,
      platform_fee: quote.platformFee,
    },
  }, { status: 201 });
}

export async function GET(request: Request) {
  const auth = await requireMoveUser(request);
  if (!auth.context) return auth.response!;
  const { user, service } = auth.context;
  const url = new URL(request.url);
  const requestId = url.searchParams.get('id')?.trim();
  if (!requestId) return NextResponse.json({ error: 'Request id is required.' }, { status: 400 });

  const { data: owned, error } = await service.from('move_dispatch_requests').select('*').eq('id', requestId).eq('customer_user_id', user.id).maybeSingle();
  if (error || !owned) return NextResponse.json({ error: 'Move request not found.' }, { status: 404 });

  if (['SEARCHING','OFFERED'].includes(owned.status)) await dispatchNextWave(service, requestId);

  const { data: current } = await service.from('move_dispatch_requests').select('*').eq('id', requestId).eq('customer_user_id', user.id).single();
  let driver = null;
  let startOtp: string | null = null;

  if (current.assigned_rider_id) {
    const { data: rider } = await service.from('riders').select('id,full_name,vehicle_number,current_latitude,current_longitude,location_updated_at').eq('id', current.assigned_rider_id).maybeSingle();
    if (rider) driver = rider;
    if (['DRIVER_ASSIGNED','DRIVER_ARRIVING','ARRIVED'].includes(current.status)) {
      const { serviceRoleKey } = await getRuntimeSupabaseEnv();
      startOtp = moveOtpForRequest(current.id, serviceRoleKey);
    }
  }

  return NextResponse.json({
    request: {
      id: current.id,
      service_code: current.service_code,
      status: current.status,
      pickup_address: current.pickup_address,
      dropoff_address: current.dropoff_address,
      distance_km: current.distance_km,
      duration_minutes: current.duration_minutes,
      quoted_fare: current.quoted_fare,
      driver_payout: current.driver_payout,
      platform_fee: current.platform_fee,
      search_expires_at: current.search_expires_at,
      accepted_at: current.accepted_at,
      arrived_at: current.arrived_at,
      started_at: current.started_at,
      completed_at: current.completed_at,
      cancelled_at: current.cancelled_at,
    },
    driver,
    start_otp: startOtp,
  }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
}

export async function DELETE(request: Request) {
  const auth = await requireMoveUser(request);
  if (!auth.context) return auth.response!;
  const { user, service } = auth.context;
  const url = new URL(request.url);
  const requestId = url.searchParams.get('id')?.trim();
  if (!requestId) return NextResponse.json({ error: 'Request id is required.' }, { status: 400 });

  const { data: current } = await service.from('move_dispatch_requests').select('*').eq('id', requestId).eq('customer_user_id', user.id).maybeSingle();
  if (!current) return NextResponse.json({ error: 'Move request not found.' }, { status: 404 });
  if (!['SEARCHING','OFFERED','DRIVER_ASSIGNED','DRIVER_ARRIVING','ARRIVED'].includes(current.status)) {
    return NextResponse.json({ error: 'This request can no longer be cancelled from the app.' }, { status: 409 });
  }

  const now = new Date().toISOString();
  await service.from('move_dispatch_offers').update({ status: 'CANCELLED' }).eq('request_id', requestId).eq('status', 'OFFERED');
  const { error } = await service.from('move_dispatch_requests').update({
    status: 'CANCELLED',
    cancelled_at: now,
    cancellation_reason: 'CUSTOMER_CANCELLED',
    updated_at: now,
  }).eq('id', requestId).eq('customer_user_id', user.id);
  if (error) return NextResponse.json({ error: 'Could not cancel the request.' }, { status: 500 });

  await service.from('move_dispatch_events').insert({ request_id: requestId, actor_type: 'CUSTOMER', actor_user_id: user.id, event_type: 'CUSTOMER_CANCELLED' });
  return NextResponse.json({ success: true });
}
