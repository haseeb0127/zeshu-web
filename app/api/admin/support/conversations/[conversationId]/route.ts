import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getRuntimeSupabaseEnv } from '@/app/lib/runtime-env';

async function getAdmin(request: Request) {
  const { url, anonKey, serviceRoleKey } = await getRuntimeSupabaseEnv();
  const authorization = request.headers.get('authorization');
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  if (!token || !url || !anonKey || !serviceRoleKey) return null;
  const authClient = createClient(url, anonKey);
  const { data: authData } = await authClient.auth.getUser(token);
  if (!authData.user) return null;
  const service = createClient(url, serviceRoleKey);
  const { data: admin } = await service.from('admin_roles').select('user_id').eq('user_id', authData.user.id).eq('role', 'admin').maybeSingle();
  return admin ? { user: authData.user, service } : null;
}

export async function GET(request: Request, context: { params: Promise<{ conversationId: string }> }) {
  const admin = await getAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const { conversationId } = await context.params;
  const { data: conversation, error: conversationError } = await admin.service.from('support_conversations').select('id,user_id,status,subject,order_id,created_at,updated_at,resolved_at').eq('id', conversationId).maybeSingle();
  if (conversationError) return NextResponse.json({ error: 'Support inbox is temporarily unavailable.' }, { status: 503 });
  if (!conversation) return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 });
  const { data: messages, error: messagesError } = await admin.service.from('support_messages').select('id,sender_role,body,created_at').eq('conversation_id', conversationId).order('created_at', { ascending: true });
  if (messagesError) return NextResponse.json({ error: 'Support inbox is temporarily unavailable.' }, { status: 503 });
  return NextResponse.json({ conversation, messages: messages || [] });
}

export async function POST(request: Request, context: { params: Promise<{ conversationId: string }> }) {
  const admin = await getAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const { conversationId } = await context.params;
  const body = await request.json().catch(() => ({}));
  const action = typeof body?.action === 'string' ? body.action : '';
  const { data: conversation, error: conversationError } = await admin.service.from('support_conversations').select('id,user_id,status,subject,order_id,created_at,updated_at,resolved_at').eq('id', conversationId).maybeSingle();
  if (conversationError) return NextResponse.json({ error: 'Support inbox is temporarily unavailable.' }, { status: 503 });
  if (!conversation) return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 });
  if (action === 'reply') {
    const message = typeof body?.message === 'string' ? body.message.trim() : '';
    if (!message || message.length > 4000) return NextResponse.json({ error: 'Enter a support reply.' }, { status: 400 });
    const { data, error } = await admin.service.rpc('admin_reply_support_message', {
      p_conversation_id: conversationId,
      p_admin_user_id: admin.user.id,
      p_message: message,
    });
    if (error) {
      const rpcMessage = String(error.message || '').toLowerCase();
      if (rpcMessage.includes('resolved')) return NextResponse.json({ error: 'This conversation is resolved.' }, { status: 409 });
      if (rpcMessage.includes('not found')) return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 });
      if (rpcMessage.includes('between 1 and 4000')) return NextResponse.json({ error: 'Enter a support reply.' }, { status: 400 });
      return NextResponse.json({ error: 'Your reply could not be saved.' }, { status: 503 });
    }
    const messageRow = Array.isArray(data) ? data[0] : data;
    if (!messageRow) return NextResponse.json({ error: 'Your reply could not be saved.' }, { status: 503 });
    const { data: updated, error: updatedError } = await admin.service.from('support_conversations').select('id,user_id,status,subject,order_id,created_at,updated_at,resolved_at').eq('id', conversationId).maybeSingle();
    if (updatedError || !updated) return NextResponse.json({ error: 'The reply was saved, but the conversation could not be loaded.' }, { status: 503 });
    return NextResponse.json({ message: { id: messageRow.message_id, sender_role: messageRow.sender_role, body: messageRow.body, created_at: messageRow.created_at }, conversation: updated });
  }
  if (action === 'resolve') {
    const { data, error } = await admin.service.rpc('admin_resolve_support_conversation', {
      p_conversation_id: conversationId,
      p_admin_user_id: admin.user.id,
    });
    if (error) {
      const rpcMessage = String(error.message || '').toLowerCase();
      if (rpcMessage.includes('not found')) return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 });
      return NextResponse.json({ error: 'The conversation could not be resolved.' }, { status: 503 });
    }
    const resolved = Array.isArray(data) ? data[0] : data;
    if (!resolved) return NextResponse.json({ error: 'The conversation could not be resolved.' }, { status: 503 });
    return NextResponse.json({ conversation: { id: resolved.conversation_id, user_id: conversation.user_id, status: resolved.status, subject: resolved.subject, order_id: resolved.order_id, created_at: resolved.created_at, updated_at: resolved.updated_at, resolved_at: resolved.resolved_at } });
  }
  return NextResponse.json({ error: 'Invalid support action.' }, { status: 400 });
}
