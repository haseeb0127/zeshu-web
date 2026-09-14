export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: Request) {
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });

  const authClient = createClient(url, anonKey, { global: { headers: { Authorization: authorization } } });
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ success: false, message: 'Invalid session' }, { status: 401 });

  const serviceClient = createClient(url, serviceRoleKey);
  const { data: wallet, error } = await serviceClient.from('wallets').select('coins,zeshu_coins').eq('user_id', user.id).maybeSingle();
  if (error) return NextResponse.json({ success: false, message: 'Wallet lookup failed' }, { status: 500 });

  return NextResponse.json({ success: true, balance: Number(wallet?.coins || 0), coins: Number(wallet?.zeshu_coins || 0) });
}
