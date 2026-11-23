import 'server-only';

type ShiprocketCourier = {
  courier_company_id?: number;
  courier_name?: string;
  freight_charge?: number | string;
  estimated_delivery_days?: number | string;
  etd?: string;
  blocked?: number | boolean;
  is_international?: number | boolean;
  charge_weight?: number | string;
};

export type NationwideCourierQuote = {
  provider: 'shiprocket';
  courierId: number;
  courierName: string;
  courierCost: number;
  estimatedDeliveryDays: number | null;
  etd: string | null;
  chargeWeightKg: number | null;
};

let cachedShiprocketToken: { value: string; expiresAt: number } | null = null;

const provider = () => process.env.ZESHU_COURIER_PROVIDER?.trim().toLowerCase() || '';
const shiprocketConfig = () => ({
  email: process.env.SHIPROCKET_API_EMAIL?.trim() || '',
  password: process.env.SHIPROCKET_API_PASSWORD || '',
  pickupPostcode: process.env.SHIPROCKET_PICKUP_POSTCODE?.trim() || '',
});

export const isNationwideCourierReady = () => {
  if (provider() !== 'shiprocket') return false;
  const config = shiprocketConfig();
  return Boolean(config.email && config.password && /^\d{6}$/.test(config.pickupPostcode));
};

export const configuredCourierProvider = () =>
  isNationwideCourierReady() ? 'shiprocket' : null;

const finiteNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const getShiprocketToken = async () => {
  if (cachedShiprocketToken && cachedShiprocketToken.expiresAt > Date.now()) {
    return cachedShiprocketToken.value;
  }

  const config = shiprocketConfig();
  if (!config.email || !config.password) throw new Error('COURIER_NOT_CONFIGURED');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ email: config.email, password: config.password }),
      cache: 'no-store',
      signal: controller.signal,
    });
    if (!response.ok) throw new Error('COURIER_AUTH_FAILED');
    const payload = await response.json().catch(() => ({}));
    const token = typeof payload?.token === 'string' ? payload.token.trim() : '';
    if (!token) throw new Error('COURIER_AUTH_FAILED');

    // Keep this shorter than Shiprocket's token lifetime so stale credentials
    // fail closed without asking customers to retry against an old token.
    cachedShiprocketToken = { value: token, expiresAt: Date.now() + 6 * 60 * 60 * 1000 };
    return token;
  } finally {
    clearTimeout(timeout);
  }
};

export const getNationwideCourierQuotes = async (input: {
  deliveryPostcode: string;
  weightKg: number;
  declaredValue: number;
  lengthCm?: number | null;
  breadthCm?: number | null;
  heightCm?: number | null;
}): Promise<NationwideCourierQuote[]> => {
  if (!isNationwideCourierReady()) throw new Error('COURIER_NOT_CONFIGURED');
  if (!/^\d{6}$/.test(input.deliveryPostcode) || !Number.isFinite(input.weightKg) || input.weightKg <= 0) {
    throw new Error('INVALID_COURIER_QUOTE_INPUT');
  }

  const config = shiprocketConfig();
  const token = await getShiprocketToken();
  const params = new URLSearchParams({
    pickup_postcode: config.pickupPostcode,
    delivery_postcode: input.deliveryPostcode,
    cod: '0',
    weight: String(Math.max(0.001, input.weightKg)),
    declared_value: String(Math.max(1, Math.round(input.declaredValue))),
  });
  if (Number.isFinite(input.lengthCm) && Number(input.lengthCm) > 0) params.set('length', String(input.lengthCm));
  if (Number.isFinite(input.breadthCm) && Number(input.breadthCm) > 0) params.set('breadth', String(input.breadthCm));
  if (Number.isFinite(input.heightCm) && Number(input.heightCm) > 0) params.set('height', String(input.heightCm));

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(`https://apiv2.shiprocket.in/v1/external/courier/serviceability/?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      cache: 'no-store',
      signal: controller.signal,
    });
    if (response.status === 401) cachedShiprocketToken = null;
    if (!response.ok) throw new Error('COURIER_SERVICEABILITY_FAILED');

    const payload = await response.json().catch(() => ({}));
    const couriers = Array.isArray(payload?.data?.available_courier_companies)
      ? payload.data.available_courier_companies as ShiprocketCourier[]
      : [];

    return couriers
      .map((courier) => {
        const courierId = finiteNumber(courier.courier_company_id);
        const courierCost = finiteNumber(courier.freight_charge);
        const estimatedDays = finiteNumber(courier.estimated_delivery_days);
        const chargeWeight = finiteNumber(courier.charge_weight);
        if (
          courierId === null
          || courierCost === null
          || courierCost < 0
          || courier.blocked === 1
          || courier.blocked === true
          || courier.is_international === 1
          || courier.is_international === true
        ) return null;

        return {
          provider: 'shiprocket' as const,
          courierId,
          courierName: String(courier.courier_name || `Courier ${courierId}`),
          courierCost,
          estimatedDeliveryDays: estimatedDays === null ? null : Math.max(0, Math.ceil(estimatedDays)),
          etd: typeof courier.etd === 'string' && courier.etd.trim() ? courier.etd.trim() : null,
          chargeWeightKg: chargeWeight,
        };
      })
      .filter((quote): quote is NationwideCourierQuote => Boolean(quote))
      .sort((a, b) => a.courierCost - b.courierCost || (a.estimatedDeliveryDays ?? 999) - (b.estimatedDeliveryDays ?? 999));
  } finally {
    clearTimeout(timeout);
  }
};
