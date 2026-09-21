import { env as runtimeEnv } from 'node:process';
import { getCloudflareContext } from '@opennextjs/cloudflare';

const isPlaceholder = (value: string) => {
  const text = value.trim().toLowerCase();
  return !text
    || text.includes('build-check')
    || text.includes('build_check')
    || text.includes('placeholder')
    || text.includes('dummy');
};

const getOpenNextBinding = async (name: string) => {
  try {
    // Official OpenNext API for accessing Worker vars/secrets at request time.
    // Async mode is safe for route handlers and also avoids relying on internal
    // symbols that can change between OpenNext releases.
    const context = await getCloudflareContext({ async: true });
    const raw = (context.env as Record<string, unknown> | undefined)?.[name];
    return typeof raw === 'string' ? raw.trim() : '';
  } catch {
    // Outside Cloudflare (Vercel/local Node), fall back to process.env below.
    return '';
  }
};

export async function getRuntimeEnvValue(name: string): Promise<string> {
  const bindingValue = await getOpenNextBinding(name);
  if (!isPlaceholder(bindingValue)) return bindingValue;

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
