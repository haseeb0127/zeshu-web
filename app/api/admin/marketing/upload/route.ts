import { NextResponse } from 'next/server';
import { requireMarketingAdmin } from '@/app/lib/marketing-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);
const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(request: Request) {
  const { context, response } = await requireMarketingAdmin(request);
  if (response || !context) return response!;

  const form = await request.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'Choose an image to upload.' }, { status: 400 });
  if (!ALLOWED_TYPES.has(file.type)) return NextResponse.json({ error: 'Use JPEG, PNG, WebP or AVIF artwork.' }, { status: 400 });
  if (file.size <= 0 || file.size > MAX_BYTES) return NextResponse.json({ error: 'Artwork must be 5 MB or smaller.' }, { status: 400 });

  const extension = file.type === 'image/jpeg' ? 'jpg' : file.type.split('/')[1];
  const path = `campaigns/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${extension}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error } = await context.service.storage.from('marketing-assets').upload(path, bytes, {
    contentType: file.type,
    cacheControl: '3600',
    upsert: false,
  });
  if (error) {
    console.error('Marketing artwork upload failed:', error);
    return NextResponse.json({ error: 'Artwork upload failed.' }, { status: 503 });
  }

  const { data } = context.service.storage.from('marketing-assets').getPublicUrl(path);
  return NextResponse.json({ path, url: data.publicUrl });
}
