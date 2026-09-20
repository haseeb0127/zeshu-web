import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_MESSAGE_LENGTH = 1200;

const getBearer = (request: Request) => {
  const authorization = request.headers.get('authorization') || '';
  return authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
};

const fallbackAnswer = (message: string) => {
  const text = message.toLowerCase();
  if (/refund|return|damaged|spoiled|wrong item|missing item/.test(text)) {
    return {
      answer: 'For a wrong, missing, damaged, expired or spoiled item, open Help & Support and share the order details. Eligible issues can be reviewed for replacement, partial refund or full refund under Zeshu policy.',
      resolved: false,
    };
  }
  if (/where.*order|track|delivery|rider|eta|late/.test(text)) {
    return {
      answer: 'Open My Account → My Orders → Track order. When a rider is assigned, Zeshu shows live rider-location freshness and an arrival estimate when available.',
      resolved: true,
    };
  }
  if (/cashback|zeshu cash|reward|coins/.test(text)) {
    return {
      answer: 'Zeshu Cash is a promotional reward for eligible activity. Your available balance and recent reward activity are shown in My Account → Zeshu Cash. It is not withdrawable as bank cash.',
      resolved: true,
    };
  }
  if (/recharge|bill|electricity|fastag|gas|water|broadband/.test(text)) {
    return {
      answer: 'Some recharge and bill features are currently discovery-only while provider fulfilment is being verified. Zeshu will not claim a bill or recharge is paid unless the provider confirms it.',
      resolved: false,
    };
  }
  if (/payment|charged|debited|razorpay|upi/.test(text)) {
    return {
      answer: 'If money was debited but the order is not confirmed, do not pay again. Use Help & Support so the existing payment can be checked and reconciled safely.',
      resolved: false,
    };
  }
  if (/location|address|pin/.test(text)) {
    return {
      answer: 'Use the delivery-location control at the top of Zeshu, place the pin at your delivery entrance, then save your house/flat and landmark details. Supported Jagtial delivery areas are validated automatically.',
      resolved: true,
    };
  }
  return {
    answer: 'I can help with orders, tracking, delivery location, Zeshu Cash, refunds, recharge/bill availability and account help. For anything involving a specific payment, refund decision or unresolved order issue, connect to a Zeshu support person.',
    resolved: false,
  };
};

const parseResponseText = (payload: any) => {
  if (typeof payload?.output_text === 'string' && payload.output_text.trim()) return payload.output_text.trim();
  if (!Array.isArray(payload?.output)) return '';
  for (const item of payload.output) {
    if (!Array.isArray(item?.content)) continue;
    for (const part of item.content) {
      if (part?.type === 'output_text' && typeof part?.text === 'string' && part.text.trim()) return part.text.trim();
    }
  }
  return '';
};

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const token = getBearer(request);
  if (!supabaseUrl || !anonKey || !token) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  const authClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: authData } = await authClient.auth.getUser(token);
  if (!authData.user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const message = typeof body?.message === 'string' ? body.message.trim() : '';
  if (!message || message.length > MAX_MESSAGE_LENGTH) return NextResponse.json({ error: 'Enter a shorter support question.' }, { status: 400 });

  const fallback = fallbackAnswer(message);
  const apiKey = process.env.OPENAI_API_KEY;
  const enabled = process.env.SUPPORT_AI_ENABLED === 'true' && Boolean(apiKey);
  if (!enabled) return NextResponse.json({ ...fallback, source: 'guided' });

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: process.env.SUPPORT_AI_MODEL || 'gpt-5.6-luna',
        max_output_tokens: 260,
        input: [
          {
            role: 'system',
            content: [{
              type: 'input_text',
              text: 'You are Zeshu Support Assistant for an Indian local-commerce service. Give concise, friendly support guidance. Never claim a payment, refund, recharge, cancellation, order change, cashback adjustment or account change was completed. Never request OTPs, passwords, card numbers, CVV, UPI PIN, API keys or secrets. Zeshu currently serves eligible Jagtial areas for quick-commerce essentials. Some utilities are discovery-only. If the issue requires checking a specific order, payment, refund, provider transaction, safety issue, or you are uncertain, tell the customer to connect to a Zeshu support person. Do not invent policies.'
            }]
          },
          { role: 'user', content: [{ type: 'input_text', text: message }] }
        ]
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return NextResponse.json({ ...fallback, source: 'guided' });
    const payload = await response.json();
    const answer = parseResponseText(payload);
    if (!answer) return NextResponse.json({ ...fallback, source: 'guided' });
    const needsHuman = /connect|support person|human|agent|specific order|payment|refund/i.test(answer);
    return NextResponse.json({ answer, resolved: !needsHuman, source: 'ai' });
  } catch {
    return NextResponse.json({ ...fallback, source: 'guided' });
  }
}
