'use client';

import { useEffect, useRef, useState } from 'react';

type Coordinates = { latitude: number; longitude: number; accuracy: number | null; source: 'DEVICE' | 'MANUAL_PIN' };

type Props = {
  open: boolean;
  initial: Coordinates | null;
  onClose: () => void;
  onConfirm: (coordinates: Coordinates, address: string) => void;
};

const JAGTIAL_VIEWPORT = { lat: 18.7989, lng: 78.9117 };

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
  const reverseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mapsReady, setMapsReady] = useState(false);
  const [mapsError, setMapsError] = useState(false);
  const [center, setCenter] = useState(initial ? { lat: initial.latitude, lng: initial.longitude } : JAGTIAL_VIEWPORT);
  const [address, setAddress] = useState('Move the map to your delivery location');

  useEffect(() => {
    if (!open) return;
    setMapsReady(false);
    setMapsError(false);
    setCenter(initial ? { lat: initial.latitude, lng: initial.longitude } : JAGTIAL_VIEWPORT);
    movedRef.current = false;
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY;
    if (!key) { setMapsError(true); return; }
    let cancelled = false;
    void loadGoogleMaps(key).then((maps) => {
      if (cancelled || !mapElement.current) return;
      const map = new maps.Map(mapElement.current, { center: initial ? { lat: initial.latitude, lng: initial.longitude } : JAGTIAL_VIEWPORT, zoom: initial ? 17 : 13, disableDefaultUI: true, clickableIcons: false, gestureHandling: 'greedy' });
      mapRef.current = map;
      geocoderRef.current = new maps.Geocoder();
      map.addListener('dragstart', () => { movedRef.current = true; });
      map.addListener('click', (event: any) => { if (event.latLng) { movedRef.current = true; map.panTo(event.latLng); } });
      map.addListener('idle', () => {
        const next = map.getCenter();
        if (!next) return;
        const nextCenter = { lat: next.lat(), lng: next.lng() };
        setCenter(nextCenter);
        if (reverseTimerRef.current) clearTimeout(reverseTimerRef.current);
        reverseTimerRef.current = setTimeout(() => {
          geocoderRef.current?.geocode({ location: nextCenter }, (results: any[], status: string) => {
            if (status === 'OK' && results?.[0]?.formatted_address) setAddress(results[0].formatted_address);
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
          await place.fetchFields({ fields: ['formattedAddress', 'location'] });
          const location = place.location;
          if (!location) return;
          movedRef.current = true;
          const nextCenter = { lat: location.lat(), lng: location.lng() };
          map.panTo(nextCenter); map.setZoom(17); setCenter(nextCenter); setAddress(place.formattedAddress || 'Selected location');
        });
      }
      setMapsReady(true);
    }).catch(() => { if (!cancelled) setMapsError(true); });
    return () => { cancelled = true; if (reverseTimerRef.current) clearTimeout(reverseTimerRef.current); mapRef.current = null; autocompleteRef.current = null; };
  }, [open, initial]);

  if (!open) return null;
  const confirm = () => onConfirm({ latitude: center.lat, longitude: center.lng, accuracy: initial && !movedRef.current ? initial.accuracy : null, source: initial && !movedRef.current && initial.accuracy !== null ? 'DEVICE' : 'MANUAL_PIN' }, address);
  return <div className="fixed inset-0 z-[180] flex flex-col bg-white" role="dialog" aria-modal="true" aria-labelledby="location-selector-title">
    <div className="flex items-center gap-3 border-b bg-white px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <button type="button" aria-label="Close location selector" onClick={onClose} className="min-h-11 min-w-11 rounded-full bg-slate-100 text-xl">×</button>
      <h2 id="location-selector-title" className="font-black text-slate-900">Choose delivery location</h2>
    </div>
    <div className="relative flex-1 bg-slate-100">
      {mapsError ? <div className="flex h-full items-center justify-center p-6 text-center"><div><p className="font-bold text-slate-800">Maps are unavailable right now.</p><p className="mt-2 text-sm text-slate-600">You can still enter your address manually.</p><button type="button" onClick={onClose} className="mt-4 rounded-xl bg-[#087443] px-5 py-3 font-black text-white">Enter address manually</button></div></div> : <><div ref={mapElement} className="h-full w-full" aria-label="Delivery location map" />{mapsReady && <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full text-4xl drop-shadow-md" aria-hidden="true">📍</div>}</>}
      <div ref={searchElement} className="absolute left-3 right-3 top-3 rounded-2xl bg-white shadow-lg" aria-label="Search delivery location" />
    </div>
    <div className="border-t bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"><p className="text-xs font-bold text-slate-500">{address}</p><p className="mt-1 text-sm font-black text-slate-800">Place the pin at your delivery entrance</p><button type="button" disabled={!mapsReady} onClick={confirm} className="mt-3 min-h-12 w-full rounded-2xl bg-[#087443] px-4 py-3 font-black text-white disabled:opacity-50">Confirm delivery location</button></div>
  </div>;
}
