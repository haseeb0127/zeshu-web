import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const STAGING_HOST = 'zeshu-web-staging.asif-mohammed0127.workers.dev';
const STAGING_PROJECT_REF = 'xdzgdhupfgsdyzellpqq';
const STAGING_ORIGIN = `https://${STAGING_HOST}`;
const COMPLETE_URL = `https://${STAGING_PROJECT_REF}.supabase.co/functions/v1/staging-complete-test-order`;

export async function POST(request: Request) {
  const host = (request.headers.get('host') || '').toLowerCase().split(':')[0];
  if (host !== STAGING_HOST) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

  const authorization = request.headers.get('authorization') || '';
  if (!authorization.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const body = await request.text();

  try {
    const response = await fetch(COMPLETE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authorization,
        Origin: STAGING_ORIGIN,
      },
      body,
      cache: 'no-store',
    });

    const payload = await response.json().catch(() => ({}));
    return NextResponse.json(payload, {
      status: response.status,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch {
    return NextResponse.json({ error: 'Staging checkout simulator is temporarily unavailable.' }, { status: 503 });
  }
}
