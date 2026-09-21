import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getRuntimeSupabaseEnv } from '@/app/lib/runtime-env';

export async function GET(request: Request, context: { params: Promise<{ conversationId: string }> }) {
  const { url, anonKey, serviceRoleKey } = await getRuntimeSupabaseEnv();
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
  const { url, anonKey, serviceRoleKey } = await getRuntimeSupabaseEnv();
  const authorization = request.headers.get('authorization');
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  const { conversationId } = await context.params;
  const body = await request.json().catch(() => ({}));
  const action = typeof body?.action === 'string' ? body.action : 'message';
  if (action !== 'message' && action !== 'escalate') return NextResponse.json({ error: 'Invalid support action.' }, { status: 400 });
  const message = typeof body?.message === 'string' ? body.message.trim() : '';
  if (action === 'message' && (!message || message.length > 4000)) return NextResponse.json({ error: 'Enter a support message.' }, { status: 400 });
  if (!token || !serviceRoleKey) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const authClient = createClient(url, anonKey);
  const { data: authData } = await authClient.auth.getUser(token);
  if (!authData.user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const service = createClient(url, serviceRoleKey);
  const { data: ownedConversation, error: ownershipError } = await service.from('support_conversations').select('id').eq('id', conversationId).eq('user_id', authData.user.id).maybeSingle();
  if (ownershipError) return NextResponse.json({ error: 'Support is temporarily unavailable.' }, { status: 503 });
  if (!ownedConversation) return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 });
  if (action === 'escalate') {
    const { data, error } = await service.rpc('customer_escalate_support_conversation', {
      p_conversation_id: conversationId,
      p_user_id: authData.user.id,
    });
    if (error) {
      const rpcMessage = String(error.message || '').toLowerCase();
      if (rpcMessage.includes('resolved')) return NextResponse.json({ error: 'This conversation is closed.' }, { status: 409 });
      if (rpcMessage.includes('not found')) return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 });
      return NextResponse.json({ error: 'Your conversation could not be escalated.' }, { status: 503 });
    }
    const conversation = Array.isArray(data) ? data[0] : data;
    if (!conversation) return NextResponse.json({ error: 'Your conversation could not be escalated.' }, { status: 503 });
    return NextResponse.json({ conversation: { id: conversation.conversation_id, status: conversation.status, subject: conversation.subject, order_id: conversation.order_id, created_at: conversation.created_at, updated_at: conversation.updated_at, resolved_at: conversation.resolved_at } });
  }
  const { data, error } = await service.rpc('customer_send_support_message', {
    p_conversation_id: conversationId,
    p_user_id: authData.user.id,
    p_message: message,
  });
  if (error) {
    const rpcMessage = String(error.message || '').toLowerCase();
    if (rpcMessage.includes('resolved')) return NextResponse.json({ error: 'This conversation is closed.' }, { status: 409 });
    if (rpcMessage.includes('between 1 and 4000')) return NextResponse.json({ error: 'Enter a support message.' }, { status: 400 });
    if (rpcMessage.includes('not found')) return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 });
    return NextResponse.json({ error: 'Your message could not be saved.' }, { status: 503 });
  }
  const messageRow = Array.isArray(data) ? data[0] : data;
  if (!messageRow) return NextResponse.json({ error: 'Your message could not be saved.' }, { status: 503 });
  return NextResponse.json({ message: { id: messageRow.message_id, sender_role: messageRow.sender_role, body: messageRow.body, created_at: messageRow.created_at } });
}
