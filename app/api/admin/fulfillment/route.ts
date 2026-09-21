import { NextResponse } from 'next/server';
import { requireMarketingAdmin } from '@/app/lib/marketing-server';
import { configuredCourierProvider, isNationwideCourierReady } from '@/app/lib/courier-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const numberOrNull = (value: unknown) => {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const booleanValue = (value: unknown) => value === true;

export async function GET(request: Request) {
  const { context, response } = await requireMarketingAdmin(request);
  if (response || !context) return response!;

  const [settingsResult, productsResult, profilesResult, vendorsResult] = await Promise.all([
    context.service.from('fulfillment_settings').select('*').eq('id', 'default').maybeSingle(),
    context.service.from('products').select('id,name,brand,category,price,vendor_id,in_stock,quantity,delivery_mode,fresh_eligible,nationwide_shipping_enabled,requires_cold_chain,packed_weight_grams,package_length_cm,package_width_cm,package_height_cm,shipping_class,min_nationwide_quantity,min_nationwide_order_value,handling_minutes').order('name'),
    context.service.from('product_fulfillment_profiles').select('*'),
    context.service.from('vendors').select('id,business_name,is_open,admin_suspended,local_30_min_enabled').order('business_name'),
  ]);

  const firstError = settingsResult.error || productsResult.error || profilesResult.error || vendorsResult.error;
  if (firstError) return NextResponse.json({ error: 'Fulfillment data is temporarily unavailable.' }, { status: 503 });

  const profileMap = new Map((profilesResult.data || []).map((row: any) => [String(row.product_id), row]));
  const products = (productsResult.data || []).map((product: any) => ({
    ...product,
    profitability: profileMap.get(String(product.id)) || null,
  }));

  return NextResponse.json({
    courier_connected: isNationwideCourierReady(),
    settings: settingsResult.data || null,
    products,
    vendors: vendorsResult.data || [],
  });
}

export async function PATCH(request: Request) {
  const { context, response } = await requireMarketingAdmin(request);
  if (response || !context) return response!;

  const body = await request.json().catch(() => ({})) as Record<string, any>;
  const action = String(body.action || '');

  if (action === 'settings') {
    const nationwideEnabled = booleanValue(body.nationwide_checkout_enabled);
    if (nationwideEnabled && !isNationwideCourierReady()) {
      return NextResponse.json({
        error: 'Connect a real courier rate/serviceability provider before enabling India-wide checkout.',
      }, { status: 409 });
    }

    const update = {
      nationwide_checkout_enabled: nationwideEnabled,
      default_min_contribution_rupees: numberOrNull(body.default_min_contribution_rupees),
      default_min_margin_percent: numberOrNull(body.default_min_margin_percent),
      payment_fee_percent: numberOrNull(body.payment_fee_percent),
      default_rto_allowance_percent: numberOrNull(body.default_rto_allowance_percent),
      default_operating_cost_percent: numberOrNull(body.default_operating_cost_percent),
      free_shipping_enabled: booleanValue(body.free_shipping_enabled),
      courier_provider: configuredCourierProvider(),
      updated_at: new Date().toISOString(),
    };

    if (
      update.default_min_contribution_rupees === null || update.default_min_contribution_rupees < 0
      || update.default_min_margin_percent === null || update.default_min_margin_percent < 0 || update.default_min_margin_percent > 100
      || update.payment_fee_percent === null || update.payment_fee_percent < 0 || update.payment_fee_percent > 100
      || update.default_rto_allowance_percent === null || update.default_rto_allowance_percent < 0 || update.default_rto_allowance_percent > 100
      || update.default_operating_cost_percent === null || update.default_operating_cost_percent < 0 || update.default_operating_cost_percent > 100
    ) {
      return NextResponse.json({ error: 'Review the profitability settings.' }, { status: 400 });
    }

    const { data, error } = await context.service.from('fulfillment_settings').update(update).eq('id', 'default').select('*').single();
    if (error) return NextResponse.json({ error: 'Fulfillment settings could not be saved.' }, { status: 503 });
    return NextResponse.json({ settings: data, courier_connected: isNationwideCourierReady() });
  }

  if (action === 'vendor') {
    const vendorId = String(body.vendor_id || '');
    if (!vendorId) return NextResponse.json({ error: 'Vendor is required.' }, { status: 400 });
    const { data, error } = await context.service
      .from('vendors')
      .update({ local_30_min_enabled: booleanValue(body.local_30_min_enabled) })
      .eq('id', vendorId)
      .select('id,business_name,is_open,admin_suspended,local_30_min_enabled')
      .single();
    if (error) return NextResponse.json({ error: 'Vendor Fresh setting could not be saved.' }, { status: 503 });
    return NextResponse.json({ vendor: data });
  }

  if (action === 'product') {
    const productId = String(body.product_id || '');
    const deliveryMode = String(body.delivery_mode || '');
    const shippingClass = String(body.shipping_class || 'STANDARD');
    const nationwide = booleanValue(body.nationwide_shipping_enabled);
    const requiresColdChain = booleanValue(body.requires_cold_chain);
    const packedWeight = numberOrNull(body.packed_weight_grams);
    const costPrice = numberOrNull(body.cost_price);

    if (!productId || !['LOCAL_30_MIN','LOCAL_STANDARD','INDIA_STANDARD'].includes(deliveryMode)) {
      return NextResponse.json({ error: 'Choose a valid delivery mode.' }, { status: 400 });
    }
    if (!['STANDARD','FRAGILE','HEAVY','COLD_CHAIN','LOCAL_ONLY'].includes(shippingClass)) {
      return NextResponse.json({ error: 'Choose a valid shipping class.' }, { status: 400 });
    }
    if (nationwide && (
      deliveryMode !== 'INDIA_STANDARD'
      || requiresColdChain
      || ['COLD_CHAIN','LOCAL_ONLY'].includes(shippingClass)
      || packedWeight === null || packedWeight <= 0
      || costPrice === null || costPrice < 0
    )) {
      return NextResponse.json({
        error: 'India shipping requires India Standard mode, packed weight, cost price, and a non-cold-chain shipping class.',
      }, { status: 400 });
    }

    const { data: updatedProduct, error: updateError } = await context.service.rpc('admin_update_product_fulfillment', {
      p_admin_user_id: context.userId,
      p_product_id: productId,
      p_delivery_mode: deliveryMode,
      p_fresh_eligible: deliveryMode === 'LOCAL_30_MIN' && booleanValue(body.fresh_eligible),
      p_nationwide_shipping_enabled: nationwide,
      p_requires_cold_chain: requiresColdChain,
      p_packed_weight_grams: packedWeight,
      p_package_length_cm: numberOrNull(body.package_length_cm),
      p_package_width_cm: numberOrNull(body.package_width_cm),
      p_package_height_cm: numberOrNull(body.package_height_cm),
      p_shipping_class: shippingClass,
      p_min_nationwide_quantity: Math.max(1, Math.floor(Number(body.min_nationwide_quantity || 1))),
      p_min_nationwide_order_value: Math.max(0, Number(body.min_nationwide_order_value || 0)),
      p_handling_minutes: Math.max(0, Math.floor(Number(body.handling_minutes || 0))),
      p_cost_price: costPrice,
      p_packaging_cost: Math.max(0, Number(body.packaging_cost || 0)),
      p_handling_cost: Math.max(0, Number(body.handling_cost || 0)),
      p_return_risk_percent: Math.min(100, Math.max(0, Number(body.return_risk_percent || 0))),
      p_min_contribution_rupees: numberOrNull(body.min_contribution_rupees),
      p_min_margin_percent: numberOrNull(body.min_margin_percent),
    });
    if (updateError || !updatedProduct) {
      return NextResponse.json({ error: 'Product fulfillment settings could not be saved.' }, { status: 503 });
    }
    return NextResponse.json({ success: true, product: updatedProduct });
  }

  return NextResponse.json({ error: 'Unsupported fulfillment action.' }, { status: 400 });
}
