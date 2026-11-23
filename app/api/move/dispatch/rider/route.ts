import { NextResponse } from 'next/server';
import { dispatchNextWave, hashMoveOtp, requireMoveUser } from '@/app/lib/move-matching-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function riderForUser(service: any, userId: string) {
  const { data } = await service.from('riders').select('id,user_id,is_active,admin_suspended').eq('user_id', userId).maybeSingle();
  return data;
}

export async function GET(request: Request) {
  const auth = await requireMoveUser(request);
  if (!auth.context) return auth.response!;
  const { user, service } = auth.context;
  const rider = await riderForUser(service, user.id);
  if (!rider) return NextResponse.json({ error: 'Rider profile not found.' }, { status: 403 });

  const now = new Date().toISOString();
  await service.from('move_dispatch_offers').update({ status: 'EXPIRED', responded_at: now }).eq('rider_id', rider.id).eq('status', 'OFFERED').lte('expires_at', now);

  const { data: offers, error: offersError } = await service
    .from('move_dispatch_offers')
    .select('id,request_id,distance_to_pickup_km,offered_at,expires_at,status')
    .eq('rider_id', rider.id)
    .eq('status', 'OFFERED')
    .gt('expires_at', now)
    .order('offered_at', { ascending: false })
    .limit(10);
  if (offersError) return NextResponse.json({ error: 'Move offers are unavailable.' }, { status: 503 });

  const ids = (offers || []).map((offer: { request_id: string }) => offer.request_id);
  const { data: offerRequests } = ids.length ? await service
    .from('move_dispatch_requests')
    .select('id,service_code,status,pickup_address,dropoff_address,distance_km,duration_minutes,quoted_fare,driver_payout,details')
    .in('id', ids) : { data: [] };

  const offerPayload = (offers || []).map((offer: { request_id: string } & Record<string, unknown>) => ({
    ...offer,
    request: (offerRequests || []).find((item: { id: string }) => item.id === offer.request_id) || null,
  })).filter((offer: { request: unknown }) => Boolean(offer.request));

  const { data: activeTrip } = await service
    .from('move_dispatch_requests')
    .select('id,service_code,status,pickup_address,pickup_latitude,pickup_longitude,dropoff_address,dropoff_latitude,dropoff_longitude,distance_km,duration_minutes,quoted_fare,driver_payout,details,accepted_at,arrived_at,started_at')
    .eq('assigned_rider_id', rider.id)
    .in('status', ['DRIVER_ASSIGNED','DRIVER_ARRIVING','ARRIVED','IN_PROGRESS'])
    .order('accepted_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({ rider: { id: rider.id, is_active: rider.is_active }, offers: offerPayload, active_trip: activeTrip || null }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
}

export async function POST(request: Request) {
  const auth = await requireMoveUser(request);
  if (!auth.context) return auth.response!;
  const { user, service } = auth.context;
  const rider = await riderForUser(service, user.id);
  if (!rider) return NextResponse.json({ error: 'Rider profile not found.' }, { status: 403 });
  if (!rider.is_active || rider.admin_suspended) return NextResponse.json({ error: 'Go online with an active verified rider profile first.' }, { status: 409 });

  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const action = typeof body.action === 'string' ? body.action.trim().toUpperCase() : '';

  if (action === 'ACCEPT') {
    const offerId = typeof body.offer_id === 'string' ? body.offer_id.trim() : '';
    if (!offerId) return NextResponse.json({ error: 'Offer id is required.' }, { status: 400 });

    const { data: offer } = await service.from('move_dispatch_offers').select('id,request_id,status,expires_at').eq('id', offerId).eq('rider_id', rider.id).maybeSingle();
    if (!offer || offer.status !== 'OFFERED' || new Date(offer.expires_at).getTime() <= Date.now()) {
      return NextResponse.json({ error: 'This offer is no longer available.' }, { status: 409 });
    }

    const { data: requestRow } = await service.from('move_dispatch_requests').select('service_code').eq('id', offer.request_id).maybeSingle();
    if (!requestRow) return NextResponse.json({ error: 'Move request not found.' }, { status: 404 });
    const { data: eligibility } = await service.from('driver_service_eligibility').select('id').eq('user_id', user.id).eq('service_code', requestRow.service_code).eq('status', 'ACTIVE').maybeSingle();
    if (!eligibility) return NextResponse.json({ error: 'This service is not active on your verified driver profile.' }, { status: 403 });

    const { data, error } = await service.rpc('accept_move_dispatch_offer', { p_offer_id: offerId, p_rider_id: rider.id });
    if (error || !data) return NextResponse.json({ error: error?.message?.includes('already') ? 'Another rider accepted this request first.' : 'Could not accept this request.' }, { status: 409 });
    await service.from('move_dispatch_events').insert({ request_id: offer.request_id, actor_type: 'RIDER', actor_user_id: user.id, event_type: 'OFFER_ACCEPTED' });
    return NextResponse.json({ success: true, request: data });
  }

  if (action === 'DECLINE') {
    const offerId = typeof body.offer_id === 'string' ? body.offer_id.trim() : '';
    const { data: offer } = await service.from('move_dispatch_offers').select('id,request_id').eq('id', offerId).eq('rider_id', rider.id).eq('status', 'OFFERED').maybeSingle();
    if (!offer) return NextResponse.json({ error: 'Offer is no longer available.' }, { status: 409 });
    await service.from('move_dispatch_offers').update({ status: 'DECLINED', responded_at: new Date().toISOString() }).eq('id', offer.id);
    await service.from('move_dispatch_events').insert({ request_id: offer.request_id, actor_type: 'RIDER', actor_user_id: user.id, event_type: 'OFFER_DECLINED' });
    await dispatchNextWave(service, offer.request_id);
    return NextResponse.json({ success: true });
  }

  const requestId = typeof body.request_id === 'string' ? body.request_id.trim() : '';
  if (!requestId) return NextResponse.json({ error: 'Request id is required.' }, { status: 400 });
  const { data: trip } = await service.from('move_dispatch_requests').select('*').eq('id', requestId).eq('assigned_rider_id', rider.id).maybeSingle();
  if (!trip) return NextResponse.json({ error: 'Active Move trip not found.' }, { status: 404 });

  const now = new Date().toISOString();
  let nextStatus = '';
  let patch: Record<string, unknown> = { updated_at: now };
  if (action === 'ARRIVING' && trip.status === 'DRIVER_ASSIGNED') nextStatus = 'DRIVER_ARRIVING';
  if (action === 'ARRIVED' && ['DRIVER_ASSIGNED','DRIVER_ARRIVING'].includes(trip.status)) { nextStatus = 'ARRIVED'; patch.arrived_at = now; }
  if (action === 'START' && trip.status === 'ARRIVED') {
    const otp = typeof body.otp === 'string' ? body.otp.replace(/\D/g, '').slice(0, 6) : '';
    if (otp.length !== 6 || !trip.start_otp_hash || hashMoveOtp(otp) !== trip.start_otp_hash) {
      return NextResponse.json({ error: 'Ask the customer for the correct 6-digit trip OTP.' }, { status: 400 });
    }
    nextStatus = 'IN_PROGRESS';
    patch.started_at = now;
  }
  if (action === 'COMPLETE' && trip.status === 'IN_PROGRESS') { nextStatus = 'COMPLETED'; patch.completed_at = now; patch.start_otp_hash = null; }

  if (action === 'CANCEL' && ['DRIVER_ASSIGNED','DRIVER_ARRIVING','ARRIVED'].includes(trip.status)) {
    const extended = new Date(Date.now() + 60_000).toISOString();
    const { error } = await service.from('move_dispatch_requests').update({
      status: 'SEARCHING',
      assigned_rider_id: null,
      accepted_at: null,
      arrived_at: null,
      search_expires_at: extended,
      updated_at: now,
    }).eq('id', requestId).eq('assigned_rider_id', rider.id);
    if (error) return NextResponse.json({ error: 'Could not release this request.' }, { status: 500 });
    await service.from('move_dispatch_events').insert({ request_id: requestId, actor_type: 'RIDER', actor_user_id: user.id, event_type: 'RIDER_CANCELLED' });
    await dispatchNextWave(service, requestId);
    return NextResponse.json({ success: true, status: 'SEARCHING' });
  }

  if (!nextStatus) return NextResponse.json({ error: 'That trip action is not valid right now.' }, { status: 409 });
  patch.status = nextStatus;
  const { error } = await service.from('move_dispatch_requests').update(patch).eq('id', requestId).eq('assigned_rider_id', rider.id).eq('status', trip.status);
  if (error) return NextResponse.json({ error: 'Trip status could not be updated.' }, { status: 500 });
  await service.from('move_dispatch_events').insert({ request_id: requestId, actor_type: 'RIDER', actor_user_id: user.id, event_type: nextStatus });
  return NextResponse.json({ success: true, status: nextStatus });
}
