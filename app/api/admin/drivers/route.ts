import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { cleanText, requireMarketingAdmin } from '@/app/lib/marketing-server';
import { passengerChecksRequired, requiredDocuments } from '@/app/lib/driver-onboarding-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CHECK_FIELDS = new Set([
  'background_verified',
  'medical_verified',
  'psychological_verified',
  'safety_training_completed',
  'bank_verified',
]);
const ACTIVATABLE = new Set(['DELIVERY_RIDER','BIKE_COURIER','GOODS_DRIVER']);

async function getApplication(service: SupabaseClient, applicationId: string) {
  const { data, error } = await service.from('driver_applications').select('*').eq('id', applicationId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function GET(request: Request) {
  const auth = await requireMarketingAdmin(request);
  if (!auth.context) return auth.response!;
  const { service } = auth.context;

  const { data: applications, error } = await service
    .from('driver_applications')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(200);
  if (error) return NextResponse.json({ error: 'Driver verification queue is unavailable.' }, { status: 503 });

  const ids = (applications || []).map((item: { id: string }) => item.id);
  if (!ids.length) return NextResponse.json({ applications: [] });

  const [{ data: documents, error: documentError }, { data: eligibility, error: eligibilityError }, { data: riders, error: riderError }] = await Promise.all([
    service.from('driver_documents').select('*').in('application_id', ids).order('created_at'),
    service.from('driver_service_eligibility').select('*').in('application_id', ids).order('service_code'),
    service.from('riders').select('id,user_id,is_active,admin_suspended,vehicle_number,driver_application_id').in('driver_application_id', ids),
  ]);
  if (documentError || eligibilityError || riderError) {
    return NextResponse.json({ error: 'Driver verification details are unavailable.' }, { status: 503 });
  }

  const signedDocuments = await Promise.all((documents || []).map(async (document: { storage_path: string } & Record<string, unknown>) => {
    const { data } = await service.storage.from('driver-verification').createSignedUrl(document.storage_path, 300);
    return { ...document, signed_url: data?.signedUrl || null };
  }));

  const payload = (applications || []).map((application: { id: string; user_id: string } & Record<string, unknown>) => ({
    ...application,
    documents: signedDocuments.filter((item) => item.application_id === application.id),
    eligibility: (eligibility || []).filter((item: { application_id: string }) => item.application_id === application.id),
    rider: (riders || []).find((item: { driver_application_id: string }) => item.driver_application_id === application.id) || null,
  }));

  return NextResponse.json({ applications: payload });
}

export async function POST(request: Request) {
  const auth = await requireMarketingAdmin(request);
  if (!auth.context) return auth.response!;
  const { service, userId } = auth.context;
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const action = cleanText(body.action, 40).toUpperCase();
  const applicationId = cleanText(body.application_id, 80);
  if (!applicationId) return NextResponse.json({ error: 'Application is required.' }, { status: 400 });

  let application;
  try {
    application = await getApplication(service, applicationId);
  } catch {
    return NextResponse.json({ error: 'Driver application could not be loaded.' }, { status: 503 });
  }
  if (!application) return NextResponse.json({ error: 'Driver application not found.' }, { status: 404 });

  if (action === 'REVIEW_DOCUMENT') {
    const documentId = cleanText(body.document_id, 80);
    const decision = cleanText(body.decision, 20).toUpperCase();
    const note = cleanText(body.note, 500);
    if (!documentId || !['APPROVED','REJECTED'].includes(decision)) {
      return NextResponse.json({ error: 'Choose an approval or rejection decision.' }, { status: 400 });
    }
    const { data: document, error } = await service.from('driver_documents').update({
      status: decision,
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
      review_note: note || null,
      updated_at: new Date().toISOString(),
    }).eq('id', documentId).eq('application_id', applicationId).select('document_type').maybeSingle();
    if (error || !document) return NextResponse.json({ error: 'Document review could not be saved.' }, { status: 500 });

    const applicationPatch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (document.document_type === 'IDENTITY') applicationPatch.identity_verified = decision === 'APPROVED';
    if (document.document_type === 'BANK_PROOF') applicationPatch.bank_verified = decision === 'APPROVED';
    if (decision === 'REJECTED') {
      applicationPatch.status = 'ACTION_REQUIRED';
      applicationPatch.rejection_reason = note || 'A verification document needs to be replaced.';
    }
    await service.from('driver_applications').update(applicationPatch).eq('id', applicationId);
    return NextResponse.json({ success: true });
  }

  if (action === 'SET_CHECK') {
    const field = cleanText(body.field, 60);
    const value = body.value === true;
    if (!CHECK_FIELDS.has(field)) return NextResponse.json({ error: 'Unknown verification check.' }, { status: 400 });
    const { error } = await service.from('driver_applications').update({
      [field]: value,
      updated_at: new Date().toISOString(),
    }).eq('id', applicationId);
    if (error) return NextResponse.json({ error: 'Verification check could not be updated.' }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (action === 'FINALIZE') {
    if (!['UNDER_REVIEW','ACTION_REQUIRED'].includes(application.status)) {
      return NextResponse.json({ error: 'This application is not ready for final verification.' }, { status: 409 });
    }
    const { data: documents, error: documentError } = await service.from('driver_documents').select('document_type,status,expiry_date').eq('application_id', applicationId);
    if (documentError) return NextResponse.json({ error: 'Documents could not be checked.' }, { status: 503 });

    const required = requiredDocuments(application.requested_services || [], application.registration_type);
    const today = new Date().toISOString().slice(0, 10);
    const valid = new Set((documents || []).filter((item: { status: string; expiry_date?: string | null }) =>
      item.status === 'APPROVED' && (!item.expiry_date || item.expiry_date >= today)
    ).map((item: { document_type: string }) => item.document_type));
    const missing = required.filter((type) => !valid.has(type));
    if (missing.length) return NextResponse.json({ error: 'Required documents are missing, rejected or expired.', missingDocuments: missing }, { status: 400 });

    const passenger = passengerChecksRequired(application.requested_services || []);
    const incompleteChecks = [
      !application.identity_verified ? 'identity' : '',
      !application.bank_verified ? 'bank/payout' : '',
      !application.background_verified ? 'background' : '',
      !application.safety_training_completed ? 'safety training' : '',
      passenger && !application.medical_verified ? 'medical fitness' : '',
      passenger && !application.psychological_verified ? 'psychological assessment' : '',
    ].filter(Boolean);
    if (incompleteChecks.length) {
      return NextResponse.json({ error: 'Complete all required verification checks first.', incompleteChecks }, { status: 400 });
    }

    const now = new Date().toISOString();
    const { error: appError } = await service.from('driver_applications').update({
      status: 'VERIFIED',
      verified_at: now,
      verified_by: userId,
      rejection_reason: null,
      updated_at: now,
    }).eq('id', applicationId);
    if (appError) return NextResponse.json({ error: 'Application could not be verified.' }, { status: 500 });

    for (const serviceCode of application.requested_services || []) {
      const { error: eligibilityError } = await service.from('driver_service_eligibility').update({
        status: 'VERIFIED',
        approved_by: userId,
        approved_at: now,
        reason: null,
        updated_at: now,
      }).eq('application_id', applicationId).eq('service_code', serviceCode);
      if (eligibilityError) return NextResponse.json({ error: 'Service verification could not be completed.' }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  }

  if (action === 'ACTIVATE') {
    const serviceCode = cleanText(body.service_code, 40).toUpperCase();
    const vehicleNumber = cleanText(body.vehicle_number, 40).toUpperCase();
    if (!ACTIVATABLE.has(serviceCode)) {
      return NextResponse.json({ error: 'Auto and Cab activation remains provider/compliance gated. Passenger Bike Taxi is not available.' }, { status: 409 });
    }
    if (application.status !== 'VERIFIED') return NextResponse.json({ error: 'Verify the application before activation.' }, { status: 409 });
    if (!application.requested_services?.includes(serviceCode)) return NextResponse.json({ error: 'This service was not requested by the applicant.' }, { status: 400 });
    if (['BIKE_COURIER','GOODS_DRIVER'].includes(serviceCode) && !vehicleNumber) {
      return NextResponse.json({ error: 'Enter the verified vehicle registration number for activation.' }, { status: 400 });
    }

    const { data: eligibility, error: eligibilityError } = await service.from('driver_service_eligibility')
      .select('id,status').eq('application_id', applicationId).eq('service_code', serviceCode).maybeSingle();
    if (eligibilityError || !eligibility || !['VERIFIED','ACTIVE'].includes(eligibility.status)) {
      return NextResponse.json({ error: 'This service has not passed verification.' }, { status: 409 });
    }

    const now = new Date().toISOString();
    await service.from('driver_service_eligibility').update({
      status: 'ACTIVE', approved_by: userId, approved_at: now, updated_at: now,
    }).eq('id', eligibility.id);

    const { data: existingRider } = await service.from('riders').select('id').eq('user_id', application.user_id).maybeSingle();
    if (!existingRider) {
      const { error: riderError } = await service.from('riders').insert({
        user_id: application.user_id,
        full_name: application.full_name,
        phone_number: application.phone_number,
        vehicle_number: vehicleNumber || null,
        is_active: false,
        admin_suspended: false,
        driver_application_id: applicationId,
        verification_grandfathered: false,
      });
      if (riderError) {
        await service.from('driver_service_eligibility').update({ status: 'VERIFIED', updated_at: new Date().toISOString() }).eq('id', eligibility.id);
        return NextResponse.json({ error: 'Service verified, but the rider profile could not be activated.' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Unknown driver verification action.' }, { status: 400 });
}
