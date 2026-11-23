import 'server-only';

import type { MoveServiceKey } from './move-readiness';

export type MoveProviderAction =
  | 'SERVICEABILITY'
  | 'QUOTE'
  | 'BOOK'
  | 'TRACK'
  | 'CANCEL'
  | 'REFUND';

export type MoveProviderCapability = {
  action: MoveProviderAction;
  supported: boolean;
};

export type MoveLocation = {
  latitude?: number | null;
  longitude?: number | null;
  postcode?: string | null;
  city?: string | null;
  state?: string | null;
};

export type MoveServiceabilityRequest = {
  service: MoveServiceKey;
  origin: MoveLocation;
  destination?: MoveLocation | null;
  requestedAt?: string | null;
};

export type MoveServiceabilityResult = {
  providerId: string;
  service: MoveServiceKey;
  serviceable: boolean;
  reason?: string | null;
  expiresAt?: string | null;
};

export type MoveQuoteRequest = MoveServiceabilityRequest & {
  passengerCount?: number | null;
  parcelWeightKg?: number | null;
  parcelDeclaredValue?: number | null;
  vehicleClass?: string | null;
  metadata?: Record<string, string | number | boolean | null>;
};

export type MoveQuote = {
  providerId: string;
  service: MoveServiceKey;
  quoteId: string;
  currency: 'INR';
  amountPaise: number;
  expiresAt: string;
  estimatedPickupMinutes?: number | null;
  estimatedCompletionMinutes?: number | null;
  termsSummary?: string | null;
};

export type MoveBookingRequest = {
  service: MoveServiceKey;
  quoteId: string;
  customerReference: string;
  idempotencyKey: string;
};

export type MoveBookingResult = {
  providerId: string;
  providerBookingId: string;
  status: 'PENDING' | 'CONFIRMED';
  providerReference?: string | null;
};

export type MoveProviderStatus = {
  providerId: string;
  providerBookingId: string;
  status: 'PENDING' | 'CONFIRMED' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'FAILED' | 'REFUNDED';
  updatedAt: string;
};

export interface MoveProviderAdapter {
  id: string;
  displayName: string;
  service: MoveServiceKey;
  capabilities: MoveProviderCapability[];
  checkServiceability(input: MoveServiceabilityRequest): Promise<MoveServiceabilityResult>;
  getQuote(input: MoveQuoteRequest): Promise<MoveQuote>;
  createBooking?(input: MoveBookingRequest): Promise<MoveBookingResult>;
  getBookingStatus?(providerBookingId: string): Promise<MoveProviderStatus>;
  cancelBooking?(providerBookingId: string, reason: string): Promise<MoveProviderStatus>;
  refundBooking?(providerBookingId: string, amountPaise?: number | null): Promise<MoveProviderStatus>;
}

export const providerSupports = (adapter: MoveProviderAdapter, action: MoveProviderAction) =>
  adapter.capabilities.some((capability) => capability.action === action && capability.supported);

export const validateMoveQuote = (quote: MoveQuote) => {
  if (!quote.providerId.trim() || !quote.quoteId.trim()) throw new Error('INVALID_MOVE_QUOTE');
  if (quote.currency !== 'INR') throw new Error('UNSUPPORTED_MOVE_CURRENCY');
  if (!Number.isInteger(quote.amountPaise) || quote.amountPaise < 0) throw new Error('INVALID_MOVE_QUOTE_AMOUNT');
  const expiresAt = Date.parse(quote.expiresAt);
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) throw new Error('EXPIRED_MOVE_QUOTE');
  return quote;
};
