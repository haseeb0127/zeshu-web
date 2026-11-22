/** 
 * Local checkout prices shared by the public quote endpoint and the secure
 * reservation/pricing flow. Keep the paid pilot OFF until rider payout,
 * consumer disclosure, GST treatment and merchant settlement are approved.
 *
 * The distance slabs use Jagtial town-centre straight-line distance as a
 * conservative pilot proxy, NOT a claim of route distance or rider cost.
 * A future verified seller-pickup routing API should replace this model.
 */
export type LocalPriceQuote = {
  policy: 'LEGACY' | 'PAID_LOCAL_PILOT';
  eligible: boolean;
  reason: 'OK' | 'ADDRESS_REQUIRED' | 'INVALID_SUBTOTAL' | 'OUTSIDE_PILOT_RADIUS';
  deliveryFee: number;
  handlingFee: number;
  totalBeforeRewards: number | null;
  zoneKm: number | null;
};

const CENTER_LAT = 18.8;
const CENTER_LNG = 78.93;
const MAX_PILOT_RADIUS_KM = 6;

function distanceKm(lat: number, lng: number) {
  const toRad = (n: number) => n * Math.PI / 180;
  const a = Math.sin(toRad(lat - CENTER_LAT) / 2) ** 2
    + Math.cos(toRad(CENTER_LAT)) * Math.cos(toRad(lat))
    * Math.sin(toRad(lng - CENTER_LNG) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(a)));
}

export function calculateLocalCheckoutPrice(input: {
  subtotal: number;
  pilotEnabled: boolean;
  latitude?: number | null;
  longitude?: number | null;
}): LocalPriceQuote {
  const subtotal = Number(input.subtotal);
  const policy = input.pilotEnabled ? 'PAID_LOCAL_PILOT' : 'LEGACY';
  const invalid = (reason: LocalPriceQuote['reason']): LocalPriceQuote => ({
    policy, eligible: false, reason, deliveryFee: 0, handlingFee: 0, totalBeforeRewards: null, zoneKm: null,
  });
  if (!Number.isFinite(subtotal) || subtotal <= 0) return invalid('INVALID_SUBTOTAL');

  if (!input.pilotEnabled) {
    const deliveryFee = subtotal >= 299 ? 0 : 30;
    return { policy, eligible: true, reason: 'OK', deliveryFee, handlingFee: 0, totalBeforeRewards: Math.round((subtotal + deliveryFee) * 100) / 100, zoneKm: null };
  }

  // Require a verified/saved location in the real checkout and never price an
  // unfamiliar location as if it were beside the town centre.
  const lat = input.latitude;
  const lng = input.longitude;
  if (typeof lat !== 'number' || typeof lng !== 'number'
      || !Number.isFinite(lat) || !Number.isFinite(lng)
      || lat < -90 || lat > 90 || lng < -180 || lng > 180) return invalid('ADDRESS_REQUIRED');

  const zoneKm = distanceKm(lat, lng);
  if (zoneKm > MAX_PILOT_RADIUS_KM) return invalid('OUTSIDE_PILOT_RADIUS');

  // Tax-inclusive proposed fees, subject to tax/registration review. There
  // is deliberately NO free-delivery-by-basket-size rule in the paid pilot.
  const deliveryFee = zoneKm <= 2 ? 29 : zoneKm <= 4 ? 39 : 49;
  const handlingFee = 10;
  return {
    policy, eligible: true, reason: 'OK', deliveryFee, handlingFee,
    totalBeforeRewards: Math.round((subtotal + deliveryFee + handlingFee) * 100) / 100,
    zoneKm: Math.round(zoneKm * 100) / 100,
  };
}
