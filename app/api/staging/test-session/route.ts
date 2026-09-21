import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const STAGING_HOST = 'zeshu-web-staging.asif-mohammed0127.workers.dev';
const STAGING_PROJECT_REF = 'xdzgdhupfgsdyzellpqq';
const STAGING_QA_EMAIL = 'qa.customer@staging.zeshu.in';

const serverClientOptions = {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
} as const;

export async function POST(request: Request) {
  const host = (request.headers.get('host') || '').toLowerCase().split(':')[0];
  if (host !== STAGING_HOST) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || `https://${STAGING_PROJECT_REF}.supabase.co`;
  const secretKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url.includes(STAGING_PROJECT_REF) || !secretKey) {
    return NextResponse.json({ error: 'Staging test sign-in is not configured.' }, { status: 503 });
  }

  const admin = createClient(url, secretKey, serverClientOptions);

  const created = await admin.auth.admin.createUser({
    email: STAGING_QA_EMAIL,
    email_confirm: true,
    user_metadata: {
      full_name: 'Zeshu Staging Customer',
      staging_qa: true,
    },
  });

  if (created.error && !/already|registered|exists/i.test(created.error.message || '')) {
    return NextResponse.json({ error: 'Could not create the staging test customer.' }, { status: 503 });
  }

  const link = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: STAGING_QA_EMAIL,
  });

  const tokenHash = link.data?.properties?.hashed_token;
  if (link.error || !tokenHash) {
    return NextResponse.json({ error: 'Could not create a staging test session.' }, { status: 503 });
  }

  return NextResponse.json({
    success: true,
    tokenHash,
    type: 'magiclink',
  });
}
