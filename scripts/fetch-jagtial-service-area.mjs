#!/usr/bin/env node

import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const layerUrl = 'https://tgrac.telangana.gov.in/arcgis/rest/services/AdministrativeInfoSystem_Folder/Administrative_Information_System/MapServer/22/query';
const wardLayerUrl = 'https://tgrac.telangana.gov.in/arcgis/rest/services/GovtHospitals_Folder/Health_Facilities_Mapping/MapServer/51/query';
const outputPath = path.join(process.cwd(), 'app', 'config', 'service-areas', 'jagtial.geojson');
const names = ['jagtial', 'jagityal', 'jagitial'];

const closeRing = (ring) => {
  const normalized = ring.map(([x, y]) => [Number(x), Number(y)]);
  const first = normalized[0];
  const last = normalized[normalized.length - 1];
  if (!last || first[0] !== last[0] || first[1] !== last[1]) normalized.push([...first]);
  return normalized;
};

const signedArea = (ring) => ring.reduce((sum, point, index) => {
  const next = ring[(index + 1) % ring.length];
  return sum + point[0] * next[1] - next[0] * point[1];
}, 0) / 2;

const pointInRing = ([longitude, latitude], ring) => {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (((yi > latitude) !== (yj > latitude)) && longitude < ((xj - xi) * (latitude - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};

const areaSqKm = (rings) => {
  const flattened = rings.flat();
  const latitude = flattened.reduce((sum, point) => sum + point[1], 0) / flattened.length;
  return Math.abs(rings.reduce((sum, ring) => sum + signedArea(ring), 0)) * 111.32 ** 2 * Math.cos(latitude * Math.PI / 180);
};

// EPSG:32644 is WGS84 / UTM zone 44N. This conversion is used only when the
// declared input CRS explicitly says 32644; unknown CRS values are rejected.
const utm44ToWgs84 = ([easting, northing]) => {
  const a = 6378137;
  const eccSquared = 0.00669438;
  const k0 = 0.9996;
  const x = Number(easting) - 500000;
  const y = Number(northing);
  const eccPrimeSquared = eccSquared / (1 - eccSquared);
  const e1 = (1 - Math.sqrt(1 - eccSquared)) / (1 + Math.sqrt(1 - eccSquared));
  const M = y / k0;
  const mu = M / (a * (1 - eccSquared / 4 - 3 * eccSquared ** 2 / 64 - 5 * eccSquared ** 3 / 256));
  const phi1 = mu + (3 * e1 / 2 - 27 * e1 ** 3 / 32) * Math.sin(2 * mu)
    + (21 * e1 ** 2 / 16 - 55 * e1 ** 4 / 32) * Math.sin(4 * mu)
    + (151 * e1 ** 3 / 96) * Math.sin(6 * mu)
    + (1097 * e1 ** 4 / 512) * Math.sin(8 * mu);
  const N1 = a / Math.sqrt(1 - eccSquared * Math.sin(phi1) ** 2);
  const R1 = a * (1 - eccSquared) / (1 - eccSquared * Math.sin(phi1) ** 2) ** 1.5;
  const T1 = Math.tan(phi1) ** 2;
  const C1 = eccPrimeSquared * Math.cos(phi1) ** 2;
  const D = x / (N1 * k0);
  const latitude = phi1 - (N1 * Math.tan(phi1) / R1) * (D ** 2 / 2 - (5 + 3 * T1 + 10 * C1 - 4 * C1 ** 2 - 9 * eccPrimeSquared) * D ** 4 / 24 + (61 + 90 * T1 + 298 * C1 + 45 * T1 ** 2 - 252 * eccPrimeSquared - 3 * C1 ** 2) * D ** 6 / 720);
  const longitude = (87 * Math.PI / 180) + (D - (1 + 2 * T1 + C1) * D ** 3 / 6 + (5 - 2 * C1 + 28 * T1 - 3 * C1 ** 2 + 8 * eccPrimeSquared + 24 * T1 ** 2) * D ** 5 / 120) / Math.cos(phi1);
  return [longitude * 180 / Math.PI, latitude * 180 / Math.PI];
};

const convertCoordinates = (coordinates, wkid) => {
  if (wkid === 4326 || wkid === undefined || wkid === null) return coordinates;
  if (wkid !== 32644) throw new Error(`Unsupported declared spatial reference EPSG:${wkid}`);
  if (Array.isArray(coordinates) && coordinates.length >= 2 && typeof coordinates[0] === 'number') return utm44ToWgs84(coordinates);
  return coordinates.map((child) => convertCoordinates(child, wkid));
};

const declaredWkid = (value) => {
  const wkid = value?.spatialReference?.latestWkid ?? value?.spatialReference?.wkid;
  if (wkid !== undefined) return Number(wkid);
  const name = String(value?.crs?.properties?.name || value?.crs?.properties?.href || '').toUpperCase();
  if (name.includes('32644')) return 32644;
  if (name.includes('4326') || !name) return 4326;
  return Number.NaN;
};

const validateRings = (rings) => {
  if (!Array.isArray(rings) || rings.length === 0 || rings.length > 10000) throw new Error('Boundary has no sensible polygon rings');
  const closed = rings.map(closeRing);
  if (closed.some((ring) => ring.length < 4 || ring.length > 100000 || ring.some(([longitude, latitude]) => !Number.isFinite(longitude) || !Number.isFinite(latitude) || longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90))) throw new Error('Boundary contains invalid coordinates or rings');
  return closed;
};

const ringsToGeometry = (rings) => {
  const largestRing = rings.slice().sort((a, b) => Math.abs(signedArea(b)) - Math.abs(signedArea(a)))[0];
  const outerSign = Math.sign(signedArea(largestRing));
  const outers = rings.filter((ring) => Math.sign(signedArea(ring)) === outerSign);
  const holes = rings.filter((ring) => Math.sign(signedArea(ring)) !== outerSign);
  const polygons = outers.map((outer) => [outer, ...holes.filter((hole) => pointInRing(hole[0], outer))]);
  return { type: polygons.length === 1 ? 'Polygon' : 'MultiPolygon', coordinates: polygons.length === 1 ? polygons[0] : polygons };
};

const dissolveOuterRings = (geometries) => {
  const edges = new Map();
  const key = (point) => `${point[0].toFixed(8)},${point[1].toFixed(8)}`;
  const addRing = (ring) => {
    for (let index = 0; index < ring.length - 1; index += 1) {
      const from = ring[index];
      const to = ring[index + 1];
      const forward = `${key(from)}>${key(to)}`;
      const reverse = `${key(to)}>${key(from)}`;
      if (edges.has(reverse)) edges.delete(reverse);
      else edges.set(forward, { from, to });
    }
  };
  geometries.forEach((geometry) => {
    const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
    polygons.forEach((polygon) => addRing(polygon[0]));
  });
  const dissolved = [];
  while (edges.size) {
    const first = edges.entries().next().value[1];
    const ring = [first.from, first.to];
    edges.delete(`${key(first.from)}>${key(first.to)}`);
    let current = first.to;
    while (key(current) !== key(ring[0])) {
      const nextEntry = Array.from(edges.entries()).find(([, edge]) => key(edge.from) === key(current));
      if (!nextEntry) throw new Error('Ward boundaries could not be safely dissolved');
      const [entryKey, edge] = nextEntry;
      edges.delete(entryKey);
      ring.push(edge.to);
      current = edge.to;
      if (ring.length > 100000) throw new Error('Dissolved ward boundary is too complex');
    }
    dissolved.push(ring);
  }
  return ringsToGeometry(dissolved);
};

const featureLabel = (feature) => String(feature?.attributes?.ULB_Name || feature?.properties?.ULB_Name || feature?.properties?.name || '').trim();
const featureCategory = (feature) => String(feature?.attributes?.Category || feature?.attributes?.Type || feature?.properties?.category || feature?.properties?.type || 'Urban Local Body').trim();
const isJagtialMunicipality = (feature) => {
  const label = featureLabel(feature).toLowerCase();
  const category = featureCategory(feature).toLowerCase();
  return names.some((name) => label.includes(name)) && !label.includes('district') && !category.includes('district');
};

const extractFeatures = (payload, allowMany = false) => {
  const features = payload?.type === 'FeatureCollection'
    ? payload.features
    : Array.isArray(payload?.features) ? payload.features : payload?.type === 'Feature' ? [payload] : [];
  if (features.length) {
    const matches = features.filter(isJagtialMunicipality);
    if (allowMany ? matches.length < 2 : matches.length !== 1) throw new Error(`Expected ${allowMany ? 'at least two' : 'exactly one'} Jagtial municipality feature; found ${matches.length}`);
    return matches;
  }
  if (payload?.rings) return [{ attributes: { ULB_Name: 'Jagtial Municipality' }, geometry: payload }];
  throw new Error('Input does not contain an ArcGIS feature or GeoJSON feature');
};

const parseFeature = (feature, rootPayload) => {
  const arcGeometry = feature.geometry?.rings ? feature.geometry : null;
  const geoGeometry = feature.geometry && feature.geometry.type ? feature.geometry : feature.type === 'Feature' ? feature.geometry : null;
  const source = arcGeometry || geoGeometry;
  if (!source) throw new Error('Feature has no polygon geometry');
  const wkid = declaredWkid(source.spatialReference ? source : rootPayload);
  if (!Number.isInteger(wkid) || ![4326, 32644].includes(wkid)) throw new Error('Geometry must declare EPSG:4326 or EPSG:32644');
  if (arcGeometry) return { rings: validateRings(convertCoordinates(arcGeometry.rings, wkid)), geometry: null };
  if (!['Polygon', 'MultiPolygon'].includes(source.type)) throw new Error('Only Polygon or MultiPolygon geometry is supported');
  const coordinates = convertCoordinates(source.coordinates, wkid);
  const polygons = source.type === 'Polygon' ? [coordinates] : coordinates;
  const rings = polygons.flat().map(validateRings).flat();
  return { rings, geometry: { type: source.type, coordinates } };
};

const secureFetch = async (url, params) => {
  try {
    const response = await fetch(`${url}?${new URLSearchParams(params)}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    const code = error?.code || error?.cause?.code || '';
    if (String(code).includes('CERT_HAS_EXPIRED') || /CERT_HAS_EXPIRED|certificate|TLS/i.test(String(error?.message || error))) {
      throw new Error('Official TGRAC boundary source could not be fetched securely because its TLS certificate is invalid/expired. No insecure TLS bypass was used.');
    }
    throw new Error(`Official TGRAC boundary source could not be fetched securely: ${String(error?.message || error)}`);
  }
};

const loadInput = async () => {
  const inputFlag = process.argv.indexOf('--input');
  if (inputFlag !== -1) {
    const inputPath = process.argv[inputFlag + 1];
    if (!inputPath) throw new Error('--input requires a JSON or GeoJSON file path');
    return { payload: JSON.parse(await readFile(path.resolve(inputPath), 'utf8')), source: 'MANUAL_INPUT', sourceUrl: inputPath };
  }
  try {
    return { payload: await secureFetch(layerUrl, { where: '1=1', outFields: 'ULB_Name,Category', returnGeometry: 'true', outSR: '4326', f: 'json' }), source: 'TGRAC_ULB_LAYER_22', sourceUrl: layerUrl };
  } catch (primaryError) {
    try {
      return { payload: await secureFetch(wardLayerUrl, { where: "ULB_Name LIKE '%Jagtial%' OR ULB_Name LIKE '%Jagityal%' OR ULB_Name LIKE '%Jagitial%'", outFields: 'FID,Name,Ward_No,ULB_Name,Category,Shape_Area', returnGeometry: 'true', outSR: '4326', f: 'json' }), source: 'TGRAC_WARD_UNION_LAYER_51', sourceUrl: wardLayerUrl };
    } catch (wardError) {
      throw new Error(`Official TGRAC primary and ward sources could not be fetched securely. ${String(wardError?.message || primaryError?.message || wardError)}`);
    }
  }
};

try {
  const loaded = await loadInput();
  const isWardSource = loaded.source === 'TGRAC_WARD_UNION_LAYER_51';
  const features = extractFeatures(loaded.payload, isWardSource);
  const parsedFeatures = features.map((feature) => parseFeature(feature, loaded.payload));
  const geometry = isWardSource ? dissolveOuterRings(parsedFeatures.map((parsed) => parsed.geometry || ringsToGeometry(parsed.rings))) : (parsedFeatures[0].geometry || ringsToGeometry(parsedFeatures[0].rings));
  const allRings = geometry.type === 'Polygon' ? geometry.coordinates : geometry.coordinates.flat();
  const area = areaSqKm(allRings);
  const pointCount = allRings.reduce((sum, ring) => sum + ring.length, 0);
  const polygonCount = geometry.type === 'Polygon' ? 1 : geometry.coordinates.length;
  const sanity = Number.isFinite(area) && area >= 1 && area <= 100 && pointCount <= 100000;
  console.info(`feature name: ${featureLabel(features[0])}`);
  console.info(`feature category: ${featureCategory(features[0])}`);
  if (isWardSource) console.info(`ward count: ${features.length}`);
  console.info(`approx area sq km: ${area.toFixed(3)}`);
  console.info(`polygon count: ${polygonCount}`);
  console.info(`point count: ${pointCount}`);
  console.info(`sanity result: ${sanity ? 'PASS' : 'FAIL'}`);
  if (!sanity) throw new Error('Jagtial municipality area sanity check failed; refusing to write boundary');
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify({
    type: 'Feature',
    properties: {
      source_name: 'TGRAC Telangana Urban Local Bodies',
      source_layer: isWardSource ? 51 : 22,
      source_type: loaded.source,
      source_url: loaded.sourceUrl,
      service_area: 'Jagtial Municipality',
      ward_count: isWardSource ? features.length : null,
      imported_at: new Date().toISOString(),
      approximate_area_sq_km: Number(area.toFixed(3)),
    },
    geometry,
  }, null, 2)}\n`, 'utf8');
  console.info(`Wrote ${outputPath}`);
} catch (error) {
  console.error(String(error?.message || error));
  process.exitCode = 1;
}
