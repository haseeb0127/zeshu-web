import { env as runtimeEnv } from 'node:process';

const isPlaceholder = (value: string) => {
  const text = value.trim().toLowerCase();
  return !text
    || text.includes('build-check')
    || text.includes('build_check')
    || text.includes('placeholder')
    || text.includes('dummy');
};

export async function getRuntimeEnvValue(name: string): Promise<string> {
  // Cloudflare Workers with a modern compatibility date and Node compatibility
  // populate process.env from Worker variables and secrets. Dynamic lookup avoids
  // Next.js treating these server-only values as build-time constants.
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
