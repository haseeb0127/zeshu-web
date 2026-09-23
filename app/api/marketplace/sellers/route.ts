import { NextResponse } from 'next/server';
import { getMarketingServiceClient } from '@/app/lib/marketing-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const service = await getMarketingServiceClient();
  if (!service) return NextResponse.json({ sellers: [] }, { status: 503 });

  const extended = await service
    .from('vendors')
    .select('id,business_name,is_open,admin_suspended,marketplace_status,kyc_verified,gst_verified,authorized_brand_partner,invoice_available')
    .eq('admin_suspended', false)
    .neq('marketplace_status', 'SUSPENDED')
    .order('business_name');

  if (!extended.error) {
    return NextResponse.json({
      sellers: (extended.data || []).map((seller: any) => ({
        id: seller.id,
        business_name: seller.business_name,
        is_open: seller.is_open,
        marketplace_status: seller.marketplace_status,
        kyc_verified: seller.kyc_verified === true,
        gst_verified: seller.gst_verified === true,
        authorized_brand_partner: seller.authorized_brand_partner === true,
        invoice_available: seller.invoice_available === true,
      })),
    }, {
      headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' },
    });
  }

  // Safe rollout fallback while production has not yet received the seller-trust migration.
  const fallback = await service
    .from('vendors')
    .select('id,business_name,is_open,admin_suspended')
    .eq('admin_suspended', false)
    .order('business_name');

  if (fallback.error) return NextResponse.json({ sellers: [] }, { status: 503 });
  return NextResponse.json({
    sellers: (fallback.data || []).map((seller: any) => ({
      id: seller.id,
      business_name: seller.business_name,
      is_open: seller.is_open,
      marketplace_status: 'PENDING',
      kyc_verified: false,
      gst_verified: false,
      authorized_brand_partner: false,
      invoice_available: false,
    })),
  }, {
    headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' },
  });
}
