import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getRuntimeSupabaseEnv } from '@/app/lib/runtime-env';

const clientOptions = {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
} as const;

export type DriverUserContext = {
  user: User;
  service: SupabaseClient;
};

export async function requireDriverUser(request: Request): Promise<{ context?: DriverUserContext; response?: NextResponse }> {
  const { url, anonKey, serviceRoleKey } = await getRuntimeSupabaseEnv();
  const authorization = request.headers.get('authorization');
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : '';

  if (!url || !anonKey || !serviceRoleKey || !token) {
    return { response: NextResponse.json({ error: 'Sign in is required for secure driver verification.' }, { status: 401 }) };
  }

  const authClient = createClient(url, anonKey, clientOptions);
  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data.user) {
    return { response: NextResponse.json({ error: 'Your verification session has expired. Sign in again.' }, { status: 401 }) };
  }

  return {
    context: {
      user: data.user,
      service: createClient(url, serviceRoleKey, clientOptions),
    },
  };
}

export const DRIVER_SERVICES = ['DELIVERY_RIDER','BIKE_COURIER','AUTO_DRIVER','CAB_DRIVER','GOODS_DRIVER'] as const;
export type DriverService = typeof DRIVER_SERVICES[number];

export const DRIVER_DOCUMENT_TYPES = ['IDENTITY','DRIVING_LICENCE','RC','INSURANCE','FITNESS','PERMIT','PUC','BANK_PROOF'] as const;
export type DriverDocumentType = typeof DRIVER_DOCUMENT_TYPES[number];

export const EXPIRING_DOCUMENTS = new Set<DriverDocumentType>(['DRIVING_LICENCE','INSURANCE','FITNESS','PERMIT','PUC']);

export function requiredDocuments(services: string[], registrationType: string): DriverDocumentType[] {
  const required = new Set<DriverDocumentType>(['IDENTITY','BANK_PROOF']);
  if (registrationType !== 'NO_VEHICLE') {
    required.add('DRIVING_LICENCE');
    required.add('RC');
    required.add('INSURANCE');
    required.add('PUC');
  }
  if (services.some((service) => ['AUTO_DRIVER','CAB_DRIVER','GOODS_DRIVER'].includes(service))) {
    required.add('FITNESS');
    required.add('PERMIT');
  }
  return [...required];
}

export function passengerChecksRequired(services: string[]) {
  return services.some((service) => service === 'AUTO_DRIVER' || service === 'CAB_DRIVER');
}
