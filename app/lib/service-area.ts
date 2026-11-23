import 'server-only';

import fs from 'node:fs';
import path from 'node:path';

export type ServiceAreaResult = 'ELIGIBLE' | 'OUTSIDE_SERVICE_AREA' | 'SERVICE_AREA_UNAVAILABLE' | 'SERVICE_AREA_ENFORCEMENT_DISABLED';

// Physical delivery is a Jagtial-only business rule in production.
// Local development can still opt out explicitly for isolated UI work.
export const isJagtialServiceAreaEnforced = () =>
  process.env.NODE_ENV === 'production'
  || process.env.ENFORCE_JAGTIAL_SERVICE_AREA?.trim().toLowerCase() !== 'false';

const JAGTIAL_FALLBACK_CENTER = { latitude: 18.80, longitude: 78.93 };
const JAGTIAL_FALLBACK_RADIUS_KM = 6;

const distanceKm = (latitude: number, longitude: number, targetLatitude: number, targetLongitude: number) => {
  const toRadians = (value: number) => value * Math.PI / 180;
  const earthRadiusKm = 6371;
  const deltaLatitude = toRadians(targetLatitude - latitude);
  const deltaLongitude = toRadians(targetLongitude - longitude);
  const lat1 = toRadians(latitude);
  const lat2 = toRadians(targetLatitude);
  const a = Math.sin(deltaLatitude / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLongitude / 2) ** 2;
  return 2 * earthRadiusKm * Math.asin(Math.min(1, Math.sqrt(a)));
};

type Position = [number, number];
type Ring = Position[];
type PolygonGeometry = { type: 'Polygon'; coordinates: Ring[] } | { type: 'MultiPolygon'; coordinates: Ring[][] };
let cachedGeometry: PolygonGeometry | null | undefined;

const validPosition = (position: unknown): position is Position => {
  if (!Array.isArray(position) || position.length < 2) return false;
  const longitude = Number(position[0]);
  const latitude = Number(position[1]);
  return Number.isFinite(longitude) && longitude >= -180 && longitude <= 180
    && Number.isFinite(latitude) && latitude >= -90 && latitude <= 90;
};

const validRing = (ring: unknown): ring is Ring => Array.isArray(ring)
  && ring.length >= 4
  && ring.every(validPosition)
  && ring[0][0] === ring[ring.length - 1][0]
  && ring[0][1] === ring[ring.length - 1][1];

const loadStaticGeometry = (): PolygonGeometry | null => {
  if (cachedGeometry !== undefined) return cachedGeometry;
  try {
    const filePath = path.join(process.cwd(), 'app', 'config', 'service-areas', 'jagtial.geojson');
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8')) as { type?: string; geometry?: unknown };
    const geometry = (parsed.type === 'Feature' ? parsed.geometry : parsed) as { type?: string; coordinates?: unknown };
    if (geometry?.type === 'Polygon' && Array.isArray(geometry.coordinates) && geometry.coordinates.every(validRing)) {
      cachedGeometry = { type: 'Polygon', coordinates: geometry.coordinates as Ring[] };
    } else if (geometry?.type === 'MultiPolygon' && Array.isArray(geometry.coordinates)
      && geometry.coordinates.every((polygon) => Array.isArray(polygon) && polygon.every(validRing))) {
      cachedGeometry = { type: 'MultiPolygon', coordinates: geometry.coordinates as Ring[][] };
    } else {
      cachedGeometry = null;
    }
  } catch {
    cachedGeometry = null;
  }
  return cachedGeometry;
};

const pointInRing = (longitude: number, latitude: number, ring: Ring) => {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersects = ((yi > latitude) !== (yj > latitude))
      && longitude < ((xj - xi) * (latitude - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
};

const pointInPolygon = (longitude: number, latitude: number, polygon: Ring[]) => {
  if (!pointInRing(longitude, latitude, polygon[0])) return false;
  return !polygon.slice(1).some((hole) => pointInRing(longitude, latitude, hole));
};

export const evaluateJagtialServiceArea = (latitude: number, longitude: number): ServiceAreaResult => {
  if (!isJagtialServiceAreaEnforced()) return 'SERVICE_AREA_ENFORCEMENT_DISABLED';
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    return 'SERVICE_AREA_UNAVAILABLE';
  }
  const geometry = loadStaticGeometry();
  if (geometry) {
    const eligible = geometry.type === 'Polygon'
      ? pointInPolygon(longitude, latitude, geometry.coordinates)
      : geometry.coordinates.some((polygon) => pointInPolygon(longitude, latitude, polygon));
    return eligible ? 'ELIGIBLE' : 'OUTSIDE_SERVICE_AREA';
  }

  // The committed municipality polygon is preferred. Until it is available,
  // use a conservative Jagtial-city radius so production never becomes
  // nationwide merely because a boundary file is missing.
  const fallbackDistanceKm = distanceKm(
    latitude,
    longitude,
    JAGTIAL_FALLBACK_CENTER.latitude,
    JAGTIAL_FALLBACK_CENTER.longitude,
  );
  return fallbackDistanceKm <= JAGTIAL_FALLBACK_RADIUS_KM ? 'ELIGIBLE' : 'OUTSIDE_SERVICE_AREA';
};

export const isWithinConfiguredJagtialServiceArea = (latitude: number, longitude: number) =>
  evaluateJagtialServiceArea(latitude, longitude) === 'ELIGIBLE';
