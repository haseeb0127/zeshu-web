import { createHash } from 'node:crypto';

const PLAN_API_BASE = 'https://planapi.in/api/Mobile';

export type NormalizedPlan = {
  id: string;
  category: string;
  amount: number;
  validity: string;
  description: string;
  source: 'standard';
};

export type NormalizedSpecialOffer = {
  id: string;
  amount: number;
  title: string;
  description: string;
  source: 'special';
};

export type PlanDiscoveryResult = {
  operator: string;
  operatorCode: string;
  circle: string;
  circleCode: string;
  plans: NormalizedPlan[];
  specialOffers: NormalizedSpecialOffer[];
};

function credentials() {
  const memberId = process.env.PLANAPI_MEMBER_ID;
  const password = process.env.PLANAPI_PASSWORD;
  if (!memberId || !password) throw new Error('PLANAPI_NOT_CONFIGURED');
  return { memberId, password };
}

function providerError(message: string) {
  return new Error(message.replace(/https?:\/\/\S+/gi, '[provider]').slice(0, 160));
}

async function getProvider(path: string, params: Record<string, string>) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const query = new URLSearchParams(params);
    const response = await fetch(`${PLAN_API_BASE}/${path}?${query.toString()}`, { signal: controller.signal, cache: 'no-store' });
    const text = await response.text();
    let data: any;
    try { data = JSON.parse(text); } catch { throw providerError('Invalid provider response.'); }
    if (!response.ok) throw providerError('Provider request failed.');
    return data;
  } finally {
    clearTimeout(timeout);
  }
}

function stableId(parts: string[]) {
  const digest = createHash('sha256').update(parts.join('|')).digest('hex').slice(0, 20);
  return `plan_${digest}`;
}

function amount(value: unknown) {
  const parsed = Number(String(value ?? '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function normalizePlans(rdata: unknown): NormalizedPlan[] {
  if (!rdata || typeof rdata !== 'object') return [];
  const plans: NormalizedPlan[] = [];
  for (const [category, entries] of Object.entries(rdata as Record<string, unknown>)) {
    if (!Array.isArray(entries)) continue;
    for (const entry of entries) {
      if (!entry || typeof entry !== 'object') continue;
      const item = entry as Record<string, unknown>;
      const price = amount(item.rs ?? item.amount ?? item.Price);
      if (price === null) continue;
      const validity = String(item.validity ?? item.Validity ?? 'Validity not provided');
      const description = String(item.desc ?? item.Description ?? item.detail ?? 'Plan details not provided');
      plans.push({ id: stableId([category, String(price), validity, description]), category, amount: price, validity, description, source: 'standard' });
    }
  }
  return plans;
}

export function normalizeSpecialOffers(rdata: unknown): NormalizedSpecialOffer[] {
  const entries = Array.isArray(rdata) ? rdata : rdata && typeof rdata === 'object' ? [rdata] : [];
  const offers: NormalizedSpecialOffer[] = [];
  for (const [index, entry] of entries.entries()) {
    if (!entry || typeof entry !== 'object') continue;
    const item = entry as Record<string, unknown>;
    const offerAmount = amount(item.price);
    if (offerAmount === null) continue;
    const description = String(item.ofrtext ?? item.logdesc ?? '').trim();
    if (!description) continue;
    offers.push({
      id: stableId(['special', String(index), String(offerAmount), description]),
      amount: offerAmount,
      title: 'Special offer for this number',
      description,
      source: 'special',
    });
  }
  return offers;
}

function shouldCheckRoffer(operator: string) {
  return /airtel|vodafone|idea|vi/i.test(operator);
}

export async function discoverPlans(mobile: string): Promise<PlanDiscoveryResult> {
  if (!/^[6-9]\d{9}$/.test(mobile)) throw new Error('INVALID_MOBILE');
  const { memberId, password } = credentials();
  const detected = await getProvider('OperatorFetchNew', { ApiUserID: memberId, ApiPassword: password, Mobileno: mobile });
  if (String(detected?.ERROR ?? '') !== '0' || !detected?.OpCode || !detected?.CircleCode) throw providerError('Operator could not be detected.');
  const operator = String(detected.Operator ?? 'Operator');
  const operatorCode = String(detected.OpCode);
  const circle = String(detected.Circle ?? 'Circle');
  const circleCode = String(detected.CircleCode);
  const standard = await getProvider('NewMobilePlans', { apimember_id: memberId, api_password: password, operatorcode: operatorCode, cricle: circleCode });
  if (String(standard?.ERROR ?? '') !== '0') throw providerError('Plans are temporarily unavailable.');
  const plans = normalizePlans(standard.RDATA);
  let specialOffers: NormalizedSpecialOffer[] = [];
  if (shouldCheckRoffer(operator)) {
    try {
      const offerData = await getProvider('RofferCheck', { apimember_id: memberId, api_password: password, operator_code: operatorCode, mobile_no: mobile });
      specialOffers = normalizeSpecialOffers(offerData?.RDATA);
    } catch {
      // R-OFFER is optional; standard plans remain usable.
    }
  }
  return { operator, operatorCode, circle, circleCode, plans, specialOffers };
}
