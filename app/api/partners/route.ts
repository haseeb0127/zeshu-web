import { NextResponse } from 'next/server';
import { cleanText, getMarketingServiceClient } from '@/app/lib/marketing-server';
import { rateLimitResponse } from '@/app/lib/provider-security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TYPES = new Set([
  'LOCAL_VENDOR',
  'LICENSED_PHARMACY',
  'MEDICINE_DISTRIBUTOR',
  'RECHARGE_BILLS',
  'TRAVEL',
  'SPONSOR',
  'OTHER',
]);

const emailLooksValid = (value: string) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const phoneLooksValid = (value: string) => !value || value.replace(/\D/g, '').length >= 7;

export async function POST(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const limited = rateLimitResponse(forwarded, 'partner-lead');
  if (limited) return limited;

  const service = await getMarketingServiceClient();
  if (!service) return NextResponse.json({ error: 'Partner applications are temporarily unavailable.' }, { status: 503 });

  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  if (cleanText(body.company_fax, 120)) return NextResponse.json({ success: true });

  const partnerType = cleanText(body.partner_type, 40).toUpperCase();
  const businessName = cleanText(body.business_name, 160);
  const contactPerson = cleanText(body.contact_person, 120);
  const contactPhone = cleanText(body.contact_phone, 40);
  const contactEmail = cleanText(body.contact_email, 180).toLowerCase();
  const city = cleanText(body.city, 120);
  const website = cleanText(body.website, 500);
  const licenceOrGst = cleanText(body.licence_or_gst, 240);
  const proposal = cleanText(body.proposal, 2400);
  const consent = body.consent === true;

  if (!TYPES.has(partnerType)) return NextResponse.json({ error: 'Choose a valid partnership type.' }, { status: 400 });
  if (!businessName || !contactPerson) return NextResponse.json({ error: 'Business name and contact person are required.' }, { status: 400 });
  if (!contactPhone && !contactEmail) return NextResponse.json({ error: 'Add a phone number or email so Zeshu can contact you.' }, { status: 400 });
  if (!emailLooksValid(contactEmail)) return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  if (!phoneLooksValid(contactPhone)) return NextResponse.json({ error: 'Enter a valid phone number.' }, { status: 400 });
  if (!consent) return NextResponse.json({ error: 'Please confirm that Zeshu may contact you about this partnership.' }, { status: 400 });

  const { data, error } = await service.from('partner_leads').insert({
    partner_type: partnerType,
    business_name: businessName,
    contact_person: contactPerson,
    contact_phone: contactPhone || null,
    contact_email: contactEmail || null,
    city: city || null,
    website: website || null,
    licence_or_gst: licenceOrGst || null,
    proposal: proposal || null,
    status: 'NEW',
    source: 'WEBSITE',
    consented_at: new Date().toISOString(),
  }).select('id,status,created_at').single();

  if (error) {
    console.error('Partner lead insert failed:', error.message);
    return NextResponse.json({ error: 'We could not save your partnership request. Please try again.' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    lead: data,
    message: 'Partnership request received. Zeshu will review it before onboarding or commercial activation.',
  }, { status: 201 });
}
