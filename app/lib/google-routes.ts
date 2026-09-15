import 'server-only';

type Coordinates = { latitude: number; longitude: number };
export type RouteEta = { durationSeconds: number; distanceMeters: number; calculatedAt: string; source: 'google_routes' };
const CACHE_TTL_MS = 60_000;
const MAX_CACHE_ENTRIES = 256;
const etaCache = new Map<string, { expiresAt: number; value: RouteEta }>();

function validCoordinate(value: number, min: number, max: number) { return Number.isFinite(value) && value >= min && value <= max; }

export async function getGoogleRoutesEta(origin: Coordinates, destination: Coordinates): Promise<RouteEta | null> {
  const key = process.env.GOOGLE_MAPS_ROUTES_API_KEY;
  if (!key || !validCoordinate(origin.latitude, -90, 90) || !validCoordinate(origin.longitude, -180, 180) || !validCoordinate(destination.latitude, -90, 90) || !validCoordinate(destination.longitude, -180, 180)) return null;
  const cacheKey = [origin.latitude, origin.longitude, destination.latitude, destination.longitude].map((value) => value.toFixed(4)).join(':');
  const cached = etaCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  if (cached) etaCache.delete(cacheKey);
  try {
    const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters' },
      body: JSON.stringify({ origin: { location: { latLng: { latitude: origin.latitude, longitude: origin.longitude } } }, destination: { location: { latLng: { latitude: destination.latitude, longitude: destination.longitude } } }, travelMode: 'DRIVE', routingPreference: 'TRAFFIC_AWARE' }),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return null;
    const route = (await response.json())?.routes?.[0];
    const seconds = Number.parseInt(String(route?.duration || '').replace(/s$/, ''), 10);
    const meters = Number(route?.distanceMeters);
    if (!Number.isFinite(seconds) || !Number.isFinite(meters)) return null;
    const value = { durationSeconds: seconds, distanceMeters: meters, calculatedAt: new Date().toISOString(), source: 'google_routes' as const };
    etaCache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, value });
    while (etaCache.size > MAX_CACHE_ENTRIES) etaCache.delete(etaCache.keys().next().value as string);
    return value;
  } catch { return null; }
}
