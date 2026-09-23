import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimitResponse } from '@/app/lib/provider-security';
import { ZESHU_SUPPORT_KNOWLEDGE } from '@/app/lib/support-ai';
import { getRuntimeEnvValue, getRuntimeSupabaseEnv } from '@/app/lib/runtime-env';
import { getMoveServiceReadiness } from '@/app/lib/move-readiness';
import { buildCategorizedSupportSubject, classifySupportCategory } from '@/app/lib/support-category';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_MESSAGE_LENGTH = 1200;
const MAX_HISTORY_ITEMS = 16;

type AssistantTurn = { role: 'CUSTOMER' | 'AI'; body: string };
type AssistantResult = {
  answer: string;
  resolved: boolean;
  subject: string;
  handoff_reason: string;
  suggested_questions: string[];
  intent: string;
};

type LiveOrder = {
  order_ref: string;
  status: string;
  total_paid: number;
  delivery_fee: number | null;
  created_at: string | null;
  item_names: string[];
};

type RewardActivity = {
  event_type: string;
  amount: number;
  description: string;
  order_ref: string | null;
  created_at: string | null;
};

type CatalogProduct = {
  name: string;
  price: number;
  unit: string;
  category: string;
  brand: string;
  quantity: number;
};

type LiveAssistantContext = {
  recent_orders?: LiveOrder[];
  reward_balance?: number;
  reward_activity?: RewardActivity[];
  catalog_matches?: CatalogProduct[];
  catalog_snapshot_partial?: boolean;
  move_services?: ReturnType<typeof getMoveServiceReadiness>;
};

const getBearer = (request: Request) => {
  const authorization = request.headers.get('authorization') || '';
  return authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
};

const safeNumber = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : 0;

const shortOrderRef = (value: unknown) => String(value || '').split('-')[0]?.toUpperCase() || '';

const SECRET_LABEL_PATTERN = /\b(otp|cvv|upi\s*pin|password|api\s*key|access\s*token|refresh\s*token|app\s*secret|client\s*secret|service\s*role(?:\s*key)?|secret\s*key)\s*[:=-]?\s*[^\s,;]{3,}/gi;
const BEARER_TOKEN_PATTERN = /\bbearer\s+[a-z0-9._~+\/-]{12,}={0,2}/gi;
const JWT_PATTERN = /\beyJ[a-z0-9_-]{10,}\.[a-z0-9_-]{10,}\.[a-z0-9_-]{10,}\b/gi;
const PROVIDER_SECRET_PATTERN = /\b(?:sk-[a-z0-9_-]{16,}|rzp_(?:test|live)_[a-z0-9]{16,}|whsec_[a-z0-9_-]{16,})\b/gi;

const redactSensitive = (value: string) => value
  .replace(/\b\d[\d\s-]{10,18}\d\b/g, '[redacted payment number]')
  .replace(SECRET_LABEL_PATTERN, '$1 [redacted]')
  .replace(BEARER_TOKEN_PATTERN, 'Bearer [redacted]')
  .replace(JWT_PATTERN, '[redacted access token]')
  .replace(PROVIDER_SECRET_PATTERN, '[redacted secret]');

const containsLikelySecret = (value: string) => {
  if (/\b\d[\d\s-]{10,18}\d\b/.test(value)) return true;
  return [SECRET_LABEL_PATTERN, BEARER_TOKEN_PATTERN, JWT_PATTERN, PROVIDER_SECRET_PATTERN]
    .some((pattern) => {
      pattern.lastIndex = 0;
      return pattern.test(value);
    });
};

const sanitizeHistory = (value: unknown): AssistantTurn[] => {
  if (!Array.isArray(value)) return [];
  return value.slice(-MAX_HISTORY_ITEMS).flatMap((item): AssistantTurn[] => {
    if (!item || typeof item !== 'object') return [];
    const role = (item as any).role;
    const body = typeof (item as any).body === 'string'
      ? redactSensitive((item as any).body.trim().slice(0, MAX_MESSAGE_LENGTH))
      : '';
    if ((role !== 'CUSTOMER' && role !== 'AI') || !body) return [];
    return [{ role, body }];
  });
};

const catalogIntent = (message: string) => /\b(product|products|stock|available|availability|price|cost|sell|find|search|grocery|groceries|milk|atta|flour|bread|chicken|biscuit|biscuits|dairy|snack|snacks|oil|rice|egg|eggs|drink|drinks|cola|pepsi)\b/i.test(message);
const orderIntent = (message: string) => /\b(order|orders|track|tracking|delivery|rider|eta|late|arrive|arriving|purchase|buy again)\b/i.test(message);
const deliveryInfoIntent = (message: string) => /\b(delivery area|delivery areas|delivery zone|deliver to|where.*deliver|saved address|saved addresses|address|location pin|serviceable|serviceability|jagtial delivery)\b/i.test(message);
const rewardIntent = (message: string) => /\b(zeshu cash|cashback|reward|rewards|bonus|bonuses|referral|coins?)\b/i.test(message);
const rideIntent = (message: string) => /\b(bike ride|bike taxi|auto ride|auto-rickshaw|autorickshaw|cab|taxi|rental car|outstation cab|ride|rides|driver|fare)\b/i.test(message);
const courierIntent = (message: string) => /\b(bike courier|courier|parcel|package|mini truck|tempo|cargo|porter|shop delivery|send.*parcel|send.*package)\b/i.test(message);
const carShareIntent = (message: string) => /\b(car share|car sharing|carpool|car pool|blablacar|share.*car|intercity.*share)\b/i.test(message);
const travelIntent = (message: string) => /\b(travel|bus ticket|train ticket|rail ticket|flight|flights|hotel|hotels|experience|tour|booking|pnr)\b/i.test(message);
const marketplaceIntent = (message: string) => /\b(marketplace|seller|vendor|electronics|fashion|clothing|beauty|home & kitchen|authorized seller|gst verified|invoice)\b/i.test(message);

const queryTokens = (message: string) => {
  const stop = new Set(['what','when','where','which','with','have','your','does','zeshu','show','tell','find','price','cost','stock','available','availability','product','products','please','need','want','give','about','there','this','that','from','for','the','and','are','can','you','do','is','me','my']);
  return Array.from(new Set(
    message.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/)
      .filter((token) => token.length >= 3 && !stop.has(token))
  )).slice(0, 8);
};

const searchCatalog = (products: any[], message: string): CatalogProduct[] => {
  const tokens = queryTokens(message);
  const normalized = products.map((product) => ({
    name: String(product?.name || ''),
    price: safeNumber(product?.price),
    unit: String(product?.unit || product?.weight || ''),
    category: String(product?.category || ''),
    brand: String(product?.brand || ''),
    quantity: Math.max(0, Number(product?.quantity || 0)),
    haystack: [product?.name, product?.brand, product?.category, product?.unit, product?.weight].filter(Boolean).join(' ').toLowerCase(),
  }));
  if (tokens.length === 0) return normalized.slice(0, 12).map(({ haystack: _haystack, ...product }) => product);
  return normalized
    .map((product) => ({ product, score: tokens.reduce((sum, token) => sum + (product.haystack.includes(token) ? 1 : 0), 0) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.product.name.localeCompare(b.product.name))
    .slice(0, 12)
    .map(({ product }) => {
      const { haystack: _haystack, ...clean } = product;
      return clean;
    });
};

const loadLiveAssistantContext = async ({
  service,
  userId,
  message,
}: {
  service: any;
  userId: string | null;
  message: string;
}): Promise<LiveAssistantContext> => {
  const needsMoveServices = rideIntent(message) || courierIntent(message) || carShareIntent(message) || travelIntent(message);
  const needsOrders = Boolean(userId) && orderIntent(message) && !needsMoveServices && !deliveryInfoIntent(message);
  const needsRewards = Boolean(userId) && rewardIntent(message);
  const needsCatalog = catalogIntent(message);
  const context: LiveAssistantContext = {};
  if (needsMoveServices) context.move_services = getMoveServiceReadiness();

  const [ordersResult, ledgerResult, allLedgerResult, reservedResult, catalogResult] = await Promise.all([
    needsOrders
      ? service.from('orders').select('id,status,total_paid,delivery_fee,created_at,items').eq('user_id', userId).order('created_at', { ascending: false }).limit(5)
      : Promise.resolve({ data: [], error: null }),
    needsRewards
      ? service.from('customer_reward_ledger').select('event_type,amount,description,order_id,created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(20)
      : Promise.resolve({ data: [], error: null }),
    needsRewards
      ? service.from('customer_reward_ledger').select('amount').eq('user_id', userId)
      : Promise.resolve({ data: [], error: null }),
    needsRewards
      ? service.from('reward_redemptions').select('approved_amount').eq('user_id', userId).eq('status', 'RESERVED')
      : Promise.resolve({ data: [], error: null }),
    needsCatalog
      ? service.from('products').select('name,price,unit,weight,category,brand,in_stock,quantity').eq('in_stock', true).gt('quantity', 0).order('name', { ascending: true }).limit(120)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (needsOrders && !ordersResult.error) {
    context.recent_orders = (ordersResult.data || []).map((order: any) => ({
      order_ref: shortOrderRef(order.id),
      status: String(order.status || 'UNKNOWN'),
      total_paid: safeNumber(order.total_paid),
      delivery_fee: order.delivery_fee == null ? null : safeNumber(order.delivery_fee),
      created_at: order.created_at || null,
      item_names: Array.isArray(order.items)
        ? order.items.slice(0, 6).map((entry: any) => String(entry?.item?.name || entry?.item_snapshot?.name || entry?.name || '')).filter(Boolean)
        : [],
    }));
  }

  if (needsRewards && !ledgerResult.error) {
    const ledger = ledgerResult.data || [];
    const fullLedger = allLedgerResult.error ? ledger : (allLedgerResult.data || []);
    const reserved = reservedResult.error ? [] : (reservedResult.data || []);
    const ledgerBalance = fullLedger.reduce((sum: number, entry: any) => sum + safeNumber(entry.amount), 0);
    const reservedBalance = reserved.reduce((sum: number, entry: any) => sum + safeNumber(entry.approved_amount), 0);
    context.reward_balance = Math.max(0, Number((ledgerBalance - reservedBalance).toFixed(2)));
    context.reward_activity = ledger.slice(0, 10).map((entry: any) => ({
      event_type: String(entry.event_type || ''),
      amount: safeNumber(entry.amount),
      description: String(entry.description || ''),
      order_ref: entry.order_id ? shortOrderRef(entry.order_id) : null,
      created_at: entry.created_at || null,
    }));
  }

  if (needsCatalog && !catalogResult.error) {
    const products = catalogResult.data || [];
    context.catalog_matches = searchCatalog(products, message);
    context.catalog_snapshot_partial = products.length >= 120;
  }

  return context;
};

const suggestedForIntent = (intent: string) => {
  if (intent === 'ORDER') return ['What is my latest order status?', 'How does live tracking work?', 'I have an order problem'];
  if (intent === 'REWARDS') return ['What is my Zeshu Cash balance?', 'How can I earn Zeshu Cash?', 'Show recent reward activity'];
  if (intent === 'CATALOG') return ['Do you have milk?', 'What products are in stock?', 'How do I search products?'];
  if (intent === 'DELIVERY') return ['Where does Zeshu deliver?', 'How do I set my address?', 'Can I use digital services outside Jagtial?'];
  if (intent === 'PAYMENT') return ['How does secure checkout work?', 'Money was debited but no order', 'Where can I find my payment reference?'];
  if (intent === 'RIDES') return ['Can I book a bike ride now?', 'When will Auto and Cab launch?', 'How will ride safety work?'];
  if (intent === 'COURIER') return ['Can I send a parcel now?', 'What will Bike Courier carry?', 'How will parcel tracking work?'];
  if (intent === 'CAR_SHARE') return ['Can I share an intercity car now?', 'How will drivers be verified?', 'How will car-share safety work?'];
  if (intent === 'TRAVEL') return ['Can I book trains on Zeshu?', 'Will Zeshu have flights and hotels?', 'How will travel refunds work?'];
  if (intent === 'MARKETPLACE') return ['What does Verified Seller mean?', 'Can I buy electronics?', 'How are nationwide products delivered?'];
  return ['Where is my latest order?', 'What is my Zeshu Cash balance?', 'What can Zeshu Assistant help with?'];
};

const fallbackAnswer = (message: string, context: LiveAssistantContext, signedIn = true): AssistantResult => {
  const text = message.toLowerCase();
  const moveServiceIntent = rideIntent(message) || courierIntent(message) || carShareIntent(message) || travelIntent(message);

  if (/\b(human|person|agent|support executive|talk to support)\b/.test(text)) {
    return {
      answer: signedIn
        ? 'I’ll transfer this to Zeshu Support so a person can help you. You will not need to repeat the question.'
        : 'Please sign in to open a private Zeshu Support conversation. You can still ask general service and policy questions here without signing in.',
      resolved: false,
      subject: 'Customer requested human support',
      handoff_reason: 'The customer explicitly requested a human support agent.',
      suggested_questions: signedIn ? [] : ['What services are available?', 'How do refunds work?', 'Is Zeshu Move & Travel live?'],
      intent: 'HUMAN',
    };
  }

  if (/\b(what services|services available|available now|live now|what is live|coming soon|what can zeshu do)\b/.test(text)) {
    const moveReady = context.move_services
      ? Object.values(context.move_services).some((entry) => Boolean(entry.customerBookingAvailable))
      : false;
    return {
      answer: moveReady
        ? 'Zeshu shopping, account/order support and selected customer services are available where the app shows a live action. Some Move & Travel services may also be live where a verified provider is shown. Pharmacy transactions, nationwide checkout and provider-backed digital actions must still be treated as available only when their real transaction button and serviceability checks are enabled.'
        : 'Zeshu shopping, product search, account/order support, Zeshu Cash, referrals, QR tools and supported digital-service discovery are available in the app. Move & Travel (Bike/Auto/Cab, Courier/Cargo, Car Share, Bus/Train/Flights/Hotels/Experiences) is currently discovery-only, pharmacy transactions are not live, and other provider-backed payments/fulfilment are available only where the app explicitly enables them.',
      resolved: true,
      subject: 'Zeshu service availability',
      handoff_reason: '',
      suggested_questions: ['Can I book a bike ride now?', 'Which recharge and bill services are available?', 'Can I buy electronics?'],
      intent: 'GENERAL',
    };
  }

  if (/\b(sell on zeshu|become a seller|seller signup|vendor signup|partner with zeshu|become a partner|advertise on zeshu|brand partnership|driver partner|fleet partner|logistics partner|travel partner)\b/.test(text)) {
    return {
      answer: 'Open Brands & Partners on Zeshu to submit a seller, brand, mobility, logistics, travel or advertising partnership request. Zeshu reviews identity/licensing, serviceability, commercial terms and support readiness before anything is activated; submitting the form does not guarantee approval.',
      resolved: true,
      subject: 'Partner with Zeshu',
      handoff_reason: '',
      suggested_questions: ['What seller verification does Zeshu use?', 'Can brands advertise on Zeshu?', 'How does marketplace fulfilment work?'],
      intent: 'PARTNER',
    };
  }

  if (/\b(pharmacy|medicine|medicines|prescription|tablet|health)\b/.test(text)) {
    return {
      answer: 'Pharmacy & Health is currently informational/upcoming. Prescription medicine fulfilment and medicine payment are not enabled. Zeshu should only show medicine ordering after a licensed pharmacy/provider and the required prescription/compliance flow are verified.',
      resolved: true,
      subject: 'Pharmacy availability',
      handoff_reason: '',
      suggested_questions: ['What services are available now?', 'How does delivery serviceability work?', 'How do I contact support?'],
      intent: 'PHARMACY',
    };
  }

    if (!moveServiceIntent && /damaged|spoiled|wrong item|missing item|refund my|refund.*order|want.*refund|need.*refund|return my|cancel.*order|order.*cancel/.test(text)) {
    return {
      answer: 'I can explain the policy, but a support person must review the actual order before any replacement, cancellation or refund decision. I’ll transfer this with your question attached.',
      resolved: false,
      subject: 'Order item, cancellation or refund help',
      handoff_reason: 'A human must review the specific order and remedy.',
      suggested_questions: [],
      intent: 'REFUND',
    };
  }

  if (!moveServiceIntent && /refund|return policy|cancellation policy/.test(text)) {
    return {
      answer: 'Approved monetary refunds are returned to the original payment method where supported and are normally processed within 5–7 business days after approval; final credit timing can depend on the bank or payment provider. Grocery quality or fulfilment issues should generally be reported within 24 hours where reasonably possible. A specific refund or replacement still needs order review.',
      resolved: true,
      subject: 'Refund policy',
      handoff_reason: '',
      suggested_questions: ['I need help with a specific order', 'What if an item is missing?', 'Money was debited but no order'],
      intent: 'REFUND_POLICY',
    };
  }

  if (/money.*debited|debited|charged|payment failed|paid.*not.*order|payment.*not.*confirmed|duplicate payment/.test(text)) {
    return {
      answer: 'Do not pay again. A specific payment needs reconciliation against Zeshu’s server records, so I’ll transfer this to Zeshu Support with your question attached.',
      resolved: false,
      subject: 'Payment reconciliation help',
      handoff_reason: 'A specific payment must be reviewed by support.',
      suggested_questions: [],
      intent: 'PAYMENT',
    };
  }

  if (!moveServiceIntent && deliveryInfoIntent(message)) {
    return {
      answer: 'Physical-product delivery is currently limited to the supported Jagtial delivery zone. You can browse without an address, but physical checkout needs a verified serviceable delivery pin. Zeshu can use device location or a map pin and then fill available area, city, state and PIN details. Digital services remain India-wide where the specific provider service is available.',
      resolved: true,
      subject: 'Delivery and address help',
      handoff_reason: '',
      suggested_questions: ['How do I set my address?', 'Can I use digital services outside Jagtial?', 'How does live tracking work?'],
      intent: 'DELIVERY',
    };
  }

  if (!moveServiceIntent && /order status meanings|what does.*(?:pending|confirmed|preparing|ready for pickup|picked up|out for delivery|delivered|cancelled)|status mean/.test(text)) {
    return {
      answer: 'Order statuses: PENDING = received but not yet confirmed; CONFIRMED = accepted; PREPARING = the store is preparing it; READY FOR PICKUP = waiting for rider pickup; PICKED UP = collected by the rider; OUT FOR DELIVERY = on the way; DELIVERED = completed; CANCELLED = cancelled.',
      resolved: true,
      subject: 'Order status meanings',
      handoff_reason: '',
      suggested_questions: ['What is my latest order status?', 'How does live tracking work?', 'I have an order problem'],
      intent: 'ORDER',
    };
  }

  if (!moveServiceIntent && /live tracking|track.*rider|rider location|delivery eta|where.*rider|when.*arrive/.test(text)) {
    return {
      answer: 'When a rider is assigned and fresh location data is available, Zeshu can show rider-location freshness and an estimated arrival time. ETA is an estimate, not a guarantee. Sign in and open My Account → Orders & payments to view the latest available tracking for your order.',
      resolved: true,
      subject: 'Delivery tracking help',
      handoff_reason: '',
      suggested_questions: ['What is my latest order status?', 'What do order statuses mean?', 'My delivery is late'],
      intent: 'DELIVERY',
    };
  }

  if (orderIntent(message) && !moveServiceIntent) {
    if (!signedIn) {
      return {
        answer: 'Please sign in to check a private order status, payment reference or delivery tracking. General delivery and order-policy questions can still be answered here without signing in.',
        resolved: true,
        subject: 'Order help',
        handoff_reason: '',
        suggested_questions: ['How does delivery tracking work?', 'How do refunds work?', 'What do order statuses mean?'],
        intent: 'ORDER',
      };
    }
    const latest = context.recent_orders?.[0];
    if (latest) {
      const items = latest.item_names.length ? ` Items include ${latest.item_names.slice(0, 3).join(', ')}.` : '';
      return {
        answer: `Your latest order #${latest.order_ref} is ${latest.status.replaceAll('_', ' ').toLowerCase()}. The recorded total is ₹${latest.total_paid.toFixed(2)}.${items} You can open My Account → Orders & payments to view or track it.`,
        resolved: true,
        subject: 'Order status',
        handoff_reason: '',
        suggested_questions: suggestedForIntent('ORDER'),
        intent: 'ORDER',
      };
    }
    return {
      answer: 'I could not find a confirmed order in your recent Zeshu order history. If you just attempted payment, do not pay again until the payment status is clear.',
      resolved: true,
      subject: 'Order history',
      handoff_reason: '',
      suggested_questions: suggestedForIntent('ORDER'),
      intent: 'ORDER',
    };
  }

  if (rewardIntent(message) && /how.*(?:zeshu cash|reward)|earn.*(?:zeshu cash|reward)|redeem|use.*zeshu cash|reward rules|cashback rules/.test(text)) {
    return {
      answer: 'Zeshu Cash is promotional reward value, not withdrawable bank cash, and ₹1 Zeshu Cash has ₹1 redemption value. Grocery redemption is currently limited by your balance, the amount you request, ₹20, 10% of merchandise subtotal and the requirement that at least ₹1 remains payable. Reward campaigns can change, so My Account → Zeshu Cash and checkout show the current authoritative balance and usable amount.',
      resolved: true,
      subject: 'Zeshu Cash rules',
      handoff_reason: '',
      suggested_questions: ['What is my Zeshu Cash balance?', 'What are referral rewards?', 'Where do I see reward history?'],
      intent: 'REWARDS',
    };
  }

  if (rewardIntent(message)) {
    if (!signedIn && /\b(my|balance|history|recent|earned|used)\b/i.test(message)) {
      return {
        answer: 'Please sign in to check your private Zeshu Cash balance or reward history. Zeshu Cash is promotional reward value and is not withdrawable bank cash.',
        resolved: true,
        subject: 'Zeshu Cash help',
        handoff_reason: '',
        suggested_questions: ['How does Zeshu Cash work?', 'How can I earn rewards?', 'What are referral rewards?'],
        intent: 'REWARDS',
      };
    }
    const balance = context.reward_balance;
    if (typeof balance === 'number') {
      return {
        answer: `Your current Zeshu Cash balance is ₹${balance.toFixed(2)}. For the full transaction history, open My Account → Zeshu Cash. Zeshu Cash is promotional reward value, not withdrawable bank cash.`,
        resolved: true,
        subject: 'Zeshu Cash help',
        handoff_reason: '',
        suggested_questions: suggestedForIntent('REWARDS'),
        intent: 'REWARDS',
      };
    }
    return {
      answer: 'Zeshu Cash is promotional reward value, not withdrawable bank cash. ₹1 Zeshu Cash has ₹1 redemption value. Current grocery redemption is capped by your available balance, the requested amount, ₹20, 10% of merchandise subtotal and the rule that final payable stays at least ₹1. Sign in and open My Account → Zeshu Cash to see your personal balance and history.',
      resolved: true,
      subject: 'Zeshu Cash help',
      handoff_reason: '',
      suggested_questions: ['How can I earn Zeshu Cash?', 'What are referral rewards?', 'Where do I see reward history?'],
      intent: 'REWARDS',
    };
  }

  if (catalogIntent(message)) {
    const matches = context.catalog_matches || [];
    if (matches.length > 0) {
      const summary = matches.slice(0, 5).map((product) => `${product.name} — ₹${product.price.toFixed(2)}${product.unit ? ` / ${product.unit}` : ''}`).join('; ');
      return {
        answer: `I found these currently in-stock matches: ${summary}. Stock can change, so the product page/cart is the final availability check before payment.`,
        resolved: true,
        subject: 'Product availability',
        handoff_reason: '',
        suggested_questions: suggestedForIntent('CATALOG'),
        intent: 'CATALOG',
      };
    }
    return {
      answer: 'I could not find a matching in-stock item in the current catalog snapshot. Try the Home search with the product or brand name; Zeshu search also handles related terms and common spelling variations.',
      resolved: true,
      subject: 'Product search',
      handoff_reason: '',
      suggested_questions: suggestedForIntent('CATALOG'),
      intent: 'CATALOG',
    };
  }

  if (/recharge failed|bill payment failed|provider.*failed|recharge.*debited|bill.*debited/.test(text)) {
    return {
      answer: 'A specific provider transaction needs a human review so Zeshu does not guess about fulfilment or money movement. I’ll transfer this with your question attached.',
      resolved: false,
      subject: 'Recharge or bill transaction help',
      handoff_reason: 'A provider-specific transaction requires reconciliation.',
      suggested_questions: [],
      intent: 'PROVIDER_DISPUTE',
    };
  }

  if (/change.*phone|update.*phone|delete.*account|close.*account|change.*account/.test(text)) {
    return {
      answer: 'That changes account data, so I’ll transfer this to Zeshu Support rather than changing or guessing about your account.',
      resolved: false,
      subject: 'Account change help',
      handoff_reason: 'The requested account change requires protected support handling.',
      suggested_questions: [],
      intent: 'ACCOUNT_CHANGE',
    };
  }

  if (/\b(accident|unsafe|danger|harass|harassment|threat|assault|emergency|driver.*unsafe|passenger.*unsafe)\b/.test(text)) {
    return {
      answer: 'If anyone is in immediate danger, contact local emergency services first. I’ll also transfer this to Zeshu Support so the platform/service record can be reviewed without making you repeat the issue.',
      resolved: false,
      subject: 'Urgent safety support',
      handoff_reason: 'A ride, delivery or service safety issue requires urgent human review.',
      suggested_questions: [],
      intent: 'SAFETY',
    };
  }

  if (/\b(lost parcel|missing parcel|courier.*lost|parcel.*damaged|courier.*damaged|driver complaint|ride complaint|ride.*charged|courier.*charged|travel.*charged|my.*(?:travel|flight|hotel|ticket).*(?:refund|cancel)|refund.*my.*(?:travel|flight|hotel|ticket))\b/.test(text)) {
    return {
      answer: 'This needs a provider or transaction review, so I’ll transfer it to Zeshu Support with your question attached. If money was debited, do not pay again while the original status is being checked.',
      resolved: false,
      subject: 'Move, courier or travel transaction help',
      handoff_reason: 'A provider-specific service, safety or money issue requires protected review.',
      suggested_questions: [],
      intent: 'SERVICE_DISPUTE',
    };
  }

  if (moveServiceIntent && /\b(when.*launch|launch date|when.*available|available when|go live|live date)\b/.test(text)) {
    return {
      answer: 'There is no published launch date I can safely promise for that service. Zeshu will enable it only after the real provider, serviceability, support, cancellation/refund and applicable compliance checks pass. The service page will stop showing Coming Soon only when customer booking is genuinely ready.',
      resolved: true,
      subject: 'Move & Travel launch timing',
      handoff_reason: '',
      suggested_questions: ['What is available right now?', 'How will this service work?', 'How can a provider partner with Zeshu?'],
      intent: rideIntent(message) ? 'RIDES' : courierIntent(message) ? 'COURIER' : carShareIntent(message) ? 'CAR_SHARE' : 'TRAVEL',
    };
  }

  if (moveServiceIntent && /\b(how much|price|fare|cost|charge|charges|surge|eta|pickup time|arrival time)\b/.test(text)) {
    return {
      answer: 'Zeshu does not have a live customer quote for that service yet, so I will not invent a fare, charge or ETA. When the service launches, Zeshu will show a real provider quote and serviceability before the customer confirms anything.',
      resolved: true,
      subject: 'Move & Travel pricing or ETA',
      handoff_reason: '',
      suggested_questions: ['What is available right now?', 'How will quotes work?', 'How does Zeshu keep bookings safe?'],
      intent: rideIntent(message) ? 'RIDES' : courierIntent(message) ? 'COURIER' : carShareIntent(message) ? 'CAR_SHARE' : 'TRAVEL',
    };
  }

  if (courierIntent(message) && /\b(weight|kg|kilogram|size|dimension|prohibited|restricted|can i send|allowed item|insurance|liability)\b/.test(text)) {
    return {
      answer: 'Direct Zeshu Courier/Cargo booking is not live yet, so final weight/size limits, prohibited-goods rules, insurance and liability must come from the verified provider shown when the service launches. The planned flow is pickup → drop → real quote → confirmation → tracking → proof of delivery.',
      resolved: true,
      subject: 'Courier rules and limits',
      handoff_reason: '',
      suggested_questions: ['Can I send a parcel now?', 'How will parcel tracking work?', 'What courier services are planned?'],
      intent: 'COURIER',
    };
  }

  if (travelIntent(message) && /\b(baggage|luggage|room policy|check in|check-in|ticket rule|fare rule)\b/.test(text)) {
    return {
      answer: 'Zeshu Travel is currently Coming Soon, so there is no live supplier booking policy to apply yet. When travel launches, the authorized provider shown at booking will supply the authoritative fare, baggage, room and ticket rules.',
      resolved: true,
      subject: 'Travel supplier policy',
      handoff_reason: '',
      suggested_questions: ['Can I book trains on Zeshu?', 'Will Zeshu have flights and hotels?', 'What is available right now?'],
      intent: 'TRAVEL',
    };
  }

  if (carShareIntent(message)) {
    return {
      answer: 'Zeshu Car Share is visible as Coming Soon, but intercity car-share booking and payment are not enabled yet. Zeshu will only launch it after the cost-sharing/legal model, driver and vehicle verification, service rules and safety controls are approved.',
      resolved: true,
      subject: 'Zeshu Car Share availability',
      handoff_reason: '',
      suggested_questions: suggestedForIntent('CAR_SHARE'),
      intent: 'CAR_SHARE',
    };
  }

  if (rideIntent(message)) {
    return {
      answer: 'Zeshu Bike Ride, Auto, Cab and Rental Car are currently Coming Soon. No live fare, driver, vehicle, ETA, booking or payment is available yet. Zeshu will only enable a ride type after the relevant licensed/authorized provider, serviceability, safety, support and compliance checks pass.',
      resolved: true,
      subject: 'Zeshu Rides availability',
      handoff_reason: '',
      suggested_questions: suggestedForIntent('RIDES'),
      intent: 'RIDES',
    };
  }

  if (courierIntent(message)) {
    return {
      answer: 'Zeshu Bike Courier, Auto / Mini Truck and Shop Delivery are currently Coming Soon for direct customer bookings. Product shipping through a marketplace courier is a separate flow and does not make on-demand parcel/cargo booking live. When launched, Zeshu will show real serviceability, quote, tracking and delivery proof before treating a job as available.',
      resolved: true,
      subject: 'Zeshu Courier availability',
      handoff_reason: '',
      suggested_questions: suggestedForIntent('COURIER'),
      intent: 'COURIER',
    };
  }

  if (travelIntent(message)) {
    return {
      answer: 'Zeshu Travel currently shows Bus, Train, Flights, Hotels and Experiences as Coming Soon. Booking and payment are not enabled yet. Zeshu will use authorized providers, and rail booking will only be offered through an authorized rail-booking partner.',
      resolved: true,
      subject: 'Zeshu Travel availability',
      handoff_reason: '',
      suggested_questions: suggestedForIntent('TRAVEL'),
      intent: 'TRAVEL',
    };
  }

  if (marketplaceIntent(message) && /invoice|gst invoice|warranty|manufacturer warranty|return.*electronics|return.*clothing|defective|serial|imei/.test(text)) {
    return {
      answer: 'For marketplace products, invoice and warranty details depend on the verified seller and product. Zeshu should show Invoice Available or Authorized Brand Partner only when the relevant evidence is verified. Wrong, damaged, defective, missing-component or materially different electronics/clothing issues should generally be reported within 7 working days, while manufacturer or seller warranty may also apply. A specific return/refund decision still needs order review.',
      resolved: true,
      subject: 'Marketplace invoice or warranty help',
      handoff_reason: '',
      suggested_questions: ['What does Verified Seller mean?', 'Can I buy electronics?', 'I need help with a specific marketplace order'],
      intent: 'MARKETPLACE',
    };
  }

  if (marketplaceIntent(message)) {
    return {
      answer: 'Zeshu Market is designed for asset-light seller fulfilment across categories such as electronics, fashion, beauty and home products. Seller trust labels are separate: Verified Seller, GST Verified, Invoice Available and Authorized Brand Partner are shown only when the relevant evidence is available. Nationwide checkout remains gated by actual seller and delivery serviceability.',
      resolved: true,
      subject: 'Marketplace help',
      handoff_reason: '',
      suggested_questions: suggestedForIntent('MARKETPLACE'),
      intent: 'MARKETPLACE',
    };
  }

  if (/which.*(?:digital|recharge|bill)|what.*(?:recharge|bill).*service|mobile recharge|dth|electricity|fastag|lpg|piped gas|water bill|broadband/.test(text)) {
    return {
      answer: 'Zeshu currently has customer surfaces for mobile recharge, DTH, electricity, FASTag, LPG/gas, water and broadband discovery. These are intended for India-wide use, but a real payment/fulfilment is available only when the specific provider integration is visibly enabled and verified. Discovery alone does not mean a bill or recharge transaction is live.',
      resolved: true,
      subject: 'Digital services availability',
      handoff_reason: '',
      suggested_questions: ['Can I use Zeshu outside Jagtial?', 'How do secure payments work?', 'I have a recharge or bill problem'],
      intent: 'DIGITAL',
    };
  }

  if (/recharge|bill|electricity|fastag|gas|water|broadband|dth/.test(text)) {
    return {
      answer: 'Recharge and bill tools are designed for India-wide use. Some services are still discovery-only, so Zeshu only treats a provider transaction as completed where the relevant fulfilment integration is explicitly enabled and verified.',
      resolved: true,
      subject: 'Recharge or bill availability',
      handoff_reason: '',
      suggested_questions: ['Which digital services are available?', 'Can I use Zeshu outside Jagtial?', 'I have a provider transaction problem'],
      intent: 'DIGITAL',
    };
  }

  if (/delivery fee|delivery charge|shipping fee|shipping charge|minimum order|min order/.test(text)) {
    return {
      answer: 'Zeshu does not promise one universal delivery or shipping fee. The customer should see the applicable delivery/shipping charge and final payable amount before confirming checkout. Fees can differ by seller, fulfilment type, distance, basket and provider; the live cart/checkout is the source of truth.',
      resolved: true,
      subject: 'Delivery fee help',
      handoff_reason: '',
      suggested_questions: ['Where does Zeshu deliver?', 'How do marketplace deliveries work?', 'How does secure checkout work?'],
      intent: 'DELIVERY',
    };
  }

  if (/coupon|promo code|promocode|discount|offer|offers|deal|cashback offer|promotion/.test(text)) {
    return {
      answer: 'Offers, sponsored promotions, coupons and Zeshu Cash benefits can change. Zeshu should show the actual eligible discount or reward before checkout; a banner or advertisement does not guarantee that every customer or product qualifies. The cart/checkout is the source of truth for the final payable amount.',
      resolved: true,
      subject: 'Offers and promotions help',
      handoff_reason: '',
      suggested_questions: ['How does Zeshu Cash work?', 'What does Sponsored mean?', 'How do secure payments work?'],
      intent: 'REWARDS',
    };
  }

  if (/verified seller|gst verified|authorized brand partner|authorised brand partner|seller verified|seller trust/.test(text)) {
    return {
      answer: 'Zeshu keeps seller trust labels separate. Verified Seller means Zeshu has completed the applicable seller verification; GST Verified means GST evidence is verified; Invoice Available means the seller supports an invoice; Authorized Brand Partner is shown only after documentary brand authorization is verified. One label does not automatically imply the others.',
      resolved: true,
      subject: 'Seller verification help',
      handoff_reason: '',
      suggested_questions: ['Do marketplace products include invoices?', 'Can I buy electronics?', 'How are nationwide products delivered?'],
      intent: 'MARKETPLACE',
    };
  }

  if (/privacy|personal data|my data|data privacy|sell.*data|share.*data/.test(text)) {
    return {
      answer: 'Use Zeshu’s Privacy Policy for the full data-handling terms. For support, never send OTPs, passwords, card numbers, CVV or UPI PIN. The assistant only uses the minimum read-only account/catalog context needed for the question, and protected account details require sign-in.',
      resolved: true,
      subject: 'Privacy and data help',
      handoff_reason: '',
      suggested_questions: ['How is my account protected?', 'What should I never share?', 'How do I contact support?'],
      intent: 'ACCOUNT',
    };
  }

  if (/whatsapp|whats app|support on whatsapp|whatsapp support/.test(text)) {
    return {
      answer: 'Zeshu WhatsApp customer support is not treated as live until the customer-facing WhatsApp toggle and verified Meta setup are enabled. Use Zeshu Help Center or the signed-in human-support conversation for current support; do not send OTPs, passwords, CVV or UPI PIN over WhatsApp.',
      resolved: true,
      subject: 'WhatsApp support availability',
      handoff_reason: '',
      suggested_questions: ['How do I contact human support?', 'What services are available?', 'How is my account protected?'],
      intent: 'GENERAL',
    };
  }

  if (/zeshu now|zeshu market|zeshu digital|what is zeshu market|what is zeshu now|what is zeshu digital/.test(text)) {
    return {
      answer: 'Zeshu Now is the fast local-commerce layer for nearby essentials where sellers and delivery are serviceable. Zeshu Market is the wider asset-light marketplace for categories such as electronics, fashion, beauty and home, using seller fulfilment rather than Zeshu owning all stock. Zeshu Digital covers recharge, bills and other digital services where the relevant provider is actually enabled.',
      resolved: true,
      subject: 'Zeshu service model',
      handoff_reason: '',
      suggested_questions: ['What services are available right now?', 'Can I buy electronics?', 'Which recharge and bill services are available?'],
      intent: 'GENERAL',
    };
  }

  if (/payment|checkout|upi|card/.test(text)) {
    return {
      answer: 'Zeshu verifies the final total, stock and payment result on the server before confirming an order. Never share an OTP, card CVV or UPI PIN with Zeshu support. If money was debited but the order is not confirmed, do not pay again—ask me to transfer the payment issue.',
      resolved: true,
      subject: 'Secure checkout help',
      handoff_reason: '',
      suggested_questions: suggestedForIntent('PAYMENT'),
      intent: 'PAYMENT',
    };
  }

  if (/location|address|delivery area|serviceable|jagtial/.test(text)) {
    return {
      answer: 'Physical delivery is limited to the supported Jagtial delivery zone. Set your delivery pin at the entrance and Zeshu checks the coordinates before physical checkout. Digital services can still be used across India where the relevant service is available.',
      resolved: true,
      subject: 'Delivery location help',
      handoff_reason: '',
      suggested_questions: suggestedForIntent('DELIVERY'),
      intent: 'DELIVERY',
    };
  }

  if (/otp|login|sign in|signin/.test(text)) {
    return {
      answer: 'Enter your mobile number and request an OTP. On supported Android/browser environments, Zeshu can securely auto-fill the OTP without reading your SMS inbox. Never send the OTP to support or type it into chat.',
      resolved: true,
      subject: 'Login help',
      handoff_reason: '',
      suggested_questions: ['OTP did not arrive', 'How is my account protected?', 'How do I update my saved address?'],
      intent: 'ACCOUNT',
    };
  }

  if (/invite|share app|referral code/.test(text)) {
    return {
      answer: 'Open My Account → Invite & Earn to copy or share your invite code and Zeshu app link. On supported phones you can choose one contact; Zeshu does not upload your full phonebook.',
      resolved: true,
      subject: 'Invite and referral help',
      handoff_reason: '',
      suggested_questions: suggestedForIntent('REWARDS'),
      intent: 'REFERRAL',
    };
  }

  if (/install.*(?:app|zeshu)|download.*(?:app|zeshu)|get zeshu|add to home screen|android app|pwa/.test(text)) {
    return {
      answer: 'Open Get Zeshu from the website to install the current Zeshu app/PWA experience on a supported device. Use the official Zeshu install path shown there rather than downloading APK files from unknown sources.',
      resolved: true,
      subject: 'Install Zeshu help',
      handoff_reason: '',
      suggested_questions: ['How do I sign in?', 'What services are available?', 'How do I set my delivery address?'],
      intent: 'ACCOUNT',
    };
  }

  if (/language|telugu|hindi|urdu|english|change.*language/.test(text)) {
    return {
      answer: 'Use the language switcher on supported Zeshu pages to choose English, Telugu, Hindi or Urdu. Urdu uses right-to-left layout where supported. If any customer-facing text does not translate, report that page to Zeshu Support.',
      resolved: true,
      subject: 'Language help',
      handoff_reason: '',
      suggested_questions: ['How do I install Zeshu?', 'How do I sign in?', 'Contact Zeshu Support'],
      intent: 'ACCOUNT',
    };
  }

  if (/support hours|customer care|contact support|help center|how.*contact.*support|need support/.test(text)) {
    return {
      answer: signedIn
        ? 'You can use Zeshu Help Center for instant guided/AI help and open a private human-support conversation for any Zeshu service when a person is needed. Safety, payment, refund, provider-dispute and protected account cases are prioritized for human review.'
        : 'You can use Zeshu Help Center for general questions without signing in. Sign in to open a private human-support conversation for an order, payment, ride, courier, travel, marketplace, recharge/bill, account or safety issue.',
      resolved: true,
      subject: 'Customer support help',
      handoff_reason: '',
      suggested_questions: ['I want to talk to a person', 'What services are available?', 'How do refunds work?'],
      intent: 'GENERAL',
    };
  }

  return {
    answer: 'I can help with orders, products, marketplace sellers, Zeshu Cash, delivery, payments, refunds policy, recharge/bills, Bike/Auto/Cab, courier/cargo, Car Share, travel, referrals and account help. Tell me what you are trying to do, or choose one of the suggestions below.',
    resolved: true,
    subject: 'Zeshu Assistant help',
    handoff_reason: '',
    suggested_questions: suggestedForIntent('GENERAL'),
    intent: 'GENERAL',
  };
};

const parseStructuredResponse = (payload: any): AssistantResult | null => {
  const outputText = typeof payload?.output_text === 'string'
    ? payload.output_text.trim()
    : Array.isArray(payload?.output)
      ? payload.output.flatMap((item: any) => Array.isArray(item?.content) ? item.content : []).find((part: any) => part?.type === 'output_text')?.text?.trim() || ''
      : '';
  if (!outputText) return null;
  try {
    const parsed = JSON.parse(outputText);
    if (typeof parsed?.answer !== 'string' || typeof parsed?.resolved !== 'boolean') return null;
    const suggestions = Array.isArray(parsed?.suggested_questions)
      ? parsed.suggested_questions.filter((item: unknown) => typeof item === 'string' && item.trim()).slice(0, 3).map((item: string) => item.trim().slice(0, 120))
      : [];
    return {
      answer: parsed.answer.trim().slice(0, 4000),
      resolved: parsed.resolved,
      subject: typeof parsed.subject === 'string' && parsed.subject.trim() ? parsed.subject.trim().slice(0, 160) : 'Zeshu Assistant handoff',
      handoff_reason: typeof parsed.handoff_reason === 'string' ? parsed.handoff_reason.trim().slice(0, 500) : '',
      suggested_questions: suggestions,
      intent: typeof parsed.intent === 'string' ? parsed.intent.trim().slice(0, 40) : 'GENERAL',
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
  const [{ url, serviceRoleKey }, aiFlag, apiKey] = await Promise.all([
    getRuntimeSupabaseEnv(),
    getRuntimeEnvValue('SUPPORT_AI_ENABLED'),
    getRuntimeEnvValue('OPENAI_API_KEY'),
  ]);
  const aiEnabled = aiFlag === 'true' && Boolean(apiKey);
  const handoffConfigured = Boolean(url && serviceRoleKey);
  return NextResponse.json({
    mode: aiEnabled ? 'ai' : 'guided',
    automatic_handoff: handoffConfigured,
    capabilities: ['public_general_help', 'live_order_status', 'reward_context', 'catalog_search', 'marketplace_help', 'pharmacy_help', 'rides_help', 'courier_help', 'car_share_help', 'travel_help', 'digital_services_help', 'delivery_address_help', 'referral_help', 'account_safety_help', 'move_service_readiness', 'policy_help', 'service_specific_handoff', 'automatic_handoff'],
  });
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  const { url: supabaseUrl, anonKey, serviceRoleKey } = await getRuntimeSupabaseEnv();
  const token = getBearer(request);
  let userId: string | null = null;

  if (token) {
    if (!supabaseUrl || !anonKey) return NextResponse.json({ error: 'Account support is temporarily unavailable.' }, { status: 503 });
    const authClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const { data: authData } = await authClient.auth.getUser(token);
    if (!authData.user) return NextResponse.json({ error: 'Your session is no longer valid. Please sign in again.' }, { status: 401 });
    userId = authData.user.id;
  }

  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('cf-connecting-ip')?.trim()
    || 'guest';
  const limited = rateLimitResponse(userId || `guest:${forwarded}`, 'support-assistant');
  if (limited) return limited;

  const body = await request.json().catch(() => ({}));
  const rawMessage = typeof body?.message === 'string' ? body.message.trim() : '';
  const history = sanitizeHistory(body?.history);
  if (!rawMessage || rawMessage.length > MAX_MESSAGE_LENGTH) return NextResponse.json({ error: 'Enter a shorter support question.' }, { status: 400 });

  if (containsLikelySecret(rawMessage)) {
    return NextResponse.json({
      answer: 'For your security, please remove any OTP, password, card number, CVV or UPI PIN from the message and ask again. Zeshu Support will never need those secrets.',
      resolved: true,
      source: 'guided',
      intent: 'SECURITY',
      suggested_questions: ['OTP did not arrive', 'Money was debited but no order', 'How is my account protected?'],
      context_used: [],
      latency_ms: Date.now() - startedAt,
      handoff_reason: '',
      handoff: { requested: false, created: false, conversation: null },
    });
  }

  const message = redactSensitive(rawMessage);
  const service = supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } })
    : null;
  const moveServiceIntent = rideIntent(message) || courierIntent(message) || carShareIntent(message) || travelIntent(message);
  const liveContext: LiveAssistantContext = service
    ? await loadLiveAssistantContext({ service, userId, message }).catch(() => (
        moveServiceIntent ? { move_services: getMoveServiceReadiness() } : {} as LiveAssistantContext
      ))
    : moveServiceIntent
      ? { move_services: getMoveServiceReadiness() }
      : {};

  const guidedResult = fallbackAnswer(message, liveContext, Boolean(userId));
  let result = guidedResult;
  let source: 'ai' | 'guided' = 'guided';

  const [apiKey, aiFlag] = await Promise.all([
    getRuntimeEnvValue('OPENAI_API_KEY'),
    getRuntimeEnvValue('SUPPORT_AI_ENABLED'),
  ]);
  const aiEnabled = aiFlag === 'true' && Boolean(apiKey);
  // Deterministic Zeshu rules own protected cases. The language model may improve
  // safe informational answers, but it cannot turn a payment/refund/safety/provider
  // dispute, protected account change, or explicit human request into self-service.
  if (aiEnabled && guidedResult.resolved) {
    try {
      const conversationInput = history.map((turn) => ({
        role: turn.role === 'CUSTOMER' ? 'user' : 'assistant',
        content: [{ type: 'input_text', text: turn.body }],
      }));
      conversationInput.push({ role: 'user', content: [{ type: 'input_text', text: message }] });

      const liveContextText = Object.keys(liveContext).length
        ? JSON.stringify(liveContext)
        : '{"note":"No live account/catalog context was needed or available for this question."}';

      const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: (await getRuntimeEnvValue('SUPPORT_AI_MODEL')) || 'gpt-5.6-luna',
          store: false,
          max_output_tokens: 600,
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
                  suggested_questions: { type: 'array', items: { type: 'string' }, maxItems: 3 },
                  intent: { type: 'string' },
                },
                required: ['answer', 'resolved', 'subject', 'handoff_reason', 'suggested_questions', 'intent'],
              },
            },
          },
          input: [
            {
              role: 'system',
              content: [{
                type: 'input_text',
                text: `You are Zeshu Assistant, a smart customer concierge for an Indian local-commerce service.

GOAL:
Resolve as many customer questions as possible accurately, quickly and in plain language. Be useful before escalating.

GROUNDING:
- ZESHU KNOWLEDGE below is the source of truth for policies, feature availability and business rules.
- LIVE CONTEXT below is fresh read-only Zeshu data for this signed-in customer or current catalog when relevant.
- Never invent an order, balance, product, price, stock state, delivery promise, provider status, refund or payment result.
- If live context conflicts with a general statement, prefer the live context for that customer's read-only facts while preserving the policy rules.
- Catalog stock and price can change; remind the customer that cart/checkout performs the final check when relevant.

WHEN TO RESOLVE WITHOUT A HUMAN:
- Read-only questions about recent order status, order totals, current catalog/stock/price, Zeshu Cash/reward activity, delivery/service-area rules, login/OTP help, referrals, policies, app navigation, feature availability and how-to questions can be answered directly when context supports them.
- If a question is vague but safe, ask ONE concise clarifying question and keep resolved=true instead of transferring immediately.

WHEN TO TRANSFER:
Set resolved=false only when a human or protected transaction review is actually required: a refund/replacement/cancellation decision, specific debit or disputed payment reconciliation, missing/wrong/damaged/spoiled-item claim, provider transaction dispute, account change that the assistant cannot perform, safety issue, explicit request for a human, or repeated failure of prior help.
When resolved=false, say clearly that it is being transferred and why. Do not make the customer repeat the issue.

SAFETY:
Never request or repeat OTPs, passwords, card numbers, CVV, UPI PIN, API keys, access tokens or secrets. Never claim a payment, refund, recharge, cancellation, order change, cashback adjustment, delivery change or account change was completed unless the live context explicitly proves a read-only completed state and no action is being taken now.

STYLE:
- Start with the direct answer.
- Use short paragraphs; bullets only when they genuinely help.
- Avoid corporate jargon and unnecessary warnings.
- If the customer asks in Hinglish, reply in natural Hinglish; otherwise match their language.
- Give at most 3 useful suggested follow-up questions.

ZESHU KNOWLEDGE:
${ZESHU_SUPPORT_KNOWLEDGE}

CUSTOMER AUTH:
${userId ? 'SIGNED_IN' : 'GUEST'}

- For a GUEST, answer public policy, availability, navigation and service questions normally.
- For a GUEST asking for private order status, Zeshu Cash balance/history, payment references or protected account data, explain that sign-in is required. Do not invent private data.
- A human support conversation can only be created for a signed-in customer.

LIVE CONTEXT:
${liveContextText}`,
              }],
            },
            ...conversationInput,
          ],
        }),
        signal: AbortSignal.timeout(12000),
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
  if (!result.resolved && userId && supabaseUrl && serviceRoleKey) {
    conversation = await createAutomaticHandoff({
      supabaseUrl,
      serviceRoleKey,
      userId,
      question: message,
      answer: result.answer,
      subject: buildCategorizedSupportSubject(result.intent, message, result.subject),
    });
  }

  const contextUsed = [
    liveContext.recent_orders ? 'orders' : null,
    typeof liveContext.reward_balance === 'number' ? 'rewards' : null,
    liveContext.catalog_matches ? 'catalog' : null,
    liveContext.move_services ? 'move_services' : null,
  ].filter(Boolean);

  return NextResponse.json({
    answer: result.answer,
    resolved: result.resolved,
    source,
    intent: result.intent,
    support_category: classifySupportCategory(result.intent, message),
    suggested_questions: result.suggested_questions,
    context_used: contextUsed,
    latency_ms: Date.now() - startedAt,
    handoff_reason: result.handoff_reason,
    signed_in: Boolean(userId),
    handoff: {
      requested: !result.resolved,
      created: Boolean(conversation),
      conversation,
    },
  });
}
