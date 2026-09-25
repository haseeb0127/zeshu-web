export type MoveAreaResult = 'ELIGIBLE' | 'OUTSIDE_TELANGANA' | 'UNAVAILABLE';

const TELANGANA_BOUNDS = {
  south: 15.75,
  north: 19.95,
  west: 77.15,
  east: 81.10,
};

const TELANGANA_NAMES = new Set([
  'telangana',
  'telengana',
  'telangana state',
  'ts',
]);

export function normalizeMoveState(value: unknown) {
  return String(value || '').trim().toLowerCase();
}

export function evaluateTelanganaMoveArea(latitude: number, longitude: number, state?: unknown): MoveAreaResult {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)
    || latitude < -90 || latitude > 90
    || longitude < -180 || longitude > 180) return 'UNAVAILABLE';

  const normalizedState = normalizeMoveState(state);
  if (normalizedState && !TELANGANA_NAMES.has(normalizedState)) return 'OUTSIDE_TELANGANA';

  const inBounds = latitude >= TELANGANA_BOUNDS.south
    && latitude <= TELANGANA_BOUNDS.north
    && longitude >= TELANGANA_BOUNDS.west
    && longitude <= TELANGANA_BOUNDS.east;

  return inBounds ? 'ELIGIBLE' : 'OUTSIDE_TELANGANA';
}

export const telanganaMoveBounds = TELANGANA_BOUNDS;
