import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const STAGING_HOST = 'zeshu-web-staging.asif-mohammed0127.workers.dev';
const STAGING_PROJECT_REF = 'xdzgdhupfgsdyzellpqq';
const STAGING_ORIGIN = `https://${STAGING_HOST}`;
const STAGING_FUNCTION_URL = `https://${STAGING_PROJECT_REF}.supabase.co/functions/v1/staging-test-session`;

export async function POST(request: Request) {
  const host = (request.headers.get('host') || '').toLowerCase().split(':')[0];
  if (host !== STAGING_HOST) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  try {
    const requestBody = await request.text();
    const response = await fetch(STAGING_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: STAGING_ORIGIN,
      },
      body: requestBody || '{}',
      cache: 'no-store',
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload?.tokenHash) {
      return NextResponse.json(
        { error: typeof payload?.error === 'string' ? payload.error : 'Staging test sign-in is temporarily unavailable.' },
        { status: response.status >= 400 && response.status < 600 ? response.status : 503 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        tokenHash: String(payload.tokenHash),
        type: 'magiclink',
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return NextResponse.json({ error: 'Staging test sign-in is temporarily unavailable.' }, { status: 503 });
  }
}
