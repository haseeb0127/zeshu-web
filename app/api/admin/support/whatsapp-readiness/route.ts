import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupportWhatsappReadiness } from '@/app/lib/support-whatsapp-sender';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  const authorization = request.headers.get('authorization');
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  if (!url || !anonKey || !serviceRoleKey || !token) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const authClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data: authData } = await authClient.auth.getUser(token);
  if (!authData.user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const service = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data: admin, error } = await service
    .from('admin_roles')
    .select('user_id')
    .eq('user_id', authData.user.id)
    .eq('role', 'admin')
    .maybeSingle();

  if (error) return NextResponse.json({ error: 'Readiness check is temporarily unavailable.' }, { status: 503 });
  if (!admin) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });

  const readiness = getSupportWhatsappReadiness();
  const cronConfigured = Boolean(process.env.CRON_SECRET?.trim());

  return NextResponse.json({
    ...readiness,
    cronConfigured,
    safeToEnableSender: readiness.senderConfigured && readiness.webhookConfigured && cronConfigured,
    safeToEnableUi: readiness.senderConfigured && readiness.webhookConfigured && cronConfigured && readiness.senderEnabled,
    note: 'This endpoint reports configuration presence only. It never returns secret values or sends a WhatsApp message.',
  });
}
