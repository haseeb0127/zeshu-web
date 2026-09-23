import {
  groupCartByFulfillment,
  marketplaceRecommendedScore,
  sellerTrustBadges,
} from '../../app/lib/marketplace';

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};

const seller = {
  id: 'seller-verified',
  business_name: 'Verified Test Seller',
  is_open: true,
  admin_suspended: false,
  marketplace_status: 'VERIFIED' as const,
  kyc_verified: true,
  gst_verified: true,
  authorized_brand_partner: false,
  invoice_available: true,
  seller_quality_score: 90,
};

const localProduct = {
  id: 'organic',
  vendor_id: seller.id,
  in_stock: true,
  quantity: 10,
  delivery_mode: 'LOCAL_STANDARD',
};

const sponsoredProduct = {
  ...localProduct,
  id: 'sponsored',
};

const organicRelevant = marketplaceRecommendedScore({
  product: localProduct,
  searchScore: 10,
  available: true,
  rating: 4.7,
  reviewCount: 25,
  sponsored: false,
  seller,
});

const sponsoredLessRelevant = marketplaceRecommendedScore({
  product: sponsoredProduct,
  searchScore: 1,
  available: true,
  rating: 4.7,
  reviewCount: 25,
  sponsored: true,
  seller,
});

assert(
  organicRelevant > sponsoredLessRelevant,
  'Sponsored +3 signal must not outrank a clearly more relevant organic product.',
);

const sponsoredUnavailable = marketplaceRecommendedScore({
  product: { ...sponsoredProduct, in_stock: false, quantity: 0 },
  searchScore: 10,
  available: false,
  rating: 5,
  reviewCount: 100,
  sponsored: true,
  seller,
});

assert(
  organicRelevant > sponsoredUnavailable,
  'Sponsored placement must not overcome customer availability/reliability signals.',
);

const verifiedBadges = sellerTrustBadges(seller).map((badge) => badge.label);
assert(verifiedBadges.includes('Verified Seller'), 'Verified + KYC seller must receive Verified Seller badge.');
assert(verifiedBadges.includes('GST Verified'), 'GST-verified seller badge is missing.');
assert(verifiedBadges.includes('GST Invoice Available'), 'Invoice-available seller badge is missing.');

const noKycBadges = sellerTrustBadges({ ...seller, kyc_verified: false }).map((badge) => badge.label);
assert(!noKycBadges.includes('Verified Seller'), 'Verified Seller badge must require KYC.');

const groups = groupCartByFulfillment([
  { item: { ...localProduct, delivery_mode: 'LOCAL_30_MIN', fresh_eligible: true }, qty: 1 },
  { item: { ...localProduct, id: 'today', delivery_mode: 'LOCAL_STANDARD' }, qty: 1 },
  {
    item: {
      ...localProduct,
      id: 'india',
      delivery_mode: 'INDIA_STANDARD',
      nationwide_shipping_enabled: true,
      handling_minutes: 720,
    },
    qty: 1,
  },
], {
  vendor30Min: { [seller.id]: true },
  nationwideCheckoutEnabled: true,
});

assert(groups.some((group) => group.label === 'Arriving in ~10–30 min'), '30-minute cart group is missing.');
assert(groups.some((group) => group.label === 'Arriving today'), 'Today cart group is missing.');
assert(groups.some((group) => group.label === 'Shipped delivery · 2–4 days'), 'Shipped cart group is missing.');

console.log('MARKETPLACE_DETERMINISTIC_QA=PASS');
