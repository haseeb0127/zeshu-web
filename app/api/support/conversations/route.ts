import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getRuntimeSupabaseEnv } from '@/app/lib/runtime-env';

async function getUser(request: Request) {
  const { url, anonKey } = await getRuntimeSupabaseEnv();
  const authorization = request.headers.get('authorization');
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  if (!token || !url || !anonKey) return null;
  const client = createClient(url, anonKey);
  const { data } = await client.auth.getUser(token);
  return data.user || null;
}

export async function GET(request: Request) {
  const { url, serviceRoleKey } = await getRuntimeSupabaseEnv();
  const user = await getUser(request);
  if (!user || !url || !serviceRoleKey) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const service = createClient(url, serviceRoleKey);
  const { data, error } = await service.from('support_conversations').select('id,status,subject,order_id,created_at,updated_at').eq('user_id', user.id).order('updated_at', { ascending: false });
  if (error) return NextResponse.json({ error: 'Support is temporarily unavailable.' }, { status: 503 });
  return NextResponse.json({ conversations: data || [] });
}

export async function POST(request: Request) {
  const { url, serviceRoleKey } = await getRuntimeSupabaseEnv();
  const user = await getUser(request);
  if (!user || !url || !serviceRoleKey) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const subject = typeof body?.subject === 'string' && body.subject.trim() ? body.subject.trim().slice(0, 160) : 'Customer support';
  const message = typeof body?.message === 'string' ? body.message.trim() : '';
  const orderId = typeof body?.order_id === 'string' && body.order_id.trim() ? body.order_id.trim() : null;
  if (!message || message.length > 4000) return NextResponse.json({ error: 'Enter a support message.' }, { status: 400 });
  const service = createClient(url, serviceRoleKey);
  if (orderId) {
    const { data: ownedOrder } = await service.from('orders').select('id').eq('id', orderId).eq('user_id', user.id).maybeSingle();
    if (!ownedOrder) return NextResponse.json({ error: 'The selected order is not available.' }, { status: 400 });
  }
  const { data: conversation, error: conversationError } = await service.from('support_conversations').insert({ user_id: user.id, order_id: orderId, subject, status: 'OPEN', resolved_at: null }).select('id,status,subject,order_id,created_at,updated_at').single();
  if (conversationError || !conversation) return NextResponse.json({ error: 'Support is temporarily unavailable.' }, { status: 503 });
  const { error: messageError } = await service.from('support_messages').insert({ conversation_id: conversation.id, sender_user_id: user.id, sender_role: 'CUSTOMER', body: message });
  if (messageError) return NextResponse.json({ error: 'Your conversation could not be saved.' }, { status: 503 });
  return NextResponse.json({ conversation });
}
