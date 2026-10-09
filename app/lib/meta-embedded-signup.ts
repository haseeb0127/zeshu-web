import { createCipheriv, createDecipheriv, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export const META_CONNECT_COOKIE = '__Host-zeshu-meta-connect';
export const META_CONNECT_TTL_MS = 10 * 60 * 1000;
export const metaIdValid = (id: unknown): id is string => typeof id === 'string' && /^[0-9]{5,32}$/.test(id);
export const graphVersionValid = (value: unknown): value is string => typeof value === 'string' && /^v[0-9]+\.[0-9]+$/.test(value);

function mac(value: string, secret: string): Buffer {
  return createHmac('sha256', secret).update(value).digest();
}
export function makeMetaConnectChallenge(userId: string, secret: string, now = Date.now()): {
  cookieValue: string; nonce: string;
} {
  if (!secret || secret.length < 20) throw new Error('META_CONNECT_CONFIGURATION_MISSING');
  const nonce = randomBytes(24).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ uid: userId, nonce, iat: now })).toString('base64url');
  return { nonce, cookieValue: payload + '.' + mac(payload, secret).toString('base64url') };
}
export function verifyMetaConnectChallenge(
  cookieValue: string | undefined, suppliedNonce: unknown, userId: string, secret: string, now = Date.now(),
): boolean {
  if (!cookieValue || !secret || typeof suppliedNonce !== 'string') return false;
  const [payload, signature, extra] = cookieValue.split('.');
  if (!payload || !signature || extra !== undefined || !/^[A-Za-z0-9_-]+$/.test(payload)) return false;
  const supplied = Buffer.from(signature, 'base64url');
  const expected = mac(payload, secret);
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return false;
  try {
    const parsed = JSON.parse(Buffer.from(payload,'base64url').toString('utf8'));
    return parsed.uid === userId && parsed.nonce === suppliedNonce
      && typeof parsed.iat === 'number' && Number.isSafeInteger(parsed.iat)
      && now >= parsed.iat && now - parsed.iat < META_CONNECT_TTL_MS;
  } catch { return false; }
}

export function encryptMetaToken(token: string, base64Key: string): {
  token_iv: string; token_ciphertext: string; token_auth_tag: string;
} {
  const key = Buffer.from(base64Key, 'base64');
  if (key.length !== 32 || !token || token.length > 10000) throw new Error('META_TOKEN_STORAGE_NOT_READY');
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  return { token_iv: iv.toString('base64'), token_ciphertext: encrypted.toString('base64'),
    token_auth_tag: cipher.getAuthTag().toString('base64') };
}
export function decryptMetaToken(record: {
  token_iv: string; token_ciphertext: string; token_auth_tag: string;
}, base64Key: string): string {
  const key = Buffer.from(base64Key,'base64');
  if (key.length !== 32) throw new Error('META_TOKEN_STORAGE_NOT_READY');
  const decipher = createDecipheriv('aes-256-gcm',key,Buffer.from(record.token_iv,'base64'));
  decipher.setAuthTag(Buffer.from(record.token_auth_tag,'base64'));
  return Buffer.concat([decipher.update(Buffer.from(record.token_ciphertext,'base64')),decipher.final()]).toString('utf8');
}

type MetaPhone = {id?: unknown;display_phone_number?: unknown;verified_name?: unknown};
const object = (v:unknown): Record<string,unknown>|null =>
  v !== null && typeof v==='object' && !Array.isArray(v) ? v as Record<string,unknown> : null;
const str = (v:unknown):string => typeof v === 'string' ? v : '';

export async function exchangeMetaSignupCode(input:{
  appId:string; appSecret:string; graphVersion:string; code:string;
  wabaId:string; phoneNumberId:string; request?:typeof fetch;
}): Promise<{token:string;phoneNumber:string|null;verifiedName:string|null;expiresIn:number|null}> {
  if (!metaIdValid(input.appId) || !metaIdValid(input.wabaId) || !metaIdValid(input.phoneNumberId)
     || !graphVersionValid(input.graphVersion) || !input.appSecret
     || !/^[A-Za-z0-9_+./=-]{8,4096}$/.test(input.code)) {
    throw new Error('META_SIGNUP_INPUT_INVALID');
  }
  const request = input.request ?? fetch;
  const url = new URL('https://graph.facebook.com/' + input.graphVersion + '/oauth/access_token');
  url.searchParams.set('client_id', input.appId);
  url.searchParams.set('client_secret', input.appSecret);
  url.searchParams.set('code', input.code);
  // Never log the URL: it contains the app secret and a one-time authorization code.
  const response = await request(url.toString(),{method:'GET',cache:'no-store',redirect:'error',
    signal:AbortSignal.timeout(10000)});
  if (!response.ok) throw new Error('META_CODE_EXCHANGE_FAILED');
  const payload = object(await response.json());
  const token = str(payload?.access_token);
  if (!token || token.length < 15 || token.length > 10000) throw new Error('META_CODE_EXCHANGE_FAILED');
  const expires = typeof payload?.expires_in === 'number' && Number.isFinite(payload.expires_in) && payload.expires_in > 0
    ? payload.expires_in : null;
  // Never trust IDs received through the browser postMessage without checking
  // ownership directly with Meta using the issued scoped token.
  const assetsUrl = new URL('https://graph.facebook.com/' + input.graphVersion + '/'
    + input.wabaId + '/phone_numbers');
  assetsUrl.searchParams.set('fields','id,display_phone_number,verified_name');
  assetsUrl.searchParams.set('limit','100');
  const assetsResponse = await request(assetsUrl.toString(),{
    method:'GET',headers:{Authorization:'Bearer ' + token},cache:'no-store',redirect:'error',
    signal:AbortSignal.timeout(10000),
  });
  if (!assetsResponse.ok) throw new Error('META_ASSET_VERIFICATION_FAILED');
  const assets = object(await assetsResponse.json());
  const phones = assets?.data;
  const match = Array.isArray(phones) ? phones.map(object).find(x=>x?.id===input.phoneNumberId) as MetaPhone|undefined:undefined;
  if (!match) throw new Error('META_PHONE_NOT_OWNED_BY_WABA');
  return {token,expiresIn:expires,
    phoneNumber:str(match.display_phone_number).slice(0,40)||null,
    verifiedName:str(match.verified_name).slice(0,120)||null};
}
