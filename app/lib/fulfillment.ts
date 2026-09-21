export type DeliveryMode = 'LOCAL_30_MIN' | 'LOCAL_STANDARD' | 'INDIA_STANDARD';

export const DELIVERY_MODE_LABELS: Record<DeliveryMode, string> = {
  LOCAL_30_MIN: '30-min Fresh',
  LOCAL_STANDARD: 'Local delivery',
  INDIA_STANDARD: 'India delivery',
};

export const isIndiaReadyProduct = (product: any) =>
  product?.delivery_mode === 'INDIA_STANDARD'
  && product?.nationwide_shipping_enabled === true
  && product?.requires_cold_chain !== true
  && !['COLD_CHAIN', 'LOCAL_ONLY'].includes(String(product?.shipping_class || 'STANDARD'))
  && Number(product?.packed_weight_grams) > 0;

export const isFreshThirtyMinuteCandidate = (product: any) =>
  product?.delivery_mode === 'LOCAL_30_MIN'
  && product?.fresh_eligible === true;

export const deliveryBadge = (
  product: any,
  options?: { localThirtyMinuteAvailable?: boolean; nationwideCheckoutEnabled?: boolean },
) => {
  if (isFreshThirtyMinuteCandidate(product)) {
    const productAvailable = Boolean(product?.vendor_id)
      && product?.in_stock !== false
      && Number(product?.quantity) > 0;
    return options?.localThirtyMinuteAvailable && productAvailable
      ? { label: '⚡ ~30 min Fresh', tone: 'fresh' as const }
      : { label: 'Fresh · local delivery', tone: 'local' as const };
  }
  if (isIndiaReadyProduct(product)) {
    return options?.nationwideCheckoutEnabled
      ? { label: '🇮🇳 India delivery', tone: 'india' as const }
      : { label: '🇮🇳 India delivery soon', tone: 'india' as const };
  }
  return { label: 'Local delivery', tone: 'local' as const };
};
