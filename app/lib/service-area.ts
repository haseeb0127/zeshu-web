import 'server-only';

type ServiceAreaConfig = {
  centerLatitude: number;
  centerLongitude: number;
  radiusKm: number;
};

const finiteCoordinate = (value: string | undefined, min: number, max: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= min && parsed <= max ? parsed : null;
};

/**
 * Returns the configured Jagtial service area only when all three server-side
 * values are present and valid. Missing configuration deliberately means that
 * coordinate-based eligibility is unavailable rather than broadly enabled.
 */
export const getJagtialServiceAreaConfig = (): ServiceAreaConfig | null => {
  const centerLatitude = finiteCoordinate(process.env.JAGTIAL_SERVICE_CENTER_LAT, -90, 90);
  const centerLongitude = finiteCoordinate(process.env.JAGTIAL_SERVICE_CENTER_LNG, -180, 180);
  const radiusKm = Number(process.env.JAGTIAL_SERVICE_RADIUS_KM);
  if (centerLatitude === null || centerLongitude === null || !Number.isFinite(radiusKm) || radiusKm <= 0) return null;
  return { centerLatitude, centerLongitude, radiusKm };
};

export const isWithinConfiguredJagtialServiceArea = (latitude: number, longitude: number) => {
  const config = getJagtialServiceAreaConfig();
  if (!config || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return false;
  const toRadians = (degrees: number) => degrees * Math.PI / 180;
  const dLat = toRadians(latitude - config.centerLatitude);
  const dLng = toRadians(longitude - config.centerLongitude);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRadians(config.centerLatitude)) * Math.cos(toRadians(latitude)) * Math.sin(dLng / 2) ** 2;
  const distanceKm = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return distanceKm <= config.radiusKm;
};
