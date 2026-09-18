import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { runSupportWhatsappSender } from '@/app/lib/support-whatsapp-sender';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (typeof secret !== 'string' || !secret.trim()) return false;
  const supplied = request.headers.get('authorization');
  const expected = `Bearer ${secret}`;
  if (!supplied) return false;
  const suppliedBytes = Buffer.from(supplied);
  const expectedBytes = Buffer.from(expected);
  return suppliedBytes.length === expectedBytes.length && timingSafeEqual(suppliedBytes, expectedBytes);
}

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ ok: false }, { status: 401 });
  const result = await runSupportWhatsappSender();
  return NextResponse.json(result, { status: result.ok ? 200 : 503 });
}
