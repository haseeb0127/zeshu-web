'use client';

import { useEffect, useRef, useState } from 'react';

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
};

const JAGTIAL_VIEWPORT = { lat: 18.7989, lng: 78.9117 };
const LOCATION_PROMPT = 'Move the map to your delivery location';
const SELECTED_LOCATION_PROMPT = 'Selected location';

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

const loadGoogleMaps = (key: string) => new Promise<any>((resolve, reject) => {
  if ((window as any).google?.maps) return resolve((window as any).google.maps);
  const existing = document.getElementById('zeshu-google-maps');
  if (existing) {
    existing.addEventListener('load', () => resolve((window as any).google?.maps));
    existing.addEventListener('error', () => reject(new Error('Google Maps unavailable')));
    return;
  }
  const script = document.createElement('script');
  script.id = 'zeshu-google-maps';
  script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places`;
  script.async = true;
  script.defer = true;
  script.onload = () => (window as any).google?.maps ? resolve((window as any).google.maps) : reject(new Error('Google Maps unavailable'));
  script.onerror = () => reject(new Error('Google Maps unavailable'));
  document.head.appendChild(script);
});

export default function LocationSelector({ open, initial, onClose, onConfirm }: Props) {
  const mapElement = useRef<HTMLDivElement>(null);
  const searchElement = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const geocoderRef = useRef<any>(null);
  const autocompleteRef = useRef<any>(null);
  const movedRef = useRef(false);
  const initialAddressRef = useRef(false);
  const reverseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mapsReady, setMapsReady] = useState(false);
  const [mapsError, setMapsError] = useState(false);
  const [center, setCenter] = useState(initial ? { lat: initial.latitude, lng: initial.longitude } : JAGTIAL_VIEWPORT);
  const [address, setAddress] = useState(LOCATION_PROMPT);
  const [addressDetails, setAddressDetails] = useState<LocationAddressDetails | null>(initial?.addressDetails || null);

  useEffect(() => {
    if (!open) return;
    setMapsReady(false);
    setMapsError(false);
    setCenter(initial ? { lat: initial.latitude, lng: initial.longitude } : JAGTIAL_VIEWPORT);
    movedRef.current = false;
    const initialAddress = initial?.displayAddress?.trim();
    initialAddressRef.current = isUsableDisplayAddress(initialAddress);
    setAddress(initialAddress || LOCATION_PROMPT);
    setAddressDetails(initial?.addressDetails || null);
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY;
    if (!key) { setMapsError(true); return; }
    let cancelled = false;
    void loadGoogleMaps(key).then((maps) => {
      if (cancelled || !mapElement.current) return;
      const map = new maps.Map(mapElement.current, { center: initial ? { lat: initial.latitude, lng: initial.longitude } : JAGTIAL_VIEWPORT, zoom: initial ? 17 : 13, disableDefaultUI: true, clickableIcons: false, gestureHandling: 'greedy' });
      mapRef.current = map;
      geocoderRef.current = new maps.Geocoder();
      map.addListener('dragstart', () => { movedRef.current = true; initialAddressRef.current = false; });
      map.addListener('click', (event: any) => { if (event.latLng) { movedRef.current = true; initialAddressRef.current = false; map.panTo(event.latLng); } });
      map.addListener('idle', () => {
        const next = map.getCenter();
        if (!next) return;
        const nextCenter = { lat: next.lat(), lng: next.lng() };
        setCenter(nextCenter);
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
        autocomplete.placeholder = 'Search for area, street or landmark';
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
          initialAddressRef.current = false;
          const nextCenter = { lat: location.lat(), lng: location.lng() };
          const details = parseAddressDetails(place);
          map.panTo(nextCenter); map.setZoom(17); setCenter(nextCenter);
          setAddress(place.formattedAddress || SELECTED_LOCATION_PROMPT);
          setAddressDetails(details);
        });
      }
      setMapsReady(true);
    }).catch(() => { if (!cancelled) setMapsError(true); });
    return () => { cancelled = true; if (reverseTimerRef.current) clearTimeout(reverseTimerRef.current); mapRef.current = null; autocompleteRef.current = null; };
  }, [open, initial]);

  if (!open) return null;
  const confirm = () => onConfirm({
    latitude: center.lat,
    longitude: center.lng,
    accuracy: initial && !movedRef.current ? initial.accuracy : null,
    source: initial && !movedRef.current && initial.accuracy !== null ? 'DEVICE' : 'MANUAL_PIN',
    ...(isUsableDisplayAddress(address) ? { displayAddress: address.trim() } : {}),
    ...(addressDetails ? { addressDetails } : {}),
  }, address);
  return <div className="fixed inset-0 z-[180] flex flex-col bg-white" role="dialog" aria-modal="true" aria-labelledby="location-selector-title">
    <div className="flex items-center gap-3 border-b bg-white px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <button type="button" aria-label="Close location selector" onClick={onClose} className="min-h-11 min-w-11 rounded-full bg-slate-100 text-xl">×</button>
      <h2 id="location-selector-title" className="font-black text-slate-900">Choose delivery location</h2>
    </div>
    <div className="relative flex-1 bg-slate-100">
      {mapsError ? <div className="flex h-full items-center justify-center p-6 text-center"><div><p className="font-bold text-slate-800">Maps are unavailable right now.</p><p className="mt-2 text-sm text-slate-600">You can still enter your address manually.</p><button type="button" onClick={onClose} className="mt-4 rounded-xl bg-[#087443] px-5 py-3 font-black text-white">Enter address manually</button></div></div> : <><div ref={mapElement} className="h-full w-full" aria-label="Delivery location map" />{mapsReady && <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full text-4xl drop-shadow-md" aria-hidden="true">📍</div>}</>}
      <div ref={searchElement} className="absolute left-3 right-3 top-3 rounded-2xl bg-white shadow-lg" aria-label="Search delivery location" />
    </div>
    <div className="border-t bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <p className="text-xs font-bold leading-5 text-slate-500">{address}</p>
      <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-black text-slate-600">
        {addressDetails?.city && <span className="rounded-full bg-slate-100 px-2.5 py-1">{addressDetails.city}</span>}
        {addressDetails?.state && <span className="rounded-full bg-slate-100 px-2.5 py-1">{addressDetails.state}</span>}
        {addressDetails?.postalCode && <span className="rounded-full bg-slate-100 px-2.5 py-1">PIN {addressDetails.postalCode}</span>}
      </div>
      <p className="mt-2 text-sm font-black text-slate-800">Place the pin at your delivery entrance</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">We&apos;ll fill the street/area, city, state and PIN code automatically. You can add your house or flat number next.</p>
      <button type="button" disabled={!mapsReady} onClick={confirm} className="mt-3 min-h-12 w-full rounded-2xl bg-[#087443] px-4 py-3 font-black text-white disabled:opacity-50">Use this location</button>
    </div>
  </div>;
}
