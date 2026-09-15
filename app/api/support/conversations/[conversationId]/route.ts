import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: Request, context: { params: Promise<{ conversationId: string }> }) {
  const authorization = request.headers.get('authorization');
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  const { conversationId } = await context.params;
  if (!token || !serviceRoleKey) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const authClient = createClient(url, anonKey);
  const { data: authData } = await authClient.auth.getUser(token);
  if (!authData.user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const service = createClient(url, serviceRoleKey);
  const { data: conversation } = await service.from('support_conversations').select('id,status,subject,created_at,updated_at').eq('id', conversationId).eq('user_id', authData.user.id).maybeSingle();
  if (!conversation) return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 });
  const { data: messages, error } = await service.from('support_messages').select('id,sender_role,body,created_at').eq('conversation_id', conversationId).order('created_at', { ascending: true });
  if (error) return NextResponse.json({ error: 'Support is temporarily unavailable.' }, { status: 503 });
  return NextResponse.json({ conversation, messages: messages || [] });
}

export async function POST(request: Request, context: { params: Promise<{ conversationId: string }> }) {
  const authorization = request.headers.get('authorization');
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  const { conversationId } = await context.params;
  const body = await request.json().catch(() => ({}));
  const message = typeof body?.message === 'string' ? body.message.trim() : '';
  if (!message || message.length > 4000) return NextResponse.json({ error: 'Enter a support message.' }, { status: 400 });
  if (!token || !serviceRoleKey) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const authClient = createClient(url, anonKey);
  const { data: authData } = await authClient.auth.getUser(token);
  if (!authData.user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const service = createClient(url, serviceRoleKey);
  const { data: conversation } = await service.from('support_conversations').select('id,status').eq('id', conversationId).eq('user_id', authData.user.id).maybeSingle();
  if (!conversation || conversation.status === 'RESOLVED') return NextResponse.json({ error: 'This conversation is closed.' }, { status: 409 });
  const { data, error } = await service.from('support_messages').insert({ conversation_id: conversationId, sender_user_id: authData.user.id, sender_role: 'CUSTOMER', body: message }).select('id,sender_role,body,created_at').single();
  if (error) return NextResponse.json({ error: 'Your message could not be saved.' }, { status: 503 });
  await service.from('support_conversations').update({ status: 'OPEN', updated_at: new Date().toISOString() }).eq('id', conversationId);
  return NextResponse.json({ message: data });
}
