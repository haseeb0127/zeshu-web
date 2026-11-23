import { createClient, type SupabaseClient } from '@supabase/supabase-js';

type BrowserRole = 'customer' | 'admin' | 'vendor' | 'rider';

const storageKeys: Record<BrowserRole, string> = {
  customer: 'zeshu-customer-auth',
  admin: 'zeshu-admin-auth',
  vendor: 'zeshu-vendor-auth',
  rider: 'zeshu-rider-auth',
};

const STAGING_SUPABASE_URL = 'https://xdzgdhupfgsdyzellpqq.supabase.co';
const STAGING_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_SQcjikOTZSoHEh19UNqOpg_ad0o7G7i';
const BUILD_CHECK_SUPABASE_URL = 'https://build-check.supabase.co';
const BUILD_CHECK_SUPABASE_KEY = 'build-check-anon-key';

const configuredUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const configuredKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

const supabaseUrl =
  !configuredUrl || configuredUrl === BUILD_CHECK_SUPABASE_URL
    ? STAGING_SUPABASE_URL
    : configuredUrl;

const supabaseKey =
  !configuredKey || configuredKey === BUILD_CHECK_SUPABASE_KEY
    ? STAGING_SUPABASE_PUBLISHABLE_KEY
    : configuredKey;

type BrowserClientRegistry = Partial<Record<BrowserRole, SupabaseClient>>;

const getRegistry = () => {
  const browser = globalThis as typeof globalThis & { __zeshuSupabaseClients?: BrowserClientRegistry };
  browser.__zeshuSupabaseClients ??= {};
  return browser.__zeshuSupabaseClients;
};

const getBrowserSupabaseClient = (role: BrowserRole) => {
  const registry = getRegistry();
  if (!registry[role]) {
    registry[role] = createClient(
      supabaseUrl,
      supabaseKey,
      {
        auth: {
          storageKey: storageKeys[role],
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
        },
      },
    );
  }
  return registry[role];
};

export const customerSupabase = () => getBrowserSupabaseClient('customer');
export const adminSupabase = () => getBrowserSupabaseClient('admin');
export const vendorSupabase = () => getBrowserSupabaseClient('vendor');
export const riderSupabase = () => getBrowserSupabaseClient('rider');
