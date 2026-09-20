const firstConfigured = (...values: Array<string | undefined>) =>
  values.map((value) => value?.trim()).find(Boolean) || '';

export type PlanApiCredentials = {
  memberId: string;
  password: string;
  tokenId?: string;
};

export function getPlanApiCredentials(options: { requireToken?: boolean } = {}): PlanApiCredentials {
  // PLANAPI_* is canonical. PLAN_API_* remains as a temporary compatibility
  // fallback so existing Vercel deployments do not break during migration.
  const memberId = firstConfigured(process.env.PLANAPI_MEMBER_ID, process.env.PLAN_API_USER_ID);
  const password = firstConfigured(process.env.PLANAPI_PASSWORD, process.env.PLAN_API_PASSWORD);
  const tokenId = firstConfigured(process.env.PLANAPI_TOKEN_ID, process.env.PLAN_API_TOKEN_ID);

  if (!memberId || !password || (options.requireToken && !tokenId)) {
    throw new Error('PLANAPI_NOT_CONFIGURED');
  }

  return { memberId, password, tokenId: tokenId || undefined };
}

export const PLANAPI_TIMEOUT_MS = 8_000;

export function planApiTimeoutSignal() {
  return AbortSignal.timeout(PLANAPI_TIMEOUT_MS);
}
