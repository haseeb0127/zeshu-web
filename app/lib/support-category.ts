export type SupportServiceCategory =
  | 'Safety issue'
  | 'Payment issue'
  | 'Refund issue'
  | 'Ride issue'
  | 'Courier / Cargo issue'
  | 'Car Share issue'
  | 'Travel issue'
  | 'Marketplace / seller issue'
  | 'Recharge/Bill issue'
  | 'Pharmacy / Health issue'
  | 'Account issue'
  | 'Delivery issue'
  | 'Rewards / Referral issue'
  | 'Order issue'
  | 'Other';

export function classifySupportCategory(intent = '', message = ''): SupportServiceCategory {
  const normalizedIntent = String(intent || '').trim().toUpperCase();
  const text = String(message || '').toLowerCase();

  // Prefer the assistant's normalized intent when one exists. This prevents
  // generic words such as "payment" from swallowing a service-specific case.
  if (normalizedIntent === 'SAFETY') return 'Safety issue';
  if (normalizedIntent === 'PAYMENT') return 'Payment issue';
  if (normalizedIntent === 'REFUND' || normalizedIntent === 'REFUND_POLICY') return 'Refund issue';
  if (normalizedIntent === 'RIDES') return 'Ride issue';
  if (normalizedIntent === 'COURIER') return 'Courier / Cargo issue';
  if (normalizedIntent === 'CAR_SHARE') return 'Car Share issue';
  if (normalizedIntent === 'TRAVEL') return 'Travel issue';
  if (normalizedIntent === 'MARKETPLACE') return 'Marketplace / seller issue';
  if (normalizedIntent === 'PROVIDER_DISPUTE' || normalizedIntent === 'DIGITAL') return 'Recharge/Bill issue';
  if (normalizedIntent === 'PHARMACY') return 'Pharmacy / Health issue';
  if (normalizedIntent === 'ACCOUNT_CHANGE' || normalizedIntent === 'ACCOUNT') return 'Account issue';
  if (normalizedIntent === 'DELIVERY') return 'Delivery issue';
  if (normalizedIntent === 'REWARDS' || normalizedIntent === 'REFERRAL') return 'Rewards / Referral issue';
  if (normalizedIntent === 'ORDER') return 'Order issue';

  if (normalizedIntent === 'SERVICE_DISPUTE') {
    if (/\b(courier|cargo|parcel|package|mini truck|tempo|porter)\b/.test(text)) return 'Courier / Cargo issue';
    if (/\b(car share|carpool|car pool|car sharing|blablacar)\b/.test(text)) return 'Car Share issue';
    if (/\b(train|rail|flight|hotel|travel|pnr|bus ticket|experience|tour)\b/.test(text)) return 'Travel issue';
    if (/\b(bike|auto|cab|taxi|driver|ride)\b/.test(text)) return 'Ride issue';
  }

  // Text-only fallback for manual support entry where no assistant intent exists.
  if (/\b(accident|unsafe|danger|harass|harassment|threat|assault|emergency|safety)\b/.test(text)) return 'Safety issue';
  if (/\b(recharge|fastag|electricity|broadband|dth|water|piped gas|lpg|utility bill|bill payment)\b/.test(text)) return 'Recharge/Bill issue';
  if (/\b(courier|cargo|parcel|package|mini truck|tempo|porter|proof of delivery)\b/.test(text)) return 'Courier / Cargo issue';
  if (/\b(car share|carpool|car pool|car sharing|blablacar)\b/.test(text)) return 'Car Share issue';
  if (/\b(train|rail|flight|hotel|bus ticket|travel|pnr|experience|tour)\b/.test(text)) return 'Travel issue';
  if (/\b(bike ride|bike taxi|auto ride|autorickshaw|auto-rickshaw|cab|taxi|driver|ride)\b/.test(text)) return 'Ride issue';
  if (/\b(marketplace|seller|vendor|electronics|fashion|beauty|warranty|invoice|brand partner)\b/.test(text)) return 'Marketplace / seller issue';
  if (/\b(pharmacy|medicine|medicines|prescription|tablet|drug|health)\b/.test(text)) return 'Pharmacy / Health issue';
  if (/\b(zeshu cash|reward|rewards|referral|invite|bonus|cashback|coins?)\b/.test(text)) return 'Rewards / Referral issue';
  if (/\b(account|login|otp|profile|phone number|sign in|signin)\b/.test(text)) return 'Account issue';
  if (/\b(delivery|rider|address|location|serviceable|late delivery|delivery area)\b/.test(text)) return 'Delivery issue';
  if (/\b(refund|return|cancel|cancellation|replacement)\b/.test(text)) return 'Refund issue';
  if (/\b(payment|charged|debited|checkout|upi|card|duplicate payment)\b/.test(text)) return 'Payment issue';
  if (/\b(order|grocery|item|stock|missing item|wrong item)\b/.test(text)) return 'Order issue';

  return 'Other';
}

export function buildCategorizedSupportSubject(intent: string, message: string, subject: string) {
  const category = classifySupportCategory(intent, message);
  const cleanSubject = String(subject || 'Customer support').trim().slice(0, 120) || 'Customer support';
  const prefix = `[${category}]`;
  if (cleanSubject.startsWith(prefix)) return cleanSubject.slice(0, 160);
  return `${prefix} ${cleanSubject}`.slice(0, 160);
}
