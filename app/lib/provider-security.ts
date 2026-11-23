import { createClient, type User } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 20;
const requestBuckets = new Map<string, { startedAt: number; count: number }>();

/**
 * This limiter is intentionally a conservative per-process fallback. It is
 * not globally distributed across serverless instances; a shared limiter
 * (for example Upstash/Redis) should replace it when that infrastructure is
 * available.
 */
export const authenticateProviderRequest = async (request: Request): Promise<User | null> => {
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) return null;
  const token = authorization.slice('Bearer '.length).trim();
  if (!token) return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  const authClient = createClient(url, anonKey);
  const { data: { user }, error } = await authClient.auth.getUser(token);
  return error || !user ? null : user;
};

export const authRequiredResponse = () => NextResponse.json(
  { success: false, message: 'Please sign in to use this service.' },
  { status: 401 },
);

export const rateLimitResponse = (userId: string, route: string) => {
  const now = Date.now();
  const key = `${route}:${userId}`;
  const bucket = requestBuckets.get(key);
  if (!bucket || now - bucket.startedAt >= WINDOW_MS) {
    requestBuckets.set(key, { startedAt: now, count: 1 });
    return null;
  }
  if (bucket.count >= MAX_REQUESTS_PER_WINDOW) {
    return NextResponse.json(
      { success: false, message: 'Too many requests. Please try again shortly.' },
      { status: 429, headers: { 'Retry-After': '60' } },
    );
  }
  bucket.count += 1;
  return null;
};
