import { randomUUID } from 'node:crypto';

const A1TOPUP_HOST = 'business.a1topup.com';
const A1TOPUP_BASE = `https://${A1TOPUP_HOST}/recharge`;

type A1TopupCredentials = { username: string; password: string };
export type A1TopupOperator = 'A' | 'RC';
export type A1TopupCircle = { name: string; code: string };
export type A1TopupStatus = 'SUCCESS' | 'FAILED' | 'PENDING' | 'UNKNOWN';
export type A1TopupNormalizedResponse = { txid?: string; status: A1TopupStatus; opid?: string; number?: string; amount?: string; orderid?: string };
export type A1TopupCallbackNotification = { txid: string; status: string; opid: string };

function credentials(): A1TopupCredentials {
  const username = process.env.A1TOPUP_USERNAME;
  const password = process.env.A1TOPUP_PASSWORD;
  if (!username || !password) throw new Error('A1TOPUP_NOT_CONFIGURED');
  return { username, password };
}

export function isA1TopupExecutionEnabled() {
  return process.env.A1TOPUP_EXECUTION_ENABLED === 'true';
}

function providerUrl(path: 'api' | 'status') {
  const url = new URL(`${A1TOPUP_BASE}/${path}`);
  if (url.protocol !== 'https:' || url.hostname !== A1TOPUP_HOST) throw new Error('A1TOPUP_INVALID_ENDPOINT');
  return url;
}

async function requestProvider(path: 'api' | 'status', params: Record<string, string>) {
  void params;
  providerUrl(path);
  throw new Error('A1TOPUP_POST_BODY_UNVERIFIED');
}

export function mapA1TopupOperator(operatorName: string): A1TopupOperator | null {
  const normalized = operatorName.trim().toLowerCase();
  if (normalized.includes('airtel')) return 'A';
  if (normalized.includes('reliance jio') || normalized === 'jio' || normalized.includes('jio')) return 'RC';
  return null;
}

const CIRCLE_CODES: Record<string, string> = {
  'andhra pradesh': '13', assam: '24', bihar: '17', chhattisgarh: '27', gujarat: '12', haryana: '20', karnataka: '9', kerala: '14',
  'madhya pradesh': '16', maharashtra: '4', orissa: '23', punjab: '1', rajasthan: '18', 'tamil nadu': '8', 'uttar pradesh east': '10',
  'uttar pradesh west': '11', 'west bengal': '2', mumbai: '3', delhi: '5', chennai: '7', 'north east': '26', kolkata: '6'
};

export function mapA1TopupCircle(circleName: string): A1TopupCircle | null {
  const normalized = circleName.trim().toLowerCase().replace(/\s+/g, ' ');
  const alias = normalized === 'odisha' ? 'orissa' : normalized;
  const code = CIRCLE_CODES[alias];
  return code ? { name: alias, code } : null;
}

export function createA1TopupOrderId() {
  return `ZMR${Date.now().toString(36).toUpperCase()}${randomUUID().replace(/-/g, '').slice(0, 16).toUpperCase()}`;
}

export function normalizeA1TopupRechargeResponse(data: unknown): A1TopupNormalizedResponse {
  const source = data && typeof data === 'object' ? data as Record<string, unknown> : {};
  const rawStatus = typeof source.status === 'string' ? source.status.trim().toLowerCase() : '';
  const status: A1TopupStatus = rawStatus === 'success' ? 'SUCCESS' : rawStatus === 'failure' || rawStatus === 'failed' ? 'FAILED' : rawStatus === 'pending' ? 'PENDING' : 'UNKNOWN';
  const pick = (key: string) => typeof source[key] === 'string' && source[key] ? source[key] as string : undefined;
  return { txid: pick('txid'), status, opid: pick('opid'), number: pick('number'), amount: pick('amount'), orderid: pick('orderid') };
}

export function parseA1TopupCallback(input: { txid?: unknown; status?: unknown; opid?: unknown }): A1TopupCallbackNotification {
  return { txid: typeof input.txid === 'string' ? input.txid.trim() : '', status: typeof input.status === 'string' ? input.status.trim() : '', opid: typeof input.opid === 'string' ? input.opid.trim() : '' };
}

export async function fetchA1TopupStatus(orderId: string) {
  if (!orderId || orderId.length > 80) throw new Error('INVALID_A1TOPUP_ORDER_ID');
  return normalizeA1TopupRechargeResponse(await requestProvider('status', { orderid: orderId }));
}

export function a1TopupSelfCheck() {
  const success = normalizeA1TopupRechargeResponse({ txid: '5804', status: 'Success', opid: 'OP', number: 'masked', amount: '10', orderid: 'ZMRTEST' });
  const failed = normalizeA1TopupRechargeResponse({ status: 'Failure' });
  const unknown = normalizeA1TopupRechargeResponse({ status: 'completed successfully maybe' });
  return mapA1TopupOperator('Airtel') === 'A' && mapA1TopupOperator('Reliance Jio') === 'RC' && mapA1TopupOperator('Vi') === null && mapA1TopupOperator('BSNL') === null && mapA1TopupCircle('Mumbai')?.code === '3' && mapA1TopupCircle('Delhi')?.code === '5' && mapA1TopupCircle('Andhra Pradesh')?.code === '13' && mapA1TopupCircle('Odisha')?.code === '23' && mapA1TopupCircle('Telangana') === null && mapA1TopupCircle('Unknown') === null && success.status === 'SUCCESS' && failed.status === 'FAILED' && unknown.status === 'UNKNOWN' && !JSON.stringify(success).includes('password');
}
