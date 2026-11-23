import { NextResponse } from 'next/server';
import { fetchPipedGasOperators } from '@/app/lib/planapi';
import { authenticateProviderRequest, authRequiredResponse, rateLimitResponse } from '@/app/lib/provider-security';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) { const user = await authenticateProviderRequest(request); if (!user) return authRequiredResponse(); const limited = rateLimitResponse(user.id, 'piped-gas-operators'); if (limited) return limited; try { return NextResponse.json({ operators: await fetchPipedGasOperators() }); } catch { return NextResponse.json({ error: 'Piped Gas providers are temporarily unavailable.' }, { status: 503 }); } }
