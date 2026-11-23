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
      bike_ride_interest_available: true,
      telangana_gig_worker_rules_effective: true,
      note: 'Individual delivery, courier, auto, cab and goods applicants can use the secure verification flow. Activation is service-specific and requires Zeshu approval. Auto/Cab live passenger dispatch remains provider/compliance gated, and passenger Bike Taxi interest registration is available only; passenger activation remains blocked pending Telangana Transport aggregator authorisation, vehicle/permit, insurance and safety compliance. Telangana Platform Based Gig Workers Act 2026 and Rules 2026 are effective; Zeshu must complete applicable aggregator/worker registration and reporting duties before operating.',
    },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } },
  );
}
