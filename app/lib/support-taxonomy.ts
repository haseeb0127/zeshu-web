export type SupportService =
  | 'COMMERCE'
  | 'MARKETPLACE'
  | 'DIGITAL'
  | 'MOBILITY'
  | 'COURIER'
  | 'CAR_SHARE'
  | 'TRAVEL'
  | 'ACCOUNT'
  | 'REWARDS'
  | 'OTHER';

export type SupportSeverity = 'P0' | 'P1' | 'P2' | 'P3';

export type SupportClassification = {
  service: SupportService;
  issueType: string;
  severity: SupportSeverity;
  priority: 0 | 1 | 2 | 3;
  escalationRequired: boolean;
  escalationReason: string;
};

const has = (text: string, pattern: RegExp) => pattern.test(text);

export function classifySupportCase(intent = '', message = ''): SupportClassification {
  const normalizedIntent = String(intent || '').trim().toUpperCase();
  const text = String(message || '').toLowerCase();

  let service: SupportService = 'OTHER';
  if (['RIDES', 'MOBILITY', 'SAFETY'].includes(normalizedIntent) || has(text, /\b(bike ride|auto ride|cab|taxi|driver|ride|rider)\b/)) service = 'MOBILITY';
  else if (normalizedIntent === 'COURIER' || has(text, /\b(courier|cargo|parcel|package|mini truck|proof of delivery|pickup)\b/)) service = 'COURIER';
  else if (normalizedIntent === 'CAR_SHARE' || has(text, /\b(car share|carpool|car pool|cost sharing|seat)\b/)) service = 'CAR_SHARE';
  else if (normalizedIntent === 'TRAVEL' || has(text, /\b(bus|train|rail|flight|hotel|pnr|experience|travel booking)\b/)) service = 'TRAVEL';
  else if (normalizedIntent === 'MARKETPLACE' || has(text, /\b(marketplace|seller|vendor|invoice|authorized brand|gst verified|electronics|fashion|beauty)\b/)) service = 'MARKETPLACE';
  else if (['DIGITAL', 'PROVIDER_DISPUTE'].includes(normalizedIntent) || has(text, /\b(recharge|bill payment|bharat connect|bbps|fastag|dth|electricity|broadband|qr|upi)\b/)) service = 'DIGITAL';
  else if (['ACCOUNT', 'ACCOUNT_CHANGE', 'SECURITY'].includes(normalizedIntent) || has(text, /\b(account|login|otp|profile|phone number|identity)\b/)) service = 'ACCOUNT';
  else if (['REWARDS', 'REFERRAL'].includes(normalizedIntent) || has(text, /\b(zeshu cash|reward|referral|cashback|bonus)\b/)) service = 'REWARDS';
  else if (['ORDER', 'DELIVERY', 'REFUND', 'REFUND_POLICY', 'CATALOG', 'PAYMENT'].includes(normalizedIntent) || has(text, /\b(grocery|order|delivery|item|stock|refund|replacement|cancel)\b/)) service = 'COMMERCE';

  const safety = normalizedIntent === 'SAFETY' || has(text, /\b(accident|emergency|unsafe|danger|harass|harassment|threat|assault|suspicious driver|suspicious provider)\b/);
  const money = ['PAYMENT', 'PROVIDER_DISPUTE'].includes(normalizedIntent)
    || has(text, /\b(money.*debited|debited|charged|duplicate payment|chargeback|payment dispute|payment failed|failed recharge|pending transaction|refund decision|reversal|provider transaction)\b/);
  const decision = ['REFUND', 'ACCOUNT_CHANGE'].includes(normalizedIntent)
    || has(text, /\b(refund my|want.*refund|replacement|compensation|cancel my|account change|identity issue|lost property|lost item)\b/);
  const human = normalizedIntent === 'HUMAN' || has(text, /\b(human|person|agent|support executive|talk to support)\b/);

  let severity: SupportSeverity = 'P3';
  if (safety) severity = 'P0';
  else if (money || human || has(text, /\b(active ride|active courier|active booking)\b/)) severity = 'P1';
  else if (decision || service !== 'OTHER') severity = 'P2';

  let issueType = 'GENERAL_INFORMATION';
  if (safety) issueType = 'SAFETY_INCIDENT';
  else if (money) issueType = 'PAYMENT_OR_PROVIDER_TRANSACTION';
  else if (decision) issueType = 'DECISION_OR_ACCOUNT_REVIEW';
  else if (human) issueType = 'HUMAN_REQUEST';
  else if (has(text, /\b(damaged|spoiled|wrong item|missing item|damage|loss|lost parcel)\b/)) issueType = 'FULFILMENT_CLAIM';
  else if (has(text, /\b(cancel|cancellation|refund|return)\b/)) issueType = 'CANCELLATION_OR_REFUND';
  else if (has(text, /\b(track|tracking|eta|pickup|delivery|proof of delivery|pnr|booking status)\b/)) issueType = 'STATUS_OR_TRACKING';
  else if (has(text, /\b(stock|price|fare|seller|provider|serviceable|serviceability|available|availability)\b/)) issueType = 'AVAILABILITY_OR_PROVIDER';

  const escalationRequired = safety || money || decision || human || has(text, /\b(lost parcel|damaged parcel|travel booking dispute|ride complaint|driver complaint)\b/);
  const escalationReason = safety
    ? 'Immediate safety or emergency case requires human review.'
    : money
      ? 'Money or provider transaction requires reconciliation by support.'
      : decision
        ? 'Refund, replacement, compensation, cancellation, identity or protected account decision requires human review.'
        : human
          ? 'Customer explicitly requested a human agent.'
          : escalationRequired
            ? 'Service-specific dispute or claim requires human review.'
            : '';

  return { service, issueType, severity, priority: severity === 'P0' ? 0 : severity === 'P1' ? 1 : severity === 'P2' ? 2 : 3, escalationRequired, escalationReason };
}
