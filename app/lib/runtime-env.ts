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
  // Use the Node process module directly so Next.js does not statically inline
  // server build placeholders. Cloudflare Workers populates node:process env
  // from runtime variables/secrets for our current compatibility date, while
  // Vercel/local Node expose their normal runtime environment here as well.
  const value = String(runtimeEnv[name] || '').trim();
  return isPlaceholder(value) ? '' : value;
}

export async function getRuntimeSupabaseEnv() {
  const [url, anonKey, serviceRoleKey] = await Promise.all([
    getRuntimeEnvValue('NEXT_PUBLIC_SUPABASE_URL'),
    getRuntimeEnvValue('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    getRuntimeEnvValue('SUPABASE_SERVICE_ROLE_KEY'),
  ]);
  return { url, anonKey, serviceRoleKey };
}
