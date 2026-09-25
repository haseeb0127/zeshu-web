import { NextResponse } from 'next/server';
import { getDriverRiderReadiness } from '@/app/lib/driver-rider-readiness';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(
    {
      roles: getDriverRiderReadiness(),
      interest_registration_available: true,
      secure_document_verification_available: true,
      self_activation_available: false,
      passenger_bike_taxi_available: false,
      note: 'Individual delivery, courier, auto, cab and goods applicants can use the secure verification flow. Activation is service-specific and requires Zeshu approval. Auto/Cab live passenger dispatch remains provider/compliance gated, and passenger Bike Taxi remains unavailable pending Telangana regulatory clarity.',
    },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } },
  );
}
