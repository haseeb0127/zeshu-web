import { NextResponse } from 'next/server';
import { cleanText } from '@/app/lib/marketing-server';
import {
  DRIVER_DOCUMENT_TYPES,
  EXPIRING_DOCUMENTS,
  requireDriverUser,
  type DriverDocumentType,
} from '@/app/lib/driver-onboarding-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const allowedTypes = new Set<string>(DRIVER_DOCUMENT_TYPES);

export async function POST(request: Request) {
  const auth = await requireDriverUser(request);
  if (!auth.context) return auth.response!;

  const { user, service } = auth.context;
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const applicationId = cleanText(body.application_id, 80);
  const documentType = cleanText(body.document_type, 40).toUpperCase() as DriverDocumentType;
  const storagePath = cleanText(body.storage_path, 700);
  const expiryDate = cleanText(body.expiry_date, 20);

  if (!applicationId || !allowedTypes.has(documentType) || !storagePath) {
    return NextResponse.json({ error: 'Document metadata is incomplete.' }, { status: 400 });
  }
  if (!storagePath.startsWith(`${user.id}/${applicationId}/${documentType}/`)) {
    return NextResponse.json({ error: 'Invalid secure document path.' }, { status: 400 });
  }
  if (EXPIRING_DOCUMENTS.has(documentType) && !/^\d{4}-\d{2}-\d{2}$/.test(expiryDate)) {
    return NextResponse.json({ error: 'Enter the document expiry date.' }, { status: 400 });
  }

  const { data: application, error: appError } = await service
    .from('driver_applications')
    .select('id,status')
    .eq('id', applicationId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (appError || !application) return NextResponse.json({ error: 'Verification application not found.' }, { status: 404 });
  if (!['PENDING_DOCUMENTS','ACTION_REQUIRED'].includes(application.status)) {
    return NextResponse.json({ error: 'Documents cannot be changed while this application is under review.' }, { status: 409 });
  }

  const { data, error } = await service.from('driver_documents').upsert({
    application_id: applicationId,
    user_id: user.id,
    document_type: documentType,
    storage_path: storagePath,
    status: 'UPLOADED',
    expiry_date: expiryDate || null,
    reviewed_by: null,
    reviewed_at: null,
    review_note: null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'application_id,document_type' }).select('id,document_type,status,expiry_date,created_at,updated_at').single();

  if (error) {
    console.error('Driver document metadata save failed:', error.message);
    return NextResponse.json({ error: 'The file uploaded, but its verification record could not be saved. Please contact support.' }, { status: 500 });
  }

  return NextResponse.json({ success: true, document: data }, { status: 201 });
}
