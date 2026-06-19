'use client';

import { useEffect, useRef } from 'react';
import { useZenithStore } from './useZenithStore';

/**
 * Reads ?lat=&lng=&loc= from the URL on first load and applies them.
 * Updates the URL (without reload) whenever coordinates change, so the
 * page becomes shareable: project-zenith.app?lat=28.6139&lng=77.209
 */
export function useShareableURL() {
  const { coordinates, setCoordinates } = useZenithStore();
  const hasReadInitial = useRef(false);

  // Read on mount
  useEffect(() => {
    if (hasReadInitial.current) return;
    hasReadInitial.current = true;

    const params = new URLSearchParams(window.location.search);
    const lat = parseFloat(params.get('lat') ?? '');
    const lng = parseFloat(params.get('lng') ?? '');
    const loc = params.get('loc') ?? undefined;

    if (!isNaN(lat) && !isNaN(lng)) {
      setCoordinates({ lat, lng, label: loc });
    }
  }, [setCoordinates]);

  // Write on change
  useEffect(() => {
    if (!coordinates) return;
    const params = new URLSearchParams();
    params.set('lat', String(coordinates.lat));
    params.set('lng', String(coordinates.lng));
    if (coordinates.label) params.set('loc', coordinates.label);

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);
  }, [coordinates]);
}

/** Build a shareable absolute URL for the current coordinates */
export function buildShareURL(lat: number, lng: number, label?: string): string {
  if (typeof window === 'undefined') return '';
  const params = new URLSearchParams();
  params.set('lat', String(lat));
  params.set('lng', String(lng));
  if (label) params.set('loc', label);
  return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
}
