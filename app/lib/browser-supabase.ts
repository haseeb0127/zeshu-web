import { createClient, type SupabaseClient } from '@supabase/supabase-js';

type BrowserRole = 'customer' | 'admin' | 'vendor' | 'rider';

const storageKeys: Record<BrowserRole, string> = {
  customer: 'zeshu-customer-auth',
  admin: 'zeshu-admin-auth',
  vendor: 'zeshu-vendor-auth',
  rider: 'zeshu-rider-auth',
};

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
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
