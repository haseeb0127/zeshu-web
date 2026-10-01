import { NextResponse } from 'next/server';
import { getMarketingServiceClient } from '@/app/lib/marketing-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const service = await getMarketingServiceClient();
  if (!service) return NextResponse.json({ products: [], filters: emptyFilters() }, { status: 503 });

  const fashion = await service
    .from('fashion_product_details')
    .select('product_id,department,subcategory,gender,material,fit');

  // Safe rollout fallback: Fashion stays honest/empty until the additive catalogue migration exists.
  if (fashion.error) return NextResponse.json({ products: [], filters: emptyFilters() }, {
    headers: { 'Cache-Control': 'public, max-age=30, stale-while-revalidate=120' },
  });

  const fashionRows = fashion.data || [];
  const productIds = fashionRows.map((row: any) => row.product_id);
  if (!productIds.length) return NextResponse.json({ products: [], filters: emptyFilters() }, {
    headers: { 'Cache-Control': 'public, max-age=30, stale-while-revalidate=120' },
  });

  const [productsResult, variantsResult, commerceResult, imagesResult] = await Promise.all([
    service.from('products')
      .select('id,name,brand,price,image_url,vendor_id,in_stock,delivery_mode,nationwide_shipping_enabled,packed_weight_grams,package_length_cm,package_width_cm,package_height_cm')
      .in('id', productIds)
      .eq('in_stock', true),
    service.from('product_variants')
      .select('id,product_id,sku,size_label,colour_name,colour_hex,stock_quantity,sale_price,mrp')
      .in('product_id', productIds)
      .eq('active', true)
      .gt('stock_quantity', 0),
    service.from('product_commerce_details')
      .select('product_id,mrp,return_eligible,return_window_days,return_policy_summary,external_source,last_catalog_sync_at')
      .in('product_id', productIds),
    service.from('product_images')
      .select('product_id,variant_id,image_url,alt_text,display_order,is_primary')
      .in('product_id', productIds)
      .order('display_order'),
  ]);

  if (productsResult.error || variantsResult.error || commerceResult.error || imagesResult.error) {
    return NextResponse.json({ products: [], filters: emptyFilters() }, { status: 503 });
  }

  const vendorIds = [...new Set((productsResult.data || []).map((row: any) => row.vendor_id).filter(Boolean))];
  const vendorsResult = vendorIds.length
    ? await service.from('vendors')
      .select('id,business_name,is_open,admin_suspended,marketplace_status,kyc_verified,gst_verified,authorized_brand_partner,invoice_available')
      .in('id', vendorIds)
      .eq('admin_suspended', false)
    : { data: [], error: null };

  if (vendorsResult.error) return NextResponse.json({ products: [], filters: emptyFilters() }, { status: 503 });

  const detailsByProduct = new Map(fashionRows.map((row: any) => [row.product_id, row]));
  const commerceByProduct = new Map((commerceResult.data || []).map((row: any) => [row.product_id, row]));
  const vendorById = new Map((vendorsResult.data || []).map((row: any) => [row.id, row]));
  const variantsByProduct = new Map<string, any[]>();
  const imagesByProduct = new Map<string, any[]>();

  for (const variant of variantsResult.data || []) {
    const rows = variantsByProduct.get(variant.product_id) || [];
    rows.push(variant);
    variantsByProduct.set(variant.product_id, rows);
  }
  for (const image of imagesResult.data || []) {
    const rows = imagesByProduct.get(image.product_id) || [];
    rows.push(image);
    imagesByProduct.set(image.product_id, rows);
  }

  const products = (productsResult.data || []).flatMap((product: any) => {
    const variants = variantsByProduct.get(product.id) || [];
    const seller = vendorById.get(product.vendor_id);
    const details = detailsByProduct.get(product.id);
    if (!details || !seller || seller.is_open === false || seller.marketplace_status === 'SUSPENDED' || variants.length === 0) return [];

    return [{
      ...product,
      fashion: details,
      commerce: commerceByProduct.get(product.id) || null,
      variants,
      images: imagesByProduct.get(product.id) || [],
      seller: {
        id: seller.id,
        business_name: seller.business_name,
        marketplace_status: seller.marketplace_status,
        kyc_verified: seller.kyc_verified === true,
        gst_verified: seller.gst_verified === true,
        authorized_brand_partner: seller.authorized_brand_partner === true,
        invoice_available: seller.invoice_available === true,
      },
    }];
  });

  const unique = (values: unknown[]) => [...new Set(values.map((value) => String(value || '').trim()).filter(Boolean))].sort();
  const filters = {
    departments: unique(products.map((p: any) => p.fashion.department)),
    sizes: unique(products.flatMap((p: any) => p.variants.map((v: any) => v.size_label))),
    colours: unique(products.flatMap((p: any) => p.variants.map((v: any) => v.colour_name))),
    brands: unique(products.map((p: any) => p.brand)),
    sellers: unique(products.map((p: any) => p.seller.business_name)),
  };

  return NextResponse.json({ products, filters }, {
    headers: { 'Cache-Control': 'public, max-age=30, stale-while-revalidate=120' },
  });
}

function emptyFilters() {
  return { departments: [], sizes: [], colours: [], brands: [], sellers: [] };
}
