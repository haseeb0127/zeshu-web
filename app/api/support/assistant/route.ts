import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimitResponse } from '@/app/lib/provider-security';
import { ZESHU_SUPPORT_KNOWLEDGE } from '@/app/lib/support-ai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_MESSAGE_LENGTH = 1200;
const MAX_HISTORY_ITEMS = 10;

type AssistantTurn = { role: 'CUSTOMER' | 'AI'; body: string };

const getBearer = (request: Request) => {
  const authorization = request.headers.get('authorization') || '';
  return authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
};

const fallbackAnswer = (message: string) => {
  const text = message.toLowerCase();
  if (/refund|return|damaged|spoiled|wrong item|missing item/.test(text)) {
    return {
      answer: 'I can explain the policy, but this needs a Zeshu support person to check the actual order and decide the correct replacement or refund.',
      resolved: false,
      subject: 'Order item or refund help',
      handoff_reason: 'A human must review the specific order and remedy.',
    };
  }
  if (/where.*order|track|delivery|rider|eta|late/.test(text)) {
    return {
      answer: 'Open My Account → Your Orders & Buy Again → Track order. When a rider is assigned, Zeshu shows rider-location freshness and an arrival estimate when available.',
      resolved: true,
      subject: 'Order tracking help',
      handoff_reason: '',
    };
  }
  if (/cashback|zeshu cash|reward|coins/.test(text)) {
    return {
      answer: 'Your available Zeshu Cash and recent reward activity are shown in My Account → ZESHU CASH. Zeshu Cash is promotional reward value and is not withdrawable as bank cash.',
      resolved: true,
      subject: 'Zeshu Cash help',
      handoff_reason: '',
    };
  }
  if (/recharge|bill|electricity|fastag|gas|water|broadband/.test(text)) {
    return {
      answer: 'Some recharge and bill features are currently discovery-only while provider fulfilment is being verified. If you need help with a specific provider transaction, I will transfer this to Zeshu Support.',
      resolved: false,
      subject: 'Recharge or bill support',
      handoff_reason: 'Provider-specific transaction support requires a human review.',
    };
  }
  if (/payment|charged|debited|razorpay|upi/.test(text)) {
    return {
      answer: 'If money was debited but your order is not confirmed, do not pay again. I am transferring this to Zeshu Support so the existing transaction can be checked safely.',
      resolved: false,
      subject: 'Payment reconciliation help',
      handoff_reason: 'A specific payment must be reviewed by support.',
    };
  }
  if (/location|address|pin/.test(text)) {
    return {
      answer: 'Use the delivery-location control at the top of Zeshu, place the pin at your delivery entrance, then save your house or flat and landmark details. Supported Jagtial delivery areas are validated automatically.',
      resolved: true,
      subject: 'Delivery location help',
      handoff_reason: '',
    };
  }
  return {
    answer: 'I can help with orders, tracking, delivery location, Zeshu Cash, refunds, recharge or bill availability, and account help. I could not safely resolve this question on my own, so I will transfer it to Zeshu Support.',
    resolved: false,
    subject: 'Zeshu Assistant handoff',
    handoff_reason: 'The assistant could not confidently resolve the customer question.',
  };
};

const sanitizeHistory = (value: unknown): AssistantTurn[] => {
  if (!Array.isArray(value)) return [];
  return value.slice(-MAX_HISTORY_ITEMS).flatMap((item): AssistantTurn[] => {
    if (!item || typeof item !== 'object') return [];
    const role = (item as any).role;
    const body = typeof (item as any).body === 'string' ? (item as any).body.trim().slice(0, MAX_MESSAGE_LENGTH) : '';
    if ((role !== 'CUSTOMER' && role !== 'AI') || !body) return [];
    return [{ role, body }];
  });
};

const parseStructuredResponse = (payload: any) => {
  const outputText = typeof payload?.output_text === 'string'
    ? payload.output_text.trim()
    : Array.isArray(payload?.output)
      ? payload.output.flatMap((item: any) => Array.isArray(item?.content) ? item.content : []).find((part: any) => part?.type === 'output_text')?.text?.trim() || ''
      : '';
  if (!outputText) return null;
  try {
    const parsed = JSON.parse(outputText);
    if (typeof parsed?.answer !== 'string' || typeof parsed?.resolved !== 'boolean') return null;
    return {
      answer: parsed.answer.trim().slice(0, 4000),
      resolved: parsed.resolved,
      subject: typeof parsed.subject === 'string' && parsed.subject.trim() ? parsed.subject.trim().slice(0, 160) : 'Zeshu Assistant handoff',
      handoff_reason: typeof parsed.handoff_reason === 'string' ? parsed.handoff_reason.trim().slice(0, 500) : '',
    };
  } catch {
    return null;
  }
};

const createAutomaticHandoff = async ({
  supabaseUrl,
  serviceRoleKey,
  userId,
  question,
  answer,
  subject,
}: {
  supabaseUrl: string;
  serviceRoleKey: string;
  userId: string;
  question: string;
  answer: string;
  subject: string;
}) => {
  try {
    const service = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const { data, error } = await service.rpc('create_ai_escalated_support_conversation', {
      p_user_id: userId,
      p_question: question,
      p_ai_answer: answer,
      p_subject: subject,
    });
    if (error) return null;
    const row = Array.isArray(data) ? data[0] : data;
    if (!row?.conversation_id) return null;
    return {
      id: row.conversation_id,
      status: row.status,
      subject: row.subject,
      created_at: row.created_at,
      updated_at: row.updated_at,
      order_id: null,
    };
  } catch {
    return null;
  }
};

export async function GET() {
  const aiEnabled = process.env.SUPPORT_AI_ENABLED === 'true' && Boolean(process.env.OPENAI_API_KEY);
  const handoffConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  return NextResponse.json({
    mode: aiEnabled ? 'ai' : 'guided',
    automatic_handoff: handoffConfigured,
  });
}

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const token = getBearer(request);
  if (!supabaseUrl || !anonKey || !token) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  const authClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data: authData } = await authClient.auth.getUser(token);
  if (!authData.user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const limited = rateLimitResponse(authData.user.id, 'support-assistant');
  if (limited) return limited;

  const body = await request.json().catch(() => ({}));
  const message = typeof body?.message === 'string' ? body.message.trim() : '';
  const history = sanitizeHistory(body?.history);
  if (!message || message.length > MAX_MESSAGE_LENGTH) return NextResponse.json({ error: 'Enter a shorter support question.' }, { status: 400 });

  let result = fallbackAnswer(message);
  let source: 'ai' | 'guided' = 'guided';

  const apiKey = process.env.OPENAI_API_KEY;
  const aiEnabled = process.env.SUPPORT_AI_ENABLED === 'true' && Boolean(apiKey);
  if (aiEnabled) {
    try {
      const conversationInput = history.map((turn) => ({
        role: turn.role === 'CUSTOMER' ? 'user' : 'assistant',
        content: [{ type: 'input_text', text: turn.body }],
      }));
      conversationInput.push({ role: 'user', content: [{ type: 'input_text', text: message }] });

      const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: process.env.SUPPORT_AI_MODEL || 'gpt-5.6-luna',
          store: false,
          max_output_tokens: 320,
          text: {
            format: {
              type: 'json_schema',
              name: 'zeshu_support_resolution',
              strict: true,
              schema: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  answer: { type: 'string' },
                  resolved: { type: 'boolean' },
                  subject: { type: 'string' },
                  handoff_reason: { type: 'string' },
                },
                required: ['answer', 'resolved', 'subject', 'handoff_reason'],
              },
            },
          },
          input: [
            {
              role: 'system',
              content: [{
                type: 'input_text',
                text: `You are Zeshu Support Assistant for an Indian local-commerce service. Reply concisely and helpfully. Use the Zeshu knowledge below as the source of truth for service-specific facts. resolved=true only when the customer can reasonably act on your answer without a staff member checking private account, order, payment, refund, provider, safety, or fulfilment data. Set resolved=false for any specific payment/debit, refund decision, order dispute, missing/wrong/damaged/spoiled item, provider transaction, account-specific issue, safety issue, explicit request for a human, repeated statement that the prior answer did not help, or whenever you are uncertain. Never claim a payment, refund, recharge, cancellation, order change, cashback adjustment, delivery change, or account change was completed. Never request OTPs, passwords, card numbers, CVV, UPI PIN, API keys, access tokens or secrets. When resolved=false, clearly say the conversation is being transferred to Zeshu Support and give a short subject. Do not invent policies or business facts.\n\nZESHU KNOWLEDGE:\n${ZESHU_SUPPORT_KNOWLEDGE}`,
              }],
            },
            ...conversationInput,
          ],
        }),
        signal: AbortSignal.timeout(9000),
      });
      if (response.ok) {
        const payload = await response.json();
        const structured = parseStructuredResponse(payload);
        if (structured?.answer) {
          result = structured;
          source = 'ai';
        }
      }
    } catch {
      // Guided fallback remains available if the model or network is unavailable.
    }
  }

  let conversation = null;
  if (!result.resolved && serviceRoleKey) {
    conversation = await createAutomaticHandoff({
      supabaseUrl,
      serviceRoleKey,
      userId: authData.user.id,
      question: message,
      answer: result.answer,
      subject: result.subject,
    });
  }

  return NextResponse.json({
    answer: result.answer,
    resolved: result.resolved,
    source,
    handoff_reason: result.handoff_reason,
    handoff: {
      requested: !result.resolved,
      created: Boolean(conversation),
      conversation,
    },
  });
}
