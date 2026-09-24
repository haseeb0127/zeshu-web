import { NextResponse } from 'next/server';
import { cleanText, getMarketingServiceClient } from '@/app/lib/marketing-server';
import { rateLimitResponse } from '@/app/lib/provider-security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ROLES = new Set([
  'DELIVERY_RIDER',
  'BIKE_COURIER',
  'AUTO_DRIVER',
  'CAB_DRIVER',
  'GOODS_DRIVER',
  'FLEET_OPERATOR',
]);

const emailLooksValid = (value: string) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const phoneLooksValid = (value: string) => value.replace(/\D/g, '').length >= 7;

export async function POST(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const limited = rateLimitResponse(forwarded, 'driver-rider-interest');
  if (limited) return limited;

  const service = await getMarketingServiceClient();
  if (!service) {
    return NextResponse.json({ error: 'Driver and rider applications are temporarily unavailable.' }, { status: 503 });
  }

  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  if (cleanText(body.company_fax, 120)) return NextResponse.json({ success: true });

  const role = cleanText(body.role, 40).toUpperCase();
  const name = cleanText(body.name, 120);
  const phone = cleanText(body.phone, 40);
  const email = cleanText(body.email, 180).toLowerCase();
  const city = cleanText(body.city, 120);
  const vehicleType = cleanText(body.vehicle_type, 80);
  const registrationType = cleanText(body.registration_type, 40).toUpperCase();
  const hasDrivingLicence = body.has_driving_licence === true;
  const hasVehicleDocuments = body.has_vehicle_documents === true;
  const notes = cleanText(body.notes, 1200);
  const consent = body.consent === true;

  if (!ROLES.has(role)) return NextResponse.json({ error: 'Choose a valid driver or rider role.' }, { status: 400 });
  if (!name || !phone || !city) return NextResponse.json({ error: 'Name, phone and city/service area are required.' }, { status: 400 });
  if (!phoneLooksValid(phone)) return NextResponse.json({ error: 'Enter a valid phone number.' }, { status: 400 });
  if (!emailLooksValid(email)) return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  if (!['TRANSPORT', 'NON_TRANSPORT', 'NO_VEHICLE'].includes(registrationType)) {
    return NextResponse.json({ error: 'Choose the current vehicle registration type.' }, { status: 400 });
  }
  if (!consent) return NextResponse.json({ error: 'Please confirm that Zeshu may contact you about onboarding.' }, { status: 400 });

  const partnerType = role === 'DELIVERY_RIDER' || role === 'BIKE_COURIER' || role === 'GOODS_DRIVER'
    ? 'LOGISTICS_COURIER'
    : 'MOBILITY';

  const proposal = [
    `Applicant role: ${role}`,
    `Vehicle type: ${vehicleType || 'Not provided'}`,
    `Vehicle registration: ${registrationType}`,
    `Valid driving licence declared: ${hasDrivingLicence ? 'Yes' : 'No'}`,
    `Vehicle documents declared available: ${hasVehicleDocuments ? 'Yes' : 'No'}`,
    notes ? `Notes: ${notes}` : '',
  ].filter(Boolean).join('\n');

  const { data, error } = await service.from('partner_leads').insert({
    partner_type: partnerType,
    business_name: role === 'FLEET_OPERATOR' ? name : `Individual applicant — ${name}`,
    contact_person: name,
    contact_phone: phone,
    contact_email: email || null,
    city,
    website: null,
    licence_or_gst: `Role: ${role}; registration: ${registrationType}; DL declared: ${hasDrivingLicence ? 'yes' : 'no'}`,
    proposal,
    status: 'NEW',
    source: 'DRIVE_DELIVER',
    consented_at: new Date().toISOString(),
  }).select('id,status,created_at').single();

  if (error) {
    console.error('Driver/rider interest insert failed:', error.message);
    return NextResponse.json({ error: 'We could not save your interest form. Please try again.' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    lead: data,
    message: 'Interest received. Zeshu will contact eligible applicants only after service, document and compliance readiness is verified.',
  }, { status: 201 });
}
