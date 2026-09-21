import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { evaluateJagtialServiceArea } from '@/app/lib/service-area';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const finiteCoordinate = (value: unknown, min: number, max: number) => {
  const number = Number(value);
  return Number.isFinite(number) && number >= min && number <= max ? number : null;
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const latitude = finiteCoordinate(body.latitude, -90, 90);
  const longitude = finiteCoordinate(body.longitude, -180, 180);
  const localStatus = latitude === null || longitude === null
    ? 'SERVICE_AREA_UNAVAILABLE'
    : evaluateJagtialServiceArea(latitude, longitude);

  const service = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const activeOrderStatuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'PICKED_UP', 'OUT_FOR_DELIVERY'];
  const [settingsResult, vendorsResult, ridersResult, activeOrdersResult] = await Promise.all([
    service.from('fulfillment_settings').select('nationwide_checkout_enabled').eq('id', 'default').maybeSingle(),
    service.from('vendors').select('id,is_open,admin_suspended,local_30_min_enabled'),
    service.from('riders').select('id,user_id').eq('is_active', true).eq('admin_suspended', false),
    service.from('orders').select('assigned_rider_id,rider_id,status').in('status', activeOrderStatuses),
  ]);

  if (settingsResult.error || vendorsResult.error || ridersResult.error || activeOrdersResult.error) {
    return NextResponse.json({
      local_status: localStatus,
      local_30_min_available: false,
      nationwide_checkout_enabled: false,
      vendor_30_min: {},
    }, { status: 200 });
  }

  const busyRiderIds = new Set<string>();
  for (const order of activeOrdersResult.data || []) {
    if (order.assigned_rider_id) busyRiderIds.add(String(order.assigned_rider_id));
    if (order.rider_id) busyRiderIds.add(String(order.rider_id));
  }
  const hasAvailableRider = (ridersResult.data || []).some((rider: any) =>
    !busyRiderIds.has(String(rider.id)) && !busyRiderIds.has(String(rider.user_id || ''))
  );
  const localServiceable = localStatus === 'ELIGIBLE';
  const vendor30Min = Object.fromEntries((vendorsResult.data || []).map((vendor: any) => [
    String(vendor.id),
    Boolean(localServiceable && hasAvailableRider && vendor.is_open === true && vendor.admin_suspended !== true && vendor.local_30_min_enabled === true),
  ]));

  return NextResponse.json({
    local_status: localStatus,
    local_30_min_available: Object.values(vendor30Min).some(Boolean),
    nationwide_checkout_enabled: settingsResult.data?.nationwide_checkout_enabled === true,
    vendor_30_min: vendor30Min,
  });
}
