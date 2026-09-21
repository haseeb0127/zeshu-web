import { env as runtimeEnv } from 'node:process';

const isPlaceholder = (value: string) => {
  const text = value.trim().toLowerCase();
  return !text
    || text.includes('build-check')
    || text.includes('build_check')
    || text.includes('placeholder')
    || text.includes('dummy');
};

type OpenNextCloudflareContext = {
  env?: Record<string, unknown>;
};

const getOpenNextBinding = (name: string) => {
  try {
    const contextSymbol = Symbol.for('__cloudflare-context__');
    const context = (globalThis as typeof globalThis & Record<symbol, OpenNextCloudflareContext | undefined>)[contextSymbol];
    const raw = context?.env?.[name];
    return typeof raw === 'string' ? raw.trim() : '';
  } catch {
    return '';
  }
};

export async function getRuntimeEnvValue(name: string): Promise<string> {
  // OpenNext stores the active Worker context on the global scope in production.
  // Read that binding first so Cloudflare dashboard vars/secrets remain runtime-only.
  const bindingValue = getOpenNextBinding(name);
  if (!isPlaceholder(bindingValue)) return bindingValue;

  // Vercel/local Node and Workers with process-env population expose runtime env here.
  const processValue = String(runtimeEnv[name] || '').trim();
  return isPlaceholder(processValue) ? '' : processValue;
}

export async function getRuntimeSupabaseEnv() {
  const [url, anonKey, serviceRoleKey] = await Promise.all([
    getRuntimeEnvValue('NEXT_PUBLIC_SUPABASE_URL'),
    getRuntimeEnvValue('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    getRuntimeEnvValue('SUPABASE_SERVICE_ROLE_KEY'),
  ]);
  return { url, anonKey, serviceRoleKey };
}
