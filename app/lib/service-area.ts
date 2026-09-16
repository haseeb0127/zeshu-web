import 'server-only';

import fs from 'node:fs';
import path from 'node:path';

export type ServiceAreaResult = 'ELIGIBLE' | 'OUTSIDE_SERVICE_AREA' | 'SERVICE_AREA_UNAVAILABLE' | 'SERVICE_AREA_ENFORCEMENT_DISABLED';

// This is intentionally server-only.  The polygon gate is opt-in so that a
// missing government boundary file cannot accidentally take checkout down.
export const isJagtialServiceAreaEnforced = () =>
  process.env.ENFORCE_JAGTIAL_SERVICE_AREA?.trim().toLowerCase() === 'true';

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
  return 'SERVICE_AREA_UNAVAILABLE';
};

export const isWithinConfiguredJagtialServiceArea = (latitude: number, longitude: number) =>
  evaluateJagtialServiceArea(latitude, longitude) === 'ELIGIBLE';
