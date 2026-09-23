import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getRuntimeSupabaseEnv } from '@/app/lib/runtime-env';
import { classifySupportPriority } from '@/app/lib/support-priority';
import { classifySupportCategory } from '@/app/lib/support-category';

export async function GET(request: Request) {
  const { url, anonKey, serviceRoleKey } = await getRuntimeSupabaseEnv();
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
  const conversations = data || [];
  const ids = conversations.map((conversation) => conversation.id);
  const { data: messages, error: messagesError } = ids.length
    ? await service.from('support_messages').select('conversation_id,body,sender_role,created_at').in('conversation_id', ids).order('created_at', { ascending: false })
    : { data: [], error: null };
  if (messagesError) return NextResponse.json({ error: 'Support inbox is temporarily unavailable.' }, { status: 503 });
  const latestByConversation = new Map<string, { body: string; sender_role: string; created_at: string }>();
  for (const message of messages || []) {
    if (!latestByConversation.has(message.conversation_id)) {
      latestByConversation.set(message.conversation_id, {
        body: String(message.body || '').slice(0, 160),
        sender_role: String(message.sender_role || ''),
        created_at: message.created_at,
      });
    }
  }
  const enriched = conversations.map((conversation) => {
    const lastMessage = latestByConversation.get(conversation.id) || null;
    const subject = String(conversation.subject || '');
    const latestBody = String(lastMessage?.body || '');
    const priority = classifySupportPriority(subject, latestBody);
    const supportCategory = classifySupportCategory('', `${subject} ${latestBody}`);
    return { ...conversation, last_message: lastMessage, support_priority: priority.label, support_priority_rank: priority.rank, support_category: supportCategory };
  }).sort((a, b) => {
    const resolvedDelta = Number(a.status === 'RESOLVED') - Number(b.status === 'RESOLVED');
    if (resolvedDelta !== 0) return resolvedDelta;
    const priorityDelta = Number(a.support_priority_rank) - Number(b.support_priority_rank);
    if (priorityDelta !== 0) return priorityDelta;
    const waitingDelta = Number(b.status === 'WAITING') - Number(a.status === 'WAITING');
    if (waitingDelta !== 0) return waitingDelta;
    return new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime();
  });

  return NextResponse.json({ conversations: enriched });
}
