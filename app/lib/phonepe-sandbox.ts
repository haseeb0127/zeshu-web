import 'server-only';

import { createClient } from '@supabase/supabase-js';
import { getRuntimeEnvValue, getRuntimeSupabaseEnv } from './runtime-env';

export const ZESHU_STAGING_HOST = 'zeshu-web-staging.asif-mohammed0127.workers.dev';
export const ZESHU_STAGING_ORIGIN = `https://${ZESHU_STAGING_HOST}`;
const STAGING_PROJECT_REF = 'xdzgdhupfgsdyzellpqq';
const PHONEPE_SANDBOX_BASE_URL = 'https://api-preprod.phonepe.com/apis/pg-sandbox';

const placeholder = (value: string) => {
  const text = String(value || '').trim().toLowerCase();
  return !text
    || text.includes('build-check')
    || text.includes('build_check')
    || text.includes('placeholder')
    || text.includes('dummy');
};

export type PhonePeSandboxConfig = {
  ready: boolean;
  environment: string;
  clientId: string;
  clientSecret: string;
  clientVersion: string;
};

export async function getPhonePeSandboxConfig(): Promise<PhonePeSandboxConfig> {
  const [environmentValue, clientId, clientSecret, clientVersion] = await Promise.all([
    getRuntimeEnvValue('PHONEPE_ENV'),
    getRuntimeEnvValue('PHONEPE_CLIENT_ID'),
    getRuntimeEnvValue('PHONEPE_CLIENT_SECRET'),
    getRuntimeEnvValue('PHONEPE_CLIENT_VERSION'),
  ]);

  const environment = String(environmentValue || 'sandbox').trim().toLowerCase();
  const versionOk = /^\d+$/.test(clientVersion) && Number(clientVersion) > 0;
  const ready = environment === 'sandbox'
    && !placeholder(clientId)
    && !placeholder(clientSecret)
    && versionOk;

  return { ready, environment, clientId, clientSecret, clientVersion };
}

export async function requireStagingPaymentTester(request: Request) {
  const host = (request.headers.get('host') || '').toLowerCase().split(':')[0];
  if (host !== ZESHU_STAGING_HOST) {
    return { response: Response.json({ error: 'Not found.' }, { status: 404 }) };
  }

  const authorization = request.headers.get('authorization') || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  if (!token) {
    return { response: Response.json({ error: 'Authentication required.' }, { status: 401 }) };
  }

  const { url, anonKey, serviceRoleKey } = await getRuntimeSupabaseEnv();
  if (!url || !anonKey || !serviceRoleKey || !url.includes(STAGING_PROJECT_REF)) {
    return { response: Response.json({ error: 'Staging runtime is not configured.' }, { status: 503 }) };
  }

  const auth = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: authData, error: authError } = await auth.auth.getUser(token);
  const user = authData.user;
  if (authError || !user) {
    return { response: Response.json({ error: 'Your staging session has expired.' }, { status: 401 }) };
  }

  const service = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: adminRole } = await service
    .from('admin_roles')
    .select('user_id')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .maybeSingle();

  const stagingQa = user.user_metadata?.staging_qa === true;
  if (!stagingQa && !adminRole) {
    return { response: Response.json({ error: 'Staging QA or admin access required.' }, { status: 403 }) };
  }

  return { user, service, token };
}

async function getPhonePeAccessToken(config: PhonePeSandboxConfig) {
  if (!config.ready) throw new Error('PHONEPE_SANDBOX_NOT_CONFIGURED');

  const body = new URLSearchParams({
    client_id: config.clientId,
    client_version: config.clientVersion,
    client_secret: config.clientSecret,
    grant_type: 'client_credentials',
  });

  const response = await fetch(`${PHONEPE_SANDBOX_BASE_URL}/v1/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    cache: 'no-store',
  });

  const payload = await response.json().catch(() => ({}));
  const token = typeof payload?.access_token === 'string'
    ? payload.access_token
    : typeof payload?.accessToken === 'string'
      ? payload.accessToken
      : '';

  if (!response.ok || !token) throw new Error('PHONEPE_AUTH_FAILED');
  return token;
}

export async function createPhonePeSandboxPayment(input: {
  merchantOrderId: string;
  amountPaise: number;
  redirectUrl: string;
  testerId: string;
}) {
  const config = await getPhonePeSandboxConfig();
  const token = await getPhonePeAccessToken(config);

  const response = await fetch(`${PHONEPE_SANDBOX_BASE_URL}/checkout/v2/pay`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `O-Bearer ${token}`,
    },
    body: JSON.stringify({
      merchantOrderId: input.merchantOrderId,
      amount: input.amountPaise,
      expireAfter: 1200,
      metaInfo: {
        udf1: 'ZESHU_STAGING_PHONEPE_QA',
        udf2: input.testerId.slice(0, 36),
      },
      paymentFlow: {
        type: 'PG_CHECKOUT',
        message: 'Zeshu staging PhonePe sandbox payment',
        merchantUrls: { redirectUrl: input.redirectUrl },
      },
    }),
    cache: 'no-store',
  });

  const payload = await response.json().catch(() => ({}));
  const redirectUrl = String(
    payload?.redirectUrl
    || payload?.data?.redirectUrl
    || payload?.data?.redirect_url
    || '',
  ).trim();

  if (!response.ok || !redirectUrl.startsWith('https://')) {
    throw new Error('PHONEPE_CREATE_FAILED');
  }

  return {
    merchantOrderId: input.merchantOrderId,
    amountPaise: input.amountPaise,
    redirectUrl,
    sandbox: true,
  };
}

export async function getPhonePeSandboxOrderStatus(merchantOrderId: string) {
  const config = await getPhonePeSandboxConfig();
  const token = await getPhonePeAccessToken(config);

  const response = await fetch(
    `${PHONEPE_SANDBOX_BASE_URL}/checkout/v2/order/${encodeURIComponent(merchantOrderId)}/status`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `O-Bearer ${token}`,
      },
      cache: 'no-store',
    },
  );

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error('PHONEPE_STATUS_FAILED');

  const state = String(payload?.state || payload?.data?.state || 'UNKNOWN').trim().toUpperCase();
  const amountCandidate = payload?.amount ?? payload?.data?.amount;
  const amountPaise = Number.isFinite(Number(amountCandidate)) ? Number(amountCandidate) : null;

  return {
    merchantOrderId,
    state,
    amountPaise,
    sandbox: true,
  };
}
