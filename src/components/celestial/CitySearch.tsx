'use client';

import { useState, useRef, useCallback } from 'react';
import { useZenithStore } from '@/hooks/useZenithStore';

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

export default function CitySearch() {
  const { setCoordinates } = useZenithStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5`,
        { headers: { Accept: 'application/json' } }
      );
      const data: NominatimResult[] = await res.json();
      setResults(data);
      setOpen(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 450);
  };

  const handleSelect = (result: NominatimResult) => {
    setCoordinates({
      lat: parseFloat(parseFloat(result.lat).toFixed(4)),
      lng: parseFloat(parseFloat(result.lon).toFixed(4)),
      label: result.display_name.split(',').slice(0, 2).join(','),
    });
    setQuery(result.display_name.split(',')[0]);
    setOpen(false);
    setResults([]);
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search a city (e.g. Tokyo, Cairo)…"
          className="w-full bg-void/80 border border-pulsar/40 rounded px-3 py-2 pl-8 text-sm font-mono text-starlight placeholder:text-starlight/30 focus:outline-none focus:border-aurora transition-colors"
        />
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-aurora/60 text-xs">
          {loading ? '◌' : '⌖'}
        </span>
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-20 mt-1 w-full glass-card-bright max-h-56 overflow-y-auto">
          {results.map((r, i) => (
            <button
              key={i}
              onClick={() => handleSelect(r)}
              className="w-full text-left px-3 py-2 text-xs font-mono text-starlight/80 hover:bg-aurora/10 hover:text-aurora transition-colors border-b border-starlight/5 last:border-0"
            >
              {r.display_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
