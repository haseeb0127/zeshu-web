const isPlaceholder = (value: string) => {
  const text = value.trim().toLowerCase();
  return !text
    || text.includes('build-check')
    || text.includes('build_check')
    || text.includes('placeholder')
    || text.includes('dummy');
};

export async function getRuntimeEnvValue(name: string): Promise<string> {
  const processValue = String(process.env[name] || '').trim();
  if (!isPlaceholder(processValue)) return processValue;

  try {
    const { getCloudflareContext } = await import('@opennextjs/cloudflare');
    const context = getCloudflareContext();
    const raw = (context.env as Record<string, unknown>)[name];
    const value = typeof raw === 'string' ? raw.trim() : '';
    return isPlaceholder(value) ? '' : value;
  } catch {
    return '';
  }
}

export async function getRuntimeSupabaseEnv() {
  const [url, anonKey, serviceRoleKey] = await Promise.all([
    getRuntimeEnvValue('NEXT_PUBLIC_SUPABASE_URL'),
    getRuntimeEnvValue('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    getRuntimeEnvValue('SUPABASE_SERVICE_ROLE_KEY'),
  ]);
  return { url, anonKey, serviceRoleKey };
}
