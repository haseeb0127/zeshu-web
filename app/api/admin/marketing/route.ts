import { NextResponse } from 'next/server';
import { cleanText, requireMarketingAdmin, safeInternalPath } from '@/app/lib/marketing-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PLACEMENTS = new Set(['HOMEPAGE_BANNER', 'CATEGORY_BANNER', 'SPONSORED_PRODUCT']);
const AUDIENCES = new Set(['JAGTIAL', 'INDIA']);
const STATUSES = new Set(['DRAFT', 'PUBLISHED', 'PAUSED']);
const PAYMENT_STATUSES = new Set(['UNPAID', 'PARTIAL', 'PAID', 'WAIVED']);
const LEAD_STATUSES = new Set(['NEW', 'CONTACTED', 'QUALIFIED', 'ONBOARDED', 'REJECTED']);

const parseDate = (value: unknown) => {
  const text = cleanText(value, 80);
  if (!text) return null;
  const date = new Date(text);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
};

const normalizeProductIds = (value: unknown) => {
  if (!Array.isArray(value)) return [] as string[];
  return Array.from(new Set(value.map((entry) => cleanText(entry, 80)).filter(Boolean))).slice(0, 100);
};

const campaignPayload = (body: Record<string, unknown>, userId: string) => {
  const placement = cleanText(body.placement, 40).toUpperCase();
  const audience = cleanText(body.audience, 20).toUpperCase();
  const status = cleanText(body.status, 20).toUpperCase() || 'DRAFT';
  const paymentStatus = cleanText(body.payment_status, 20).toUpperCase() || 'UNPAID';
  if (!PLACEMENTS.has(placement) || !AUDIENCES.has(audience) || !STATUSES.has(status) || !PAYMENT_STATUSES.has(paymentStatus)) {
    throw new Error('INVALID_CAMPAIGN_ENUM');
  }

  const startsAt = parseDate(body.starts_at);
  const endsAt = parseDate(body.ends_at);
  if (startsAt && endsAt && new Date(endsAt).getTime() <= new Date(startsAt).getTime()) throw new Error('INVALID_CAMPAIGN_DATES');

  const productIds = normalizeProductIds(body.product_ids);
  if (productIds.length > 0 && audience !== 'JAGTIAL') throw new Error('PHYSICAL_PRODUCTS_JAGTIAL_ONLY');
  if (placement === 'SPONSORED_PRODUCT' && productIds.length === 0) throw new Error('SPONSORED_PRODUCT_REQUIRED');

  const priorityNumber = Number(body.priority ?? 0);
  const feeNumber = body.advertising_fee === '' || body.advertising_fee === null || body.advertising_fee === undefined
    ? null
    : Number(body.advertising_fee);
  if (!Number.isFinite(priorityNumber) || priorityNumber < 0 || priorityNumber > 1000) throw new Error('INVALID_PRIORITY');
  if (feeNumber !== null && (!Number.isFinite(feeNumber) || feeNumber < 0)) throw new Error('INVALID_FEE');

  const desktopImageUrl = cleanText(body.desktop_image_url, 900) || null;
  const mobileImageUrl = cleanText(body.mobile_image_url, 900) || null;
  if (status === 'PUBLISHED') {
    if (!startsAt || !endsAt) throw new Error('PUBLISH_DATES_REQUIRED');
    if ((placement === 'HOMEPAGE_BANNER' || placement === 'CATEGORY_BANNER') && !desktopImageUrl && !mobileImageUrl) {
      throw new Error('PUBLISH_IMAGE_REQUIRED');
    }
  }

  return {
    productIds,
    row: {
      client_id: cleanText(body.client_id, 80),
      name: cleanText(body.name, 160),
      placement,
      audience,
      category_name: cleanText(body.category_name, 120) || null,
      headline: cleanText(body.headline, 180) || null,
      cta_label: cleanText(body.cta_label, 60) || 'Shop now',
      desktop_image_url: desktopImageUrl,
      mobile_image_url: mobileImageUrl,
      destination_url: safeInternalPath(body.destination_url),
      starts_at: startsAt,
      ends_at: endsAt,
      priority: Math.round(priorityNumber),
      advertising_fee: feeNumber,
      payment_status: paymentStatus,
      status,
      published_at: status === 'PUBLISHED' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
      created_by: userId,
    },
  };
};

const validateProductsForPublish = async (service: any, productIds: string[]) => {
  if (!productIds.length) return;
  const { data, error } = await service
    .from('products')
    .select('id,name,in_stock,quantity,vendor_id')
    .in('id', productIds);
  if (error) throw new Error('PRODUCT_LOOKUP_FAILED');
  const rows = Array.isArray(data) ? data : [];
  if (rows.length !== productIds.length) throw new Error('PRODUCT_NOT_FOUND');
  const unavailable = rows.filter((product: any) => !product.vendor_id || product.in_stock === false || Number(product.quantity) <= 0);
  if (unavailable.length) throw new Error('PRODUCT_UNAVAILABLE');
};

const replaceCampaignProducts = async (service: any, campaignId: string, productIds: string[]) => {
  const { error: deleteError } = await service.from('marketing_campaign_products').delete().eq('campaign_id', campaignId);
  if (deleteError) throw deleteError;
  if (!productIds.length) return;
  const { error: insertError } = await service
    .from('marketing_campaign_products')
    .insert(productIds.map((productId, index) => ({ campaign_id: campaignId, product_id: productId, display_order: index })));
  if (insertError) throw insertError;
};

const messageFor = (error: unknown) => {
  const code = error instanceof Error ? error.message : '';
  const messages: Record<string, string> = {
    INVALID_CAMPAIGN_ENUM: 'Choose a valid placement, audience, status and payment status.',
    INVALID_CAMPAIGN_DATES: 'Campaign end time must be after its start time.',
    PHYSICAL_PRODUCTS_JAGTIAL_ONLY: 'Campaigns linked to physical catalog products must target Jagtial.',
    SPONSORED_PRODUCT_REQUIRED: 'Sponsored product campaigns need at least one catalog product.',
    INVALID_PRIORITY: 'Priority must be between 0 and 1000.',
    INVALID_FEE: 'Advertising fee must be zero or greater.',
    PUBLISH_DATES_REQUIRED: 'Published campaigns need both a start and end time.',
    PUBLISH_IMAGE_REQUIRED: 'Published banner campaigns need mobile or desktop artwork.',
    PRODUCT_LOOKUP_FAILED: 'Product availability could not be checked.',
    PRODUCT_NOT_FOUND: 'One or more selected products no longer exist.',
    PRODUCT_UNAVAILABLE: 'Only currently available products can be published in a campaign.',
  };
  return messages[code] || 'Marketing operation could not be completed.';
};

export async function GET(request: Request) {
  const { context, response } = await requireMarketingAdmin(request);
  if (response || !context) return response!;

  const [clientsResult, campaignsResult, linksResult, productsResult, eventsResult, leadsResult] = await Promise.all([
    context.service.from('marketing_clients').select('*').order('created_at', { ascending: false }),
    context.service.from('marketing_campaigns').select('*').order('created_at', { ascending: false }),
    context.service.from('marketing_campaign_products').select('campaign_id,product_id,display_order').order('display_order', { ascending: true }),
    context.service.from('products').select('id,name,brand,category,price,weight,unit,image_url,in_stock,quantity,vendor_id').order('name', { ascending: true }),
    context.service.from('marketing_campaign_events').select('campaign_id,event_type').limit(50000),
    context.service.from('partner_leads').select('*').order('created_at', { ascending: false }).limit(500),
  ]);
  const firstError = clientsResult.error || campaignsResult.error || linksResult.error || productsResult.error || eventsResult.error || leadsResult.error;
  if (firstError) return NextResponse.json({ error: 'Marketing data is temporarily unavailable.' }, { status: 503 });

  const eventCounts = new Map<string, { views: number; clicks: number }>();
  for (const event of eventsResult.data || []) {
    const current = eventCounts.get(event.campaign_id) || { views: 0, clicks: 0 };
    if (event.event_type === 'VIEW') current.views += 1;
    if (event.event_type === 'CLICK') current.clicks += 1;
    eventCounts.set(event.campaign_id, current);
  }

  const linksByCampaign = new Map<string, string[]>();
  for (const link of linksResult.data || []) {
    const list = linksByCampaign.get(link.campaign_id) || [];
    list.push(link.product_id);
    linksByCampaign.set(link.campaign_id, list);
  }

  const campaigns = (campaignsResult.data || []).map((campaign: any) => {
    const counts = eventCounts.get(campaign.id) || { views: 0, clicks: 0 };
    return {
      ...campaign,
      product_ids: linksByCampaign.get(campaign.id) || [],
      views: counts.views,
      clicks: counts.clicks,
      ctr: counts.views > 0 ? Number(((counts.clicks / counts.views) * 100).toFixed(2)) : 0,
    };
  });

  return NextResponse.json({
    clients: clientsResult.data || [],
    campaigns,
    products: productsResult.data || [],
    partner_leads: leadsResult.data || [],
  });
}

export async function POST(request: Request) {
  const { context, response } = await requireMarketingAdmin(request);
  if (response || !context) return response!;
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const action = cleanText(body.action, 30).toLowerCase();

  try {
    if (action === 'client') {
      const businessName = cleanText(body.business_name, 160);
      const contactPerson = cleanText(body.contact_person, 120);
      const brandName = cleanText(body.brand_name, 120);
      if (!businessName || !contactPerson || !brandName) {
        return NextResponse.json({ error: 'Business name, contact person and brand are required.' }, { status: 400 });
      }
      const { data, error } = await context.service.from('marketing_clients').insert({
        business_name: businessName,
        contact_person: contactPerson,
        brand_name: brandName,
        contact_email: cleanText(body.contact_email, 180) || null,
        contact_phone: cleanText(body.contact_phone, 40) || null,
        notes: cleanText(body.notes, 1000) || null,
        created_by: context.userId,
      }).select('*').single();
      if (error) throw error;
      return NextResponse.json({ client: data }, { status: 201 });
    }

    if (action === 'campaign') {
      const payload = campaignPayload(body, context.userId);
      if (!payload.row.client_id || !payload.row.name) {
        return NextResponse.json({ error: 'Client and campaign name are required.' }, { status: 400 });
      }
      if (payload.row.status === 'PUBLISHED') await validateProductsForPublish(context.service, payload.productIds);
      const { data: campaign, error } = await context.service.from('marketing_campaigns').insert(payload.row).select('*').single();
      if (error || !campaign) throw error || new Error('CAMPAIGN_CREATE_FAILED');
      try {
        await replaceCampaignProducts(context.service, campaign.id, payload.productIds);
      } catch (linkError) {
        await context.service.from('marketing_campaigns').delete().eq('id', campaign.id);
        throw linkError;
      }
      return NextResponse.json({ campaign: { ...campaign, product_ids: payload.productIds } }, { status: 201 });
    }

    return NextResponse.json({ error: 'Unsupported marketing action.' }, { status: 400 });
  } catch (error) {
    console.error('Admin marketing POST failed:', error);
    return NextResponse.json({ error: messageFor(error) }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const { context, response } = await requireMarketingAdmin(request);
  if (response || !context) return response!;
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const action = cleanText(body.action, 30).toLowerCase();

  if (action === 'lead_status') {
    const leadId = cleanText(body.id, 80);
    const status = cleanText(body.status, 30).toUpperCase();
    if (!leadId || !LEAD_STATUSES.has(status)) return NextResponse.json({ error: 'Choose a valid partner lead status.' }, { status: 400 });
    const { data: lead, error } = await context.service
      .from('partner_leads')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', leadId)
      .select('*')
      .single();
    if (error || !lead) return NextResponse.json({ error: 'Partner lead could not be updated.' }, { status: 400 });
    return NextResponse.json({ lead });
  }

  const campaignId = cleanText(body.id, 80);
  if (!campaignId) return NextResponse.json({ error: 'Campaign ID is required.' }, { status: 400 });

  try {
    const payload = campaignPayload(body, context.userId);
    if (!payload.row.client_id || !payload.row.name) {
      return NextResponse.json({ error: 'Client and campaign name are required.' }, { status: 400 });
    }
    if (payload.row.status === 'PUBLISHED') await validateProductsForPublish(context.service, payload.productIds);
    const { data: campaign, error } = await context.service
      .from('marketing_campaigns')
      .update(payload.row)
      .eq('id', campaignId)
      .select('*')
      .single();
    if (error || !campaign) throw error || new Error('CAMPAIGN_UPDATE_FAILED');
    await replaceCampaignProducts(context.service, campaignId, payload.productIds);
    return NextResponse.json({ campaign: { ...campaign, product_ids: payload.productIds } });
  } catch (error) {
    console.error('Admin marketing PATCH failed:', error);
    return NextResponse.json({ error: messageFor(error) }, { status: 400 });
  }
}
