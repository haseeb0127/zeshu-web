import 'server-only';

export type MetaTemplateAudit = {
  event: 'SUPPORT_REPLY' | 'SUPPORT_RESOLVED';
  name: string | null;
  language: string | null;
  status: 'MISSING_CONFIG' | 'NOT_FOUND' | 'NOT_APPROVED' | 'WRONG_CATEGORY' | 'VARIABLES_UNSUPPORTED' | 'APPROVED' | 'API_UNAVAILABLE';
  category: string | null;
};

type TemplateInfo = { name?: unknown; language?: unknown; status?: unknown; category?: unknown; components?: unknown };
const record = (v: unknown): Record<string, unknown> | null => v !== null && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : null;
const safe = (v: unknown): string => typeof v === 'string' ? v.trim() : '';

/** Sender sends parameterless utility templates. A dynamic header/body/button is incompatible. */
export function requiresTemplateParameters(components: unknown): boolean {
  if (!Array.isArray(components)) return true;
  for (const component of components) {
    const row = record(component);
    if (!row) return true;
    if (/\{\{\s*\d+\s*\}\}/.test(safe(row.text))) return true;
    if (String(row.format || '').toUpperCase() === 'MEDIA') return true;
    if (['IMAGE','VIDEO','DOCUMENT','LOCATION'].includes(String(row.format || '').toUpperCase())) return true;
    if (Array.isArray(row.buttons)) {
      for (const button of row.buttons) {
        const b = record(button);
        if (!b || /\{\{\s*\d+\s*\}\}/.test(safe(b.url)) || /\{\{\s*\d+\s*\}\}/.test(safe(b.text))) return true;
      }
    }
  }
  return false;
}

export async function auditMetaSupportTemplates(input: {
  token: string;
  wabaId: string;
  graphVersion: string;
  replyName: string;
  replyLanguage: string;
  resolvedName: string;
  resolvedLanguage: string;
  request?: typeof fetch;
}): Promise<{ configured: boolean; verified: boolean; templates: MetaTemplateAudit[] }> {
  const jobs = [
    { event: 'SUPPORT_REPLY' as const, name: input.replyName, language: input.replyLanguage },
    { event: 'SUPPORT_RESOLVED' as const, name: input.resolvedName, language: input.resolvedLanguage },
  ];
  const configured = Boolean(input.token && /^\d{5,32}$/.test(input.wabaId)
    && /^v\d+\.\d+$/.test(input.graphVersion));
  const request = input.request ?? fetch;
  const templates: MetaTemplateAudit[] = [];
  for (const job of jobs) {
    const audit: MetaTemplateAudit = {
      event: job.event, name: job.name || null, language: job.language || null,
      status: 'MISSING_CONFIG', category: null,
    };
    if (!configured || !/^[a-z0-9_]{1,512}$/.test(job.name)
      || !/^[a-z]{2}(?:_[A-Z]{2})?$/.test(job.language)) {
      templates.push(audit); continue;
    }
    const url = new URL('https://graph.facebook.com/' + input.graphVersion + '/' + input.wabaId + '/message_templates');
    url.searchParams.set('fields','name,language,status,category,components');
    url.searchParams.set('name',job.name);
    url.searchParams.set('limit','20');
    try {
      const result = await request(url.toString(), {
        method: 'GET',
        headers: { Authorization: 'Bearer ' + input.token },
        cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(7000),
      });
      if (!result.ok) { audit.status = 'API_UNAVAILABLE'; templates.push(audit); continue; }
      const body = record(await result.json());
      const rows = body?.data;
      if (!Array.isArray(rows)) { audit.status = 'API_UNAVAILABLE'; templates.push(audit); continue; }
      const found = rows.map(record).find(row=>row && safe(row.name) === job.name && safe(row.language) === job.language) as TemplateInfo | undefined;
      if (!found) { audit.status='NOT_FOUND'; templates.push(audit); continue; }
      audit.category = safe(found.category).toUpperCase() || null;
      if (safe(found.status).toUpperCase() !== 'APPROVED') audit.status = 'NOT_APPROVED';
      else if (audit.category !== 'UTILITY') audit.status = 'WRONG_CATEGORY';
      else if (requiresTemplateParameters(found.components)) audit.status = 'VARIABLES_UNSUPPORTED';
      else audit.status = 'APPROVED';
    } catch {
      audit.status = 'API_UNAVAILABLE';
    }
    templates.push(audit);
  }
  return { configured, verified: templates.length===2 && templates.every(t=>t.status==='APPROVED'), templates };
}
