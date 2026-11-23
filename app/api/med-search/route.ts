import { NextResponse } from 'next/server';
import { authenticateProviderRequest, authRequiredResponse, rateLimitResponse } from '@/app/lib/provider-security';

export async function GET(request: Request) {
  const user = await authenticateProviderRequest(request);
  if (!user) return authRequiredResponse();
  const limited = rateLimitResponse(user.id, 'med-search');
  if (limited) return limited;
  const query = new URL(request.url).searchParams.get('q')?.trim();
  if (!query || query.length > 100) return NextResponse.json({ success: false, message: 'Search query required' }, { status: 400 });
  return NextResponse.json({ success: false, message: 'Local pharmacy search is unavailable until a verified inventory partner is connected.' }, { status: 503 });
}
