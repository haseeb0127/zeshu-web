import 'server-only';

/** AI support is intentionally disabled until a privacy and escalation review is complete. */
export const SUPPORT_AI_ENABLED = false;
export async function getSupportAiDraft(): Promise<null> {
  return null;
}
