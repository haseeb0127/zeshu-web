import 'server-only';

// Add a provider slug here only after Zeshu has a reviewed adapter that performs
// real pincode serviceability, live rate quoting, shipment creation and status lookup.
// Environment variables alone must never unlock nationwide checkout.
const SUPPORTED_COURIER_ADAPTERS = new Set<string>();

export const isNationwideCourierReady = () => {
  const provider = process.env.ZESHU_COURIER_PROVIDER?.trim().toLowerCase() || '';
  const rateApiUrl = process.env.ZESHU_COURIER_RATE_API_URL?.trim() || '';
  return Boolean(provider && rateApiUrl && SUPPORTED_COURIER_ADAPTERS.has(provider));
};

export const configuredCourierProvider = () =>
  isNationwideCourierReady()
    ? process.env.ZESHU_COURIER_PROVIDER!.trim().toLowerCase()
    : null;
