import 'server-only';

export type UtilityProviderStatus = 'SUCCESS' | 'PENDING' | 'FAILED' | 'UNKNOWN';

export interface UtilityProvider {
  validate(input: unknown): Promise<{ valid: boolean; message?: string }>;
  fetchBillOrPlan(input: unknown): Promise<{ status: UtilityProviderStatus; data?: unknown; message?: string }>;
  initiateFulfillment(input: unknown): Promise<{ status: UtilityProviderStatus; message: string }>;
  statusEnquiry(input: unknown): Promise<{ status: UtilityProviderStatus; message?: string }>;
}

/** Safe seam for future providers. No provider is enabled by this adapter. */
export function createDisabledUtilityProvider(name: string): UtilityProvider {
  const message = `${name} provider fulfillment is not available.`;
  return {
    async validate() { return { valid: false, message }; },
    async fetchBillOrPlan() { return { status: 'UNKNOWN', message }; },
    async initiateFulfillment() { return { status: 'FAILED', message }; },
    async statusEnquiry() { return { status: 'UNKNOWN', message }; },
  };
}
