export type MarketplaceSeller = {
  id: string;
  business_name?: string | null;
  is_open?: boolean | null;
  admin_suspended?: boolean | null;
  marketplace_status?: 'PENDING' | 'VERIFIED' | 'SUSPENDED' | null;
  kyc_verified?: boolean | null;
  gst_verified?: boolean | null;
  authorized_brand_partner?: boolean | null;
  invoice_available?: boolean | null;
  seller_quality_score?: number | null;
};

export type SellerTrustBadge = {
  label: 'Verified Seller' | 'Authorized Brand Partner' | 'GST Verified' | 'GST Invoice Available';
  tone: 'green' | 'blue' | 'slate';
};

export const sellerTrustBadges = (seller?: MarketplaceSeller | null): SellerTrustBadge[] => {
  if (!seller || seller.admin_suspended === true) return [];
  const badges: SellerTrustBadge[] = [];
  if (seller.marketplace_status === 'VERIFIED' && seller.kyc_verified === true) {
    badges.push({ label: 'Verified Seller', tone: 'green' });
  }
  if (seller.authorized_brand_partner === true) {
    badges.push({ label: 'Authorized Brand Partner', tone: 'blue' });
  }
  if (seller.gst_verified === true) {
    badges.push({ label: 'GST Verified', tone: 'slate' });
  }
  if (seller.invoice_available === true) {
    badges.push({ label: 'GST Invoice Available', tone: 'slate' });
  }
  return badges;
};

export const sellerReliabilityScore = (seller?: MarketplaceSeller | null) => {
  if (!seller || seller.admin_suspended === true || seller.marketplace_status === 'SUSPENDED') return -100;
  let score = 0;
  if (seller.marketplace_status === 'VERIFIED') score += 16;
  if (seller.kyc_verified === true) score += 12;
  if (seller.gst_verified === true) score += 7;
  if (seller.authorized_brand_partner === true) score += 8;
  if (seller.invoice_available === true) score += 4;
  const quality = Number(seller.seller_quality_score);
  if (Number.isFinite(quality)) score += Math.max(0, Math.min(100, quality)) * 0.18;
  if (seller.is_open === true) score += 3;
  return score;
};

export type DeliveryPromise = {
  label: '⚡ 10–30 min' | 'Today' | 'Tomorrow' | '2–4 days' | 'India delivery soon' | 'Local delivery';
  group: 'NOW' | 'TODAY' | 'NATIONAL' | 'LOCKED';
  sortWeight: number;
};

export const marketplaceDeliveryPromise = (
  product: any,
  options?: { localThirtyMinuteAvailable?: boolean; nationwideCheckoutEnabled?: boolean },
): DeliveryPromise => {
  const inStock = Boolean(product?.vendor_id) && product?.in_stock !== false && Number(product?.quantity) > 0;
  if (product?.delivery_mode === 'LOCAL_30_MIN' && product?.fresh_eligible === true && options?.localThirtyMinuteAvailable && inStock) {
    return { label: '⚡ 10–30 min', group: 'NOW', sortWeight: 24 };
  }
  if (product?.delivery_mode === 'LOCAL_30_MIN' || product?.delivery_mode === 'LOCAL_STANDARD') {
    return { label: inStock ? 'Today' : 'Local delivery', group: 'TODAY', sortWeight: inStock ? 16 : 5 };
  }
  if (product?.delivery_mode === 'INDIA_STANDARD') {
    if (!(product?.nationwide_shipping_enabled === true && options?.nationwideCheckoutEnabled)) {
      return { label: 'India delivery soon', group: 'LOCKED', sortWeight: 0 };
    }
    const handlingMinutes = Number(product?.handling_minutes || 0);
    if (Number.isFinite(handlingMinutes) && handlingMinutes > 0 && handlingMinutes <= 360) {
      return { label: 'Tomorrow', group: 'NATIONAL', sortWeight: 9 };
    }
    return { label: '2–4 days', group: 'NATIONAL', sortWeight: 7 };
  }
  return { label: 'Local delivery', group: 'TODAY', sortWeight: 5 };
};

export const marketplaceRecommendedScore = ({
  product,
  searchScore = 0,
  available = false,
  rating = 0,
  reviewCount = 0,
  sponsored = false,
  seller,
  localThirtyMinuteAvailable = false,
  nationwideCheckoutEnabled = false,
}: {
  product: any;
  searchScore?: number;
  available?: boolean;
  rating?: number;
  reviewCount?: number;
  sponsored?: boolean;
  seller?: MarketplaceSeller | null;
  localThirtyMinuteAvailable?: boolean;
  nationwideCheckoutEnabled?: boolean;
}) => {
  // Customer value signals intentionally dominate paid placement.
  const relevance = Math.max(0, Number(searchScore || 0));
  const availability = available ? 70 : -45;
  const delivery = marketplaceDeliveryPromise(product, { localThirtyMinuteAvailable, nationwideCheckoutEnabled }).sortWeight;
  const reliability = sellerReliabilityScore(seller);
  const safeRating = Number.isFinite(Number(rating)) ? Math.max(0, Math.min(5, Number(rating))) : 0;
  const safeReviews = Number.isFinite(Number(reviewCount)) ? Math.max(0, Number(reviewCount)) : 0;
  const ratingConfidence = safeRating * 6 + Math.min(12, Math.log10(safeReviews + 1) * 8);
  const paidPlacement = sponsored ? 3 : 0;
  return relevance * 4 + availability + delivery + reliability + ratingConfidence + paidPlacement;
};

export type CartFulfillmentGroup = {
  key: string;
  label: 'Arriving in ~10–30 min' | 'Arriving today' | 'Shipped delivery · 2–4 days' | 'India delivery · coming soon';
  entries: Array<{ item: any; qty: number }>;
};

export const groupCartByFulfillment = (
  cart: Array<{ item: any; qty: number }>,
  options?: { vendor30Min?: Record<string, boolean>; nationwideCheckoutEnabled?: boolean },
): CartFulfillmentGroup[] => {
  const groups = new Map<string, CartFulfillmentGroup>();
  for (const entry of cart) {
    const vendorId = String(entry?.item?.vendor_id || '');
    const promise = marketplaceDeliveryPromise(entry.item, {
      localThirtyMinuteAvailable: Boolean(options?.vendor30Min?.[vendorId]),
      nationwideCheckoutEnabled: options?.nationwideCheckoutEnabled === true,
    });
    const key = promise.group;
    const label: CartFulfillmentGroup['label'] =
      promise.group === 'NOW' ? 'Arriving in ~10–30 min'
      : promise.group === 'TODAY' ? 'Arriving today'
      : promise.group === 'NATIONAL' ? 'Shipped delivery · 2–4 days'
      : 'India delivery · coming soon';
    const group = groups.get(key) || { key, label, entries: [] };
    group.entries.push(entry);
    groups.set(key, group);
  }
  const order = ['NOW', 'TODAY', 'NATIONAL', 'LOCKED'];
  return Array.from(groups.values()).sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));
};
