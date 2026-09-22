'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useCustomerLanguage } from './CustomerLanguageProvider';

export type LocationAddressDetails = {
  formattedAddress: string;
  addressLine: string;
  city: string;
  state: string;
  postalCode: string;
};

export type LocationSelection = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  source: 'DEVICE' | 'MANUAL_PIN';
  displayAddress?: string;
  addressDetails?: LocationAddressDetails;
};

type Props = {
  open: boolean;
  initial: LocationSelection | null;
  onClose: () => void;
  onConfirm: (coordinates: LocationSelection, address: string) => void;
  onExploreDigital?: () => void;
};

const JAGTIAL_VIEWPORT = { lat: 18.7989, lng: 78.9117 };
const LOCATION_PROMPT = 'Move the map to your delivery location';
const SELECTED_LOCATION_PROMPT = 'Selected location';
const BUILD_CHECK_MAP_KEY = 'build-check-google-browser-key';

const isUsableDisplayAddress = (value?: string) => {
  const trimmed = value?.trim();
  return Boolean(trimmed && trimmed !== LOCATION_PROMPT && trimmed !== SELECTED_LOCATION_PROMPT);
};

const componentText = (components: any[], type: string) => {
  const component = components.find((entry) => Array.isArray(entry?.types) && entry.types.includes(type));
  const value = component?.long_name ?? component?.longText ?? component?.short_name ?? component?.shortText;
  return typeof value === 'string' ? value.trim() : '';
};

const uniqueParts = (parts: Array<string | undefined>) => {
  const seen = new Set<string>();
  return parts
    .map((part) => part?.trim() || '')
    .filter((part) => {
      if (!part) return false;
      const key = part.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};

const parseAddressDetails = (result: any): LocationAddressDetails | null => {
  if (!result) return null;
  const formattedAddress = String(result.formatted_address ?? result.formattedAddress ?? '').trim();
  const components = Array.isArray(result.address_components)
    ? result.address_components
    : Array.isArray(result.addressComponents)
      ? result.addressComponents
      : [];

  const subpremise = componentText(components, 'subpremise');
  const premise = componentText(components, 'premise');
  const streetNumber = componentText(components, 'street_number');
  const route = componentText(components, 'route');
  const neighborhood = componentText(components, 'neighborhood');
  const sublocality2 = componentText(components, 'sublocality_level_2');
  const sublocality1 = componentText(components, 'sublocality_level_1') || componentText(components, 'sublocality');
  const city = componentText(components, 'locality')
    || componentText(components, 'postal_town')
    || componentText(components, 'administrative_area_level_3')
    || sublocality1;
  const state = componentText(components, 'administrative_area_level_1');
  const postalCode = componentText(components, 'postal_code');

  const street = [streetNumber, route].filter(Boolean).join(' ').trim();
  let addressLine = uniqueParts([subpremise, premise, street, neighborhood, sublocality2, sublocality1]).join(', ');

  if (!addressLine && formattedAddress) {
    const stopWords = new Set([city, state, postalCode, componentText(components, 'country')].filter(Boolean).map((part) => part.toLowerCase()));
    addressLine = formattedAddress
      .split(',')
      .map((part) => part.trim())
      .filter((part) => part && !stopWords.has(part.toLowerCase()) && !/^\d{6}$/.test(part))
      .slice(0, 3)
      .join(', ');
  }

  if (!formattedAddress && !addressLine && !city && !state && !postalCode) return null;
  return { formattedAddress, addressLine, city, state, postalCode };
};

const parseOpenStreetMapAddress = (result: any): LocationAddressDetails | null => {
  if (!result) return null;
  const raw = result.address && typeof result.address === 'object' ? result.address : {};
  const house = [raw.house_number, raw.road].filter(Boolean).join(' ').trim();
  const area = raw.neighbourhood || raw.suburb || raw.quarter || raw.residential || raw.hamlet || '';
  const city = raw.city || raw.town || raw.village || raw.municipality || raw.county || '';
  const state = raw.state || '';
  const postalCode = raw.postcode || '';
  const formattedAddress = String(result.display_name || '').trim();
  const addressLine = uniqueParts([house, area]).join(', ') || formattedAddress.split(',').slice(0, 2).join(', ').trim();
  if (!formattedAddress && !addressLine && !city && !state && !postalCode) return null;
  return { formattedAddress, addressLine, city, state, postalCode };
};

const loadGoogleMaps = (key: string, language: string) => new Promise<any>((resolve, reject) => {
  if ((window as any).google?.maps) return resolve((window as any).google.maps);
  const existing = document.getElementById('zeshu-google-maps');
  if (existing) {
    existing.addEventListener('load', () => resolve((window as any).google?.maps));
    existing.addEventListener('error', () => reject(new Error('Google Maps unavailable')));
    return;
  }
  const script = document.createElement('script');
  script.id = 'zeshu-google-maps';
  script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places&language=${encodeURIComponent(language)}&region=IN`;
  script.async = true;
  script.defer = true;
  script.onload = () => (window as any).google?.maps ? resolve((window as any).google.maps) : reject(new Error('Google Maps unavailable'));
  script.onerror = () => reject(new Error('Google Maps unavailable'));
  document.head.appendChild(script);
});

export default function LocationSelector({ open, initial, onClose, onConfirm, onExploreDigital }: Props) {
  const { language, t } = useCustomerLanguage();
  const addressLanguageHeader = language === 'te' ? 'te-IN,te;q=0.9,en-IN;q=0.7' : language === 'hi' ? 'hi-IN,hi;q=0.9,en-IN;q=0.7' : language === 'ur' ? 'ur-IN,ur;q=0.9,en-IN;q=0.7' : 'en-IN,en;q=0.9';
  const mapElement = useRef<HTMLDivElement>(null);
  const searchElement = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const geocoderRef = useRef<any>(null);
  const autocompleteRef = useRef<any>(null);
  const movedRef = useRef(false);
  const initialAddressRef = useRef(false);
  const reverseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const detectedAccuracyRef = useRef<number | null>(null);
  const [mapsReady, setMapsReady] = useState(false);
  const [mapsError, setMapsError] = useState(false);
  const [fallbackMap, setFallbackMap] = useState(false);
  const [fallbackBusy, setFallbackBusy] = useState(false);
  const [fallbackQuery, setFallbackQuery] = useState('');
  const [fallbackMessage, setFallbackMessage] = useState('');
  const [center, setCenter] = useState(initial ? { lat: initial.latitude, lng: initial.longitude } : JAGTIAL_VIEWPORT);
  const [address, setAddress] = useState(LOCATION_PROMPT);
  const [addressDetails, setAddressDetails] = useState<LocationAddressDetails | null>(initial?.addressDetails || null);
  const [serviceAreaStatus, setServiceAreaStatus] = useState<'ELIGIBLE' | 'OUTSIDE_SERVICE_AREA' | 'SERVICE_AREA_UNAVAILABLE' | null>(null);
  const [serviceAreaMessage, setServiceAreaMessage] = useState('');
  const [checkingServiceArea, setCheckingServiceArea] = useState(false);

  const fallbackMapUrl = useMemo(() => {
    const lat = Number(center.lat);
    const lng = Number(center.lng);
    const delta = 0.012;
    const bbox = [lng - delta, lat - delta, lng + delta, lat + delta].join(',');
    return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${encodeURIComponent(`${lat},${lng}`)}`;
  }, [center.lat, center.lng]);

  const reverseFallback = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=18&lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lng))}`,
        { headers: { 'Accept-Language': addressLanguageHeader } },
      );
      if (!response.ok) return;
      const result = await response.json();
      const details = parseOpenStreetMapAddress(result);
      if (details) {
        setAddressDetails(details);
        setAddress(details.formattedAddress || SELECTED_LOCATION_PROMPT);
      }
    } catch {
      // Coordinates are still usable even if reverse geocoding is unavailable.
    }
  };

  const enableFallbackMap = (message?: string) => {
    setFallbackMap(true);
    setMapsError(false);
    setMapsReady(true);
    if (message) setFallbackMessage(message);
    if (initial) {
      detectedAccuracyRef.current = initial.source === 'DEVICE' ? initial.accuracy : null;
      if (!isUsableDisplayAddress(initial.displayAddress)) void reverseFallback(initial.latitude, initial.longitude);
    }
  };

  useEffect(() => {
    if (!open) return;
    setMapsReady(false);
    setMapsError(false);
    setFallbackMap(false);
    setFallbackBusy(false);
    setFallbackQuery('');
    setFallbackMessage('');
    setCenter(initial ? { lat: initial.latitude, lng: initial.longitude } : JAGTIAL_VIEWPORT);
    movedRef.current = false;
    detectedAccuracyRef.current = initial?.source === 'DEVICE' ? initial.accuracy : null;
    const initialAddress = initial?.displayAddress?.trim();
    initialAddressRef.current = isUsableDisplayAddress(initialAddress);
    setAddress(initialAddress || LOCATION_PROMPT);
    setAddressDetails(initial?.addressDetails || null);
    setServiceAreaStatus(null);
    setServiceAreaMessage('');
    setCheckingServiceArea(false);

    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY?.trim();
    if (!key || key === BUILD_CHECK_MAP_KEY || key.startsWith('build-check-')) {
      enableFallbackMap(t('Using the staging map fallback. GPS detection and address search are available without a Google browser key.'));
      return;
    }

    let cancelled = false;
    void loadGoogleMaps(key, language).then((maps) => {
      if (cancelled || !mapElement.current) return;
      const map = new maps.Map(mapElement.current, {
        center: initial ? { lat: initial.latitude, lng: initial.longitude } : JAGTIAL_VIEWPORT,
        zoom: initial ? 17 : 13,
        disableDefaultUI: true,
        clickableIcons: false,
        gestureHandling: 'greedy',
      });
      mapRef.current = map;
      geocoderRef.current = new maps.Geocoder();
      map.addListener('dragstart', () => {
        movedRef.current = true;
        detectedAccuracyRef.current = null;
        initialAddressRef.current = false;
      });
      map.addListener('click', (event: any) => {
        if (event.latLng) {
          movedRef.current = true;
          detectedAccuracyRef.current = null;
          initialAddressRef.current = false;
          map.panTo(event.latLng);
        }
      });
      map.addListener('idle', () => {
        const next = map.getCenter();
        if (!next) return;
        const nextCenter = { lat: next.lat(), lng: next.lng() };
        setCenter(nextCenter);
        setServiceAreaStatus(null);
        setServiceAreaMessage('');
        if (initialAddressRef.current && !movedRef.current) return;
        if (reverseTimerRef.current) clearTimeout(reverseTimerRef.current);
        reverseTimerRef.current = setTimeout(() => {
          geocoderRef.current?.geocode({ location: nextCenter }, (results: any[], status: string) => {
            if (status !== 'OK' || !results?.[0]) return;
            const details = parseAddressDetails(results[0]);
            if (details?.formattedAddress) setAddress(details.formattedAddress);
            else if (results[0].formatted_address) setAddress(results[0].formatted_address);
            setAddressDetails(details);
          });
        }, 500);
      });
      if (searchElement.current) {
        const autocomplete = new maps.places.PlaceAutocompleteElement({ includedRegionCodes: ['in'] });
        autocomplete.placeholder = t('Search for area, street or landmark');
        autocomplete.className = 'zeshu-place-autocomplete';
        autocomplete.style.width = '100%';
        searchElement.current.replaceChildren(autocomplete);
        autocompleteRef.current = autocomplete;
        autocomplete.addEventListener('gmp-select', async (event: any) => {
          const prediction = event.placePrediction;
          if (!prediction) return;
          const place = prediction.toPlace();
          await place.fetchFields({ fields: ['formattedAddress', 'location', 'addressComponents'] });
          const location = place.location;
          if (!location) return;
          movedRef.current = true;
          detectedAccuracyRef.current = null;
          initialAddressRef.current = false;
          const nextCenter = { lat: location.lat(), lng: location.lng() };
          const details = parseAddressDetails(place);
          map.panTo(nextCenter);
          map.setZoom(17);
          setCenter(nextCenter);
          setServiceAreaStatus(null);
          setServiceAreaMessage('');
          setAddress(place.formattedAddress || SELECTED_LOCATION_PROMPT);
          setAddressDetails(details);
        });
      }
      setMapsReady(true);
    }).catch(() => {
      if (!cancelled) enableFallbackMap(t('Google Maps is not configured for staging, so Zeshu switched to the GPS/OpenStreetMap fallback.'));
    });

    return () => {
      cancelled = true;
      if (reverseTimerRef.current) clearTimeout(reverseTimerRef.current);
      mapRef.current = null;
      autocompleteRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial]);

  const detectFallbackLocation = () => {
    if (!('geolocation' in navigator)) {
      setFallbackMessage(t('This browser does not provide GPS location. Search for your area instead.'));
      return;
    }
    setFallbackBusy(true);
    setFallbackMessage(t('Detecting your current location…'));
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const accuracy = Number(position.coords.accuracy);
        const next = { lat: position.coords.latitude, lng: position.coords.longitude };
        detectedAccuracyRef.current = Number.isFinite(accuracy) && accuracy >= 0 ? accuracy : null;
        movedRef.current = false;
        initialAddressRef.current = false;
        setCenter(next);
        setServiceAreaStatus(null);
        setServiceAreaMessage('');
        setFallbackBusy(false);
        setFallbackMessage(detectedAccuracyRef.current !== null ? `${t('GPS detected · accuracy about')} ${Math.round(detectedAccuracyRef.current)} m` : t('GPS location detected.'));
        void reverseFallback(next.lat, next.lng);
      },
      (error) => {
        setFallbackBusy(false);
        const denied = error?.code === 1;
        setFallbackMessage(denied
          ? t('Location permission is blocked. Allow location for this site, then try again, or search for your area.')
          : t('GPS could not get a reliable fix. Search for your area or try again outdoors.'));
      },
      { enableHighAccuracy: true, maximumAge: 15000, timeout: 12000 },
    );
  };

  const searchFallbackLocation = async () => {
    const query = fallbackQuery.trim();
    if (!query || fallbackBusy) return;
    setFallbackBusy(true);
    setFallbackMessage(t('Searching…'));
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=1&countrycodes=in&q=${encodeURIComponent(query)}`,
        { headers: { 'Accept-Language': addressLanguageHeader } },
      );
      const results = response.ok ? await response.json() : [];
      const result = Array.isArray(results) ? results[0] : null;
      const lat = Number(result?.lat);
      const lng = Number(result?.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        setFallbackMessage(t('No matching place found. Try an area, street, landmark or PIN code.'));
        return;
      }
      detectedAccuracyRef.current = null;
      movedRef.current = true;
      initialAddressRef.current = false;
      setCenter({ lat, lng });
      setServiceAreaStatus(null);
      setServiceAreaMessage('');
      const details = parseOpenStreetMapAddress(result);
      setAddressDetails(details);
      setAddress(details?.formattedAddress || String(result?.display_name || SELECTED_LOCATION_PROMPT));
      setFallbackMessage(t('Location found. Confirm the preview below.'));
    } catch {
      setFallbackMessage(t('Location search is temporarily unavailable. You can still use GPS.'));
    } finally {
      setFallbackBusy(false);
    }
  };

  if (!open) return null;

  const confirm = async () => {
    if (checkingServiceArea) return;
    setCheckingServiceArea(true);
    setServiceAreaStatus(null);
    setServiceAreaMessage('');
    try {
      const response = await fetch('/api/service-area/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude: center.lat, longitude: center.lng }),
      });
      const payload = await response.json().catch(() => ({}));
      const status = payload?.status === 'ELIGIBLE' || payload?.status === 'OUTSIDE_SERVICE_AREA'
        ? payload.status
        : 'SERVICE_AREA_UNAVAILABLE';
      setServiceAreaStatus(status);
      setServiceAreaMessage(String(payload?.message || t('We could not verify this delivery location.')));

      if (!response.ok || status !== 'ELIGIBLE') return;

      const detectedAccuracy = detectedAccuracyRef.current;
      onConfirm({
        latitude: center.lat,
        longitude: center.lng,
        accuracy: detectedAccuracy ?? (initial && !movedRef.current ? initial.accuracy : null),
        source: detectedAccuracy !== null || (initial && !movedRef.current && initial.source === 'DEVICE') ? 'DEVICE' : 'MANUAL_PIN',
        ...(isUsableDisplayAddress(address) ? { displayAddress: address.trim() } : {}),
        ...(addressDetails ? { addressDetails } : {}),
      }, address);
    } catch {
      setServiceAreaStatus('SERVICE_AREA_UNAVAILABLE');
      setServiceAreaMessage(t('We could not verify this delivery location. Check your connection and try again.'));
    } finally {
      setCheckingServiceArea(false);
    }
  };

  return <div className="fixed inset-0 z-[180] flex flex-col bg-white" role="dialog" aria-modal="true" aria-labelledby="location-selector-title">
    <div className="flex items-center gap-3 border-b bg-white px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <button type="button" aria-label={t('Close location selector')} onClick={onClose} className="min-h-11 min-w-11 rounded-full bg-slate-100 text-xl">×</button>
      <div>
        <h2 id="location-selector-title" className="font-black text-slate-900">{t('Choose delivery location')}</h2>
        {fallbackMap && <p className="text-[10px] font-bold text-emerald-700">{t('GPS map fallback active')}</p>}
      </div>
    </div>

    <div className="relative flex-1 bg-slate-100">
      {fallbackMap ? <>
        <iframe title={t('Delivery location map preview')} src={fallbackMapUrl} className="h-full w-full border-0" loading="eager" referrerPolicy="strict-origin-when-cross-origin" />
        <div className="absolute left-3 right-3 top-3 space-y-2 rounded-2xl bg-white/95 p-3 shadow-lg backdrop-blur">
          <div className="flex gap-2">
            <input
              value={fallbackQuery}
              onChange={(event) => setFallbackQuery(event.target.value)}
              onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); void searchFallbackLocation(); } }}
              placeholder={t('Search area, street, landmark or PIN')}
              className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold outline-none focus:border-[#087443]"
            />
            <button type="button" disabled={fallbackBusy || !fallbackQuery.trim()} onClick={() => void searchFallbackLocation()} className="rounded-xl bg-[#111827] px-3 py-2.5 text-xs font-black text-white disabled:opacity-50">{t('Search')}</button>
          </div>
          <button type="button" disabled={fallbackBusy} onClick={detectFallbackLocation} className="w-full rounded-xl bg-[#087443] px-3 py-2.5 text-xs font-black text-white disabled:opacity-50">
            {fallbackBusy ? t('Working…') : t('Use my current GPS location')}
          </button>
          {fallbackMessage && <p className="text-[11px] font-bold leading-4 text-slate-600">{fallbackMessage}</p>}
        </div>
      </> : mapsError ? <div className="flex h-full items-center justify-center p-6 text-center"><div><p className="font-bold text-slate-800">{t('Maps are unavailable right now.')}</p><p className="mt-2 text-sm text-slate-600">{t('You can still enter your address manually.')}</p><button type="button" onClick={onClose} className="mt-4 rounded-xl bg-[#087443] px-5 py-3 font-black text-white">{t('Enter address manually')}</button></div></div> : <>
        <div ref={mapElement} className="h-full w-full" aria-label={t('Delivery location map')} />
        {mapsReady && <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full text-4xl drop-shadow-md" aria-hidden="true">📍</div>}
        <div ref={searchElement} className="absolute left-3 right-3 top-3 rounded-2xl bg-white shadow-lg" aria-label={t('Search delivery location')} />
      </>}
    </div>

    <div className="border-t bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <p className="text-xs font-bold leading-5 text-slate-500">{address}</p>
      <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-black text-slate-600">
        {addressDetails?.city && <span className="rounded-full bg-slate-100 px-2.5 py-1">{addressDetails.city}</span>}
        {addressDetails?.state && <span className="rounded-full bg-slate-100 px-2.5 py-1">{addressDetails.state}</span>}
        {addressDetails?.postalCode && <span className="rounded-full bg-slate-100 px-2.5 py-1">PIN {addressDetails.postalCode}</span>}
      </div>
      <p className="mt-2 text-sm font-black text-slate-800">{fallbackMap ? t('Confirm the detected/search result') : t('Place the pin at your delivery entrance')}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{t("We'll verify this location against the Jagtial delivery area before saving it. Street/area, city, state and PIN are filled automatically when available.")}</p>
      {serviceAreaStatus === 'ELIGIBLE' && <div role="status" className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3"><p className="text-sm font-black text-emerald-800">{t('Delivery available here')}</p><p className="mt-1 text-xs leading-5 text-emerald-700">{serviceAreaMessage}</p></div>}
      {serviceAreaStatus === 'OUTSIDE_SERVICE_AREA' && <div role="alert" className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3"><p className="text-sm font-black text-amber-900">{t("We're not delivering physical products here yet")}</p><p className="mt-1 text-xs leading-5 text-amber-800">{serviceAreaMessage} {t('Digital services remain available across India.')}</p>{onExploreDigital && <button type="button" onClick={onExploreDigital} className="mt-2 rounded-lg bg-white px-3 py-2 text-xs font-black text-indigo-700 shadow-sm">{t('Explore digital services')}</button>}</div>}
      {serviceAreaStatus === 'SERVICE_AREA_UNAVAILABLE' && <div role="alert" className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3"><p className="text-sm font-black text-slate-800">{t('Location could not be verified')}</p><p className="mt-1 text-xs leading-5 text-slate-600">{serviceAreaMessage}</p></div>}
      <button type="button" disabled={!mapsReady || checkingServiceArea} onClick={() => void confirm()} className="mt-3 min-h-12 w-full rounded-2xl bg-[#087443] px-4 py-3 font-black text-white disabled:opacity-50">{checkingServiceArea ? t('Checking delivery area…') : serviceAreaStatus === 'OUTSIDE_SERVICE_AREA' ? t('Check another location') : t('Use this location')}</button>
    </div>
  </div>;
}
