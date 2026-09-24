import { NextResponse } from 'next/server';
import { getDriverRiderReadiness } from '@/app/lib/driver-rider-readiness';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(
    {
      roles: getDriverRiderReadiness(),
      interest_registration_available: true,
      document_upload_available: false,
      activation_available: false,
      note: 'Zeshu currently accepts interest only. No applicant is authorized to carry passengers, parcels or goods until the applicable secure KYC, vehicle, permit, provider, safety and legal gates pass.',
    },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } },
  );
}
