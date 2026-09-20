import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export type MarketingAdminContext = {
  service: SupabaseClient;
  userId: string;
};

const serverClientOptions = {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
} as const;

export const getMarketingServiceClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceRoleKey) return null;
  return createClient(url, serviceRoleKey, serverClientOptions);
};

export const requireMarketingAdmin = async (
  request: Request,
): Promise<{ context?: MarketingAdminContext; response?: NextResponse }> => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const authorization = request.headers.get('authorization');
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : '';

  if (!url || !anonKey || !serviceRoleKey || !token) {
    return { response: NextResponse.json({ error: 'Authentication required.' }, { status: 401 }) };
  }

  const authClient = createClient(url, anonKey, serverClientOptions);
  const { data: authData, error: authError } = await authClient.auth.getUser(token);
  if (authError || !authData.user) {
    return { response: NextResponse.json({ error: 'Authentication required.' }, { status: 401 }) };
  }

  const service = createClient(url, serviceRoleKey, serverClientOptions);
  const { data: admin, error: adminError } = await service
    .from('admin_roles')
    .select('user_id')
    .eq('user_id', authData.user.id)
    .eq('role', 'admin')
    .maybeSingle();

  if (adminError) {
    return { response: NextResponse.json({ error: 'Admin access check is temporarily unavailable.' }, { status: 503 }) };
  }
  if (!admin) {
    return { response: NextResponse.json({ error: 'Admin access required.' }, { status: 403 }) };
  }

  return { context: { service, userId: authData.user.id } };
};

export const cleanText = (value: unknown, max = 240) => {
  const text = String(value ?? '').trim().replace(/\s+/g, ' ');
  return text ? text.slice(0, max) : '';
};

export const safeInternalPath = (value: unknown) => {
  const text = cleanText(value, 500);
  if (!text) return null;
  if (!text.startsWith('/') || text.startsWith('//')) return null;
  return text;
};
