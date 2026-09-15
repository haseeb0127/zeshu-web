import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: Request) {
  const authorization = request.headers.get('authorization');
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  if (!token || !url || !anonKey || !serviceRoleKey) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const authClient = createClient(url, anonKey);
  const { data: authData } = await authClient.auth.getUser(token);
  if (!authData.user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const service = createClient(url, serviceRoleKey);
  const { data: admin } = await service.from('admin_roles').select('user_id').eq('user_id', authData.user.id).eq('role', 'admin').maybeSingle();
  if (!admin) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const { data, error } = await service.from('support_conversations').select('id,user_id,status,subject,order_id,created_at,updated_at').order('updated_at', { ascending: false });
  if (error) return NextResponse.json({ error: 'Support inbox is temporarily unavailable.' }, { status: 503 });
  return NextResponse.json({ conversations: data || [] });
}
