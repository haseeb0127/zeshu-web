export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getRuntimeSupabaseEnv } from '@/app/lib/runtime-env';

export async function GET(request: Request) {
  const { url, anonKey, serviceRoleKey } = await getRuntimeSupabaseEnv();
  const authorization = request.headers.get('authorization');
  if (!url || !anonKey || !serviceRoleKey) return NextResponse.json({ success: false, message: 'Wallet service unavailable' }, { status: 503 });
  if (!authorization?.startsWith('Bearer ')) return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });

  const authClient = createClient(url, anonKey, { global: { headers: { Authorization: authorization } } });
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ success: false, message: 'Invalid session' }, { status: 401 });

  const serviceClient = createClient(url, serviceRoleKey);
  const { data: wallet, error } = await serviceClient.from('wallets').select('coins,zeshu_coins').eq('user_id', user.id).maybeSingle();
  if (error) return NextResponse.json({ success: false, message: 'Wallet lookup failed' }, { status: 500 });

  return NextResponse.json({ success: true, balance: Number(wallet?.coins || 0), coins: Number(wallet?.zeshu_coins || 0) });
}
