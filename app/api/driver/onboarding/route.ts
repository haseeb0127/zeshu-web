import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { cleanText } from '@/app/lib/marketing-server';
import {
  DRIVER_SERVICES,
  requiredDocuments,
  requireDriverUser,
  type DriverService,
} from '@/app/lib/driver-onboarding-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const allowedServices = new Set<string>(DRIVER_SERVICES);

async function loadState(service: SupabaseClient, userId: string) {
  const { data: application, error } = await service
    .from('driver_applications')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!application) return { application: null, documents: [], eligibility: [] };

  const [{ data: documents, error: documentsError }, { data: eligibility, error: eligibilityError }] = await Promise.all([
    service.from('driver_documents').select('id,document_type,status,expiry_date,review_note,created_at,updated_at').eq('application_id', application.id).order('created_at'),
    service.from('driver_service_eligibility').select('id,service_code,status,reason,approved_at').eq('application_id', application.id).order('service_code'),
  ]);

  if (documentsError) throw documentsError;
  if (eligibilityError) throw eligibilityError;
  return { application, documents: documents || [], eligibility: eligibility || [] };
}

export async function GET(request: Request) {
  const auth = await requireDriverUser(request);
  if (!auth.context) return auth.response!;
  try {
    return NextResponse.json(await loadState(auth.context.service, auth.context.user.id));
  } catch (error) {
    console.error('Driver onboarding state failed:', error);
    return NextResponse.json({ error: 'Verification status is temporarily unavailable.' }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const auth = await requireDriverUser(request);
  if (!auth.context) return auth.response!;

  const { user, service } = auth.context;
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const action = cleanText(body.action, 30).toUpperCase() || 'SAVE';

  if (action === 'SUBMIT') {
    const state = await loadState(service, user.id).catch(() => null);
    if (!state?.application) return NextResponse.json({ error: 'Create your verification profile first.' }, { status: 400 });
    if (!['PENDING_DOCUMENTS','ACTION_REQUIRED'].includes(String(state.application.status))) {
      return NextResponse.json({ error: 'This application cannot be submitted in its current status.' }, { status: 409 });
    }

    const required = requiredDocuments(state.application.requested_services || [], state.application.registration_type);
    const uploaded = new Set((state.documents || []).filter((item: { status?: string }) => item.status !== 'REJECTED').map((item: { document_type: string }) => item.document_type));
    const missing = required.filter((type) => !uploaded.has(type));
    if (missing.length) {
      return NextResponse.json({ error: 'Upload the required documents before submitting.', missingDocuments: missing }, { status: 400 });
    }

    const { error } = await service
      .from('driver_applications')
      .update({ status: 'UNDER_REVIEW', updated_at: new Date().toISOString(), rejection_reason: null })
      .eq('id', state.application.id)
      .eq('user_id', user.id);
    if (error) return NextResponse.json({ error: 'Could not submit your verification for review.' }, { status: 500 });
    return NextResponse.json({ success: true, ...(await loadState(service, user.id)) });
  }

  const fullName = cleanText(body.full_name, 120);
  const city = cleanText(body.city, 120);
  const vehicleType = cleanText(body.vehicle_type, 80);
  const registrationType = cleanText(body.registration_type, 40).toUpperCase();
  const rawServices = Array.isArray(body.requested_services) ? body.requested_services : [];
  const requestedServices = [...new Set(rawServices.map((item) => cleanText(item, 40).toUpperCase()).filter((item) => allowedServices.has(item)))] as DriverService[];

  if (!fullName || !city || requestedServices.length === 0) {
    return NextResponse.json({ error: 'Name, city and at least one service are required.' }, { status: 400 });
  }
  if (!['TRANSPORT','NON_TRANSPORT','NO_VEHICLE'].includes(registrationType)) {
    return NextResponse.json({ error: 'Choose the current vehicle registration type.' }, { status: 400 });
  }

  const needsMotorVehicle = requestedServices.some((serviceCode) =>
    ['BIKE_COURIER','AUTO_DRIVER','CAB_DRIVER','GOODS_DRIVER'].includes(serviceCode),
  );
  if (needsMotorVehicle && registrationType === 'NO_VEHICLE') {
    return NextResponse.json({ error: 'Add the vehicle you intend to use before starting verification for courier, auto, cab or goods services.' }, { status: 400 });
  }

  const phone = cleanText(user.phone, 40);
  if (!phone) return NextResponse.json({ error: 'A verified mobile number is required.' }, { status: 400 });

  const { data: existing } = await service.from('driver_applications').select('id,status').eq('user_id', user.id).maybeSingle();
  if (existing && ['UNDER_REVIEW','VERIFIED','SUSPENDED'].includes(existing.status)) {
    return NextResponse.json({ error: 'This application is locked while it is under review or already verified.' }, { status: 409 });
  }

  const payload = {
    user_id: user.id,
    full_name: fullName,
    phone_number: phone,
    city,
    requested_services: requestedServices,
    vehicle_type: vehicleType || null,
    registration_type: registrationType,
    status: existing?.status === 'ACTION_REQUIRED' ? 'ACTION_REQUIRED' : 'PENDING_DOCUMENTS',
    updated_at: new Date().toISOString(),
  };

  const { data: application, error } = await service
    .from('driver_applications')
    .upsert(payload, { onConflict: 'user_id' })
    .select('*')
    .single();

  if (error || !application) {
    console.error('Driver application upsert failed:', error?.message);
    return NextResponse.json({ error: 'Could not save your verification profile.' }, { status: 500 });
  }

  for (const serviceCode of requestedServices) {
    const { error: eligibilityError } = await service.from('driver_service_eligibility').upsert({
      application_id: application.id,
      user_id: user.id,
      service_code: serviceCode,
      status: 'PENDING_VERIFICATION',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'application_id,service_code' });
    if (eligibilityError) {
      console.error('Driver eligibility upsert failed:', eligibilityError.message);
      return NextResponse.json({ error: 'Could not save requested services.' }, { status: 500 });
    }
  }

  const { data: currentEligibility } = await service
    .from('driver_service_eligibility')
    .select('id,service_code,status')
    .eq('application_id', application.id);
  for (const item of currentEligibility || []) {
    if (item.status === 'PENDING_VERIFICATION' && !requestedServices.includes(item.service_code as DriverService)) {
      const { error: deleteError } = await service.from('driver_service_eligibility').delete().eq('id', item.id);
      if (deleteError) console.warn('Driver unused eligibility cleanup failed:', deleteError.message);
    }
  }

  return NextResponse.json({ success: true, ...(await loadState(service, user.id)) }, { status: existing ? 200 : 201 });
}
