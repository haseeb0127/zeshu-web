import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getRuntimeSupabaseEnv } from '@/app/lib/runtime-env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const passengerExecutionAllowed = () =>
  process.env.MOVE_EXECUTION_ENABLED?.trim().toLowerCase() === 'true'
  && process.env.MOVE_RIDES_EXECUTION_ENABLED?.trim().toLowerCase() === 'true'
  && Boolean(process.env.ZESHU_RIDES_PROVIDER?.trim());

export async function GET() {
  const { url, serviceRoleKey } = await getRuntimeSupabaseEnv();
  if (!url || !serviceRoleKey) {
    return NextResponse.json({ services: {} }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
  }
  const service = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: settings } = await service.from('move_dispatch_settings').select('service_code,request_enabled,matching_enabled,max_search_seconds,offer_seconds,max_radius_km');
  const result: Record<string, unknown> = {};
  for (const row of settings || []) {
    const passenger = row.service_code === 'AUTO_DRIVER' || row.service_code === 'CAB_DRIVER';
    result[row.service_code] = {
      request_enabled: Boolean(row.request_enabled) && (!passenger || passengerExecutionAllowed()),
      matching_enabled: Boolean(row.matching_enabled) && (!passenger || passengerExecutionAllowed()),
      max_search_seconds: row.max_search_seconds,
      offer_seconds: row.offer_seconds,
      max_radius_km: row.max_radius_km,
      compliance_gate: passenger && !passengerExecutionAllowed(),
    };
  }
  return NextResponse.json({
    services: result,
    bike_taxi_available: false,
    note: 'Courier matching can run with verified active Zeshu partners. Auto/Cab matching remains gated until the compliant Telangana mobility provider setup is enabled.',
  }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
}
