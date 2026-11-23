import { NextResponse } from 'next/server';
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import { getRuntimeSupabaseEnv } from '@/app/lib/runtime-env';

const preferenceColumns = 'whatsapp_transactional_enabled,consented_at,revoked_at';

type Preference = {
  whatsapp_transactional_enabled: boolean;
  consented_at: string | null;
  revoked_at: string | null;
};

function authenticationRequired() {
  return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
}

function serviceUnavailable() {
  return NextResponse.json({ error: 'Notification preferences are temporarily unavailable.' }, { status: 503 });
}

async function getAuthenticatedUser(request: Request): Promise<User | null> {
  const { url: supabaseUrl, anonKey: supabaseAnonKey } = await getRuntimeSupabaseEnv();
  const authorization = request.headers.get('authorization');
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  if (!token || !supabaseUrl || !supabaseAnonKey) return null;

  const authClient = createClient(supabaseUrl, supabaseAnonKey);
  const { data } = await authClient.auth.getUser(token);
  return data.user || null;
}

function hasUsableVerifiedPhone(user: User) {
  if (typeof user.phone !== 'string' || user.phone.trim().length === 0) return false;
  const phoneConfirmedAt = (user as User & { phone_confirmed_at?: string | null }).phone_confirmed_at;
  return typeof phoneConfirmedAt === 'string'
    && phoneConfirmedAt.trim().length > 0
    && !Number.isNaN(Date.parse(phoneConfirmedAt));
}

function preferenceResponse(preference: Preference | null, phoneAvailable: boolean) {
  return {
    whatsapp_transactional_enabled: preference?.whatsapp_transactional_enabled ?? false,
    consented_at: preference?.consented_at ?? null,
    revoked_at: preference?.revoked_at ?? null,
    phone_available: phoneAvailable,
  };
}

async function readPreference(service: SupabaseClient, userId: string) {
  return service
    .from('support_notification_preferences')
    .select(preferenceColumns)
    .eq('user_id', userId)
    .maybeSingle();
}

function isPreferenceBody(value: unknown): value is { enabled: boolean } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const body = value as Record<string, unknown>;
  return Object.keys(body).length === 1 && typeof body.enabled === 'boolean';
}

export async function GET(request: Request) {
  const { url: supabaseUrl, serviceRoleKey } = await getRuntimeSupabaseEnv();
  const user = await getAuthenticatedUser(request);
  if (!user) return authenticationRequired();
  if (!supabaseUrl || !serviceRoleKey) return serviceUnavailable();

  const service = createClient(supabaseUrl, serviceRoleKey);
  const { data: preference, error } = await readPreference(service, user.id);
  if (error) return serviceUnavailable();

  return NextResponse.json(preferenceResponse(preference as Preference | null, hasUsableVerifiedPhone(user)));
}

export async function POST(request: Request) {
  const { url: supabaseUrl, serviceRoleKey } = await getRuntimeSupabaseEnv();
  const user = await getAuthenticatedUser(request);
  if (!user) return authenticationRequired();
  if (!supabaseUrl || !serviceRoleKey) return serviceUnavailable();

  const body = await request.json().catch(() => null);
  if (!isPreferenceBody(body)) {
    return NextResponse.json({ error: 'Invalid notification preference.' }, { status: 400 });
  }

  const service = createClient(supabaseUrl, serviceRoleKey);
  const { data: existingPreference, error: readError } = await readPreference(service, user.id);
  if (readError) return serviceUnavailable();

  if (body.enabled) {
    if (!hasUsableVerifiedPhone(user)) {
      return NextResponse.json({ error: 'A verified phone number is required for WhatsApp notifications.' }, { status: 409 });
    }

    if (existingPreference?.whatsapp_transactional_enabled === true) {
      return NextResponse.json(preferenceResponse(existingPreference as Preference, true));
    }

    const consentedAt = new Date().toISOString();
    const { data: preference, error } = await service
      .from('support_notification_preferences')
      .upsert({
        user_id: user.id,
        whatsapp_transactional_enabled: true,
        consented_at: consentedAt,
        revoked_at: null,
        updated_at: consentedAt,
      }, { onConflict: 'user_id' })
      .select(preferenceColumns)
      .single();
    if (error || !preference) return serviceUnavailable();

    return NextResponse.json(preferenceResponse(preference as Preference, true));
  }

  if (!existingPreference) {
    return NextResponse.json(preferenceResponse(null, hasUsableVerifiedPhone(user)));
  }

  let preference = existingPreference as Preference;
  const operationTimestamp = new Date().toISOString();
  if (existingPreference.whatsapp_transactional_enabled === true) {
    const { data: updatedPreference, error: preferenceError } = await service
      .from('support_notification_preferences')
      .update({
        whatsapp_transactional_enabled: false,
        revoked_at: operationTimestamp,
        updated_at: operationTimestamp,
      })
      .eq('user_id', user.id)
      .eq('whatsapp_transactional_enabled', true)
      .select(preferenceColumns)
      .maybeSingle();
    if (preferenceError || !updatedPreference) return serviceUnavailable();
    preference = updatedPreference as Preference;
  }

  const { error: cancellationError } = await service
    .from('support_notification_outbox')
    .update({
      status: 'CANCELLED',
      updated_at: operationTimestamp,
      next_attempt_at: null,
    })
    .eq('recipient_user_id', user.id)
    .eq('provider', 'META_WHATSAPP')
    .in('status', ['PENDING', 'FAILED']);
  if (cancellationError) return serviceUnavailable();

  return NextResponse.json(preferenceResponse(preference, hasUsableVerifiedPhone(user)));
}
