const isPlaceholder = (value: string) => {
  const text = value.trim().toLowerCase();
  return !text
    || text.includes('build-check')
    || text.includes('build_check')
    || text.includes('placeholder')
    || text.includes('dummy');
};

export async function getRuntimeEnvValue(name: string): Promise<string> {
  // Dynamic property access avoids Next.js statically baking build-time placeholder
  // values into server routes. On Cloudflare Workers, our 2026 compatibility date
  // with Node compatibility populates process.env from runtime vars/secrets.
  const value = String(process.env[name] || '').trim();
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
