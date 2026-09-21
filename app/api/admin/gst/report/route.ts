import { NextResponse } from 'next/server';
import { requireMarketingAdmin } from '@/app/lib/marketing-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const monthPattern = /^\d{4}-(0[1-9]|1[0-2])$/;

const csvCell = (value: unknown) => {
  const text = value == null ? '' : String(value);
  return '"' + text.replaceAll('"', '""') + '"';
};

const round2 = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

function monthBounds(month: string) {
  const [year, monthNumber] = month.split('-').map(Number);
  const start = new Date(Date.UTC(year, monthNumber - 1, 1));
  const end = new Date(Date.UTC(year, monthNumber, 1));
  return { start: start.toISOString(), end: end.toISOString() };
}

type SalesRow = {
  order_id: string;
  order_date: string;
  order_status: string;
  vendor_id: string;
  product_name: string;
  hsn_code: string;
  quantity: number;
  unit_price: number;
  gross_value: number;
  gst_rate: number | null;
  taxable_value: number | null;
  gst_amount: number | null;
  seller_legal_name: string;
  seller_gstin: string;
  seller_state_code: string;
  invoice_model: string;
  classification_status: string;
  review_flag: string;
};

function buildSalesRows(orders: any[]): SalesRow[] {
  const rows: SalesRow[] = [];
  for (const order of orders) {
    const items = Array.isArray(order.items) ? order.items : [];
    for (const entry of items) {
      const snapshot = entry?.item || entry?.item_snapshot || {};
      const quantity = Number(entry?.qty ?? entry?.quantity ?? 0);
      const unitPrice = Number(snapshot?.price ?? entry?.unit_price ?? entry?.price ?? 0);
      const grossValue = round2(quantity * unitPrice);
      const rawRate = snapshot?.gst_rate;
      const gstRate = rawRate === null || rawRate === undefined || rawRate === '' ? null : Number(rawRate);
      const priceIncludesGst = snapshot?.price_includes_gst !== false;
      const classification = String(snapshot?.tax_classification_status || 'UNCLASSIFIED');
      const sellerGstin = String(snapshot?.seller_gstin || '');
      const invoiceModel = String(snapshot?.invoice_model || '');
      let taxableValue: number | null = null;
      let gstAmount: number | null = null;
      const flags: string[] = [];

      if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(unitPrice) || unitPrice < 0) flags.push('INVALID_LINE_VALUE');
      if (gstRate === null || !Number.isFinite(gstRate)) flags.push('GST_RATE_MISSING');
      if (!snapshot?.hsn_code) flags.push('HSN_MISSING');
      if (classification !== 'REVIEWED') flags.push('TAX_CLASSIFICATION_REVIEW');
      if (!priceIncludesGst) flags.push('PRICE_TAX_MODE_REVIEW');
      if (!sellerGstin) flags.push('SELLER_GSTIN_MISSING');
      if (!invoiceModel) flags.push('INVOICE_MODEL_MISSING');
      if (order.status === 'CANCELLED') flags.push('CANCELLED_ORDER_CREDIT_NOTE_REVIEW');

      if (flags.length === 0 && gstRate !== null && priceIncludesGst) {
        taxableValue = round2(grossValue / (1 + gstRate / 100));
        gstAmount = round2(grossValue - taxableValue);
      }

      rows.push({
        order_id: String(order.id || ''),
        order_date: String(order.created_at || ''),
        order_status: String(order.status || ''),
        vendor_id: String(order.vendor_id || ''),
        product_name: String(snapshot?.name || entry?.name || 'Product'),
        hsn_code: String(snapshot?.hsn_code || ''),
        quantity: Number.isFinite(quantity) ? quantity : 0,
        unit_price: Number.isFinite(unitPrice) ? unitPrice : 0,
        gross_value: grossValue,
        gst_rate: gstRate !== null && Number.isFinite(gstRate) ? gstRate : null,
        taxable_value: taxableValue,
        gst_amount: gstAmount,
        seller_legal_name: String(snapshot?.seller_legal_name || ''),
        seller_gstin: sellerGstin,
        seller_state_code: String(snapshot?.seller_state_code || ''),
        invoice_model: invoiceModel,
        classification_status: classification,
        review_flag: flags.join('|'),
      });
    }
  }
  return rows;
}

export async function GET(request: Request) {
  const { context, response } = await requireMarketingAdmin(request);
  if (response || !context) return response!;

  const url = new URL(request.url);
  const month = url.searchParams.get('month') || '';
  const format = (url.searchParams.get('format') || 'json').toLowerCase();

  const [profileResult, vendorTaxResult, productTaxResult, purchaseResult] = await Promise.all([
    context.service.from('business_tax_profiles').select('*').eq('status', 'ACTIVE').maybeSingle(),
    context.service.from('vendor_tax_profiles').select('vendor_id,gst_registered,gstin,invoice_model,verification_status'),
    context.service.from('product_tax_profiles').select('product_id,hsn_code,gst_rate,classification_status'),
    context.service.from('gst_purchase_invoices').select('*').order('invoice_date', { ascending: false }).limit(2000),
  ]);
  const setupError = profileResult.error || vendorTaxResult.error || productTaxResult.error || purchaseResult.error;
  if (setupError) return NextResponse.json({ error: 'GST bookkeeping data is temporarily unavailable.' }, { status: 503 });

  const readiness = {
    business_profile_active: Boolean(profileResult.data),
    vendor_profiles: (vendorTaxResult.data || []).length,
    vendor_profiles_verified: (vendorTaxResult.data || []).filter((row: any) => row.verification_status === 'VERIFIED').length,
    product_tax_profiles: (productTaxResult.data || []).length,
    product_tax_profiles_reviewed: (productTaxResult.data || []).filter((row: any) => row.classification_status === 'REVIEWED' && row.hsn_code && row.gst_rate !== null).length,
    itc_invoice_count: (purchaseResult.data || []).length,
    itc_eligible_unclaimed: (purchaseResult.data || []).filter((row: any) => row.itc_eligible && !row.itc_claimed).length,
  };

  if (!month) return NextResponse.json({ profile: profileResult.data || null, readiness });

  if (!monthPattern.test(month)) return NextResponse.json({ error: 'Month must be YYYY-MM.' }, { status: 400 });
  const { start, end } = monthBounds(month);
  const { data: orders, error: orderError } = await context.service
    .from('orders')
    .select('id,created_at,status,vendor_id,items,total_paid,delivery_fee')
    .gte('created_at', start)
    .lt('created_at', end)
    .order('created_at', { ascending: true })
    .limit(50000);
  if (orderError) return NextResponse.json({ error: 'Monthly GST sales data is temporarily unavailable.' }, { status: 503 });

  const salesRows = buildSalesRows(orders || []);
  const monthlyPurchases = (purchaseResult.data || []).filter((row: any) => {
    const date = String(row.invoice_date || '');
    return date >= start.slice(0, 10) && date < end.slice(0, 10);
  });
  const summary = {
    month,
    order_count: (orders || []).length,
    sales_line_count: salesRows.length,
    gross_sales_lines: round2(salesRows.reduce((sum, row) => sum + row.gross_value, 0)),
    classified_taxable_value: round2(salesRows.reduce((sum, row) => sum + Number(row.taxable_value || 0), 0)),
    classified_output_gst: round2(salesRows.reduce((sum, row) => sum + Number(row.gst_amount || 0), 0)),
    exception_lines: salesRows.filter((row) => row.review_flag).length,
    eligible_itc_recorded: round2(monthlyPurchases.filter((row: any) => row.itc_eligible).reduce((sum: number, row: any) => sum + Number(row.cgst || 0) + Number(row.sgst || 0) + Number(row.igst || 0) + Number(row.cess || 0), 0)),
  };

  if (format === 'csv') {
    const headers = [
      'Order ID','Order Date','Order Status','Vendor ID','Product','HSN','Qty','Unit Price','Gross Value','GST Rate %','Taxable Value','GST Amount',
      'Seller Legal Name','Seller GSTIN','Seller State Code','Invoice Model','Classification Status','Review Flag',
    ];
    const lines = [headers.map(csvCell).join(',')];
    for (const row of salesRows) {
      lines.push([
        row.order_id,row.order_date,row.order_status,row.vendor_id,row.product_name,row.hsn_code,row.quantity,row.unit_price,row.gross_value,
        row.gst_rate ?? '',row.taxable_value ?? '',row.gst_amount ?? '',row.seller_legal_name,row.seller_gstin,row.seller_state_code,
        row.invoice_model,row.classification_status,row.review_flag,
      ].map(csvCell).join(','));
    }
    const csv = '\uFEFF' + lines.join('\r\n');
    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="zeshu-gst-sales-${month}.csv"`,
        'Cache-Control': 'no-store',
      },
    });
  }

  return NextResponse.json({ profile: profileResult.data || null, readiness, summary, sales_rows: salesRows, purchase_invoices: monthlyPurchases });
}
