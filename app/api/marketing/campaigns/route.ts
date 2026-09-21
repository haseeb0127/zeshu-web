import { NextResponse } from 'next/server';
import { getMarketingServiceClient } from '@/app/lib/marketing-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_AUDIENCES = new Set(['INDIA', 'JAGTIAL']);

export async function GET(request: Request) {
  const service = await getMarketingServiceClient();
  if (!service) return NextResponse.json({ campaigns: [] }, { status: 503 });

  const url = new URL(request.url);
  const audiences = (url.searchParams.get('audiences') || 'INDIA')
    .split(',')
    .map((value) => value.trim().toUpperCase())
    .filter((value) => VALID_AUDIENCES.has(value));
  const targetAudiences = audiences.length ? Array.from(new Set(audiences)) : ['INDIA'];
  const now = new Date().toISOString();

  const { data: campaigns, error } = await service
    .from('marketing_campaigns')
    .select('id,name,placement,audience,category_name,headline,cta_label,desktop_image_url,mobile_image_url,destination_url,starts_at,ends_at,priority')
    .eq('status', 'PUBLISHED')
    .in('audience', targetAudiences)
    .lte('starts_at', now)
    .gte('ends_at', now)
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(50);

  if (error || !campaigns?.length) {
    if (error) console.error('Public marketing campaigns load failed:', error);
    return NextResponse.json({ campaigns: [] }, { headers: { 'Cache-Control': 'public, max-age=30, s-maxage=60' } });
  }

  const ids = campaigns.map((campaign) => campaign.id);
  const { data: links, error: linksError } = await service
    .from('marketing_campaign_products')
    .select('campaign_id,product_id,display_order')
    .in('campaign_id', ids)
    .order('display_order', { ascending: true });

  if (linksError) return NextResponse.json({ campaigns: [] }, { status: 503 });

  const productIds = Array.from(new Set((links || []).map((link) => link.product_id)));
  const productsResult = productIds.length
    ? await service.from('products').select('id,name,brand,category,price,weight,unit,image_url,in_stock,quantity,vendor_id').in('id', productIds)
    : { data: [], error: null };
  if (productsResult.error) return NextResponse.json({ campaigns: [] }, { status: 503 });

  const productsById = new Map((productsResult.data || []).map((product: any) => [product.id, product]));
  const linksByCampaign = new Map<string, any[]>();
  for (const link of links || []) {
    const product = productsById.get(link.product_id);
    if (!product || !product.vendor_id || product.in_stock === false || Number(product.quantity) <= 0) continue;
    const list = linksByCampaign.get(link.campaign_id) || [];
    list.push(product);
    linksByCampaign.set(link.campaign_id, list);
  }

  const publicCampaigns = campaigns
    .map((campaign) => ({ ...campaign, products: linksByCampaign.get(campaign.id) || [] }))
    .filter((campaign) => campaign.placement !== 'SPONSORED_PRODUCT' || campaign.products.length > 0)
    .filter((campaign) => campaign.products.length === 0 || campaign.audience === 'JAGTIAL');

  return NextResponse.json(
    { campaigns: publicCampaigns },
    { headers: { 'Cache-Control': 'public, max-age=30, s-maxage=60, stale-while-revalidate=120' } },
  );
}
