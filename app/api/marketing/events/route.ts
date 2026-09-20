import { NextResponse } from 'next/server';
import { getMarketingServiceClient } from '@/app/lib/marketing-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const buckets = new Map<string, { startedAt: number; count: number }>();
const WINDOW_MS = 60_000;
const MAX_EVENTS = 60;

const limited = (key: string) => {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now - bucket.startedAt >= WINDOW_MS) {
    buckets.set(key, { startedAt: now, count: 1 });
    return false;
  }
  if (bucket.count >= MAX_EVENTS) return true;
  bucket.count += 1;
  return false;
};

export async function POST(request: Request) {
  const service = getMarketingServiceClient();
  if (!service) return NextResponse.json({ success: false }, { status: 503 });
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const campaignId = String(body.campaign_id || '').trim();
  const eventType = String(body.event_type || '').trim().toUpperCase();
  if (!campaignId || (eventType !== 'VIEW' && eventType !== 'CLICK')) {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  const clientKey = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (limited(`${clientKey}:${campaignId}`)) return NextResponse.json({ success: true });

  const now = new Date().toISOString();
  const { data: campaign, error } = await service
    .from('marketing_campaigns')
    .select('id')
    .eq('id', campaignId)
    .eq('status', 'PUBLISHED')
    .lte('starts_at', now)
    .gte('ends_at', now)
    .maybeSingle();
  if (error || !campaign) return NextResponse.json({ success: false }, { status: 404 });

  const { error: insertError } = await service.from('marketing_campaign_events').insert({
    campaign_id: campaignId,
    event_type: eventType,
  });
  if (insertError) {
    console.error('Marketing event insert failed:', insertError);
    return NextResponse.json({ success: false }, { status: 503 });
  }
  return NextResponse.json({ success: true }, { status: 201 });
}
