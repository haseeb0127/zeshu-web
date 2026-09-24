export type ZeshuMoveMode = 'BIKE' | 'AUTO' | 'CAB' | 'COURIER';

export type FarePreviewInput = {
  mode: ZeshuMoveMode;
  distanceKm: number;
  durationMin: number;
};

export type FarePreview = {
  customerFare: number;
  captainGross: number;
  zeshuPlatformFee: number;
  currency: 'INR';
  promotional: boolean;
  disclaimer: string;
};

const pricing: Record<ZeshuMoveMode, { base: number; perKm: number; perMin: number; minimum: number }> = {
  BIKE: { base: 18, perKm: 7, perMin: 0.35, minimum: 25 },
  AUTO: { base: 30, perKm: 12, perMin: 0.45, minimum: 45 },
  CAB: { base: 55, perKm: 16, perMin: 0.6, minimum: 80 },
  COURIER: { base: 25, perKm: 9, perMin: 0.25, minimum: 35 },
};

export function previewMoveFare(input: FarePreviewInput): FarePreview {
  const rule = pricing[input.mode];
  const raw = rule.base + Math.max(0, input.distanceKm) * rule.perKm + Math.max(0, input.durationMin) * rule.perMin;
  const customerFare = Math.ceil(Math.max(rule.minimum, raw));
  // Launch target only: keep platform take low. Final commercial rates must be configured
  // after compliance, taxes, insurance, provider and payment costs are known.
  const feeRate = 0.08;
  const zeshuPlatformFee = Math.round(customerFare * feeRate);
  return {
    customerFare,
    captainGross: customerFare - zeshuPlatformFee,
    zeshuPlatformFee,
    currency: 'INR',
    promotional: true,
    disclaimer: 'Planning estimate only. Not a quote or booking. Final fare is shown only by an enabled verified provider.',
  };
}
